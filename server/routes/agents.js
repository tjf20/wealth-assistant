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
  if (!AGENT_META[key]) return res.status(404).json({ error: `Agent key "${key}" not found` });
  res.json(AGENT_META[key]);
});

// POST /api/agents/:id/run
// Kick off an agent or workflow run (stub — wire to your actual execution layer)
router.post("/:id/run", async (req, res) => {
  const { id } = req.params;
  const { clientId, accountIds, params } = req.body;

  console.log(`[RUN] Agent: ${id} | Client: ${clientId || "all"} | Params:`, params);

  // TODO: Replace this stub with your actual agent execution call.
  // Options:
  //   - Call Anthropic API with a pre-built system prompt for this agent
  //   - Trigger a Salesforce AgentForce flow
  //   - Call your internal data services (CF Agent, Finder Agent, etc.)

  // For now, return a job receipt so the frontend can poll for status
  const jobId = `job-${Date.now()}`;
  res.json({
    jobId,
    agentId: id,
    status: "queued",
    startedAt: new Date().toISOString(),
    message: `Agent ${id} queued successfully. Poll /api/activity/${jobId} for status.`,
  });
});

module.exports = router;
