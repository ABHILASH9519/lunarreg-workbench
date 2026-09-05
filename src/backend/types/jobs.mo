import Common "common";

module {
  /// Unique identifier of a registration job.
  public type JobId = Nat;

  /// Lifecycle of a registration job.
  public type JobStatus = {
    #pending;
    #processing;
    #completed;
    #failed;
  };

  /// Metadata of an uploaded input image.
  public type ImageMetadata = {
    name : Text;
    format : Text;
    width : Nat;
    height : Nat;
    sizeBytes : Nat;
  };

  /// An input image: storage reference plus metadata.
  public type InputImage = {
    ref : Common.ImageRef;
    metadata : ImageMetadata;
  };

  /// Preprocessing settings applied before feature extraction.
  public type PreprocessingSettings = {
    grayscale : Bool;
    resizeWidth : ?Nat;
    resizeHeight : ?Nat;
    denoise : Bool;
    contrastEnhancement : Bool;
  };

  /// Classic feature detector (AI correspondence models are out of scope).
  public type FeatureDetector = {
    #orb;
    #sift;
    #brisk;
    #kaze;
  };

  /// Feature detector configuration.
  public type DetectorConfig = {
    detector : FeatureDetector;
    maxFeatures : Nat;
    scaleFactor : Float;
    nLevels : Nat;
    edgeThreshold : Nat;
  };

  /// Feature matching parameters.
  public type MatchingConfig = {
    ratioThreshold : Float;
    crossCheck : Bool;
    maxMatches : Nat;
  };

  /// Transformation model fitted to the correspondence points.
  public type TransformationModel = {
    #similarity;
    #affine;
    #homography;
  };

  /// Acceptance thresholds for the fitted model.
  public type Thresholds = {
    ransacReprojThreshold : Float;
    minInlierRatio : Float;
  };

  /// Full reproducibility configuration of a job.
  public type ReproConfig = {
    preprocessing : PreprocessingSettings;
    detector : DetectorConfig;
    matching : MatchingConfig;
    model : TransformationModel;
    thresholds : Thresholds;
  };

  /// A matched point pair: source/moving image vs reference/fixed image.
  public type CorrespondencePoint = {
    source : Common.Point2D;
    reference : Common.Point2D;
  };

  /// Quality metrics of a completed job. Optional fields are null (N/A)
  /// when the value was not computed — never fabricated.
  public type JobMetrics = {
    rmse : ?Float;
    reprojectionError : ?Float;
    inlierCount : ?Nat;
    outlierCount : ?Nat;
    spatialCoverage : ?Float;
    scale : ?Float;
    rotationDegrees : ?Float;
  };

  /// Computed result of a completed job.
  public type JobResult = {
    transformationMatrix : Common.Matrix3x3;
    correspondences : [CorrespondencePoint];
    metrics : JobMetrics;
    registeredOutput : Common.ImageRef;
    report : Text;
  };

  /// A persisted registration job (single image pair).
  public type Job = {
    id : JobId;
    owner : Common.UserId;
    createdAt : Common.Timestamp;
    status : JobStatus;
    sourceImage : InputImage;
    referenceImage : InputImage;
    config : ReproConfig;
    result : ?JobResult;
    error : ?Text;
  };

  /// Lightweight view of a job for history listings.
  public type JobSummary = {
    id : JobId;
    createdAt : Common.Timestamp;
    status : JobStatus;
    sourceName : Text;
    referenceName : Text;
    model : TransformationModel;
  };

  /// Caller-visible job errors.
  public type JobError = {
    #notFound : JobId;
    #invalidConfig : Text;
  };
};