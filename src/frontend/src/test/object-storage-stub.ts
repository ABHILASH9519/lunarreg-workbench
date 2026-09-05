/**
 * Test-only stub for `@caffeineai/object-storage`.
 *
 * The real package's `dist/index.js` imports a subpath (`dist/blob`) that the
 * pnpm/Vitest module resolver cannot resolve in this environment, so any test
 * that transitively imports the generated backend wrapper (`@/backend`, which
 * re-exports `ExternalBlob`) fails to load. The wrapper only ever uses
 * `ExternalBlob` as a type, so a placeholder export is sufficient for tests
 * that exercise the CV engine and export utilities.
 */
export type ExternalBlob = Uint8Array;
