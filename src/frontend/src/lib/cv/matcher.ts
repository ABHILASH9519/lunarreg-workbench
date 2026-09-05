import type { Descriptor, Match } from "../types";

/**
 * Brute-force descriptor matching with Lowe's ratio test.
 * Computes Hamming distance between binary descriptors.
 */

export interface MatchOptions {
  /** Lowe's ratio threshold (0..1). Lower = stricter. */
  ratioThreshold: number;
  /** Maximum number of matches to keep. */
  maxMatches: number;
}

const DEFAULT_OPTIONS: MatchOptions = {
  ratioThreshold: 0.75,
  maxMatches: 500,
};

/** Hamming distance between two binary descriptor vectors. */
export function hammingDistance(a: number[], b: number[]): number {
  let dist = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

/** Brute-force match with ratio test. Returns matches sorted by distance. */
export function matchDescriptors(
  source: Descriptor[],
  reference: Descriptor[],
  options?: Partial<MatchOptions>,
): Match[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const matches: Match[] = [];

  for (let i = 0; i < source.length; i++) {
    // Find the two nearest neighbors in the reference set.
    let best = Number.POSITIVE_INFINITY;
    let second = Number.POSITIVE_INFINITY;
    let bestIdx = -1;
    for (let j = 0; j < reference.length; j++) {
      const d = hammingDistance(source[i].values, reference[j].values);
      if (d < best) {
        second = best;
        best = d;
        bestIdx = j;
      } else if (d < second) {
        second = d;
      }
    }
    if (bestIdx < 0) continue;
    // Lowe's ratio test: reject ambiguous matches.
    const ratio = second === Number.POSITIVE_INFINITY ? 0 : best / second;
    if (ratio > opts.ratioThreshold) continue;
    matches.push({
      sourceIndex: i,
      referenceIndex: bestIdx,
      distance: best,
      ratio,
    });
  }

  matches.sort((a, b) => a.distance - b.distance);
  return matches.slice(0, opts.maxMatches);
}
