import numpy as np
import pytest
from app.main import decode, make_detector, estimate

def test_decode_rejects_empty_image():
    with pytest.raises(ValueError): decode(b"", "empty.png")

def test_supported_detectors_construct():
    for name in ("orb", "sift", "akaze", "brisk", "kaze"):
        detector, norm = make_detector(name, 500)
        assert detector is not None
        assert norm in (cv2.NORM_L2, cv2.NORM_HAMMING)

def test_unknown_detector_rejected():
    with pytest.raises(ValueError): make_detector("unknown", 500)

def test_affine_estimation_returns_3x3():
    source=np.float32([[0,0],[10,0],[0,10],[10,10],[5,7]])
    target=source+np.float32([3,4])
    matrix,mask=estimate(source,target,"affine",1.0)
    assert matrix.shape==(3,3)
    assert int(mask.sum())==len(source)
