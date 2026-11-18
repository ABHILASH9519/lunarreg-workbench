from __future__ import annotations
import base64,json,math
from typing import Any
import cv2
import numpy as np
from fastapi import FastAPI,File,Form,HTTPException,UploadFile
app=FastAPI(title="LunarReg CV Worker",version="1.0.0")
MAX_PIXELS=80_000_000
@app.get("/healthz")
def health()->dict[str,str]:return {"status":"ok","service":"lunarreg-cv-worker","opencv":cv2.__version__}
def decode(data:bytes,name:str)->np.ndarray:
 if not data:raise ValueError(f"{name}: empty image")
 image=cv2.imdecode(np.frombuffer(data,dtype=np.uint8),cv2.IMREAD_UNCHANGED)
 if image is None:raise ValueError(f"{name}: unsupported or corrupt image")
 if image.ndim==3:image=cv2.cvtColor(image,cv2.COLOR_BGRA2GRAY if image.shape[2]==4 else cv2.COLOR_BGR2GRAY)
 if image.ndim!=2:raise ValueError(f"{name}: expected grayscale or RGB image")
 if image.shape[0]*image.shape[1]>MAX_PIXELS:raise ValueError("image exceeds 80 megapixels")
 if image.dtype!=np.uint8:
  lo,hi=np.percentile(image,[1,99]);image=np.clip((image.astype(np.float32)-lo)*(255.0/max(float(hi-lo),1.0)),0,255).astype(np.uint8)
 return image
def make_detector(name:str,n:int):
 k=name.lower()
 if k=="sift" and hasattr(cv2,"SIFT_create"):return cv2.SIFT_create(nfeatures=n),cv2.NORM_L2
 if k=="orb":return cv2.ORB_create(nfeatures=n),cv2.NORM_HAMMING
 if k=="akaze":return cv2.AKAZE_create(),cv2.NORM_HAMMING
 if k=="brisk":return cv2.BRISK_create(),cv2.NORM_HAMMING
 if k=="kaze":return cv2.KAZE_create(),cv2.NORM_L2
 raise ValueError("detector must be SIFT, ORB, AKAZE, BRISK or KAZE")
def estimate(a:np.ndarray,b:np.ndarray,model:str,threshold:float):
 if model=="homography":return cv2.findHomography(a,b,cv2.RANSAC,threshold,maxIters=5000,confidence=.995)
 if model=="affine":m,mask=cv2.estimateAffine2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=threshold,maxIters=5000,confidence=.995,refineIters=20)
 elif model=="similarity":m,mask=cv2.estimateAffinePartial2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=threshold,maxIters=5000,confidence=.995,refineIters=20)
 else:raise ValueError("model must be similarity, affine or homography")
 return (None if m is None else np.vstack([m,[0,0,1]])),mask
def png64(img:np.ndarray)->str:
 ok,buf=cv2.imencode(".png",img)
 if not ok:raise ValueError("failed to encode result image")
 return base64.b64encode(buf.tobytes()).decode("ascii")
@app.post("/v1/register")
async def register(source:UploadFile=File(...),reference:UploadFile=File(...),config:str=Form("{}"))->dict[str,Any]:
 try:
  cfg=json.loads(config);s=decode(await source.read(),source.filename or "source");r=decode(await reference.read(),reference.filename or "reference")
  if min(*s.shape,*r.shape)<16:raise ValueError("images must be at least 16 pixels in each dimension")
  pre=cfg.get("preprocessing",{})
  if pre.get("denoise"):s=cv2.GaussianBlur(s,(3,3),0);r=cv2.GaussianBlur(r,(3,3),0)
  if pre.get("contrastEnhancement"):
   clahe=cv2.createCLAHE(clipLimit=2.0,tileGridSize=(8,8));s=clahe.apply(s);r=clahe.apply(r)
  dc=cfg.get("detector",{});name=str(dc.get("detector",cfg.get("detectorName","orb"))).lower();det,norm=make_detector(name,max(100,min(10000,int(dc.get("maxFeatures",3000)))))
  k1,d1=det.detectAndCompute(s,None);k2,d2=det.detectAndCompute(r,None)
  if d1 is None or d2 is None or len(k1)<4 or len(k2)<4:raise ValueError("not enough stable features; adjust detector or preprocessing")
  matcher=cv2.BFMatcher(norm);pairs=matcher.knnMatch(d1,d2,k=2);ratio=float(cfg.get("matching",{}).get("ratioThreshold",.78));good=[m for pair in pairs if len(pair)==2 for m,n in [pair] if m.distance<ratio*n.distance]
  if cfg.get("matching",{}).get("crossCheck",False):mutual={(m.trainIdx,m.queryIdx) for m in matcher.match(d2,d1)};good=[m for m in good if (m.queryIdx,m.trainIdx) in mutual]
  good=sorted(good,key=lambda m:m.distance)[:max(4,min(5000,int(cfg.get("matching",{}).get("maxMatches",2000))))]
  if len(good)<4:raise ValueError("fewer than four matches passed descriptor filtering")
  a=np.float32([k1[m.queryIdx].pt for m in good]);b=np.float32([k2[m.trainIdx].pt for m in good]);model=str(cfg.get("model","homography")).lower();threshold=float(cfg.get("thresholds",{}).get("ransacReprojThreshold",3.0));matrix,mask=estimate(a,b,model,threshold)
  if matrix is None or mask is None:raise ValueError("RANSAC could not estimate a stable transform")
  inside=mask.ravel().astype(bool);projected=cv2.perspectiveTransform(a.reshape(-1,1,2),matrix).reshape(-1,2);errors=np.linalg.norm(projected-b,axis=1);accepted=errors[inside]
  if not accepted.size:raise ValueError("RANSAC found no inliers")
  rmse=float(np.sqrt(np.mean(accepted**2)));inlier_ratio=float(np.mean(inside))
  if inlier_ratio<float(cfg.get("thresholds",{}).get("minInlierRatio",.15)):raise ValueError("registration rejected: inlier ratio below configured minimum")
  h,w=r.shape;warped=cv2.warpPerspective(s,matrix,(w,h));overlay=cv2.addWeighted(r,.5,warped,.5,0);diff=cv2.absdiff(r,warped);cells={(min(3,int(p[0]/max(w,1)*4)),min(3,int(p[1]/max(h,1)*4))) for p in b[inside]};scale=float(math.hypot(matrix[0,0],matrix[1,0]));rotation=float(math.degrees(math.atan2(matrix[1,0],matrix[0,0])))
  points=[{"source":{"x":float(a[i,0]),"y":float(a[i,1])},"reference":{"x":float(b[i,0]),"y":float(b[i,1])},"inlier":bool(inside[i]),"reprojectionError":float(errors[i])} for i in range(len(good))]
  return {"transformationMatrix":matrix.reshape(-1).astype(float).tolist(),"correspondences":points,"metrics":{"rmse":rmse,"reprojectionError":float(np.mean(accepted)),"inlierCount":int(inside.sum()),"outlierCount":int((~inside).sum()),"inlierRatio":inlier_ratio,"spatialCoverage":float(len(cells)/16),"scale":scale,"rotationDegrees":rotation},"registeredImage":"data:image/png;base64,"+png64(warped),"overlayImage":"data:image/png;base64,"+png64(overlay),"differenceImage":"data:image/png;base64,"+png64(diff),"imageSize":{"width":w,"height":h},"detector":name,"model":model,"warnings":[]}
 except (ValueError,TypeError,json.JSONDecodeError,cv2.error) as exc:raise HTTPException(status_code=422,detail=str(exc)) from exc
