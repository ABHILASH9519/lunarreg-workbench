import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  InputImage,
  Job,
  JobId,
  JobResult,
  JobSummary,
  ReproConfig,
} from "./types";

/**
 * Typed wrapper around the generated backend actor for job CRUD.
 * All reads go through React Query; writes through mutations that
 * invalidate the affected query keys.
 */

export function useJobs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async (): Promise<JobSummary[]> => {
      if (!actor) return [];
      return actor.listJobs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useJob(jobId: JobId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["jobs", jobId],
    queryFn: async (): Promise<Job | null> => {
      if (!actor || jobId === null) return null;
      return actor.getJob(jobId);
    },
    enabled: !!actor && !isFetching && jobId !== null,
  });
}

export function useCreateJob() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      source: InputImage;
      reference: InputImage;
      config: ReproConfig;
    }): Promise<JobId> => {
      if (!actor) throw new Error("Backend is not ready");
      const res = await actor.createJob(
        input.source,
        input.reference,
        input.config,
      );
      if (res.__kind__ === "err") {
        const err = res.err;
        throw new Error(
          err.__kind__ === "notFound"
            ? "Job not found"
            : `Invalid config: ${err.invalidConfig}`,
        );
      }
      return res.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUpdateJobResult() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      jobId: JobId;
      result: JobResult;
    }): Promise<void> => {
      if (!actor) throw new Error("Backend is not ready");
      const res = await actor.updateJobResult(input.jobId, input.result);
      if (res.__kind__ === "err") {
        const err = res.err;
        throw new Error(
          err.__kind__ === "notFound"
            ? "Job not found"
            : `Invalid config: ${err.invalidConfig}`,
        );
      }
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs", vars.jobId] });
    },
  });
}

export function useDeleteJob() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: JobId): Promise<void> => {
      if (!actor) throw new Error("Backend is not ready");
      const res = await actor.deleteJob(jobId);
      if (res.__kind__ === "err") {
        const err = res.err;
        throw new Error(
          err.__kind__ === "notFound"
            ? "Job not found"
            : `Invalid config: ${err.invalidConfig}`,
        );
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
