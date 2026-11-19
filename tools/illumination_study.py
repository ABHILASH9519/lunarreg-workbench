#!/usr/bin/env python3
"""Quantify how registration accuracy degrades as the sun-azimuth difference grows.

For each azimuth delta and seed, a synthetic pair with exact ground truth is
generated, uploaded to the running server and scored (corner error recomputed
here, independent of the Go code). Output: a success curve per delta, written
to JSON and printed. This documents a known limitation of binary descriptors.
"""
from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_dataset as md  # noqa: E402
from lunarreg_client import ApiError, Client, corner_error  # noqa: E402


def run_case(c: Client, tmp: str, seed: int, az: float, limit: float) -> dict:
    src, ref, m = md.make_pair(seed=seed, az_delta=az, el_delta=0.0)
    sp, rp = f"{tmp}/s.png", f"{tmp}/r.png"
    md.write_png(sp, src)
    md.write_png(rp, ref)
    try:
        job = c.wait(c.submit(source=sp, reference=rp, name=f"illumination study az+{az:g} seed {seed}"))
    except ApiError as e:
        return {"azDelta": az, "seed": seed, "success": False, "reason": str(e)}
    res = job.get("result")
    if job["status"] != "completed" or not res:
        return {"azDelta": az, "seed": seed, "success": False, "reason": job.get("error", job["status"])}
    err = corner_error(res["matrix"], m.flatten().tolist(), 512)
    return {"azDelta": az, "seed": seed, "success": err <= limit, "cornerError": err,
            "inliers": res["metrics"]["inliers"], "confidence": res["metrics"]["confidence"]}


def summarize(rows: list[dict]) -> list[dict]:
    out = []
    for az in sorted({r["azDelta"] for r in rows}):
        g = [r for r in rows if r["azDelta"] == az]
        ok = [r for r in g if r["success"]]
        out.append({"azDelta": az, "n": len(g), "successRate": len(ok) / len(g),
                    "medianError": statistics.median(r["cornerError"] for r in ok) if ok else None,
                    "medianInliers": statistics.median(r["inliers"] for r in ok) if ok else None})
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", default="http://localhost:8080")
    ap.add_argument("--deltas", type=float, nargs="+", default=[0, 10, 20, 30, 40, 60])
    ap.add_argument("--seeds", type=int, default=3)
    ap.add_argument("--limit", type=float, default=3.0, help="corner error (px) counted as success")
    ap.add_argument("--out", default="data/illumination_study.json")
    a = ap.parse_args()
    c = Client(a.url)
    rows = []
    with tempfile.TemporaryDirectory() as tmp:
        for az in a.deltas:
            for seed in range(1, a.seeds + 1):
                rows.append(run_case(c, tmp, 100 + seed, az, a.limit))
    summary = summarize(rows)
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    with open(a.out, "w") as f:
        json.dump({"limitPx": a.limit, "summary": summary, "cases": rows}, f, indent=2)
    print(f"{'az delta':>9} {'success':>8} {'median err':>11} {'median inliers':>15}")
    for s in summary:
        me = f"{s['medianError']:.2f} px" if s["medianError"] is not None else "-"
        mi = f"{s['medianInliers']:.0f}" if s["medianInliers"] is not None else "-"
        print(f"{s['azDelta']:>8g}° {s['successRate']:>7.0%} {me:>11} {mi:>15}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
