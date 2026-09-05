import { useEffect } from "react";
import {
  useCreateJob,
  useDeleteJob,
  useJob,
  useJobs,
  useUpdateJobResult,
} from "../lib/backend-client";
import { useJobHistoryStore } from "../stores/job-history-store";

/**
 * useJobs: exposes the backend job list and keeps the local history cache in
 * sync so the history page renders instantly.
 */
export function useJobsQuery() {
  const query = useJobs();
  const setJobs = useJobHistoryStore((s) => s.setJobs);

  useEffect(() => {
    if (query.data) {
      setJobs(query.data);
    }
  }, [query.data, setJobs]);

  return query;
}

export { useJob, useCreateJob, useUpdateJobResult, useDeleteJob };
