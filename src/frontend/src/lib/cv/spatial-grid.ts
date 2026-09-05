import type { ClassifiedCorrespondence, SpatialGridSize } from "../types";

/**
 * Uniform spatial distribution of correspondence points using a configurable
 * grid (4x4, 8x8, 16x16). Ensures matches never concentrate in one region by
 * selecting a representative point per occupied cell.
 */

export interface SpatialGridOptions {
  gridSize: SpatialGridSize;
  /** Maximum points to keep after grid filtering. */
  maxPoints: number;
}

const DEFAULT_OPTIONS: SpatialGridOptions = {
  gridSize: 8,
  maxPoints: 200,
};

export interface SpatialGridResult {
  /** Filtered correspondences (one representative per occupied cell). */
  correspondences: ClassifiedCorrespondence[];
  /** Number of occupied cells. */
  occupiedCells: number;
  /** Total number of cells in the grid. */
  totalCells: number;
}

/**
 * Filter correspondences so they are uniformly distributed across the image.
 * For each grid cell, keeps the inlier with the lowest reprojection error
 * (falling back to any point if no inlier occupies the cell).
 */
export function spatialGridFilter(
  correspondences: ClassifiedCorrespondence[],
  width: number,
  height: number,
  options?: Partial<SpatialGridOptions>,
): SpatialGridResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const grid = opts.gridSize;
  const totalCells = grid * grid;

  // Map cell -> best point in that cell.
  const cellBest = new Map<number, ClassifiedCorrespondence>();
  for (const c of correspondences) {
    const gx = Math.min(
      grid - 1,
      Math.max(0, Math.floor((c.source.x / width) * grid)),
    );
    const gy = Math.min(
      grid - 1,
      Math.max(0, Math.floor((c.source.y / height) * grid)),
    );
    const key = gy * grid + gx;
    const existing = cellBest.get(key);
    if (!existing) {
      cellBest.set(key, c);
    } else if (c.inlier && !existing.inlier) {
      cellBest.set(key, c);
    } else if (
      c.inlier &&
      existing.inlier &&
      c.reprojectionError < existing.reprojectionError
    ) {
      cellBest.set(key, c);
    }
  }

  // Sort occupied cells: prefer cells with inliers first, then by error.
  const cells = [...cellBest.entries()];
  cells.sort((a, b) => {
    const inA = a[1].inlier ? 0 : 1;
    const inB = b[1].inlier ? 0 : 1;
    if (inA !== inB) return inA - inB;
    return a[1].reprojectionError - b[1].reprojectionError;
  });

  const selected = cells.slice(0, opts.maxPoints).map(([, c]) => c);
  return {
    correspondences: selected,
    occupiedCells: cellBest.size,
    totalCells,
  };
}
