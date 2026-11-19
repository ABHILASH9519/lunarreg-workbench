"use strict";
/* LunarReg Workbench — thin client. All computation happens in the Go server. */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (v, d = 2) => v == null || Number.isNaN(v) ? '<span class="na">N/A</span>' : Number(v).toFixed(d);
const pct = v => v == null ? '<span class="na">N/A</span>' : (v * 100).toFixed(0) + "%";
const when = t => t ? new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const ms = v => v == null ? "—" : v < 1000 ? v + " ms" : (v / 1000).toFixed(1) + " s";
const view = $("#view");
let cleanups = [];
const onLeave = f => cleanups.push(f);

async function api(path, opt) {
  const r = await fetch("/api" + path, opt);
  if (!r.ok) { let m = r.statusText; try { m = (await r.json()).error || m; } catch { } throw new Error(m); }
  return (r.headers.get("content-type") || "").includes("json") ? r.json() : r;
}
function toast(msg, type = "") {
  const t = document.createElement("div"); t.className = "toast " + type; t.textContent = msg;
  $("#toasts").append(t); setTimeout(() => { t.style.opacity = 0; t.style.transition = ".3s"; setTimeout(() => t.remove(), 300); }, 4200);
}
function confirmBox(title, msg, ok = "Confirm") {
  return new Promise(res => {
    const m = document.createElement("div"); m.className = "modal";
    m.innerHTML = `<div class="card" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p class="muted">${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-v="0">Cancel</button><button class="btn dng" data-v="1">${esc(ok)}</button></div></div>`;
    const done = v => { m.remove(); document.removeEventListener("keydown", key); res(v); };
    const key = e => { if (e.key === "Escape") done(false); };
    m.onclick = e => { if (e.target === m) done(false); const b = e.target.closest("[data-v]"); if (b) done(b.dataset.v === "1"); };
    document.addEventListener("keydown", key); document.body.append(m); $("[data-v='0']", m).focus();
  });
}
function countUp(el, to, dec = 0, dur = 900) {
  if (to == null) { el.innerHTML = '<span class="na">N/A</span>'; return; }
  const t0 = performance.now(), u = el.dataset.u ? `<span class="u">${el.dataset.u}</span>` : "";
  const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.innerHTML = (to * e).toFixed(dec) + u; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const badge = (s, label) => `<span class="badge b-${esc(s)}">${esc(label || s)}</span>`;
const originBadge = k => k === "sample" ? badge("sample", "Sample data") : badge("user", "User data");

/* ---------- starfield ---------- */
(function stars() {
  const c = $("#stars"), x = c.getContext("2d"); let W, H, S = [], mx = 0, my = 0;
  const init = () => { W = c.width = innerWidth; H = c.height = innerHeight; S = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 1.6 + .3, p: Math.random() * 6.28 })); };
  addEventListener("resize", init); addEventListener("pointermove", e => { mx = e.clientX / W - .5; my = e.clientY / H - .5; }); init();
  (function f(t) {
    x.clearRect(0, 0, W, H);
    for (const s of S) { s.y += .04 * s.z; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } const a = .35 + .4 * Math.sin(t / 900 + s.p);
      x.fillStyle = `rgba(190,225,255,${a})`; x.fillRect((s.x + mx * 14 * s.z + W) % W, s.y + my * 14 * s.z, s.z, s.z); }
    requestAnimationFrame(f);
  })(0);
})();

/* ---------- shell: health, nav ---------- */
async function pollHealth() {
  try { const h = await api("/health"); $("#health").innerHTML = `<span class="dot live"></span><span>LIVE · v${esc(h.version)} · ${h.workers} workers</span>`; $("#qchip").textContent = "queue " + h.queued; }
  catch { $("#health").innerHTML = `<span class="dot off"></span><span>OFFLINE</span>`; }
}
pollHealth(); setInterval(pollHealth, 5000);
$("#burger").onclick = () => $("#side").classList.toggle("open");
let gPending = false;
addEventListener("keydown", e => {
  if (/input|textarea|select/i.test(e.target.tagName) || e.metaKey || e.ctrlKey) return;
  if (e.key === "?") return toast("g d · dashboard   g n · new   g h · history   g l · lab   g t · technology");
  if (gPending) { gPending = false; const m = { d: "/", n: "/new", h: "/history", l: "/lab", t: "/about" }[e.key]; if (m) location.hash = "#" + m; return; }
  if (e.key === "g") { gPending = true; setTimeout(() => gPending = false, 900); }
});

/* ---------- router ---------- */
const routes = [
  [/^\/?$/, "dash", "Mission Control", dashboard], [/^\/new$/, "new", "New Registration", newReg],
  [/^\/history$/, "history", "Job History", history], [/^\/job\/([0-9a-f]{12})$/, "history", "Job", jobPage],
  [/^\/lab(?:\/([0-9a-f]{12}))?$/, "lab", "Experiment Lab", lab], [/^\/about$/, "about", "Technology", about],
];
async function route() {
  cleanups.forEach(f => { try { f(); } catch { } }); cleanups = [];
  $("#side").classList.remove("open");
  const p = location.hash.slice(1) || "/";
  const r = routes.find(r => r[0].test(p));
  const [, key, title, fn] = r || routes[0];
  $$("nav.side a.nl").forEach(a => a.classList.toggle("on", a.dataset.r === key));
  $("#crumb").textContent = title; document.title = title + " · LunarReg Workbench";
  view.className = "view"; view.innerHTML = '<div class="grid g4"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
  window.scrollTo(0, 0);
  try { const m = r ? p.match(r[0]) : []; const html = await fn(...(m || []).slice(1)); if (typeof html === "string") view.innerHTML = html; view.className = "view"; void view.offsetWidth; (fn.after || (() => { }))(); }
  catch (e) { view.innerHTML = `<div class="card empty"><div class="big">🛰️</div><h2>Signal lost</h2><p>${esc(e.message)}</p><a class="btn pri" href="#/">Back to Mission Control</a></div>`; }
}
addEventListener("hashchange", route);

/* ---------- shared actions ---------- */
async function startJob(fd) {
  const r = await api("/jobs", { method: "POST", body: fd });
  location.hash = "#/job/" + r.id;
}
async function runSample(id, params) {
  const fd = new FormData(); fd.set("sample", id); if (params) fd.set("params", JSON.stringify(params));
  try { await startJob(fd); } catch (e) { toast(e.message, "bad"); }
}
const imgTag = (src, cls = "thumb", alt = "") => `<img class="${cls}" src="${src}" alt="${esc(alt)}" loading="lazy">`;

/* ---------- dashboard ---------- */
async function dashboard() {
  const [st, samples, jobs, c1, c2, c3] = await Promise.all([api("/stats"), api("/samples"), api("/jobs"),
    fetch("/api/charts/rmse.svg").then(r => r.text()), fetch("/api/charts/models.svg").then(r => r.text()), fetch("/api/charts/confidence.svg").then(r => r.text())]);
  dashboard.after = () => {
    $$(".cu").forEach(e => countUp(e, e.dataset.to === "" ? null : +e.dataset.to, +e.dataset.d));
    $$("[data-run]").forEach(b => b.onclick = e => { e.stopPropagation(); b.disabled = true; b.textContent = "Launching…"; runSample(b.dataset.run); });
    if (jobs.some(j => ["queued", "running"].includes(j.status))) { const t = setTimeout(route, 2500); onLeave(() => clearTimeout(t)); }
  };
  const k = (l, v, d, u = "") => `<div class="card kpi"><div class="lbl">${l}</div><div class="v mono cu" data-to="${v ?? ""}" data-d="${d}" data-u="${u}"></div></div>`;
  const recent = jobs.slice(0, 5).map(j => `<tr class="click" onclick="location.hash='#/job/${j.id}'"><td>${j.status === "completed" ? imgTag(`/api/jobs/${j.id}/image/overlay`, "thumbs") : ""}</td><td><b>${esc(j.name)}</b><div class="muted" style="font-size:12px">${when(j.createdAt)}</div></td><td>${badge(j.status)}</td><td class="mono">${j.result?.metrics?.computed ? j.result.metrics.rmse.toFixed(2) + " px" : "N/A"}</td></tr>`).join("");
  return `<div class="stagger">
  <section class="hero scan"><div class="lbl" style="color:var(--gold)">Lunar imagery · correspondence analysis</div>
    <h1 style="margin:8px 0 12px">Align the Moon.<br><span style="color:var(--cyan)">Prove the geometry.</span></h1>
    <p>Register a moving lunar image onto a fixed reference with multi-octave features and RANSAC verification across similarity, affine and homography models — every metric computed, never invented.</p>
    <div class="row mt2"><a class="btn pri" href="#/new">▶ New registration</a><button class="btn gold" data-run="${esc(samples[0].id)}">⚡ Run a sample pair</button><a class="btn" href="#/about">How it works</a></div></section>
  <div class="grid g5 mt">${k("Jobs", st.total, 0)}${k("Success rate", st.successRate == null ? null : st.successRate * 100, 0, "%")}${k("Mean RMSE", st.meanRMSE, 2, "px")}${k("Mean inlier ratio", st.meanInlierRatio == null ? null : st.meanInlierRatio * 100, 0, "%")}${k("Mean runtime", st.meanRuntimeMs == null ? null : st.meanRuntimeMs / 1000, 1, "s")}</div>
  <div class="grid g3 mt"><div class="card"><div class="lbl">RMSE trend</div>${c1}</div><div class="card"><div class="lbl">Model usage</div>${c2}</div><div class="card"><div class="lbl">Confidence</div>${c3}</div></div>
  <div class="grid g2 mt"><div class="card"><div class="row between"><h3>Recent registrations</h3><a href="#/history">View all →</a></div>
    ${recent ? `<div class="tw"><table><tbody>${recent}</tbody></table></div>` : `<div class="empty"><div class="big">🌑</div>No registrations yet.<br>Run a sample pair to see the pipeline live.</div>`}</div>
  <div class="card"><div class="row between"><h3>Sample pairs</h3>${badge("sample", "synthetic")}</div><div class="grid" style="margin-top:12px">${samples.map(s => `<div class="row between"><div><b>${esc(s.name)}</b><div class="muted" style="font-size:12px">${esc(s.sensor)} · ${esc(s.difficulty)} · truth: ${esc(s.truthModel)}</div></div><button class="btn sm" data-run="${esc(s.id)}">Run</button></div>`).join("")}</div></div></div></div>`;
}

/* ---------- new registration ---------- */
const PRESETS = {
  fast: { features: 600, levels: 2, maxIter: 1500, maxDim: 384 },
  balanced: { features: 1200, levels: 3, maxIter: 2500, maxDim: 512, ratio: .85, ransacThreshold: 3, fastThreshold: 14 },
  precise: { features: 2200, levels: 4, maxIter: 6000, maxDim: 768, ratio: .8, ransacThreshold: 2, fastThreshold: 10 },
};
const CTL = [["features", "Max features", 100, 5000, 100, ""], ["levels", "Pyramid levels", 1, 5, 1, ""], ["fastThreshold", "FAST threshold", 3, 60, 1, ""], ["ratio", "Lowe ratio", .5, .99, .01, ""],
  ["ransacThreshold", "RANSAC threshold", .5, 12, .5, " px"], ["maxDim", "Processing size", 128, 1024, 64, " px"], ["gridCells", "Spatial grid", 0, 12, 1, "×"], ["gridMaxPerCell", "Max per cell", 5, 80, 5, ""], ["maxIter", "RANSAC iterations", 100, 10000, 100, ""]];
const reg = { step: 1, mode: "sample", sample: null, files: {}, params: null };
async function newReg() {
  const [samples, defs] = await Promise.all([api("/samples"), api("/defaults")]);
  if (!reg.params) reg.params = { ...defs, model: "auto" };
  if (!reg.sample) reg.sample = samples[0].id;
  const paint = () => {
    const p = reg.params, canGo = reg.mode === "sample" ? !!reg.sample : !!(reg.files.source && reg.files.reference);
    const step = n => `<div class="step ${reg.step === n ? "on" : reg.step > n ? "done" : ""}" data-s="${n}"><i>${reg.step > n ? "✓" : n}</i>${["Select images", "Configure"][n - 1]}</div>`;
    let body;
    if (reg.step === 1) body = `<div class="row between"><div class="seg" id="mode"><button data-m="sample" class="${reg.mode === "sample" ? "on" : ""}">Sample pairs</button><button data-m="upload" class="${reg.mode === "upload" ? "on" : ""}">Upload images</button></div>${reg.mode === "sample" ? badge("sample", "Sample data (synthetic)") : badge("user", "User data")}</div><div class="mt2">` +
      (reg.mode === "sample" ? `<div class="grid g3 stagger">${samples.map(s => `<div class="card sample hov ${reg.sample === s.id ? "sel" : ""}" data-id="${esc(s.id)}"><div class="pair">${imgTag(`/api/samples/${s.id}/source.png`, "", "source")}${imgTag(`/api/samples/${s.id}/reference.png`, "", "reference")}</div><div class="row between"><b>${esc(s.name)}</b>${badge(s.difficulty === "easy" ? "ok" : s.difficulty === "hard" ? "bad" : "warn", s.difficulty)}</div><div class="muted" style="font-size:13px;margin-top:4px">${esc(s.description)}</div></div>`).join("")}</div>` :
        `<div class="grid g2">${["source", "reference"].map(k => `<div><div class="lbl" style="margin-bottom:6px">${k === "source" ? "Source (moving)" : "Reference (fixed)"}</div><label class="drop" data-k="${k}"><input type="file" hidden accept=".png,.jpg,.jpeg,.tif,.tiff,image/png,image/jpeg,image/tiff">${reg.files[k] ? `<img src="${reg.files[k].url}" alt="${k} preview"><b>${esc(reg.files[k].file.name)}</b><span class="muted">${(reg.files[k].file.size / 1048576).toFixed(2)} MB</span>` : `<div style="font-size:34px">⬆</div><b>Drop a ${k} image</b><span class="muted">PNG, JPEG or TIFF/GeoTIFF · max 20 MB</span>`}</label></div>`).join("")}</div>`) + `</div>`;
    else body = `<div class="row between"><div><div class="lbl">Presets</div><div class="seg mt2" id="presets">${Object.keys(PRESETS).map(k => `<button data-p="${k}">${k}</button>`).join("")}</div></div><div class="seg" id="models">${["auto", "similarity", "affine", "homography"].map(m => `<button data-m="${m}" class="${p.model === m ? "on" : ""}">${m}</button>`).join("")}</div></div>
      <div class="grid g3 mt">${CTL.map(([k, l, a, b, st, u]) => `<div class="ctl"><div class="top"><span class="lbl">${l}</span><span class="val" id="v-${k}">${p[k]}${u}</span></div><input type="range" data-k="${k}" min="${a}" max="${b}" step="${st}" value="${p[k]}"></div>`).join("")}</div>
      <div class="card mt" style="padding:6px 18px">${[["denoise", "Median denoise", "Edge-preserving 3×3 filter"], ["contrast", "CLAHE contrast", "Adaptive histogram equalisation"], ["crossCheck", "Mutual cross-check", "Keep only mutual nearest neighbours"]].map(([k, l, d]) => `<div class="sw"><div><b>${l}</b><div class="muted" style="font-size:12px">${d}</div></div><input type="checkbox" class="tog" data-t="${k}" ${p[k] ? "checked" : ""}></div>`).join("")}</div>
      <div class="ctl mt"><span class="lbl">Job name (optional)</span><input type="text" id="jname" maxlength="120" placeholder="e.g. Tycho rim — NAC vs TMC-2" value="${esc(reg.name || "")}"></div>`;
    view.innerHTML = `<div class="view"><h2 style="margin-bottom:14px">New registration</h2><div class="steps">${step(1)}${step(2)}</div><div class="card">${body}</div>
      <div class="row between mt2"><button class="btn" id="back" ${reg.step === 1 ? "disabled" : ""}>← Back</button>${reg.step === 1 ? `<button class="btn pri" id="next" ${canGo ? "" : "disabled"}>Configure →</button>` : `<button class="btn gold" id="go">▶ Run registration</button>`}</div></div>`;
    $$(".step").forEach(s => s.onclick = () => { if (+s.dataset.s === 1 || canGo) { reg.step = +s.dataset.s; paint(); } });
    $("#back").onclick = () => { reg.step = 1; paint(); }; if ($("#next")) $("#next").onclick = () => { reg.step = 2; paint(); };
    $$("#mode button").forEach(b => b.onclick = () => { reg.mode = b.dataset.m; paint(); });
    $$(".sample").forEach(c => c.onclick = () => { reg.sample = c.dataset.id; paint(); });
    $$(".drop").forEach(d => {
      const inp = $("input", d), set = f => { if (!f) return; if (f.size > 20 << 20) return toast("File exceeds 20 MB", "bad"); if (!/\.(png|jpe?g|tiff?)$/i.test(f.name)) return toast("Use PNG, JPEG or TIFF", "bad");
        if (reg.files[d.dataset.k]) URL.revokeObjectURL(reg.files[d.dataset.k].url);
        reg.files[d.dataset.k] = { file: f, url: /tiff?$/i.test(f.name) ? "favicon.svg" : URL.createObjectURL(f) }; paint(); };
      inp.onchange = () => set(inp.files[0]);
      ["dragenter", "dragover"].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add("over"); }));
      ["dragleave", "drop"].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove("over"); }));
      d.addEventListener("drop", e => set(e.dataTransfer.files[0]));
    });
    $$("#presets button").forEach(b => b.onclick = () => { Object.assign(reg.params, PRESETS[b.dataset.p]); paint(); toast("Preset: " + b.dataset.p); });
    $$("#models button").forEach(b => b.onclick = () => { reg.params.model = b.dataset.m; paint(); });
    $$("input[type=range]").forEach(r => r.oninput = () => { reg.params[r.dataset.k] = +r.value; const c = CTL.find(c => c[0] === r.dataset.k); $("#v-" + r.dataset.k).textContent = r.value + c[5]; });
    $$(".tog").forEach(t => t.onchange = () => reg.params[t.dataset.t] = t.checked);
    if ($("#jname")) $("#jname").oninput = e => reg.name = e.target.value;
    if ($("#go")) $("#go").onclick = async e => {
      e.target.disabled = true; e.target.textContent = "Launching…"; const fd = new FormData();
      fd.set("params", JSON.stringify(reg.params)); if (reg.name) fd.set("name", reg.name);
      if (reg.mode === "sample") fd.set("sample", reg.sample); else { fd.set("source", reg.files.source.file); fd.set("reference", reg.files.reference.file); }
      try { await startJob(fd); } catch (err) { toast(err.message, "bad"); e.target.disabled = false; e.target.textContent = "▶ Run registration"; }
    };
  };
  paint(); return null;
}

/* ---------- job page ---------- */
const STAGES = [["preprocess", "Preprocess", "Denoise · CLAHE"], ["features", "Features", "FAST + Harris · pyramid · BRIEF"], ["matching", "Matching", "Hamming · ratio · cross-check"], ["verify", "Verify", "RANSAC · 3 models"], ["warp", "Warp", "Resample into reference"], ["metrics", "Metrics", "RMSE · coverage · NCC"], ["compose", "Compose", "Overlay · diff · checker"]];
async function jobPage(id) {
  const j = await api("/jobs/" + id);
  const head = `<div class="row between"><div><div class="lbl">${esc(j.id)} · ${when(j.createdAt)}</div><h2 style="margin:4px 0 8px">${esc(j.name)}</h2><div class="row">${badge(j.status)}${originBadge(j.source.kind)}<span class="chip">${esc(j.result?.modelUsed || j.params.model)}</span>${j.durationMs ? `<span class="chip">${ms(j.durationMs)}</span>` : ""}</div></div><div class="row" id="acts"></div></div>`;
  const acts = () => {
    const a = $("#acts"); if (!a) return;
    const done = j.status === "completed" && j.result;
    a.innerHTML = `${["queued", "running"].includes(j.status) ? `<button class="btn dng" id="cancel">Cancel</button>` : `<button class="btn" id="rerun">↻ Re-run</button>`}${j.result ? `<a class="btn" href="#/lab/${j.id}">🧪 Lab</a>` : ""}${done ? `<a class="btn pri" href="/api/jobs/${j.id}/export.zip">⬇ ZIP</a><a class="btn" href="/api/jobs/${j.id}/correspondences.csv">CSV</a><a class="btn" href="/api/jobs/${j.id}/result.json">JSON</a>` : ""}<button class="btn dng" id="del">Delete</button>`;
    if ($("#cancel")) $("#cancel").onclick = () => api(`/jobs/${id}/cancel`, { method: "POST" }).then(() => toast("Cancelling…"));
    if ($("#rerun")) $("#rerun").onclick = () => rerun({});
    $("#del").onclick = async () => { if (await confirmBox("Delete job?", "This removes the job, its images and results permanently.", "Delete")) { await api("/jobs/" + id, { method: "DELETE" }); toast("Job deleted", "ok"); location.hash = "#/history"; } };
  };
  const rerun = async body => { try { const r = await api(`/jobs/${id}/rerun`, { method: "POST", body: JSON.stringify(body) }); location.hash = "#/job/" + r.id; } catch (e) { toast(e.message, "bad"); } };
  jobPage.after = () => {
    acts();
    if (["queued", "running"].includes(j.status)) live(j);
    else if (j.result?.metrics?.computed) setupViewer(j);
    if ($("#relax")) $("#relax").onclick = () => rerun({ ratio: .92, fastThreshold: 8, features: 2200, ransacThreshold: 4, gridCells: 0, crossCheck: false, model: "auto" });
  };
  if (["queued", "running"].includes(j.status)) return `<div class="stagger">${head}<div class="grid g2 mt"><div class="card"><div class="row between"><h3>Live pipeline</h3><span class="mono" id="pp">0%</span></div><div class="bar mt2"><i id="pb" style="width:0"></i></div><div class="stages mt2" id="stages">${STAGES.map(s => `<div class="stg" data-st="${s[0]}"><span class="ic"></span><div><b>${s[1]}</b><div style="font-size:12px">${s[2]}</div></div></div>`).join("")}</div></div><div class="card"><h3>Console</h3><div class="console mt2" id="con"></div></div></div></div>`;
  if (j.status !== "completed" || !j.result?.metrics?.computed) {
    const r = j.result;
    return `<div class="stagger">${head}<div class="card mt"><div class="warn err"><b>${esc(j.status === "cancelled" ? "Cancelled" : "Registration did not complete")}</b><div>${esc(j.error || "")}</div></div>${(r?.warnings || []).map(w => `<div class="warn">${esc(w)}</div>`).join("")}
      <p class="muted">Raw matches ${r?.rawMatches ?? "N/A"} · after filtering ${r?.filteredMatches ?? "N/A"} · keypoints ${r?.sourceKeypoints ?? "N/A"} / ${r?.referenceKeypoints ?? "N/A"}. No metrics are shown because none were validly computed.</p>
      <div class="row"><button class="btn gold" id="relax">Retry with relaxed settings</button><a class="btn" href="#/new">Choose different images</a></div></div>
      ${r?.models?.length ? `<div class="card mt">${modelTable(r)}</div>` : ""}</div>`;
  }
  return resultHTML(j, head);
}
function modelTable(r) {
  return `<h3>Model comparison</h3><div class="tw mt2"><table><thead><tr><th>Model</th><th>Inliers</th><th>Ratio</th><th>RMSE</th><th>Median</th><th>Max</th><th></th></tr></thead><tbody>${r.models.map(m => `<tr><td><b>${m.model}</b></td><td class="mono">${m.inliers}</td><td class="mono">${pct(m.inlierRatio)}</td><td class="mono">${m.ok ? m.rmse.toFixed(2) : "N/A"}</td><td class="mono">${m.ok ? m.medianError.toFixed(2) : "N/A"}</td><td class="mono">${m.ok ? m.maxError.toFixed(2) : "N/A"}</td><td>${m.model === r.recommendedModel ? badge("ok", "recommended") : ""} ${m.model === r.modelUsed ? badge("info", "applied") : ""} ${m.ok ? "" : badge("bad", "no consensus")}</td></tr>`).join("")}</tbody></table></div>`;
}
function resultHTML(j, head) {
  const r = j.result, m = r.metrics, t = m.transform, im = m.image;
  const cell = (l, v, s = "") => `<div><div class="lbl">${l}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
  return `<div class="stagger">${head}
  <div class="layout mt"><div>
    <div class="tabs" id="tabs">${[["registered", "Registered"], ["overlay", "Overlay"], ["before", "Before"], ["difference", "Difference"], ["checker", "Checker"], ["matches", "Matches"], ["inputs", "Inputs"]].map(([k, l]) => `<button data-k="${k}">${l}</button>`).join("")}<button data-k="compare">⇄ Compare</button></div>
    <div class="viewer scan" id="vw"><span class="tag" id="vtag"></span><div class="stage" id="stage"></div><div class="split" id="split" hidden></div>
      <div class="hud"><button class="btn sm" id="zi">＋</button><button class="btn sm" id="zo">－</button><button class="btn sm" id="zf">Fit</button><button class="btn sm" id="zp">● Points</button></div></div>
    <div class="muted mt2" style="font-size:12px">Scroll to zoom · drag to pan · double-click to fit. Overlay: aligned areas are grey, misregistration shows red/cyan fringes. Coordinates are in processed pixels.</div>
    <div class="card mt">${modelTable(r)}</div></div>
  <div class="grid">
    <div class="card"><div class="row between"><h3>Telemetry</h3>${badge(m.confidence)}</div><p class="muted" style="margin:6px 0 12px;font-size:13px">${esc(m.confidenceNote)}</p>
      <div class="met">${cell("RMSE", num(m.rmse) + " px")}${cell("Inliers", `${m.inliers} <span class="s">/ ${m.inliers + m.outliers}</span>`, pct(m.inlierRatio) + " consensus")}${cell("Median error", num(m.medianError) + " px", "max " + num(m.maxError) + " px")}${cell("Coverage", pct(m.coverage), "hull " + pct(m.hullRatio))}
      ${cell("Scale", num(t.scale, 4) + "×")}${cell("Rotation", num(t.rotationDeg) + "°")}${cell("Translation", `${num(t.tx, 1)}, ${num(t.ty, 1)}`, "px")}${cell("Shear / persp.", `${num(t.shear, 3)} / ${num(t.perspective * 1000, 2)}e-3`)}
      ${cell("NCC", im.computed ? num(im.ncc, 3) : "N/A", "overlap " + (im.computed ? pct(im.overlapRatio) : "N/A"))}${cell("Mutual info", im.computed ? num(im.mutualInfo, 3) : "N/A", "normalised")}
      ${j.truthError != null ? cell("Truth error", num(j.truthError) + " px", "synthetic ground truth") : ""}${cell("Keypoints", `${r.sourceKeypoints} / ${r.referenceKeypoints}`, `${r.rawMatches} raw → ${r.filteredMatches}`)}</div></div>
    ${r.warnings?.length ? `<div class="card"><h3 style="margin-bottom:10px">Warnings</h3>${r.warnings.map(w => `<div class="warn">${esc(w)}</div>`).join("")}</div>` : ""}
    <div class="card"><h3 style="margin-bottom:10px">Pipeline timings</h3>${Object.entries(r.timingsMs).map(([k, v]) => `<div class="row between" style="font-size:13px"><span class="muted">${k}</span><span class="mono">${ms(v)}</span></div><div class="bar" style="height:4px;margin:3px 0 8px"><i style="width:${Math.min(100, v / Math.max(...Object.values(r.timingsMs), 1) * 100)}%"></i></div>`).join("")}</div>
  </div></div>
  <div class="card mt"><div class="row between"><h3>Correspondences</h3><div class="seg" id="cf">${["all", "inliers", "outliers"].map((k, i) => `<button data-f="${k}" class="${i ? "" : "on"}">${k}</button>`).join("")}</div></div><div class="scroll mt2"><table id="ct"><thead><tr><th data-s="i">#</th><th>Source</th><th>Reference</th><th data-s="err">Error px</th><th data-s="dist">Hamming</th><th data-s="level">Lvl</th><th>Class</th></tr></thead><tbody></tbody></table></div></div>
  <div class="card mt"><h3>Run configuration</h3><div class="grid g4 mt2">${Object.entries(r.params).map(([k, v]) => `<div><div class="lbl">${esc(k)}</div><div class="mono">${esc(v)}</div></div>`).join("")}</div></div></div>`;
}

function live(j) {
  const id = j.id, con = $("#con"); let cur = null;
  const line = (s, m, t) => { con.insertAdjacentHTML("beforeend", `<div><b>[${s}]</b> ${esc(m)}</div>`); con.scrollTop = con.scrollHeight; };
  (j.log || []).forEach(l => line(l.stage, l.msg));
  const mark = (stage, p) => {
    cur = stage; const i = STAGES.findIndex(s => s[0] === stage);
    $$(".stg").forEach((e, k) => { e.classList.toggle("ok", k < i || stage === "done"); e.classList.toggle("act", k === i && stage !== "done"); e.querySelector(".ic").textContent = k < i || stage === "done" ? "✓" : ""; });
    $("#pb").style.width = Math.round(p * 100) + "%"; $("#pp").textContent = Math.round(p * 100) + "%";
  };
  mark(j.stage, j.progress || 0);
  let finished = false; const fin = () => { if (!finished) { finished = true; mark("done", 1); setTimeout(route, 450); } };
  const es = new EventSource(`/api/jobs/${id}/events`); let poll;
  es.onmessage = e => { const d = JSON.parse(e.data); if (d.type === "progress") { if (d.msg && d.msg !== "connected") line(d.stage, d.msg); mark(d.stage, d.progress); } else { es.close(); fin(); } };
  es.onerror = () => { es.close(); poll = setInterval(async () => { try { const k = await api("/jobs/" + id); if (!["queued", "running"].includes(k.status)) { clearInterval(poll); fin(); } else mark(k.stage, k.progress); } catch { } }, 1000); };
  onLeave(() => { es.close(); clearInterval(poll); finished = true; });
}

function setupViewer(j) {
  const r = j.result, vw = $("#vw"), stage = $("#stage"), split = $("#split"), tip = $("#tip");
  const W = r.referenceSize[0], H = r.referenceSize[1], src = k => `/api/jobs/${j.id}/image/${k}`;
  const V = { kind: "registered", compare: false, pts: true, k: 1, tx: 0, ty: 0, sx: .5, hl: -1, nat: [W, H] };
  const tags = { registered: "REGISTERED SOURCE", overlay: "OVERLAY · red/cyan fringes = misfit", before: "BEFORE REGISTRATION", difference: "ABSOLUTE DIFFERENCE", checker: "CHECKERBOARD", matches: "CORRESPONDENCES · cyan inlier · red outlier", inputs: "PROCESSED INPUTS", compare: "REFERENCE ◂ ▸ REGISTERED" };
  const fit = () => { const [w, h] = V.nat; V.k = Math.min(vw.clientWidth / w, vw.clientHeight / h); V.tx = (vw.clientWidth - w * V.k) / 2; V.ty = (vw.clientHeight - h * V.k) / 2; apply(); };
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  function draw() {
    const c = canvas.getContext("2d"); c.clearRect(0, 0, W, H);
    const show = V.pts && (V.compare || !["matches", "inputs"].includes(V.kind));
    canvas.style.display = show ? "block" : "none"; if (!show) return;
    const rad = Math.max(2, 4 / V.k);
    r.correspondences.forEach((p, i) => { c.beginPath(); c.arc(p.rx, p.ry, rad, 0, 6.283); c.lineWidth = 1.3 / V.k; c.strokeStyle = p.inlier ? "#5fe3ee" : "#ff6b6b"; c.fillStyle = p.inlier ? "#5fe3ee33" : "#ff6b6b33"; c.fill(); c.stroke(); });
    if (V.hl >= 0) { const p = r.correspondences[V.hl]; c.beginPath(); c.arc(p.rx, p.ry, rad * 2.6, 0, 6.283); c.lineWidth = 2.4 / V.k; c.strokeStyle = "#ffd166"; c.stroke(); }
  }
  function apply() {
    stage.style.transform = `translate(${V.tx}px,${V.ty}px) scale(${V.k})`;
    if (V.compare) { const top = $("#ctop"); if (top) top.style.clipPath = `inset(0 0 0 ${Math.max(0, (V.sx * vw.clientWidth - V.tx) / V.k)}px)`; split.style.left = V.sx * 100 + "%"; }
    draw();
  }
  function paint() {
    $$("#tabs button").forEach(b => b.classList.toggle("on", V.compare ? b.dataset.k === "compare" : b.dataset.k === V.kind));
    $("#vtag").textContent = tags[V.compare ? "compare" : V.kind]; split.hidden = !V.compare; stage.innerHTML = "";
    let imgs;
    if (V.compare) { V.nat = [W, H]; imgs = `<img src="${src("reference")}" width="${W}" height="${H}" alt="reference"><img id="ctop" src="${src("registered")}" width="${W}" height="${H}" alt="registered">`; }
    else if (V.kind === "matches") { V.nat = [r.sourceSize[0] + W, Math.max(r.sourceSize[1], H)]; imgs = `<img src="${src("matches")}" alt="matches">`; }
    else if (V.kind === "inputs") { V.nat = [r.sourceSize[0] + W + 12, Math.max(r.sourceSize[1], H)]; imgs = `<img src="${src("source")}" alt="source"><img src="${src("reference")}" style="left:${r.sourceSize[0] + 12}px" alt="reference">`; }
    else { V.nat = [W, H]; imgs = `<img src="${src(V.kind)}" width="${W}" height="${H}" alt="${V.kind}">`; }
    stage.style.width = V.nat[0] + "px"; stage.style.height = V.nat[1] + "px"; stage.innerHTML = imgs; stage.append(canvas); fit();
  }
  $$("#tabs button").forEach(b => b.onclick = () => { if (b.dataset.k === "compare") V.compare = true; else { V.compare = false; V.kind = b.dataset.k; } paint(); });
  $("#zp").onclick = () => { V.pts = !V.pts; $("#zp").style.opacity = V.pts ? 1 : .5; draw(); };
  const zoomAt = (f, cx, cy) => { const nk = Math.max(.1, Math.min(24, V.k * f)); V.tx = cx - (cx - V.tx) * nk / V.k; V.ty = cy - (cy - V.ty) * nk / V.k; V.k = nk; apply(); };
  $("#zi").onclick = () => zoomAt(1.4, vw.clientWidth / 2, vw.clientHeight / 2); $("#zo").onclick = () => zoomAt(1 / 1.4, vw.clientWidth / 2, vw.clientHeight / 2); $("#zf").onclick = fit; vw.ondblclick = fit;
  vw.addEventListener("wheel", e => { e.preventDefault(); const b = vw.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - b.left, e.clientY - b.top); }, { passive: false });
  let drag = null;
  vw.addEventListener("pointerdown", e => { if (e.target === split || e.target.closest(".hud")) return; drag = { x: e.clientX, y: e.clientY, tx: V.tx, ty: V.ty }; vw.setPointerCapture(e.pointerId); vw.classList.add("drag"); });
  split.addEventListener("pointerdown", e => { e.stopPropagation(); split.setPointerCapture(e.pointerId); split.dragging = true; });
  split.addEventListener("pointermove", e => { if (!split.dragging) return; const b = vw.getBoundingClientRect(); V.sx = Math.max(.02, Math.min(.98, (e.clientX - b.left) / b.width)); apply(); });
  split.addEventListener("pointerup", () => split.dragging = false);
  vw.addEventListener("pointermove", e => {
    if (drag) { V.tx = drag.tx + e.clientX - drag.x; V.ty = drag.ty + e.clientY - drag.y; apply(); tip.style.display = "none"; return; }
    if (canvas.style.display === "none") { tip.style.display = "none"; return; }
    const b = vw.getBoundingClientRect(), ix = (e.clientX - b.left - V.tx) / V.k, iy = (e.clientY - b.top - V.ty) / V.k; let best = -1, bd = (10 / V.k) ** 2;
    r.correspondences.forEach((p, i) => { const d = (p.rx - ix) ** 2 + (p.ry - iy) ** 2; if (d < bd) { bd = d; best = i; } });
    if (best >= 0) { const p = r.correspondences[best]; tip.innerHTML = `#${best} · ${p.inlier ? "inlier" : "outlier"}<br>error ${p.err.toFixed(2)} px · hamming ${p.dist} · lvl ${p.level}`; tip.style.display = "block"; tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px"; } else tip.style.display = "none";
  });
  vw.addEventListener("pointerup", () => { drag = null; vw.classList.remove("drag"); }); vw.addEventListener("pointerleave", () => tip.style.display = "none");
  const ro = new ResizeObserver(() => apply()); ro.observe(vw); onLeave(() => { ro.disconnect(); tip.style.display = "none"; });
  // correspondences table
  let filt = "all", sortK = "i", dir = 1;
  const rows = () => {
    let a = r.correspondences.map((p, i) => ({ ...p, i })).filter(p => filt === "all" || (filt === "inliers") === p.inlier);
    a.sort((x, y) => (x[sortK] - y[sortK]) * dir); return a.slice(0, 150);
  };
  const tbl = () => { $("#ct tbody").innerHTML = rows().map(p => `<tr data-i="${p.i}" class="click ${p.i === V.hl ? "hl" : ""}"><td class="mono">${p.i}</td><td class="mono">${p.sx.toFixed(1)}, ${p.sy.toFixed(1)}</td><td class="mono">${p.rx.toFixed(1)}, ${p.ry.toFixed(1)}</td><td class="mono">${p.err.toFixed(2)}</td><td class="mono">${p.dist}</td><td class="mono">${p.level}</td><td>${badge(p.inlier ? "ok" : "bad", p.inlier ? "inlier" : "outlier")}</td></tr>`).join(""); };
  $("#ct tbody").onclick = e => { const tr = e.target.closest("tr"); if (!tr) return; V.hl = +tr.dataset.i; if (V.kind === "matches" || V.kind === "inputs") { V.kind = "registered"; V.compare = false; paint(); } draw(); tbl(); vw.scrollIntoView({ behavior: "smooth", block: "center" }); };
  $$("#ct th[data-s]").forEach(th => th.onclick = () => { dir = sortK === th.dataset.s ? -dir : 1; sortK = th.dataset.s; tbl(); });
  $$("#cf button").forEach(b => b.onclick = () => { filt = b.dataset.f; $$("#cf button").forEach(x => x.classList.toggle("on", x === b)); tbl(); });
  paint(); tbl();
}

/* ---------- history ---------- */
async function history() {
  let jobs = await api("/jobs"), q = "", fs = "all", so = "new";
  history.after = () => {
    const paint = () => {
      let a = jobs.filter(j => (fs === "all" || j.status === fs) && (j.name + j.id).toLowerCase().includes(q.toLowerCase()));
      const val = j => j.result?.metrics?.rmse ?? Infinity;
      a.sort((x, y) => so === "new" ? new Date(y.createdAt) - new Date(x.createdAt) : so === "rmse" ? val(x) - val(y) : (y.result?.metrics?.inliers || 0) - (x.result?.metrics?.inliers || 0));
      $("#hb").innerHTML = a.map(j => `<tr class="click" data-id="${j.id}"><td>${j.status === "completed" ? imgTag(`/api/jobs/${j.id}/image/overlay`, "thumbs") : '<div class="thumbs"></div>'}</td><td><b>${esc(j.name)}</b><div class="muted mono" style="font-size:11px">${j.id}</div></td><td>${badge(j.status)}</td><td>${originBadge(j.source.kind)}</td><td class="mono">${esc(j.result?.modelUsed || "—")}</td><td class="mono">${j.result?.metrics?.computed ? j.result.metrics.rmse.toFixed(2) + " px" : "N/A"}</td><td class="mono">${j.result?.metrics?.computed ? j.result.metrics.inliers : "N/A"}</td><td class="mono">${ms(j.durationMs)}</td><td class="muted">${when(j.createdAt)}</td><td><button class="btn sm dng" data-del="${j.id}" aria-label="Delete">✕</button></td></tr>`).join("");
      $("#hn").textContent = `${a.length} of ${jobs.length} jobs`; $("#he").hidden = a.length > 0; $("#ht").hidden = a.length === 0;
    };
    $("#hq").oninput = e => { q = e.target.value; paint(); }; $("#hs").onchange = e => { so = e.target.value; paint(); };
    $$("#hf button").forEach(b => b.onclick = () => { fs = b.dataset.f; $$("#hf button").forEach(x => x.classList.toggle("on", x === b)); paint(); });
    $("#hb").onclick = async e => {
      const d = e.target.closest("[data-del]"); if (d) { e.stopPropagation(); if (await confirmBox("Delete job?", "This cannot be undone.", "Delete")) { await api("/jobs/" + d.dataset.del, { method: "DELETE" }); jobs = jobs.filter(j => j.id !== d.dataset.del); paint(); toast("Deleted", "ok"); } return; }
      const tr = e.target.closest("tr"); if (tr) location.hash = "#/job/" + tr.dataset.id;
    };
    paint();
    if (jobs.some(j => ["queued", "running"].includes(j.status))) { const t = setTimeout(route, 2500); onLeave(() => clearTimeout(t)); }
  };
  return `<div class="row between"><h2>Job history</h2><a class="btn pri" href="#/new">＋ New registration</a></div>
  <div class="card mt2"><div class="row"><div style="flex:1;min-width:200px"><input type="search" id="hq" placeholder="Search by name or id…" aria-label="Search jobs"></div><div class="seg" id="hf">${["all", "completed", "running", "failed"].map((k, i) => `<button data-f="${k}" class="${i ? "" : "on"}">${k}</button>`).join("")}</div><select id="hs" style="width:auto" aria-label="Sort"><option value="new">Newest</option><option value="rmse">Lowest RMSE</option><option value="inl">Most inliers</option></select></div>
  <div class="muted mt2" id="hn" style="font-size:13px"></div>
  <div class="tw mt2" id="ht"><table><thead><tr><th></th><th>Job</th><th>Status</th><th>Data</th><th>Model</th><th>RMSE</th><th>Inliers</th><th>Time</th><th>Created</th><th></th></tr></thead><tbody id="hb"></tbody></table></div>
  <div class="empty" id="he" hidden><div class="big">🌑</div><p>No jobs match. Start your first registration.</p><a class="btn pri" href="#/new">New registration</a></div></div>`;
}

/* ---------- lab ---------- */
const SWEEPS = { ransacThreshold: [1, 2, 3, 4, 6, 8], ratio: [.7, .75, .8, .85, .9, .95], features: [300, 600, 900, 1200, 1800, 2500], fastThreshold: [6, 10, 14, 20, 30, 40], levels: [1, 2, 3, 4, 5] };
async function lab(pre) {
  const jobs = (await api("/jobs")).filter(j => j.status === "completed");
  lab.after = () => {
    const sel = $("#ls"), pa = $("#lp"); if (!sel) return;
    $("#lr").onclick = async () => {
      const b = $("#lr"); b.disabled = true; b.textContent = "Sweeping…"; $("#lo").innerHTML = '<div class="skel"></div>';
      try {
        const d = await api(`/jobs/${sel.value}/sweep`, { method: "POST", body: JSON.stringify({ param: pa.value, values: SWEEPS[pa.value] }) });
        const ok = d.rows.filter(r => r.ok), best = ok.length ? ok.reduce((a, c) => (c.hasTruth ? c.truthError < a.truthError : c.inlierRatio > a.inlierRatio) ? c : a) : null;
        $("#lo").innerHTML = `<div class="grid g2"><div><div class="lbl">RMSE per ${esc(d.param)}</div>${d.svg}</div><div class="tw"><table><thead><tr><th>${esc(d.param)}</th><th>Result</th><th>Inliers</th><th>Ratio</th><th>RMSE</th><th>Truth err</th></tr></thead><tbody>${d.rows.map(r => `<tr class="${r === best ? "hl" : ""}"><td class="mono">${r.value}</td><td>${r.ok ? badge("ok", r.model) : badge("bad", "failed")}</td><td class="mono">${r.ok ? r.inliers : "—"}</td><td class="mono">${r.ok ? pct(r.inlierRatio) : "—"}</td><td class="mono">${r.ok ? r.rmse.toFixed(2) : "N/A"}</td><td class="mono">${r.hasTruth ? r.truthError.toFixed(2) : "N/A"}</td></tr>`).join("")}</tbody></table></div></div><p class="muted mt2" style="font-size:13px">Lower RMSE alone can reward fewer, easier inliers. The highlighted row is chosen by ${best?.hasTruth ? "lowest error against synthetic ground truth" : "highest inlier ratio"}.</p>`;
      } catch (e) { toast(e.message, "bad"); $("#lo").innerHTML = ""; }
      b.disabled = false; b.textContent = "▶ Run sweep";
    };
  };
  if (!jobs.length) return `<div class="card empty"><div class="big">🧪</div><h2>Experiment Lab</h2><p>Sweep one parameter and watch how accuracy responds. Complete a registration first.</p><a class="btn pri" href="#/new">New registration</a></div>`;
  return `<h2>Experiment Lab</h2><p class="muted">Re-run a completed job's images while varying one parameter. Runs in parallel on the server.</p>
  <div class="card mt2"><div class="grid g3"><div class="ctl"><span class="lbl">Job</span><select id="ls">${jobs.map(j => `<option value="${j.id}" ${j.id === pre ? "selected" : ""}>${esc(j.name)} · ${j.id.slice(0, 6)}</option>`).join("")}</select></div>
  <div class="ctl"><span class="lbl">Parameter</span><select id="lp">${Object.keys(SWEEPS).map(k => `<option>${k}</option>`).join("")}</select></div><div class="ctl"><span class="lbl">&nbsp;</span><button class="btn gold" id="lr">▶ Run sweep</button></div></div></div><div class="card mt" id="lo"><div class="empty">Pick a parameter and run a sweep.</div></div>`;
}

/* ---------- about ---------- */
async function about() {
  const b = await api("/benchmark");
  const rows = b.available ? b.results.map(r => `<tr><td><b>${esc(r.name)}</b></td><td class="mono">${esc(r.truth)}</td><td class="mono">${esc(r.model)}</td><td class="mono">${r.ok ? r.cornerError.toFixed(2) + " px" : "failed"}</td><td class="mono">${r.ok ? r.inliers : "—"}</td><td class="mono">${r.ok ? r.rmse.toFixed(2) : "—"}</td></tr>`).join("") : "";
  return `<div class="stagger"><h2>Technology</h2><p class="muted" style="max-width:700px">A Go service with a thin web client. Registration, queueing, persistence, charts and exports run in Go; Python provides dataset generation, benchmarking and reporting tools.</p>
  <div class="card mt"><h3>Pipeline</h3><div class="flow mt2">${["Decode PNG/JPEG/TIFF", "Denoise + CLAHE", "Gaussian pyramid", "FAST-9 + Harris", "Oriented BRIEF", "Hamming + ratio + mutual", "Grid filter", "RANSAC ×3 models", "Model selection", "Warp + metrics"].map((s, i, a) => `<span class="n" style="animation-delay:${i * 60}ms">${s}</span>${i < a.length - 1 ? '<span class="a">→</span>' : ""}`).join("")}</div></div>
  <div class="grid g2 mt"><div class="card"><h3>Stack</h3><table class="mt2"><tbody><tr><td class="muted">Engine, API, queue, store</td><td>Go (standard library only)</td></tr><tr><td class="muted">Transport</td><td>REST + Server-Sent Events</td></tr><tr><td class="muted">Charts</td><td>SVG rendered in Go</td></tr><tr><td class="muted">Tooling</td><td>Python (datasets, benchmark, report)</td></tr><tr><td class="muted">Client</td><td>Vanilla JS, no framework, embedded in the binary</td></tr></tbody></table></div>
  <div class="card"><h3>Known limitations</h3><div class="mt2"><div class="warn">Binary descriptors are not robust to large illumination changes (≈40° sun-azimuth shift failed in testing).</div><div class="warn">Tiled and LZW-compressed TIFFs are rejected with a clear error.</div><div class="warn">Metrics are processed-pixel diagnostics, not ground-truth validation on mission imagery.</div></div></div></div>
  <div class="card mt"><div class="row between"><h3>Benchmark on synthetic ground truth</h3>${badge("sample", "sample data")}</div>${b.available ? `<div class="tw mt2"><table><thead><tr><th>Pair</th><th>Truth</th><th>Recovered</th><th>Corner error</th><th>Inliers</th><th>RMSE</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="font-size:12px">Generated ${esc(b.generated || "")} by tools/benchmark.py</p>` : `<p class="muted">No benchmark has been run yet. Run <span class="mono">python3 tools/benchmark.py</span> against a running server.</p>`}</div></div>`;
}

route();
