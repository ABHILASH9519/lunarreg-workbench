# LunarReg Python CV worker

Private FastAPI/OpenCV service. Install requirements.txt and run uvicorn app.main:app --host 127.0.0.1 --port 8000. POST /v1/register accepts multipart source, reference and JSON config. GET /healthz reports worker health.

Detector choices: SIFT, ORB, AKAZE, BRISK and KAZE. Matching uses BFMatcher, ratio filtering and optional mutual-nearest cross-check. RANSAC estimates Similarity, Affine or Homography transforms. Response includes the matrix, classified correspondences, registered image, overlay, difference image and calculated metrics. An 80-megapixel guard limits input size. Keep this worker private behind the Go API.
