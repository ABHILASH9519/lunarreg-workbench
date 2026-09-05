import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MatchingConfig {
    crossCheck: boolean;
    maxMatches: bigint;
    ratioThreshold: number;
}
export type Timestamp = bigint;
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface CorrespondencePoint {
    source: Point2D;
    reference: Point2D;
}
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface DetectorConfig {
    maxFeatures: bigint;
    detector: FeatureDetector;
    nLevels: bigint;
    edgeThreshold: bigint;
    scaleFactor: number;
}
export type Result_1 = {
    __kind__: "ok";
    ok: JobId;
} | {
    __kind__: "err";
    err: JobError;
};
export interface Job {
    id: JobId;
    status: JobStatus;
    result?: JobResult;
    owner: UserId;
    createdAt: Timestamp;
    error?: string;
    referenceImage: InputImage;
    config: ReproConfig;
    sourceImage: InputImage;
}
export interface JobSummary {
    id: JobId;
    status: JobStatus;
    model: TransformationModel;
    createdAt: Timestamp;
    sourceName: string;
    referenceName: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface Point2D {
    x: number;
    y: number;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type ImageRef = string;
export interface ReproConfig {
    model: TransformationModel;
    preprocessing: PreprocessingSettings;
    detector: DetectorConfig;
    matching: MatchingConfig;
    thresholds: Thresholds;
}
export interface JobMetrics {
    rmse?: number;
    scale?: number;
    reprojectionError?: number;
    rotationDegrees?: number;
    spatialCoverage?: number;
    inlierCount?: bigint;
    outlierCount?: bigint;
}
export interface PreprocessingSettings {
    resizeWidth?: bigint;
    denoise: boolean;
    contrastEnhancement: boolean;
    resizeHeight?: bigint;
    grayscale: boolean;
}
export type JobId = bigint;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Matrix3x3 = Array<number>;
export type UserId = Principal;
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: JobError;
};
export type JobError = {
    __kind__: "notFound";
    notFound: JobId;
} | {
    __kind__: "invalidConfig";
    invalidConfig: string;
};
export interface Thresholds {
    minInlierRatio: number;
    ransacReprojThreshold: number;
}
export interface JobResult {
    report: string;
    metrics: JobMetrics;
    registeredOutput: ImageRef;
    transformationMatrix: Matrix3x3;
    correspondences: Array<CorrespondencePoint>;
}
export interface InputImage {
    ref: ImageRef;
    metadata: ImageMetadata;
}
export interface ImageMetadata {
    height: bigint;
    name: string;
    sizeBytes: bigint;
    width: bigint;
    format: string;
}
export enum FeatureDetector {
    orb = "orb",
    kaze = "kaze",
    sift = "sift",
    brisk = "brisk"
}
export enum JobStatus {
    pending = "pending",
    completed = "completed",
    processing = "processing",
    failed = "failed"
}
export enum TransformationModel {
    homography = "homography",
    similarity = "similarity",
    affine = "affine"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createJob(source: InputImage, reference: InputImage, config: ReproConfig): Promise<Result_1>;
    deleteJob(jobId: JobId): Promise<Result>;
    execute(qJson: string): Promise<Result__1>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getJob(jobId: JobId): Promise<Job | null>;
    isCallerAdmin(): Promise<boolean>;
    listJobs(): Promise<Array<JobSummary>>;
    schema(): Promise<string>;
    updateJobResult(jobId: JobId, result: JobResult): Promise<Result>;
}
