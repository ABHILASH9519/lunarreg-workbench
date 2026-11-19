#!/usr/bin/env python3
"""Batch analysis: register every pair in a directory, then summarise and grid-search parameters.

Directory layout: <dir>/<case>/source.(png|jpg|tif) + reference.(png|jpg|tif)
and optionally ground_truth.json (as written by make_dataset.py).

  analyze.py run  DIR   -> per-case CSV + summary statistics
  analyze.py grid DIR   -> try parameter combinations, rank by success then error
"""
from __future__ import annotations

import argparse
import csv
import itertools
import glob
import json
import os
import statistics
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lunarreg_client import ApiError, Client, corner_error  # noqa: E402


def find_cases(root: str) -> list[dict]:
    cases = []
    for d in sorted(glob.glob(os.path.join(root, "*"))) or [root]:
        if not os.path.isdir(d):
            continue
        pick = lambda stem: next(iter(sorted(glob.glob(os.path.join(d, stem + ".*")))), None)
        s, r = pick("source"), pick("reference")
        if s and r:
            gt = os.path.join(d, "ground_truth.json")
            truth = json.load(open(gt)) if os.path.exists(gt) else None
            cases.append({"name": os.path.basename(d), "source": s, "reference": r, "truth": truth})
    return cases


def run_case(c: Client, case: dict, params: dict | None) -> dict:
    row = {"case": case["name"], "status": "error", "model": "", "inliers": "", "rmse": "", "cornerError": "", "confidence": ""}
    try:
        job = c.wait(c.submit(source=case["source"], reference=case["reference"], params=params, name=case["name"]))
    except ApiError as e:
        row["error"] = str(e)
        return row
    row["status"], res = job["status"], job.get("result")
    if job["status"] == "completed" and res:
        m = res["metrics"]
        row.update(model=res["modelUsed"], inliers=m["inliers"], rmse=round(m["rmse"], 3), confidence=m["confidence"])
        if case["truth"]:
            row["cornerError"] = round(corner_error(res["matrix"], case["truth"]["matrix"], case["truth"].get("size", 512)), 3)
    else:
        row["error"] = job.get("error", "")
    return row


def stats(rows: list[dict], limit: float) -> dict:
    done = [r for r in rows if r["status"] == "completed"]
    errs = [r["cornerError"] for r in done if r["cornerError"] != ""]
    s = {"cases": len(rows), "completed": len(done), "failed": len(rows) - len(done)}
    if errs:
        errs.sort()
        s.update(withTruth=len(errs), withinLimit=sum(e <= limit for e in errs), medianError=statistics.median(errs),
                 p95Error=errs[min(len(errs) - 1, int(0.95 * len(errs)))], maxError=errs[-1])
    return s


def cmd_run(a, c: Client) -> int:
    rows = [run_case(c, case, None) for case in find_cases(a.dir)]
    if not rows:
        print("no cases found", file=sys.stderr)
        return 2
    with open(a.csv, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=sorted({k for r in rows for k in r}))
        w.writeheader()
        w.writerows(rows)
    for r in rows:
        print(f"{r['case']:<24} {r['status']:<10} {r['model']:<11} corner={r['cornerError']!s:<8} inliers={r['inliers']}")
    print(json.dumps(stats(rows, a.limit), indent=2))
    return 0


def cmd_grid(a, c: Client) -> int:
    cases = [x for x in find_cases(a.dir) if x["truth"]]
    if not cases:
        print("grid search needs cases with ground_truth.json", file=sys.stderr)
        return 2
    grid = {"ratio": [0.8, 0.85, 0.9], "ransacThreshold": [2, 3, 4], "fastThreshold": [10, 14, 20]}
    ranked = []
    for combo in itertools.product(*grid.values()):
        params = dict(zip(grid, combo))
        rows = [run_case(c, case, params) for case in cases]
        s = stats(rows, a.limit)
        ranked.append((-(s.get("withinLimit", 0)), s.get("medianError", 1e9), params))
        print(f"{params} -> within limit {s.get('withinLimit', 0)}/{len(cases)}, median {s.get('medianError', float('nan')):.2f}")
    ranked.sort(key=lambda t: (t[0], t[1]))
    print("\nbest:", json.dumps(ranked[0][2]))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["run", "grid"])
    ap.add_argument("dir")
    ap.add_argument("--url", default="http://localhost:8080")
    ap.add_argument("--limit", type=float, default=3.0)
    ap.add_argument("--csv", default="analysis.csv")
    a = ap.parse_args()
    c = Client(a.url)
    return cmd_run(a, c) if a.mode == "run" else cmd_grid(a, c)


if __name__ == "__main__":
    sys.exit(main())
