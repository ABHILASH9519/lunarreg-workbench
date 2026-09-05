import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import JobsApi "mixins/jobs-api";
import ApiDocMixin "mixins/api-doc";
import Common "types/common";
import Types "types/jobs";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let jobs : Map.Map<Common.JobId, Types.Job>;
  let jobState : { var nextJobId : Common.JobId };
  include JobsApi(accessControlState, jobs, jobState);

  // Sample owner used only to seed OQL schema discovery; the value is ignored.
  transient let anyP = Principal.fromText("aaaaa-aa");

  func statusText(s : Types.JobStatus) : Text {
    switch s {
      case (#pending) "pending";
      case (#processing) "processing";
      case (#completed) "completed";
      case (#failed) "failed";
    };
  };

  func modelText(m : Types.TransformationModel) : Text {
    switch m {
      case (#similarity) "similarity";
      case (#affine) "affine";
      case (#homography) "homography";
    };
  };

  func errorText(e : ?Text) : Text {
    switch e {
      case null "";
      case (?e) e;
    };
  };

  include Expose({
    entities = [
      // The persisted per-user registration jobs. Manual mode because Job is a
      // nested record (variants, options, arrays); the identity lives in the
      // Map key, so it is promoted from the entry tuple. Per-user scoping:
      // each signed-in user reads only their own rows; the controller (agent)
      // reads all.
      OQL.Entity.manual<(Common.JobId, Types.Job)>(
        "job",
        func () = jobs.entries(),
        "Job",
        "id",
      )
        .sample((
          0,
          {
            id = 0;
            owner = anyP;
            createdAt = 0;
            status = #pending;
            sourceImage = {
              ref = "";
              metadata = { name = ""; format = ""; width = 0; height = 0; sizeBytes = 0 };
            };
            referenceImage = {
              ref = "";
              metadata = { name = ""; format = ""; width = 0; height = 0; sizeBytes = 0 };
            };
            config = {
              preprocessing = {
                grayscale = false;
                resizeWidth = null;
                resizeHeight = null;
                denoise = false;
                contrastEnhancement = false;
              };
              detector = {
                detector = #orb;
                maxFeatures = 0;
                scaleFactor = 0.0;
                nLevels = 0;
                edgeThreshold = 0;
              };
              matching = { ratioThreshold = 0.0; crossCheck = false; maxMatches = 0 };
              model = #similarity;
              thresholds = { ransacReprojThreshold = 0.0; minInlierRatio = 0.0 };
            };
            result = null;
            error = null;
          },
        ))
        .payload("id", func((id, _)) = id)
        .payload("owner", func((_, job)) = job.owner)
        .payload("createdAt", func((_, job)) = job.createdAt)
        .payload("status", func((_, job)) = statusText(job.status))
        .payload("sourceName", func((_, job)) = job.sourceImage.metadata.name)
        .payload("referenceName", func((_, job)) = job.referenceImage.metadata.name)
        .payload("model", func((_, job)) = modelText(job.config.model))
        .payload("error", func((_, job)) = errorText(job.error))
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });

  include ApiDocMixin();
};
