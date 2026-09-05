import Map "mo:core/Map";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import JobsLib "../lib/jobs";
import Common "../types/common";
import Types "../types/jobs";

mixin (
  accessControlState : AccessControl.AccessControlState,
  jobs : Map.Map<Common.JobId, Types.Job>,
  jobState : { var nextJobId : Common.JobId },
) {
  /// Creates a registration job for the caller (single image pair).
  public shared ({ caller }) func createJob(
    source : Types.InputImage,
    reference : Types.InputImage,
    config : Types.ReproConfig,
  ) : async Result.Result<Common.JobId, Types.JobError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create jobs");
    };
    JobsLib.createJob(jobs, jobState, caller, source, reference, config)
  };

  /// Lists the caller's job history.
  public query ({ caller }) func listJobs() : async [Types.JobSummary] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list jobs");
    };
    JobsLib.listJobs(jobs, caller)
  };

  /// Returns one of the caller's jobs.
  public query ({ caller }) func getJob(jobId : Common.JobId) : async ?Types.Job {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view jobs");
    };
    JobsLib.getJob(jobs, caller, jobId)
  };

  /// Records the computed result of one of the caller's jobs.
  public shared ({ caller }) func updateJobResult(
    jobId : Common.JobId,
    result : Types.JobResult,
  ) : async Result.Result<(), Types.JobError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update jobs");
    };
    JobsLib.updateJobResult(jobs, caller, jobId, result)
  };

  /// Deletes one of the caller's jobs.
  public shared ({ caller }) func deleteJob(jobId : Common.JobId) : async Result.Result<(), Types.JobError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete jobs");
    };
    JobsLib.deleteJob(jobs, caller, jobId)
  };
};