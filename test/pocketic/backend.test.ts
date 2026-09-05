import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type {
  _SERVICE,
  InputImage,
  JobResult,
  ReproConfig,
} from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

// Deterministic identities from seeds; `@icp-sdk/core` is a frontend-only
// dependency, so the lane uses `createIdentity` from the root's `@dfinity/pic`
// instead of importing Principal directly.
const ALICE = createIdentity("alice-seed");
const BOB = createIdentity("bob-seed");

let pic: PocketIc | undefined;
let actor: _SERVICE;

function inputImage(name: string): InputImage {
  return {
    ref: `data:image/png;base64,${name}`,
    metadata: {
      name,
      format: "image/png",
      width: 512n,
      height: 512n,
      sizeBytes: 1024n,
    },
  };
}

function config(): ReproConfig {
  return {
    preprocessing: {
      grayscale: true,
      resizeWidth: [],
      resizeHeight: [],
      denoise: true,
      contrastEnhancement: true,
    },
    detector: {
      detector: { orb: null },
      maxFeatures: 800n,
      scaleFactor: 1.2,
      nLevels: 4n,
      edgeThreshold: 31n,
    },
    matching: {
      ratioThreshold: 0.75,
      crossCheck: true,
      maxMatches: 500n,
    },
    model: { similarity: null },
    thresholds: {
      ransacReprojThreshold: 3.0,
      minInlierRatio: 0.3,
    },
  };
}

function jobResult(): JobResult {
  return {
    report: "Registration completed with similarity model.",
    metrics: {
      rmse: [1.2],
      scale: [1.0],
      reprojectionError: [1.1],
      rotationDegrees: [2.5],
      spatialCoverage: [0.7],
      inlierCount: [42n],
      outlierCount: [3n],
    },
    registeredOutput: "data:image/png;base64,registered",
    transformationMatrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    correspondences: [
      { source: { x: 1, y: 2 }, reference: { x: 1.1, y: 2.1 } },
    ],
  };
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
    sender: ALICE.getPrincipal(),
  }));
  // Register the installing caller so it holds a role (first caller becomes
  // admin, which also satisfies the #user permission the job methods require).
  actor.setIdentity(ALICE);
  await actor._initialize_access_control();
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far.
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  actor.setIdentity(ALICE);
  await expect(actor.listJobs()).resolves.toEqual([]);
});

it("round-trips a job through create, list, get, and update", async () => {
  actor.setIdentity(ALICE);
  const res = await actor.createJob(
    inputImage("crater-source"),
    inputImage("crater-reference"),
    config(),
  );
  expect(res).toHaveProperty("ok");
  const jobId = (res as { ok: bigint }).ok;

  const summaries = await actor.listJobs();
  expect(summaries).toHaveLength(1);
  expect(summaries[0]).toMatchObject({
    id: jobId,
    sourceName: "crater-source",
    referenceName: "crater-reference",
    model: { similarity: null },
  });

  const before = await actor.getJob(jobId);
  expect(before).toHaveLength(1);
  expect(before[0].status).toEqual({ pending: null });
  expect(before[0].result).toEqual([]);

  const update = await actor.updateJobResult(jobId, jobResult());
  expect(update).toEqual({ ok: null });

  const after = await actor.getJob(jobId);
  expect(after).toHaveLength(1);
  expect(after[0].status).toEqual({ completed: null });
  expect(after[0].result).toHaveLength(1);
  expect(after[0].result![0].metrics.inlierCount).toEqual([42n]);
});

it("does not show one caller's jobs to another", async () => {
  actor.setIdentity(BOB);
  await actor._initialize_access_control();
  await expect(actor.listJobs()).resolves.toEqual([]);

  const res = await actor.createJob(
    inputImage("bob-source"),
    inputImage("bob-reference"),
    config(),
  );
  const bobJobId = (res as { ok: bigint }).ok;

  // Bob sees his own job.
  const bobJobs = await actor.listJobs();
  expect(bobJobs.map((j) => j.id)).toEqual([bobJobId]);

  // Alice does not see Bob's job.
  actor.setIdentity(ALICE);
  const aliceJobs = await actor.listJobs();
  expect(aliceJobs.map((j) => j.id)).not.toContain(bobJobId);

  // Alice cannot read or update Bob's job (treated as not found).
  await expect(actor.getJob(bobJobId)).resolves.toEqual([]);
  const update = await actor.updateJobResult(bobJobId, jobResult());
  expect(update).toEqual({ err: { notFound: bobJobId } });
});

it("deletes a job owned by the caller", async () => {
  actor.setIdentity(ALICE);
  const res = await actor.createJob(
    inputImage("delete-source"),
    inputImage("delete-reference"),
    config(),
  );
  const jobId = (res as { ok: bigint }).ok;

  const del = await actor.deleteJob(jobId);
  expect(del).toEqual({ ok: null });
  await expect(actor.getJob(jobId)).resolves.toEqual([]);
});
