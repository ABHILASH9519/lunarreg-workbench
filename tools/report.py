#!/usr/bin/env python3
"""Render a finished job as a single self-contained HTML report (images embedded)."""
from __future__ import annotations

import argparse
import base64
import html
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lunarreg_client import Client  # noqa: E402


def na(v, fmt="{:.2f}", unit=""):
    return "N/A" if v is None else fmt.format(v) + unit


def build(c: Client, job_id: str) -> str:
    job = c.get_json(f"/api/jobs/{job_id}")
    res = job.get("result")
    if job["status"] != "completed" or not res:
        raise SystemExit(f"job {job_id} is {job['status']}: {job.get('error', '')}")
    m, t, im = res["metrics"], res["metrics"]["transform"], res["metrics"]["image"]
    e = html.escape

    def img(kind: str, cap: str) -> str:
        b64 = base64.b64encode(c.get(f"/api/jobs/{job_id}/image/{kind}")).decode()
        return f'<figure><img src="data:image/png;base64,{b64}" alt="{e(cap)}"><figcaption>{e(cap)}</figcaption></figure>'

    rows = "".join(
        f"<tr><td>{e(x['model'])}</td><td>{x['inliers']}</td><td>{x['inlierRatio']:.0%}</td>"
        f"<td>{na(x['rmse'] if x['ok'] else None)}</td><td>{'recommended' if x['model'] == res['recommendedModel'] else ''}"
        f"{' · applied' if x['model'] == res['modelUsed'] else ''}</td></tr>" for x in res["models"])
    sample = job["source"]["kind"] == "sample"
    truth = f"<tr><td>Ground-truth error</td><td>{na(job.get('truthError'), unit=' px')}</td></tr>" if sample else ""
    warns = "".join(f"<li>{e(w)}</li>" for w in (res.get("warnings") or [])) or "<li>None</li>"
    return f"""<!doctype html><html lang="en"><meta charset="utf-8"><title>LunarReg report {e(job_id)}</title>
<style>body{{font:15px/1.5 system-ui;background:#0b0e17;color:#e8ecf4;max-width:980px;margin:30px auto;padding:0 18px}}
h1,h2{{font-family:ui-sans-serif}}table{{border-collapse:collapse;width:100%}}td,th{{border-bottom:1px solid #2a3040;padding:6px 10px;text-align:left}}
figure{{margin:0}}img{{width:100%;border-radius:8px}}.g{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}
.tag{{background:#3a2d0a;color:#ffd166;padding:2px 10px;border-radius:99px;font-size:12px}}small{{color:#8c97ad}}</style>
<h1>{e(job['name'])} {'<span class="tag">SAMPLE DATA</span>' if sample else ''}</h1>
<small>Job {e(job_id)} · model {e(res['modelUsed'])} · confidence {e(m['confidence'])}</small>
<h2>Metrics</h2><table>
<tr><td>RMSE</td><td>{na(m['rmse'], unit=' px')}</td></tr><tr><td>Inliers / total</td><td>{m['inliers']} / {m['inliers'] + m['outliers']} ({m['inlierRatio']:.0%})</td></tr>
<tr><td>Median / max error</td><td>{na(m['medianError'])} / {na(m['maxError'])} px</td></tr><tr><td>Spatial coverage</td><td>{m['coverage']:.0%}</td></tr>
<tr><td>Scale · rotation</td><td>{t['scale']:.4f}× · {t['rotationDeg']:.2f}°</td></tr>
<tr><td>NCC · mutual information</td><td>{na(im['ncc'] if im['computed'] else None, '{:.3f}')} · {na(im['mutualInfo'] if im['computed'] else None, '{:.3f}')}</td></tr>{truth}</table>
<h2>Model comparison</h2><table><tr><th>Model</th><th>Inliers</th><th>Ratio</th><th>RMSE</th><th></th></tr>{rows}</table>
<h2>Warnings</h2><ul>{warns}</ul>
<h2>Imagery</h2><div class="g">{img('overlay', 'Overlay (grey = aligned, red/cyan = misfit)')}{img('difference', 'Absolute difference')}
{img('checker', 'Checkerboard')}{img('matches', 'Correspondences (cyan inlier, red outlier)')}</div>
<p><small>Metrics are internal-consistency diagnostics in processed-pixel units, not ground-truth validation.</small></p></html>"""


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("job_id")
    ap.add_argument("--url", default="http://localhost:8080")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    out = a.out or f"report-{a.job_id}.html"
    with open(out, "w") as f:
        f.write(build(Client(a.url), a.job_id))
    print("wrote", out)


if __name__ == "__main__":
    main()
