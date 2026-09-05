import { create } from "zustand";
import type { JobSummary } from "../lib/types";

/**
 * Zustand store for the job history cache. Mirrors the backend list of jobs
 * so the history page can render instantly while React Query refetches.
 */

export interface JobHistoryState {
  jobs: JobSummary[];
  lastFetchedAt: number | null;
  setJobs: (jobs: JobSummary[]) => void;
  addJob: (job: JobSummary) => void;
  removeJob: (jobId: bigint) => void;
  clear: () => void;
}

export const useJobHistoryStore = create<JobHistoryState>((set) => ({
  jobs: [],
  lastFetchedAt: null,
  setJobs: (jobs) => set({ jobs, lastFetchedAt: Date.now() }),
  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs.filter((j) => j.id !== job.id)],
    })),
  removeJob: (jobId) =>
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== jobId) })),
  clear: () => set({ jobs: [], lastFetchedAt: null }),
}));
