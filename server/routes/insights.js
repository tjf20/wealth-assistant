// server/routes/insights.js
// Lightweight in-memory insights store.
// External assistants (email assistant, wire-transfer assistant, etc.) POST here.
// Frontend GETs here to display the badge count and list.
//
// POST /api/insights  { title, body, severity, agentSource, clientId? }
// GET  /api/insights  → [{ id, title, body, severity, agentSource, clientId, createdAt }]
// DELETE /api/insights/:id

const express = require("express");
const router = express.Router();

const MAX_INSIGHTS = 100;
let insights = [
  {
    id: "demo-1",
    title: "Wire transfer intent detected",
    body: "Email from Anderson, Robert mentions an upcoming wire of $250K. Review before close of business.",
    severity: "high",
    agentSource: "Email Assistant",
    clientId: "c-001",
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    read: false,
  },
  {
    id: "demo-2",
    title: "High-Net-Worth ESG interest",
    body: "3 HNW clients opened ESG fund emails this week. Consider proactive outreach.",
    severity: "info",
    agentSource: "Market Intelligence",
    clientId: null,
    createdAt: new Date(Date.now() - 38 * 60000).toISOString(),
    read: false,
  },
];

// GET /api/insights
router.get("/", (req, res) => {
  res.json(insights);
});

// GET /api/insights/count  — lightweight badge endpoint
router.get("/count", (req, res) => {
  res.json({ total: insights.length, unread: insights.filter(i => !i.read).length });
});

// POST /api/insights  — external assistants call this
router.post("/", (req, res) => {
  const { title, body, severity = "info", agentSource = "Unknown Source", clientId = null } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title and body are required" });

  const insight = {
    id: `insight-${Date.now()}`,
    title,
    body,
    severity,
    agentSource,
    clientId,
    createdAt: new Date().toISOString(),
    read: false,
  };

  insights.unshift(insight);
  if (insights.length > MAX_INSIGHTS) insights = insights.slice(0, MAX_INSIGHTS);

  res.status(201).json(insight);
});

// PATCH /api/insights/:id/read — mark as read
router.patch("/:id/read", (req, res) => {
  const insight = insights.find(i => i.id === req.params.id);
  if (!insight) return res.status(404).json({ error: "Not found" });
  insight.read = true;
  res.json(insight);
});

// DELETE /api/insights/:id
router.delete("/:id", (req, res) => {
  const idx = insights.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  insights.splice(idx, 1);
  res.json({ deleted: req.params.id });
});

module.exports = router;
