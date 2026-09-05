mixin () {
  public query func getApiDoc() : async Text {
    "# Lunar Image Registration — Backend API

This canister is the backend for a lunar image registration platform. It
authenticates users via Internet Identity, authorizes them by role, and
persists per-user registration jobs (input images, algorithm configuration,
transformation matrix, correspondence points, metrics, registered output, and
report) so every result is reproducible from its stored configuration.

## Authentication and authorization

Access is gated by a role-based access-control system backed by Internet
Identity (II) single sign-on. Roles are `#admin`, `#user`, and `#guest`.

- **Anonymous callers** are `#guest`. They cannot create, list, view, update,
  or delete jobs — every job endpoint traps with `Unauthorized: Only users can
  ...` for a caller without `#user` (or `#admin`) permission.
- **Registration prerequisite:** a caller must be registered before any
  role-guarded call (guarded queries included). Registration happens only when
  a caller signs in through the app's own frontend, which calls
  `_internet_identity_sign_in_start` then `_internet_identity_sign_in_finish`
  (or `_initialize_access_control` directly). The **first** caller to register
  becomes `#admin`; every subsequent caller becomes `#user`. A principal that
  never signed in through the frontend is unregistered even if it belongs to
  the app's owner, and a signed-in caller derived against a different origin is
  a different principal than the one the frontend registered.
- **Guarded endpoints** (`createJob`, `listJobs`, `getJob`, `updateJobResult`,
  `deleteJob`) require `#user` or `#admin`. An unregistered or anonymous caller
  traps with `Unauthorized: Only users can ...`.
- **Admin-only:** `assignCallerUserRole` requires `#admin`; otherwise it traps
  with `Unauthorized: Only admins can assign user roles`.
- **Public (no role required):** `_internet_identity_sign_in_start`,
  `_internet_identity_sign_in_finish`, `_initialize_access_control`,
  `getCallerUserRole`, `isCallerAdmin`, `schema`, `execute`, and `getApiDoc`.

### Identity derivation

The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding
the user's Internet Identity authorization derives the correct per-app
principal against that origin (for example
`icp identity link web <name> --app <host>`). Such a delegation acts with the
user's full authority in this app until it expires.

## Units and encodings

- **Timestamps** (`createdAt`) are nanoseconds since the Unix epoch
  (`Time.now()`), an `Int`.
- **Identifiers** (`JobId`, `id`) are `Nat`, assigned sequentially per job.
- **Owner** (`owner`) is the caller's `Principal` (Internet Identity).
- **Image references** (`ref`, `registeredOutput`) are `Text` keys into object
  storage.
- **Transformation matrix** is a row-major 3x3 `[Float]` (9 elements).
- **Correspondence points** are `{ source : {x,y}; reference : {x,y} }` in
  pixel coordinates.
- **Optional metrics** (`rmse`, `reprojectionError`, `inlierCount`,
  `outlierCount`, `spatialCoverage`, `scale`, `rotationDegrees`) are `null`
  (N/A) when not computed — never fabricated.
- **Status** is a variant: `#pending`, `#processing`, `#completed`, `#failed`.
- **Transformation model** is a variant: `#similarity`, `#affine`,
  `#homography`.

## Lifecycle and polling

A job is created with `createJob` in `#pending` status. It transitions to
`#processing` while the (external) registration engine runs, then to
`#completed` when `updateJobResult` records the result, or to `#failed` with an
`error` message. Poll `getJob` (or `listJobs`) until `status` is `#completed`
or `#failed`; a `#completed` job carries its `result`. Polling is safe and
read-only.

## Mutation retry safety

- `createJob` is not idempotent: each call creates a new job and returns a new
  `JobId`. Retrying a failed create may produce duplicate jobs.
- `updateJobResult` is idempotent per job: recording the same result again
  overwrites the stored result and leaves the job `#completed`.
- `deleteJob` is idempotent: deleting an already-deleted or nonexistent job
  returns `#err(#notFound(id))` rather than trapping.
- All job mutations are scoped to the caller's own jobs; operating on another
  user's job returns `#err(#notFound(id))`.

## Errors

- Job endpoints return `Result.Result<_, JobError>` where `JobError` is
  `#notFound : JobId` or `#invalidConfig : Text`.
- Authorization failures trap (reject) rather than returning a value.
- `execute` traps with `OQL: invalid query — <detail>` on a malformed query.

## OQL data access

The persisted `job` entity is queryable through `schema()` (JSON schema) and
`execute(qJson)` (typed Candid result). Authorization is per table: each
signed-in user reads only their own rows (`owner`), while the platform
controller reads all rows. Exposed columns: `id`, `owner`, `createdAt`,
`status`, `sourceName`, `referenceName`, `model`, `error`.

## Non-obvious gotchas

- `execute` is named so because `query` is a reserved keyword in Motoko.
- `getCallerUserRole` traps with `User is not registered` for a signed-in but
  unregistered caller.
- `_initialize_access_control` is a no-op for anonymous callers.
"
  };
};
