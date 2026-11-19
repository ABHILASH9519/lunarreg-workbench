#!/usr/bin/env python3
"""lunarreg — command-line client for a running LunarReg Workbench server.

  lunarreg.py health
  lunarreg.py samples
  lunarreg.py run --sample ohrc-crater-field [--model affine] [--features 2000]
  lunarreg.py run --source a.tif --reference b.tif --out results/
  lunarreg.py list [--status completed]
  lunarreg.py show JOB_ID
  lunarreg.py export JOB_ID --out results/       (zip + csv + json)
  lunarreg.py sweep JOB_ID ransacThreshold 1 2 3 4
  lunarreg.py delete JOB_ID

Set LUNARREG_URL or pass --url (default http://localhost:8080).
The session cookie (your private job history) is stored in ~/.config/lunarreg/cookies.txt,
override with LUNARREG_COOKIES.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lunarreg_client import ApiError, Client  # noqa: E402

PARAM_FLAGS = {"features": int, "levels": int, "ratio": float, "ransac_threshold": float, "fast_threshold": float,
               "max_dim": int, "grid_cells": int, "max_iter": int, "model": str}
CAMEL = {"ransac_threshold": "ransacThreshold", "fast_threshold": "fastThreshold", "max_dim": "maxDim",
         "grid_cells": "gridCells", "max_iter": "maxIter"}


def params_from(args: argparse.Namespace) -> dict:
    p = {CAMEL.get(k, k): getattr(args, k) for k in PARAM_FLAGS if getattr(args, k, None) is not None}
    for flag in ("no_denoise", "no_contrast", "no_cross_check"):
        if getattr(args, flag, False):
            p[{"no_denoise": "denoise", "no_contrast": "contrast", "no_cross_check": "crossCheck"}[flag]] = False
    return p


def fmt_job(j: dict) -> str:
    r = j.get("result") or {}
    m = r.get("metrics") or {}
    rmse = f"{m['rmse']:.2f} px" if m.get("computed") else "N/A"
    return (f"{j['id']}  {j['status']:<10} {j['name'][:34]:<34} {r.get('modelUsed', '-'):<11} "
            f"rmse={rmse:<9} inliers={m.get('inliers', 'N/A')}")


def save(c: Client, job_id: str, out: str) -> None:
    os.makedirs(out, exist_ok=True)
    for name, path in (("zip", "export.zip"), ("csv", "correspondences.csv"), ("json", "result.json")):
        ext = "zip" if name == "zip" else name
        dest = os.path.join(out, f"lunarreg-{job_id}.{ext}" if name == "zip" else f"{job_id}-{path}")
        with open(dest, "wb") as f:
            f.write(c.get(f"/api/jobs/{job_id}/{path}"))
        print("saved", dest)


def cmd(args: argparse.Namespace, c: Client) -> int:
    if args.cmd == "health":
        print(json.dumps(c.get_json("/api/health"), indent=2))
    elif args.cmd == "samples":
        for s in c.get_json("/api/samples"):
            print(f"{s['id']:<22} {s['difficulty']:<7} {s['truthModel']:<11} {s['name']}")
    elif args.cmd == "run":
        jid = c.submit(sample=args.sample, source=args.source, reference=args.reference,
                       params=params_from(args), name=args.name or "")
        print("submitted", jid)
        job = c.wait(jid)
        print(fmt_job(job))
        for w in (job.get("result") or {}).get("warnings") or []:
            print("  warning:", w)
        if job["status"] != "completed":
            print("  error:", job.get("error", ""), file=sys.stderr)
            return 1
        if args.out:
            save(c, jid, args.out)
    elif args.cmd == "list":
        jobs = [j for j in c.get_json("/api/jobs") if not args.status or j["status"] == args.status]
        print("\n".join(fmt_job(j) for j in jobs) or "no jobs")
    elif args.cmd == "show":
        j = c.get_json(f"/api/jobs/{args.job_id}")
        if args.json:
            print(json.dumps(j, indent=2))
            return 0
        print(fmt_job(j))
        m = (j.get("result") or {}).get("metrics") or {}
        if m.get("computed"):
            t = m["transform"]
            print(f"  confidence {m['confidence']} · coverage {m['coverage']:.0%} · scale {t['scale']:.4f} · rotation {t['rotationDeg']:.2f}°")
            print(f"  median err {m['medianError']:.2f} px · max {m['maxError']:.2f} px · NCC {m['image']['ncc']:.3f}")
        if j.get("truthError") is not None:
            print(f"  ground-truth error {j['truthError']:.2f} px (SAMPLE DATA)")
    elif args.cmd == "export":
        save(c, args.job_id, args.out)
    elif args.cmd == "sweep":
        d = c.post_json(f"/api/jobs/{args.job_id}/sweep", {"param": args.param, "values": args.values})
        print(f"{args.param:>16}  result       inliers  rmse")
        for r in d["rows"]:
            print(f"{r['value']:>16g}  {'ok ' + r['model'] if r['ok'] else 'failed':<12} {r['inliers'] if r['ok'] else '-':>7}  "
                  f"{r['rmse']:.2f}" if r["ok"] else f"{r['value']:>16g}  failed")
    elif args.cmd == "delete":
        print(c.delete(f"/api/jobs/{args.job_id}"))
    return 0


def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", default=os.environ.get("LUNARREG_URL", "http://localhost:8080"))
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("health")
    sub.add_parser("samples")
    r = sub.add_parser("run")
    r.add_argument("--sample")
    r.add_argument("--source")
    r.add_argument("--reference")
    r.add_argument("--name")
    r.add_argument("--out", help="directory to save zip/csv/json when done")
    for k, t in PARAM_FLAGS.items():
        r.add_argument("--" + k.replace("_", "-"), type=t, dest=k)
    for k in ("no_denoise", "no_contrast", "no_cross_check"):
        r.add_argument("--" + k.replace("_", "-"), action="store_true")
    ls = sub.add_parser("list")
    ls.add_argument("--status")
    sh = sub.add_parser("show")
    sh.add_argument("job_id")
    sh.add_argument("--json", action="store_true")
    ex = sub.add_parser("export")
    ex.add_argument("job_id")
    ex.add_argument("--out", default=".")
    sw = sub.add_parser("sweep")
    sw.add_argument("job_id")
    sw.add_argument("param", choices=["ransacThreshold", "ratio", "features", "fastThreshold", "levels"])
    sw.add_argument("values", type=float, nargs="+")
    dl = sub.add_parser("delete")
    dl.add_argument("job_id")
    return ap


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.cmd == "run" and not (args.sample or (args.source and args.reference)):
        print("run needs --sample or both --source and --reference", file=sys.stderr)
        return 2
    try:
        cookies = os.environ.get("LUNARREG_COOKIES", os.path.expanduser("~/.config/lunarreg/cookies.txt"))
        return cmd(args, Client(args.url, cookie_file=cookies))
    except (ApiError, OSError) as e:
        print("error:", e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
