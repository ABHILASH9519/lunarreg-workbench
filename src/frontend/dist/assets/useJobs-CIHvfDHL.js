import { r as reactExports } from "./index-CLvvNGC5.js";
import { c as useJobs, d as useJobHistoryStore } from "./job-history-store-BWqWtVFr.js";
function useJobsQuery() {
  const query = useJobs();
  const setJobs = useJobHistoryStore((s) => s.setJobs);
  reactExports.useEffect(() => {
    if (query.data) {
      setJobs(query.data);
    }
  }, [query.data, setJobs]);
  return query;
}
export {
  useJobsQuery as u
};
