"""Minimal standard-library client for the LunarReg Workbench API."""
from __future__ import annotations

import json
import mimetypes
import time
import urllib.error
import urllib.request
import uuid
import os
from http.cookiejar import CookieJar, MozillaCookieJar


class ApiError(RuntimeError):
    pass


class Client:
    """One Client == one visitor (the server scopes job history by cookie)."""

    def __init__(self, base: str = "http://localhost:8080", timeout: float = 120, cookie_file: str | None = None):
        """cookie_file persists the visitor identity across processes (the CLI uses this)."""
        self.base = base.rstrip("/")
        self.timeout = timeout
        self.cookie_file = cookie_file
        if cookie_file:
            self.jar: CookieJar = MozillaCookieJar(cookie_file)
            if os.path.exists(cookie_file):
                try:
                    self.jar.load(ignore_discard=True)
                except OSError:
                    pass
        else:
            self.jar = CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def _save(self) -> None:
        if self.cookie_file:
            os.makedirs(os.path.dirname(os.path.abspath(self.cookie_file)), exist_ok=True)
            self.jar.save(ignore_discard=True)

    def _open(self, req: urllib.request.Request):
        try:
            resp = self.opener.open(req, timeout=self.timeout)
            self._save()
            return resp
        except urllib.error.HTTPError as e:
            try:
                msg = json.loads(e.read()).get("error", e.reason)
            except Exception:
                msg = e.reason
            raise ApiError(f"{e.code}: {msg}") from None

    def get(self, path: str) -> bytes:
        return self._open(urllib.request.Request(self.base + path)).read()

    def get_json(self, path: str):
        return json.loads(self.get(path))

    def post_json(self, path: str, body: dict | None = None):
        data = json.dumps(body or {}).encode()
        req = urllib.request.Request(self.base + path, data=data, method="POST",
                                     headers={"Content-Type": "application/json"})
        return json.loads(self._open(req).read())

    def delete(self, path: str):
        return json.loads(self._open(urllib.request.Request(self.base + path, method="DELETE")).read())

    def submit(self, *, sample: str | None = None, source: str | None = None,
               reference: str | None = None, params: dict | None = None, name: str = "") -> str:
        """Create a job from a bundled sample id or from two image files; returns the job id."""
        fields: list[tuple[str, str]] = []
        files: list[tuple[str, str, bytes]] = []
        if sample:
            fields.append(("sample", sample))
        else:
            for field, path in (("source", source), ("reference", reference)):
                if not path:
                    raise ValueError("provide a sample id or both source and reference paths")
                with open(path, "rb") as f:
                    files.append((field, path.rsplit("/", 1)[-1], f.read()))
        if params:
            fields.append(("params", json.dumps(params)))
        if name:
            fields.append(("name", name))
        boundary = uuid.uuid4().hex
        body = bytearray()
        for k, v in fields:
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        for k, fn, data in files:
            ctype = mimetypes.guess_type(fn)[0] or "application/octet-stream"
            body += (f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{fn}"\r\n'
                     f"Content-Type: {ctype}\r\n\r\n").encode() + data + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(self.base + "/api/jobs", data=bytes(body), method="POST",
                                     headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        return json.loads(self._open(req).read())["id"]

    def wait(self, job_id: str, timeout: float = 180) -> dict:
        """Poll until the job leaves queued/running and return the job record."""
        end = time.time() + timeout
        while time.time() < end:
            job = self.get_json(f"/api/jobs/{job_id}")
            if job["status"] not in ("queued", "running"):
                return job
            time.sleep(0.25)
        raise TimeoutError(f"job {job_id} did not finish in {timeout}s")


def corner_error(a: list[float], b: list[float], size: int) -> float:
    """RMS distance between two 3x3 transforms applied to the corners and centre of a size x size frame."""
    s = size - 1
    pts = [(0, 0), (s, 0), (0, s), (s, s), (s / 2, s / 2)]

    def apply(m, x, y):
        w = m[6] * x + m[7] * y + m[8]
        return (m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w

    total = 0.0
    for x, y in pts:
        ax, ay = apply(a, x, y)
        bx, by = apply(b, x, y)
        total += (ax - bx) ** 2 + (ay - by) ** 2
    return (total / len(pts)) ** 0.5
