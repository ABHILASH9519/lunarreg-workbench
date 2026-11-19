"""Unit tests for the dataset generator and client helpers (no server needed)."""
import os
import struct
import sys
import tempfile
import unittest
import zlib

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools"))
import make_dataset as md  # noqa: E402
from lunarreg_client import corner_error  # noqa: E402


class TestGenerator(unittest.TestCase):
    def test_truth_matrix_identity(self):
        m = md.truth_matrix(512, 0, 1, 0, 0)
        np.testing.assert_allclose(m, np.eye(3), atol=1e-12)

    def test_truth_matrix_rotation_scale_about_centre(self):
        m = md.truth_matrix(101, 90, 2, 0, 0)  # centre is (50,50)
        c = m @ np.array([50, 50, 1])
        np.testing.assert_allclose(c[:2], [50, 50], atol=1e-9)
        p = m @ np.array([60, 50, 1])  # 10px right of centre -> 20px below after 90deg rot * 2
        np.testing.assert_allclose(p[:2], [50, 70], atol=1e-9)

    def test_bilinear_exact_on_grid_and_midpoint(self):
        img = np.arange(16, dtype=np.float64).reshape(4, 4)
        self.assertAlmostEqual(float(md.bilinear(img, np.array([2.0]), np.array([1.0]))[0]), img[1, 2])
        self.assertAlmostEqual(float(md.bilinear(img, np.array([0.5]), np.array([0.5]))[0]), 2.5)

    def test_pair_is_deterministic_and_textured(self):
        a, b, _ = md.make_pair(size=128, seed=3)
        a2, b2, _ = md.make_pair(size=128, seed=3)
        np.testing.assert_array_equal(a, a2)
        self.assertGreater(float(a.std()), 15)
        self.assertGreater(float(b.std()), 15)

    def test_lighting_change_alters_source_only(self):
        s0, r0, _ = md.make_pair(size=128, seed=3, az_delta=0, el_delta=0, noise=0)
        s1, r1, _ = md.make_pair(size=128, seed=3, az_delta=40, el_delta=0, noise=0)
        np.testing.assert_array_equal(r0, r1)
        self.assertGreater(float(np.abs(s0 - s1).mean()), 1.0)

    def test_tiff_header_and_payload(self):
        a = np.linspace(0, 255, 64 * 48).reshape(48, 64)
        for deflate in (False, True):
            with tempfile.TemporaryDirectory() as d:
                p = f"{d}/x.tif"
                md.write_tiff16(p, a, deflate=deflate)
                with open(p, "rb") as f:
                    raw = f.read()
            self.assertEqual(raw[:4], b"II*\x00")
            n = struct.unpack_from("<H", raw, 8)[0]
            tags = {struct.unpack_from("<H", raw, 10 + 12 * i)[0]: struct.unpack_from("<I", raw, 18 + 12 * i)[0] & 0xFFFF
                    for i in range(n)}
            self.assertEqual((tags[256], tags[257], tags[258]), (64, 48, 16))
            off = struct.unpack_from("<I", raw, 10 + 12 * [t for t in range(n) if struct.unpack_from("<H", raw, 10 + 12 * t)[0] == 273][0] + 8)[0]
            payload = raw[off:]
            if deflate:
                payload = zlib.decompress(payload)
            px = np.frombuffer(payload, "<u2").reshape(48, 64)
            self.assertEqual(int(px[0, 0]), 0)
            self.assertAlmostEqual(int(px[-1, -1]), 60000, delta=1)

    def test_corner_error_zero_and_known_shift(self):
        i = [1, 0, 0, 0, 1, 0, 0, 0, 1]
        self.assertEqual(corner_error(i, i, 100), 0)
        t = [1, 0, 3, 0, 1, 4, 0, 0, 1]  # 5px translation everywhere
        self.assertAlmostEqual(corner_error(i, t, 100), 5.0)


if __name__ == "__main__":
    unittest.main()
