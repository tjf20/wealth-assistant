// client/src/hooks/useActivity.js
// Polls /api/activity every 10 seconds so the Activity rail stays live
// without requiring a page refresh. Replace with WebSockets for real-time.

import { useState, useEffect, useCallback } from "react";
import { api } from "../api.js";

export function useActivity(pollIntervalMs = 10_000) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    api.getActivity()
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [refresh, pollIntervalMs]);

  // Manually add a job to the local list immediately (optimistic update)
  const addJob = (job) => setJobs(prev => [job, ...prev]);

  // Count of running or queued jobs
  const activeCount = jobs.filter(j => j.status === "running" || j.status === "queued").length;

  return { jobs, loading, refresh, addJob, activeCount };
}
