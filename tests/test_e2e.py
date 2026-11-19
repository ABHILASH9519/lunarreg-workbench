"""End-to-end tests: start the real Go binary and drive it with the Python tools.

Run:  go build -o bin/lunarreg ./cmd/lunarreg && python3 -m unittest discover -s tests -v
"""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import make_dataset  # noqa: E402
import report  # noqa: E402
from lunarreg_client import ApiError, Client, corner_error  # noqa: E402


class ServerCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        binary = os.path.join(ROOT, "bin", "lunarreg")
        if not os.path.exists(binary):
            raise unittest.SkipTest("build bin/lunarreg first")
        s = socket.socket()
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
        s.close()
        cls.data = tempfile.mkdtemp()
        cls.proc = subprocess.Popen([binary, "-addr", f"127.0.0.1:{port}", "-data", cls.data],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.c = Client(f"http://127.0.0.1:{port}")
        for _ in range(50):
            try:
                cls.c.get_json("/api/health")
                break
            except Exception:
                time.sleep(0.1)

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        cls.proc.wait(5)
        shutil.rmtree(cls.data, ignore_errors=True)


class TestTools(ServerCase):
    def _upload_and_check(self, fmt, limit=3.0):
        d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, d, ignore_errors=True)
        src, ref, m = make_dataset.make_pair()
        ext = "png" if fmt == "png" else "tif"
        for name, img in (("source", src), ("reference", ref)):
            p = f"{d}/{name}.{ext}"
            (make_dataset.write_png if fmt == "png" else
             (lambda path, a: make_dataset.write_tiff16(path, a, deflate=fmt == "tiff-deflate")))(p, img)
        job = self.c.wait(self.c.submit(source=f"{d}/source.{ext}", reference=f"{d}/reference.{ext}"))
        self.assertEqual(job["status"], "completed", job.get("error"))
        err = corner_error(job["result"]["matrix"], m.flatten().tolist(), 512)
        self.assertLess(err, limit, f"{fmt}: corner error {err:.2f}px")
        self.assertEqual(job["source"]["info"]["format"], "png" if fmt == "png" else "tiff")

    def test_png_upload_recovers_truth(self):
        self._upload_and_check("png")

    def test_tiff16_upload_recovers_truth(self):
        self._upload_and_check("tiff")

    def test_tiff16_deflate_upload_recovers_truth(self):
        self._upload_and_check("tiff-deflate")

    def test_benchmark_script_passes(self):
        out = os.path.join(self.data, "benchmark.json")
        r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "benchmark.py"), "--url", self.c.base,
                            "--out", out], capture_output=True, text=True, timeout=300)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        with open(out) as f:
            b = json.load(f)
        self.assertEqual(len(b["results"]), 5)
        self.assertTrue(all(x["ok"] and x["model"] == x["truth"] for x in b["results"]))
        self.assertTrue(self.c.get_json("/api/benchmark")["available"])

    def _cli(self, *args):
        env = dict(os.environ, LUNARREG_COOKIES=os.path.join(self.data, "cli-cookies.txt"))
        return subprocess.run([sys.executable, os.path.join(ROOT, "tools", "lunarreg.py"), "--url", self.c.base, *args],
                              capture_output=True, text=True, timeout=120, env=env)

    def test_cli_run_show_export_sweep_delete(self):
        out = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, out, ignore_errors=True)
        r = self._cli("run", "--sample", "tmc2-affine", "--model", "affine", "--features", "900", "--out", out)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        jid = r.stdout.split("submitted ")[1].split()[0]
        self.assertEqual(len([f for f in os.listdir(out)]), 3)
        shown = self._cli("show", jid).stdout
        self.assertIn("ground-truth error", shown)
        self.assertIn("affine", shown)
        sw = self._cli("sweep", jid, "ransacThreshold", "2", "4")
        self.assertEqual(sw.returncode, 0, sw.stderr)
        self.assertIn(jid, self._cli("list", "--status", "completed").stdout)
        self.assertEqual(self._cli("delete", jid).returncode, 0)
        self.assertNotIn(jid, self._cli("list").stdout)

    def test_cli_rejects_bad_usage_and_params(self):
        self.assertEqual(self._cli("run").returncode, 2)
        bad = self._cli("run", "--sample", "ohrc-crater-field", "--features", "7")
        self.assertEqual(bad.returncode, 1)
        self.assertIn("features must be", bad.stderr)

    def test_report_is_self_contained(self):
        job = self.c.wait(self.c.submit(sample="ohrc-crater-field"))
        html = report.build(self.c, job["id"])
        self.assertIn("SAMPLE DATA", html)
        self.assertGreaterEqual(html.count("data:image/png;base64,"), 4)

    def test_garbage_and_missing_inputs_rejected(self):
        with self.assertRaises(ApiError):
            self.c.submit(sample="does-not-exist")
        d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, d, ignore_errors=True)
        with open(f"{d}/a.png", "wb") as f:
            f.write(b"not an image at all, definitely")
        with self.assertRaises(ApiError) as cm:
            self.c.submit(source=f"{d}/a.png", reference=f"{d}/a.png")
        self.assertIn("422", str(cm.exception))


if __name__ == "__main__":
    unittest.main()
