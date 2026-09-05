import Int "mo:core/Int";
import Map "mo:core/Map";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/jobs";

module {
  /// Creates a new registration job for the owner and returns its id.
  public func createJob(
    jobs : Map.Map<Common.JobId, Types.Job>,
    jobState : { var nextJobId : Common.JobId },
    owner : Common.UserId,
    source : Types.InputImage,
    reference : Types.InputImage,
    config : Types.ReproConfig,
  ) : Result.Result<Common.JobId, Types.JobError> {
    let id = jobState.nextJobId;
    jobState.nextJobId += 1;
    let job : Types.Job = {
      id;
      owner;
      createdAt = Time.now();
      status = #pending;
      sourceImage = source;
      referenceImage = reference;
      config;
      result = null;
      error = null;
    };
    jobs.add(id, job);
    #ok(id)
  };

  /// Lists the owner's jobs, newest first.
  public func listJobs(
    jobs : Map.Map<Common.JobId, Types.Job>,
    owner : Common.UserId,
  ) : [Types.JobSummary] {
    jobs.entries()
      .filter(func(_, job) = job.owner.equal(owner))
      .sort(func((_, a), (_, b)) = Int.compare(b.createdAt, a.createdAt))
      .map(func(_, job) = toSummary(job))
      .toArray()
  };

  /// Returns the owner's job by id.
  public func getJob(
    jobs : Map.Map<Common.JobId, Types.Job>,
    owner : Common.UserId,
    jobId : Common.JobId,
  ) : ?Types.Job {
    switch (jobs.get(jobId)) {
      case (?job) {
        if (job.owner.equal(owner)) { ?job } else { null };
      };
      case null { null };
    };
  };

  /// Records the computed result of a job owned by the caller.
  public func updateJobResult(
    jobs : Map.Map<Common.JobId, Types.Job>,
    owner : Common.UserId,
    jobId : Common.JobId,
    result : Types.JobResult,
  ) : Result.Result<(), Types.JobError> {
    switch (jobs.get(jobId)) {
      case (?job) {
        if (not job.owner.equal(owner)) {
          return #err(#notFound(jobId));
        };
        jobs.add(jobId, { job with status = #completed; result = ?result; error = null });
        #ok()
      };
      case null { #err(#notFound(jobId)) };
    };
  };

  /// Deletes a job owned by the caller.
  public func deleteJob(
    jobs : Map.Map<Common.JobId, Types.Job>,
    owner : Common.UserId,
    jobId : Common.JobId,
  ) : Result.Result<(), Types.JobError> {
    switch (jobs.get(jobId)) {
      case (?job) {
        if (not job.owner.equal(owner)) {
          return #err(#notFound(jobId));
        };
        jobs.remove(jobId);
        #ok()
      };
      case null { #err(#notFound(jobId)) };
    };
  };

  /// Projects a job into its listing summary.
  func toSummary(job : Types.Job) : Types.JobSummary {
    {
      id = job.id;
      createdAt = job.createdAt;
      status = job.status;
      sourceName = job.sourceImage.metadata.name;
      referenceName = job.referenceImage.metadata.name;
      model = job.config.model;
    };
  };
};