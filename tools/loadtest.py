#!/usr/bin/env python3
"""Concurrent load test: submit N sample jobs from several visitors and report latency/throughput."""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import os
import statistics
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lunarreg_client import Client  # noqa: E402


def one(url: str, sample: str) -> tuple[str, float, float]:
    c = Client(url)  # separate cookie jar == separate visitor
    t0 = time.time()
    job = c.wait(c.submit(sample=sample), timeout=300)
    return job["status"], time.time() - t0, (job.get("durationMs") or 0) / 1000


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", default="http://localhost:8080")
    ap.add_argument("-n", type=int, default=12, help="total jobs")
    ap.add_argument("-c", type=int, default=6, help="concurrent visitors")
    a = ap.parse_args()
    samples = [s["id"] for s in Client(a.url).get_json("/api/samples")]
    t0 = time.time()
    with cf.ThreadPoolExecutor(a.c) as ex:
        res = list(ex.map(lambda i: one(a.url, samples[i % len(samples)]), range(a.n)))
    wall = time.time() - t0
    lat = sorted(r[1] for r in res)
    ok = sum(r[0] == "completed" for r in res)
    p = lambda q: lat[min(len(lat) - 1, int(q * len(lat)))]
    print(f"{ok}/{a.n} completed in {wall:.1f}s ({a.n / wall:.2f} jobs/s)")
    print(f"end-to-end latency: median {statistics.median(lat):.2f}s  p90 {p(0.9):.2f}s  max {lat[-1]:.2f}s")
    print(f"pure compute:       median {statistics.median(r[2] for r in res):.2f}s")
    return 0 if ok == a.n else 1


if __name__ == "__main__":
    sys.exit(main())
