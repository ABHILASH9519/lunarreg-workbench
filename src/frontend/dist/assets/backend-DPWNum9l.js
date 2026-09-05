import { aw as Variant, ax as Text, ay as Null, az as Record, aA as Vec, aB as Nat, aC as Bool, aD as Opt, aE as Float64, aF as Int, aG as Principal, aH as Service, aI as Func, aJ as Nat8, aK as HttpAgent, aL as Actor } from "./index-CLvvNGC5.js";
const Error$1 = Variant({
  "FrontendOriginsNotConfigured": Null,
  "MixedSsoSources": Record({
    "otherKeys": Vec(Text),
    "ssoKeys": Vec(Text)
  }),
  "Stale": Record({ "ageNs": Nat }),
  "MalformedCandid": Null,
  "AmbiguousAttribute": Record({
    "field": Text,
    "sources": Vec(Text)
  }),
  "NoAttributes": Null,
  "UnknownNonce": Null,
  "UntrustedSsoSource": Record({ "domain": Text }),
  "MissingField": Text,
  "FrontendOriginMismatch": Record({
    "got": Text,
    "expected": Vec(Text)
  })
});
const Result_2 = Variant({ "ok": Null, "err": Error$1 });
const UserRole = Variant({
  "admin": Null,
  "user": Null,
  "guest": Null
});
const ImageRef = Text;
const ImageMetadata = Record({
  "height": Nat,
  "name": Text,
  "sizeBytes": Nat,
  "width": Nat,
  "format": Text
});
const InputImage = Record({
  "ref": ImageRef,
  "metadata": ImageMetadata
});
const TransformationModel$1 = Variant({
  "homography": Null,
  "similarity": Null,
  "affine": Null
});
const PreprocessingSettings = Record({
  "resizeWidth": Opt(Nat),
  "denoise": Bool,
  "contrastEnhancement": Bool,
  "resizeHeight": Opt(Nat),
  "grayscale": Bool
});
const FeatureDetector$1 = Variant({
  "orb": Null,
  "kaze": Null,
  "sift": Null,
  "brisk": Null
});
const DetectorConfig = Record({
  "maxFeatures": Nat,
  "detector": FeatureDetector$1,
  "nLevels": Nat,
  "edgeThreshold": Nat,
  "scaleFactor": Float64
});
const MatchingConfig = Record({
  "crossCheck": Bool,
  "maxMatches": Nat,
  "ratioThreshold": Float64
});
const Thresholds = Record({
  "minInlierRatio": Float64,
  "ransacReprojThreshold": Float64
});
const ReproConfig = Record({
  "model": TransformationModel$1,
  "preprocessing": PreprocessingSettings,
  "detector": DetectorConfig,
  "matching": MatchingConfig,
  "thresholds": Thresholds
});
const JobId = Nat;
const JobError = Variant({
  "notFound": JobId,
  "invalidConfig": Text
});
const Result_1 = Variant({ "ok": JobId, "err": JobError });
const Result = Variant({ "ok": Null, "err": JobError });
const Value = Variant({
  "int": Int,
  "nat": Nat,
  "float": Float64,
  "bool": Bool,
  "null": Null,
  "text": Text
});
const Cell = Record({ "value": Value, "name": Text });
const Result__1 = Record({
  "hasMore": Bool,
  "rows": Vec(Vec(Cell))
});
const JobStatus = Variant({
  "pending": Null,
  "completed": Null,
  "processing": Null,
  "failed": Null
});
const JobMetrics = Record({
  "rmse": Opt(Float64),
  "scale": Opt(Float64),
  "reprojectionError": Opt(Float64),
  "rotationDegrees": Opt(Float64),
  "spatialCoverage": Opt(Float64),
  "inlierCount": Opt(Nat),
  "outlierCount": Opt(Nat)
});
const Matrix3x3 = Vec(Float64);
const Point2D = Record({ "x": Float64, "y": Float64 });
const CorrespondencePoint = Record({
  "source": Point2D,
  "reference": Point2D
});
const JobResult = Record({
  "report": Text,
  "metrics": JobMetrics,
  "registeredOutput": ImageRef,
  "transformationMatrix": Matrix3x3,
  "correspondences": Vec(CorrespondencePoint)
});
const UserId = Principal;
const Timestamp = Int;
const Job = Record({
  "id": JobId,
  "status": JobStatus,
  "result": Opt(JobResult),
  "owner": UserId,
  "createdAt": Timestamp,
  "error": Opt(Text),
  "referenceImage": InputImage,
  "config": ReproConfig,
  "sourceImage": InputImage
});
const JobSummary = Record({
  "id": JobId,
  "status": JobStatus,
  "model": TransformationModel$1,
  "createdAt": Timestamp,
  "sourceName": Text,
  "referenceName": Text
});
Service({
  "_initialize_access_control": Func([], [], []),
  "_internet_identity_sign_in_finish": Func([], [Result_2], []),
  "_internet_identity_sign_in_start": Func([], [Vec(Nat8)], []),
  "assignCallerUserRole": Func([Principal, UserRole], [], []),
  "createJob": Func([InputImage, InputImage, ReproConfig], [Result_1], []),
  "deleteJob": Func([JobId], [Result], []),
  "execute": Func([Text], [Result__1], ["query"]),
  "getApiDoc": Func([], [Text], ["query"]),
  "getCallerUserRole": Func([], [UserRole], ["query"]),
  "getJob": Func([JobId], [Opt(Job)], ["query"]),
  "isCallerAdmin": Func([], [Bool], ["query"]),
  "listJobs": Func([], [Vec(JobSummary)], ["query"]),
  "schema": Func([], [Text], ["query"]),
  "updateJobResult": Func([JobId, JobResult], [Result], [])
});
const idlFactory = ({ IDL }) => {
  const Error2 = IDL.Variant({
    "FrontendOriginsNotConfigured": IDL.Null,
    "MixedSsoSources": IDL.Record({
      "otherKeys": IDL.Vec(IDL.Text),
      "ssoKeys": IDL.Vec(IDL.Text)
    }),
    "Stale": IDL.Record({ "ageNs": IDL.Nat }),
    "MalformedCandid": IDL.Null,
    "AmbiguousAttribute": IDL.Record({
      "field": IDL.Text,
      "sources": IDL.Vec(IDL.Text)
    }),
    "NoAttributes": IDL.Null,
    "UnknownNonce": IDL.Null,
    "UntrustedSsoSource": IDL.Record({ "domain": IDL.Text }),
    "MissingField": IDL.Text,
    "FrontendOriginMismatch": IDL.Record({
      "got": IDL.Text,
      "expected": IDL.Vec(IDL.Text)
    })
  });
  const Result_22 = IDL.Variant({ "ok": IDL.Null, "err": Error2 });
  const UserRole2 = IDL.Variant({
    "admin": IDL.Null,
    "user": IDL.Null,
    "guest": IDL.Null
  });
  const ImageRef2 = IDL.Text;
  const ImageMetadata2 = IDL.Record({
    "height": IDL.Nat,
    "name": IDL.Text,
    "sizeBytes": IDL.Nat,
    "width": IDL.Nat,
    "format": IDL.Text
  });
  const InputImage2 = IDL.Record({
    "ref": ImageRef2,
    "metadata": ImageMetadata2
  });
  const TransformationModel2 = IDL.Variant({
    "homography": IDL.Null,
    "similarity": IDL.Null,
    "affine": IDL.Null
  });
  const PreprocessingSettings2 = IDL.Record({
    "resizeWidth": IDL.Opt(IDL.Nat),
    "denoise": IDL.Bool,
    "contrastEnhancement": IDL.Bool,
    "resizeHeight": IDL.Opt(IDL.Nat),
    "grayscale": IDL.Bool
  });
  const FeatureDetector2 = IDL.Variant({
    "orb": IDL.Null,
    "kaze": IDL.Null,
    "sift": IDL.Null,
    "brisk": IDL.Null
  });
  const DetectorConfig2 = IDL.Record({
    "maxFeatures": IDL.Nat,
    "detector": FeatureDetector2,
    "nLevels": IDL.Nat,
    "edgeThreshold": IDL.Nat,
    "scaleFactor": IDL.Float64
  });
  const MatchingConfig2 = IDL.Record({
    "crossCheck": IDL.Bool,
    "maxMatches": IDL.Nat,
    "ratioThreshold": IDL.Float64
  });
  const Thresholds2 = IDL.Record({
    "minInlierRatio": IDL.Float64,
    "ransacReprojThreshold": IDL.Float64
  });
  const ReproConfig2 = IDL.Record({
    "model": TransformationModel2,
    "preprocessing": PreprocessingSettings2,
    "detector": DetectorConfig2,
    "matching": MatchingConfig2,
    "thresholds": Thresholds2
  });
  const JobId2 = IDL.Nat;
  const JobError2 = IDL.Variant({
    "notFound": JobId2,
    "invalidConfig": IDL.Text
  });
  const Result_12 = IDL.Variant({ "ok": JobId2, "err": JobError2 });
  const Result2 = IDL.Variant({ "ok": IDL.Null, "err": JobError2 });
  const Value2 = IDL.Variant({
    "int": IDL.Int,
    "nat": IDL.Nat,
    "float": IDL.Float64,
    "bool": IDL.Bool,
    "null": IDL.Null,
    "text": IDL.Text
  });
  const Cell2 = IDL.Record({ "value": Value2, "name": IDL.Text });
  const Result__12 = IDL.Record({
    "hasMore": IDL.Bool,
    "rows": IDL.Vec(IDL.Vec(Cell2))
  });
  const JobStatus2 = IDL.Variant({
    "pending": IDL.Null,
    "completed": IDL.Null,
    "processing": IDL.Null,
    "failed": IDL.Null
  });
  const JobMetrics2 = IDL.Record({
    "rmse": IDL.Opt(IDL.Float64),
    "scale": IDL.Opt(IDL.Float64),
    "reprojectionError": IDL.Opt(IDL.Float64),
    "rotationDegrees": IDL.Opt(IDL.Float64),
    "spatialCoverage": IDL.Opt(IDL.Float64),
    "inlierCount": IDL.Opt(IDL.Nat),
    "outlierCount": IDL.Opt(IDL.Nat)
  });
  const Matrix3x32 = IDL.Vec(IDL.Float64);
  const Point2D2 = IDL.Record({ "x": IDL.Float64, "y": IDL.Float64 });
  const CorrespondencePoint2 = IDL.Record({
    "source": Point2D2,
    "reference": Point2D2
  });
  const JobResult2 = IDL.Record({
    "report": IDL.Text,
    "metrics": JobMetrics2,
    "registeredOutput": ImageRef2,
    "transformationMatrix": Matrix3x32,
    "correspondences": IDL.Vec(CorrespondencePoint2)
  });
  const UserId2 = IDL.Principal;
  const Timestamp2 = IDL.Int;
  const Job2 = IDL.Record({
    "id": JobId2,
    "status": JobStatus2,
    "result": IDL.Opt(JobResult2),
    "owner": UserId2,
    "createdAt": Timestamp2,
    "error": IDL.Opt(IDL.Text),
    "referenceImage": InputImage2,
    "config": ReproConfig2,
    "sourceImage": InputImage2
  });
  const JobSummary2 = IDL.Record({
    "id": JobId2,
    "status": JobStatus2,
    "model": TransformationModel2,
    "createdAt": Timestamp2,
    "sourceName": IDL.Text,
    "referenceName": IDL.Text
  });
  return IDL.Service({
    "_initialize_access_control": IDL.Func([], [], []),
    "_internet_identity_sign_in_finish": IDL.Func([], [Result_22], []),
    "_internet_identity_sign_in_start": IDL.Func([], [IDL.Vec(IDL.Nat8)], []),
    "assignCallerUserRole": IDL.Func([IDL.Principal, UserRole2], [], []),
    "createJob": IDL.Func(
      [InputImage2, InputImage2, ReproConfig2],
      [Result_12],
      []
    ),
    "deleteJob": IDL.Func([JobId2], [Result2], []),
    "execute": IDL.Func([IDL.Text], [Result__12], ["query"]),
    "getApiDoc": IDL.Func([], [IDL.Text], ["query"]),
    "getCallerUserRole": IDL.Func([], [UserRole2], ["query"]),
    "getJob": IDL.Func([JobId2], [IDL.Opt(Job2)], ["query"]),
    "isCallerAdmin": IDL.Func([], [IDL.Bool], ["query"]),
    "listJobs": IDL.Func([], [IDL.Vec(JobSummary2)], ["query"]),
    "schema": IDL.Func([], [IDL.Text], ["query"]),
    "updateJobResult": IDL.Func([JobId2, JobResult2], [Result2], [])
  });
};
function candid_some(value) {
  return [
    value
  ];
}
function candid_none() {
  return [];
}
function record_opt_to_undefined(arg) {
  return arg == null ? void 0 : arg;
}
var FeatureDetector = /* @__PURE__ */ ((FeatureDetector2) => {
  FeatureDetector2["orb"] = "orb";
  FeatureDetector2["kaze"] = "kaze";
  FeatureDetector2["sift"] = "sift";
  FeatureDetector2["brisk"] = "brisk";
  return FeatureDetector2;
})(FeatureDetector || {});
var TransformationModel = /* @__PURE__ */ ((TransformationModel2) => {
  TransformationModel2["homography"] = "homography";
  TransformationModel2["similarity"] = "similarity";
  TransformationModel2["affine"] = "affine";
  return TransformationModel2;
})(TransformationModel || {});
class Backend {
  constructor(actor, _uploadFile, _downloadFile, processError) {
    this.actor = actor;
    this._uploadFile = _uploadFile;
    this._downloadFile = _downloadFile;
    this.processError = processError;
  }
  async _initialize_access_control() {
    if (this.processError) {
      try {
        const result = await this.actor._initialize_access_control();
        return result;
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor._initialize_access_control();
      return result;
    }
  }
  async _internet_identity_sign_in_finish() {
    if (this.processError) {
      try {
        const result = await this.actor._internet_identity_sign_in_finish();
        return from_candid_Result_2_n1(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor._internet_identity_sign_in_finish();
      return from_candid_Result_2_n1(this._uploadFile, this._downloadFile, result);
    }
  }
  async _internet_identity_sign_in_start() {
    if (this.processError) {
      try {
        const result = await this.actor._internet_identity_sign_in_start();
        return result;
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor._internet_identity_sign_in_start();
      return result;
    }
  }
  async assignCallerUserRole(arg0, arg1) {
    if (this.processError) {
      try {
        const result = await this.actor.assignCallerUserRole(arg0, to_candid_UserRole_n5(this._uploadFile, this._downloadFile, arg1));
        return result;
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.assignCallerUserRole(arg0, to_candid_UserRole_n5(this._uploadFile, this._downloadFile, arg1));
      return result;
    }
  }
  async createJob(arg0, arg1, arg2) {
    if (this.processError) {
      try {
        const result = await this.actor.createJob(arg0, arg1, to_candid_ReproConfig_n7(this._uploadFile, this._downloadFile, arg2));
        return from_candid_Result_1_n17(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.createJob(arg0, arg1, to_candid_ReproConfig_n7(this._uploadFile, this._downloadFile, arg2));
      return from_candid_Result_1_n17(this._uploadFile, this._downloadFile, result);
    }
  }
  async deleteJob(arg0) {
    if (this.processError) {
      try {
        const result = await this.actor.deleteJob(arg0);
        return from_candid_Result_n21(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.deleteJob(arg0);
      return from_candid_Result_n21(this._uploadFile, this._downloadFile, result);
    }
  }
  async execute(arg0) {
    if (this.processError) {
      try {
        const result = await this.actor.execute(arg0);
        return from_candid_Result__1_n23(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.execute(arg0);
      return from_candid_Result__1_n23(this._uploadFile, this._downloadFile, result);
    }
  }
  async getApiDoc() {
    if (this.processError) {
      try {
        const result = await this.actor.getApiDoc();
        return result;
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.getApiDoc();
      return result;
    }
  }
  async getCallerUserRole() {
    if (this.processError) {
      try {
        const result = await this.actor.getCallerUserRole();
        return from_candid_UserRole_n31(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.getCallerUserRole();
      return from_candid_UserRole_n31(this._uploadFile, this._downloadFile, result);
    }
  }
  async getJob(arg0) {
    if (this.processError) {
      try {
        const result = await this.actor.getJob(arg0);
        return from_candid_opt_n33(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.getJob(arg0);
      return from_candid_opt_n33(this._uploadFile, this._downloadFile, result);
    }
  }
  async isCallerAdmin() {
    if (this.processError) {
      try {
        const result = await this.actor.isCallerAdmin();
        return result;
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.isCallerAdmin();
      return result;
    }
  }
  async listJobs() {
    if (this.processError) {
      try {
        const result = await this.actor.listJobs();
        return from_candid_vec_n56(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.listJobs();
      return from_candid_vec_n56(this._uploadFile, this._downloadFile, result);
    }
  }
  async schema() {
    if (this.processError) {
      try {
        const result = await this.actor.schema();
        return result;
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.schema();
      return result;
    }
  }
  async updateJobResult(arg0, arg1) {
    if (this.processError) {
      try {
        const result = await this.actor.updateJobResult(arg0, to_candid_JobResult_n59(this._uploadFile, this._downloadFile, arg1));
        return from_candid_Result_n21(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.updateJobResult(arg0, to_candid_JobResult_n59(this._uploadFile, this._downloadFile, arg1));
      return from_candid_Result_n21(this._uploadFile, this._downloadFile, result);
    }
  }
}
function from_candid_Cell_n27(_uploadFile, _downloadFile, value) {
  return from_candid_record_n28(_uploadFile, _downloadFile, value);
}
function from_candid_DetectorConfig_n52(_uploadFile, _downloadFile, value) {
  return from_candid_record_n53(_uploadFile, _downloadFile, value);
}
function from_candid_Error_n3(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n4(_uploadFile, _downloadFile, value);
}
function from_candid_FeatureDetector_n54(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n55(_uploadFile, _downloadFile, value);
}
function from_candid_JobError_n19(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n20(_uploadFile, _downloadFile, value);
}
function from_candid_JobMetrics_n41(_uploadFile, _downloadFile, value) {
  return from_candid_record_n42(_uploadFile, _downloadFile, value);
}
function from_candid_JobResult_n39(_uploadFile, _downloadFile, value) {
  return from_candid_record_n40(_uploadFile, _downloadFile, value);
}
function from_candid_JobStatus_n36(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n37(_uploadFile, _downloadFile, value);
}
function from_candid_JobSummary_n57(_uploadFile, _downloadFile, value) {
  return from_candid_record_n58(_uploadFile, _downloadFile, value);
}
function from_candid_Job_n34(_uploadFile, _downloadFile, value) {
  return from_candid_record_n35(_uploadFile, _downloadFile, value);
}
function from_candid_PreprocessingSettings_n50(_uploadFile, _downloadFile, value) {
  return from_candid_record_n51(_uploadFile, _downloadFile, value);
}
function from_candid_ReproConfig_n46(_uploadFile, _downloadFile, value) {
  return from_candid_record_n47(_uploadFile, _downloadFile, value);
}
function from_candid_Result_1_n17(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n18(_uploadFile, _downloadFile, value);
}
function from_candid_Result_2_n1(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n2(_uploadFile, _downloadFile, value);
}
function from_candid_Result__1_n23(_uploadFile, _downloadFile, value) {
  return from_candid_record_n24(_uploadFile, _downloadFile, value);
}
function from_candid_Result_n21(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n22(_uploadFile, _downloadFile, value);
}
function from_candid_TransformationModel_n48(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n49(_uploadFile, _downloadFile, value);
}
function from_candid_UserRole_n31(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n32(_uploadFile, _downloadFile, value);
}
function from_candid_Value_n29(_uploadFile, _downloadFile, value) {
  return from_candid_variant_n30(_uploadFile, _downloadFile, value);
}
function from_candid_opt_n33(_uploadFile, _downloadFile, value) {
  return value.length === 0 ? null : from_candid_Job_n34(_uploadFile, _downloadFile, value[0]);
}
function from_candid_opt_n38(_uploadFile, _downloadFile, value) {
  return value.length === 0 ? null : from_candid_JobResult_n39(_uploadFile, _downloadFile, value[0]);
}
function from_candid_opt_n43(_uploadFile, _downloadFile, value) {
  return value.length === 0 ? null : value[0];
}
function from_candid_opt_n44(_uploadFile, _downloadFile, value) {
  return value.length === 0 ? null : value[0];
}
function from_candid_opt_n45(_uploadFile, _downloadFile, value) {
  return value.length === 0 ? null : value[0];
}
function from_candid_record_n24(_uploadFile, _downloadFile, value) {
  return {
    hasMore: value.hasMore,
    rows: from_candid_vec_n25(_uploadFile, _downloadFile, value.rows)
  };
}
function from_candid_record_n28(_uploadFile, _downloadFile, value) {
  return {
    value: from_candid_Value_n29(_uploadFile, _downloadFile, value.value),
    name: value.name
  };
}
function from_candid_record_n35(_uploadFile, _downloadFile, value) {
  return {
    id: value.id,
    status: from_candid_JobStatus_n36(_uploadFile, _downloadFile, value.status),
    result: record_opt_to_undefined(from_candid_opt_n38(_uploadFile, _downloadFile, value.result)),
    owner: value.owner,
    createdAt: value.createdAt,
    error: record_opt_to_undefined(from_candid_opt_n45(_uploadFile, _downloadFile, value.error)),
    referenceImage: value.referenceImage,
    config: from_candid_ReproConfig_n46(_uploadFile, _downloadFile, value.config),
    sourceImage: value.sourceImage
  };
}
function from_candid_record_n40(_uploadFile, _downloadFile, value) {
  return {
    report: value.report,
    metrics: from_candid_JobMetrics_n41(_uploadFile, _downloadFile, value.metrics),
    registeredOutput: value.registeredOutput,
    transformationMatrix: value.transformationMatrix,
    correspondences: value.correspondences
  };
}
function from_candid_record_n42(_uploadFile, _downloadFile, value) {
  return {
    rmse: record_opt_to_undefined(from_candid_opt_n43(_uploadFile, _downloadFile, value.rmse)),
    scale: record_opt_to_undefined(from_candid_opt_n43(_uploadFile, _downloadFile, value.scale)),
    reprojectionError: record_opt_to_undefined(from_candid_opt_n43(_uploadFile, _downloadFile, value.reprojectionError)),
    rotationDegrees: record_opt_to_undefined(from_candid_opt_n43(_uploadFile, _downloadFile, value.rotationDegrees)),
    spatialCoverage: record_opt_to_undefined(from_candid_opt_n43(_uploadFile, _downloadFile, value.spatialCoverage)),
    inlierCount: record_opt_to_undefined(from_candid_opt_n44(_uploadFile, _downloadFile, value.inlierCount)),
    outlierCount: record_opt_to_undefined(from_candid_opt_n44(_uploadFile, _downloadFile, value.outlierCount))
  };
}
function from_candid_record_n47(_uploadFile, _downloadFile, value) {
  return {
    model: from_candid_TransformationModel_n48(_uploadFile, _downloadFile, value.model),
    preprocessing: from_candid_PreprocessingSettings_n50(_uploadFile, _downloadFile, value.preprocessing),
    detector: from_candid_DetectorConfig_n52(_uploadFile, _downloadFile, value.detector),
    matching: value.matching,
    thresholds: value.thresholds
  };
}
function from_candid_record_n51(_uploadFile, _downloadFile, value) {
  return {
    resizeWidth: record_opt_to_undefined(from_candid_opt_n44(_uploadFile, _downloadFile, value.resizeWidth)),
    denoise: value.denoise,
    contrastEnhancement: value.contrastEnhancement,
    resizeHeight: record_opt_to_undefined(from_candid_opt_n44(_uploadFile, _downloadFile, value.resizeHeight)),
    grayscale: value.grayscale
  };
}
function from_candid_record_n53(_uploadFile, _downloadFile, value) {
  return {
    maxFeatures: value.maxFeatures,
    detector: from_candid_FeatureDetector_n54(_uploadFile, _downloadFile, value.detector),
    nLevels: value.nLevels,
    edgeThreshold: value.edgeThreshold,
    scaleFactor: value.scaleFactor
  };
}
function from_candid_record_n58(_uploadFile, _downloadFile, value) {
  return {
    id: value.id,
    status: from_candid_JobStatus_n36(_uploadFile, _downloadFile, value.status),
    model: from_candid_TransformationModel_n48(_uploadFile, _downloadFile, value.model),
    createdAt: value.createdAt,
    sourceName: value.sourceName,
    referenceName: value.referenceName
  };
}
function from_candid_variant_n18(_uploadFile, _downloadFile, value) {
  return "ok" in value ? {
    __kind__: "ok",
    ok: value.ok
  } : "err" in value ? {
    __kind__: "err",
    err: from_candid_JobError_n19(_uploadFile, _downloadFile, value.err)
  } : value;
}
function from_candid_variant_n2(_uploadFile, _downloadFile, value) {
  return "ok" in value ? {
    __kind__: "ok",
    ok: value.ok
  } : "err" in value ? {
    __kind__: "err",
    err: from_candid_Error_n3(_uploadFile, _downloadFile, value.err)
  } : value;
}
function from_candid_variant_n20(_uploadFile, _downloadFile, value) {
  return "notFound" in value ? {
    __kind__: "notFound",
    notFound: value.notFound
  } : "invalidConfig" in value ? {
    __kind__: "invalidConfig",
    invalidConfig: value.invalidConfig
  } : value;
}
function from_candid_variant_n22(_uploadFile, _downloadFile, value) {
  return "ok" in value ? {
    __kind__: "ok",
    ok: value.ok
  } : "err" in value ? {
    __kind__: "err",
    err: from_candid_JobError_n19(_uploadFile, _downloadFile, value.err)
  } : value;
}
function from_candid_variant_n30(_uploadFile, _downloadFile, value) {
  return "int" in value ? {
    __kind__: "int",
    int: value.int
  } : "nat" in value ? {
    __kind__: "nat",
    nat: value.nat
  } : "float" in value ? {
    __kind__: "float",
    float: value.float
  } : "bool" in value ? {
    __kind__: "bool",
    bool: value.bool
  } : "null" in value ? {
    __kind__: "null",
    null: value.null
  } : "text" in value ? {
    __kind__: "text",
    text: value.text
  } : value;
}
function from_candid_variant_n32(_uploadFile, _downloadFile, value) {
  return "admin" in value ? "admin" : "user" in value ? "user" : "guest" in value ? "guest" : value;
}
function from_candid_variant_n37(_uploadFile, _downloadFile, value) {
  return "pending" in value ? "pending" : "completed" in value ? "completed" : "processing" in value ? "processing" : "failed" in value ? "failed" : value;
}
function from_candid_variant_n4(_uploadFile, _downloadFile, value) {
  return "FrontendOriginsNotConfigured" in value ? {
    __kind__: "FrontendOriginsNotConfigured",
    FrontendOriginsNotConfigured: value.FrontendOriginsNotConfigured
  } : "MixedSsoSources" in value ? {
    __kind__: "MixedSsoSources",
    MixedSsoSources: value.MixedSsoSources
  } : "Stale" in value ? {
    __kind__: "Stale",
    Stale: value.Stale
  } : "MalformedCandid" in value ? {
    __kind__: "MalformedCandid",
    MalformedCandid: value.MalformedCandid
  } : "AmbiguousAttribute" in value ? {
    __kind__: "AmbiguousAttribute",
    AmbiguousAttribute: value.AmbiguousAttribute
  } : "NoAttributes" in value ? {
    __kind__: "NoAttributes",
    NoAttributes: value.NoAttributes
  } : "UnknownNonce" in value ? {
    __kind__: "UnknownNonce",
    UnknownNonce: value.UnknownNonce
  } : "UntrustedSsoSource" in value ? {
    __kind__: "UntrustedSsoSource",
    UntrustedSsoSource: value.UntrustedSsoSource
  } : "MissingField" in value ? {
    __kind__: "MissingField",
    MissingField: value.MissingField
  } : "FrontendOriginMismatch" in value ? {
    __kind__: "FrontendOriginMismatch",
    FrontendOriginMismatch: value.FrontendOriginMismatch
  } : value;
}
function from_candid_variant_n49(_uploadFile, _downloadFile, value) {
  return "homography" in value ? "homography" : "similarity" in value ? "similarity" : "affine" in value ? "affine" : value;
}
function from_candid_variant_n55(_uploadFile, _downloadFile, value) {
  return "orb" in value ? "orb" : "kaze" in value ? "kaze" : "sift" in value ? "sift" : "brisk" in value ? "brisk" : value;
}
function from_candid_vec_n25(_uploadFile, _downloadFile, value) {
  return value.map((x) => from_candid_vec_n26(_uploadFile, _downloadFile, x));
}
function from_candid_vec_n26(_uploadFile, _downloadFile, value) {
  return value.map((x) => from_candid_Cell_n27(_uploadFile, _downloadFile, x));
}
function from_candid_vec_n56(_uploadFile, _downloadFile, value) {
  return value.map((x) => from_candid_JobSummary_n57(_uploadFile, _downloadFile, x));
}
function to_candid_DetectorConfig_n13(_uploadFile, _downloadFile, value) {
  return to_candid_record_n14(_uploadFile, _downloadFile, value);
}
function to_candid_FeatureDetector_n15(_uploadFile, _downloadFile, value) {
  return to_candid_variant_n16(_uploadFile, _downloadFile, value);
}
function to_candid_JobMetrics_n61(_uploadFile, _downloadFile, value) {
  return to_candid_record_n62(_uploadFile, _downloadFile, value);
}
function to_candid_JobResult_n59(_uploadFile, _downloadFile, value) {
  return to_candid_record_n60(_uploadFile, _downloadFile, value);
}
function to_candid_PreprocessingSettings_n11(_uploadFile, _downloadFile, value) {
  return to_candid_record_n12(_uploadFile, _downloadFile, value);
}
function to_candid_ReproConfig_n7(_uploadFile, _downloadFile, value) {
  return to_candid_record_n8(_uploadFile, _downloadFile, value);
}
function to_candid_TransformationModel_n9(_uploadFile, _downloadFile, value) {
  return to_candid_variant_n10(_uploadFile, _downloadFile, value);
}
function to_candid_UserRole_n5(_uploadFile, _downloadFile, value) {
  return to_candid_variant_n6(_uploadFile, _downloadFile, value);
}
function to_candid_record_n12(_uploadFile, _downloadFile, value) {
  return {
    resizeWidth: value.resizeWidth ? candid_some(value.resizeWidth) : candid_none(),
    denoise: value.denoise,
    contrastEnhancement: value.contrastEnhancement,
    resizeHeight: value.resizeHeight ? candid_some(value.resizeHeight) : candid_none(),
    grayscale: value.grayscale
  };
}
function to_candid_record_n14(_uploadFile, _downloadFile, value) {
  return {
    maxFeatures: value.maxFeatures,
    detector: to_candid_FeatureDetector_n15(_uploadFile, _downloadFile, value.detector),
    nLevels: value.nLevels,
    edgeThreshold: value.edgeThreshold,
    scaleFactor: value.scaleFactor
  };
}
function to_candid_record_n60(_uploadFile, _downloadFile, value) {
  return {
    report: value.report,
    metrics: to_candid_JobMetrics_n61(_uploadFile, _downloadFile, value.metrics),
    registeredOutput: value.registeredOutput,
    transformationMatrix: value.transformationMatrix,
    correspondences: value.correspondences
  };
}
function to_candid_record_n62(_uploadFile, _downloadFile, value) {
  return {
    rmse: value.rmse ? candid_some(value.rmse) : candid_none(),
    scale: value.scale ? candid_some(value.scale) : candid_none(),
    reprojectionError: value.reprojectionError ? candid_some(value.reprojectionError) : candid_none(),
    rotationDegrees: value.rotationDegrees ? candid_some(value.rotationDegrees) : candid_none(),
    spatialCoverage: value.spatialCoverage ? candid_some(value.spatialCoverage) : candid_none(),
    inlierCount: value.inlierCount ? candid_some(value.inlierCount) : candid_none(),
    outlierCount: value.outlierCount ? candid_some(value.outlierCount) : candid_none()
  };
}
function to_candid_record_n8(_uploadFile, _downloadFile, value) {
  return {
    model: to_candid_TransformationModel_n9(_uploadFile, _downloadFile, value.model),
    preprocessing: to_candid_PreprocessingSettings_n11(_uploadFile, _downloadFile, value.preprocessing),
    detector: to_candid_DetectorConfig_n13(_uploadFile, _downloadFile, value.detector),
    matching: value.matching,
    thresholds: value.thresholds
  };
}
function to_candid_variant_n10(_uploadFile, _downloadFile, value) {
  return value == "homography" ? {
    homography: null
  } : value == "similarity" ? {
    similarity: null
  } : value == "affine" ? {
    affine: null
  } : value;
}
function to_candid_variant_n16(_uploadFile, _downloadFile, value) {
  return value == "orb" ? {
    orb: null
  } : value == "kaze" ? {
    kaze: null
  } : value == "sift" ? {
    sift: null
  } : value == "brisk" ? {
    brisk: null
  } : value;
}
function to_candid_variant_n6(_uploadFile, _downloadFile, value) {
  return value == "admin" ? {
    admin: null
  } : value == "user" ? {
    user: null
  } : value == "guest" ? {
    guest: null
  } : value;
}
function createActor(canisterId, _uploadFile, _downloadFile, options = {}) {
  const agent = options.agent || HttpAgent.createSync({
    ...options.agentOptions
  });
  if (options.agent && options.agentOptions) {
    console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
  }
  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions
  });
  return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
export {
  FeatureDetector as F,
  TransformationModel as T,
  createActor as c
};
