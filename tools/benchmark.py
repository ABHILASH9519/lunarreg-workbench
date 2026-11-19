#!/usr/bin/env python3
"""Benchmark the running server on every bundled sample pair.

Corner error is recomputed here in Python from the matrices the API returns,
independently of the Go implementation, and written to <data>/benchmark.json
so the web UI's Technology page can display it.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lunarreg_client import Client, corner_error  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", default="http://localhost:8080")
    ap.add_argument("--out", default="data/benchmark.json", help="where to write results (the server's data dir)")
    ap.add_argument("--max-error", type=float, default=4.0, help="fail if any corner error exceeds this (px)")
    args = ap.parse_args()

    c = Client(args.url)
    samples = c.get_json("/api/samples")
    results = []
    for s in samples:
        job = c.wait(c.submit(sample=s["id"], name=f"benchmark: {s['name']}"))
        row = {"id": s["id"], "name": s["name"], "truth": s["truthModel"], "ok": False, "model": "-"}
        res = job.get("result")
        if job["status"] == "completed" and res:
            err = corner_error(res["matrix"], s["truthMatrix"], s["size"])
            row.update(ok=True, model=res["modelUsed"], cornerError=err, inliers=res["metrics"]["inliers"],
                       rmse=res["metrics"]["rmse"], ncc=res["metrics"]["image"]["ncc"],
                       confidence=res["metrics"]["confidence"], runtimeMs=job.get("durationMs"))
        results.append(row)
        status = f"{row['cornerError']:.2f} px" if row["ok"] else "FAILED"
        print(f"{s['name']:<26} truth={s['truthModel']:<11} got={row['model']:<11} {status}")

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w") as f:
        json.dump({"available": True, "generated": dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
                   "results": results}, f, indent=2)
    bad = [r for r in results if not r["ok"] or r["cornerError"] > args.max_error]
    print(f"\n{len(results) - len(bad)}/{len(results)} within {args.max_error} px -> {args.out}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
