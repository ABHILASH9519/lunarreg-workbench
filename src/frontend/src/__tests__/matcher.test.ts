import { describe, expect, it } from "vitest";
import { matchDescriptors } from "@/lib/cv/matcher";
import type { Descriptor } from "@/lib/types";

const descriptor = (...values: number[]): Descriptor => ({ values });

describe("matchDescriptors cross-check", () => {
  it("keeps ratio-tested matches when mutual-nearest checking is disabled", () => {
    const source = [descriptor(0, 0), descriptor(1, 1)];
    const reference = [descriptor(0, 0), descriptor(1, 0)];
    const matches = matchDescriptors(source, reference, {
      ratioThreshold: 1,
      maxMatches: 10,
      crossCheck: false,
    });
    expect(matches.length).toBeGreaterThan(0);
  });

  it("rejects a one-way nearest-neighbour match when cross-check is enabled", () => {
    const source = [descriptor(0, 0), descriptor(0, 1)];
    const reference = [descriptor(0, 0), descriptor(1, 1)];
    const matches = matchDescriptors(source, reference, {
      ratioThreshold: 1,
      maxMatches: 10,
      crossCheck: true,
    });
    expect(matches).toHaveLength(1);
    expect(matches[0].sourceIndex).toBe(0);
  });
});
