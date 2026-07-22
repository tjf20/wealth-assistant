// server/routes/agents.js
const express = require("express");
const router = express.Router();
const AGENT_META = require("../data/agentMeta");

// GET /api/agents
// Returns the full agent hierarchy
router.get("/", (req, res) => {
  res.json(AGENT_META);
});

// GET /api/agents/:key
// Returns a specific level of the hierarchy (e.g. "root", "sub-ag-01", "prompts-101")
router.get("/:key", (req, res) => {
  const { key } = req.params;
  if (!AGENT_META[key]) return res.status(404).json({ error: `Assistant key "${key}" not found` });
  res.json(AGENT_META[key]);
});

// POST /api/agents/:id/run
// Kick off an agent or workflow run (stub — wire to your actual execution layer)
router.post("/:id/run", async (req, res) => {
  const { id } = req.params;
  const { clientId, accountIds, params } = req.body;

  console.log(`[RUN] Assistant: ${id} | Client: ${clientId || "all"} | Params:`, params);

  // TODO: Replace this stub with your actual assistant execution call.
  // Options:
  //   - Call Anthropic API with a pre-built system prompt for this assistant
  //   - Trigger a Salesforce Agentforce flow
  //   - Call your internal data services (CF Assistant, Finder Assistant, etc.)

  // For now, return a job receipt so the frontend can poll for status
  const jobId = `job-${Date.now()}`;
  res.json({
    jobId,
    agentId: id,
    status: "queued",
    startedAt: new Date().toISOString(),
    message: `Assistant ${id} queued successfully. Poll /api/activity/${jobId} for status.`,
  });
});

module.exports = router;
