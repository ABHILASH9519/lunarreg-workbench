import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // OldActor = {} — this is the init migration for a brand-new canister.

  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type JobId = Nat;
  type Timestamp = Int;
  type UserId = Principal;
  type ImageRef = Text;
  type Point2D = { x : Float; y : Float };
  type Matrix3x3 = [Float];

  type JobStatus = {
    #pending;
    #processing;
    #completed;
    #failed;
  };

  type ImageMetadata = {
    name : Text;
    format : Text;
    width : Nat;
    height : Nat;
    sizeBytes : Nat;
  };

  type InputImage = {
    ref : ImageRef;
    metadata : ImageMetadata;
  };

  type PreprocessingSettings = {
    grayscale : Bool;
    resizeWidth : ?Nat;
    resizeHeight : ?Nat;
    denoise : Bool;
    contrastEnhancement : Bool;
  };

  type FeatureDetector = {
    #orb;
    #sift;
    #brisk;
    #kaze;
  };

  type DetectorConfig = {
    detector : FeatureDetector;
    maxFeatures : Nat;
    scaleFactor : Float;
    nLevels : Nat;
    edgeThreshold : Nat;
  };

  type MatchingConfig = {
    ratioThreshold : Float;
    crossCheck : Bool;
    maxMatches : Nat;
  };

  type TransformationModel = {
    #similarity;
    #affine;
    #homography;
  };

  type Thresholds = {
    ransacReprojThreshold : Float;
    minInlierRatio : Float;
  };

  type ReproConfig = {
    preprocessing : PreprocessingSettings;
    detector : DetectorConfig;
    matching : MatchingConfig;
    model : TransformationModel;
    thresholds : Thresholds;
  };

  type CorrespondencePoint = {
    source : Point2D;
    reference : Point2D;
  };

  type JobMetrics = {
    rmse : ?Float;
    reprojectionError : ?Float;
    inlierCount : ?Nat;
    outlierCount : ?Nat;
    spatialCoverage : ?Float;
    scale : ?Float;
    rotationDegrees : ?Float;
  };

  type JobResult = {
    transformationMatrix : Matrix3x3;
    correspondences : [CorrespondencePoint];
    metrics : JobMetrics;
    registeredOutput : ImageRef;
    report : Text;
  };

  type Job = {
    id : JobId;
    owner : UserId;
    createdAt : Timestamp;
    status : JobStatus;
    sourceImage : InputImage;
    referenceImage : InputImage;
    config : ReproConfig;
    result : ?JobResult;
    error : ?Text;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControlState;
    jobs : Map.Map<JobId, Job>;
    jobState : { var nextJobId : JobId };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      jobs = Map.empty();
      jobState = { var nextJobId = 0 };
    };
  };
};
