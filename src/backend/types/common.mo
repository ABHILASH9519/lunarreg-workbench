module {
  // Cross-cutting types shared across domains.

  /// Principal of a signed-in user (Internet Identity).
  public type UserId = Principal;

  /// Unique identifier of a registration job.
  public type JobId = Nat;

  /// Nanoseconds since the Unix epoch (Time.now()).
  public type Timestamp = Int;

  /// Reference to a stored image (object-storage key or URL).
  public type ImageRef = Text;

  /// 2D point in image pixel coordinates.
  public type Point2D = { x : Float; y : Float };

  /// 3x3 transformation matrix, row-major, 9 elements.
  public type Matrix3x3 = [Float];
};