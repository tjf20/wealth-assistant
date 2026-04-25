// server/routes/activity.js
// Tracks running, completed, and queued agent jobs.
// In production, replace the in-memory store with a database (e.g. Azure SQL, Cosmos DB).

const express = require("express");
const router = express.Router();

// In-memory job store (replace with DB in production)
const jobs = [
  { jobId: "job-demo-1", agentId: "sub-101", agentName: "Tax Loss Harvesting", status: "running", startedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(), completedAt: null },
  { jobId: "job-demo-2", agentId: "sub-102", agentName: "Gain/Loss Summary", status: "done", startedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), completedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(), resultUrl: "/api/activity/job-demo-2/results" },
  { jobId: "job-demo-3", agentId: "sub-502", agentName: "Client Outreach Batch", status: "queued", startedAt: null, completedAt: null },
];

// GET /api/activity
// Returns all jobs for the current advisor (scoped by session in production)
router.get("/", (req, res) => {
  res.json(jobs.sort((a, b) => {
    const order = { running: 0, queued: 1, done: 2, failed: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  }));
});

// GET /api/activity/:jobId
// Returns a single job's status
router.get("/:jobId", (req, res) => {
  const job = jobs.find(j => j.jobId === req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// GET /api/activity/:jobId/results
// Returns the results payload for a completed job
router.get("/:jobId/results", (req, res) => {
  const job = jobs.find(j => j.jobId === req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status !== "done") return res.status(202).json({ message: "Job not yet complete", status: job.status });

  // TODO: Return real results from your data store
  res.json({
    jobId: job.jobId,
    agentName: job.agentName,
    completedAt: job.completedAt,
    summary: { accountsAnalyzed: 47, opportunitiesFound: 4, estimatedTaxSavings: 8215 },
    rows: [
      { client: "Anderson, R.", security: "ARKK", unrealizedLoss: -12400, action: "Harvest" },
      { client: "Chen, L.",     security: "BOND", unrealizedLoss: -8100,  action: "Harvest" },
      { client: "Williams, S.", security: "INTC", unrealizedLoss: -5650,  action: "Review"  },
      { client: "Patel, A.",    security: "XPEV", unrealizedLoss: -3200,  action: "Harvest" },
    ],
  });
});

// POST /api/activity (internal — called by agent runner to register a new job)
router.post("/", (req, res) => {
  const job = { ...req.body, jobId: `job-${Date.now()}` };
  jobs.push(job);
  res.status(201).json(job);
});

// PATCH /api/activity/:jobId (internal — update job status)
router.patch("/:jobId", (req, res) => {
  const job = jobs.find(j => j.jobId === req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  Object.assign(job, req.body);
  res.json(job);
});

module.exports = router;
