// server/routes/insights.js
// Lightweight in-memory insights store — this is the data source behind the
// Insights workspace (the app's sole landing page). External assistants
// (email assistant, wire-transfer assistant, etc.) POST here as they scour
// data sources; the Insights view GETs here and groups by domain.
//
// POST /api/insights  { title, body, severity, agentSource, domain, clientId?, suggestedAgentId? }
// GET  /api/insights  → [{ id, title, body, severity, agentSource, domain, clientId, suggestedAgentId, createdAt }]
// GET  /api/insights/count → { total, unread }
// PATCH /api/insights/:id/read
// DELETE /api/insights/:id

const express = require("express");
const router = express.Router();

const MAX_INSIGHTS = 200;
const now = Date.now();
const minsAgo = (m) => new Date(now - m * 60000).toISOString();

// Demo data spans all seven starting domains (Client Financials, Prospecting,
// Client Deepening, Planning, Investments, Supervisory, My Practice). More
// domains can be added later without touching this shape — just tag new
// insights with a new `domain` string and the Insights view will group them.
let insights = [
  // Client Financials
  {
    id: "demo-1",
    title: "Realized gain approaching tax threshold",
    body: "Addison, Tianna has $184K in realized gains YTD — within $16K of the estimated tax bracket threshold. Consider harvesting offsetting losses before year-end.",
    severity: "high",
    domain: "Client Financials",
    agentSource: "Portfolio Financials Intelligence",
    clientId: "7496781191",
    suggestedAgentId: "sub-101",
    createdAt: minsAgo(12),
    read: false,
  },
  {
    id: "demo-2",
    title: "Idle cash building across accounts",
    body: "3 of your clients are holding over $50K in uninvested cash for 30+ days. A sweep to money market or short-duration bonds could add yield.",
    severity: "info",
    domain: "Client Financials",
    agentSource: "Portfolio Financials Intelligence",
    clientId: null,
    suggestedAgentId: "sub-202",
    createdAt: minsAgo(52),
    read: false,
  },

  // Prospecting
  {
    id: "demo-3",
    title: "High-scoring prospect ready for outreach",
    body: "Andersen, Brendan (prospect) scored 88/100 on conversion likelihood based on recent engagement. No outreach logged in 21 days.",
    severity: "high",
    domain: "Prospecting",
    agentSource: "Client Acquisition Assistant",
    clientId: "4441798255",
    suggestedAgentId: "sub-502",
    createdAt: minsAgo(38),
    read: false,
  },
  {
    id: "demo-4",
    title: "Referral window may be open",
    body: "Back, Mercedez referenced a colleague looking for a new advisor during a recent service call. Good moment for a referral ask.",
    severity: "info",
    domain: "Prospecting",
    agentSource: "Client Acquisition Assistant",
    clientId: "8028041755",
    suggestedAgentId: "sub-105",
    createdAt: minsAgo(95),
    read: false,
  },

  // Client Deepening
  {
    id: "demo-5",
    title: "Life event detected — new grandchild",
    body: "Arsenault, Amir mentioned a new grandchild in a recent email thread. Consider a 529 education planning conversation.",
    severity: "info",
    domain: "Client Deepening",
    agentSource: "Client Deepening Assistant",
    clientId: "5477575527",
    suggestedAgentId: "sub-604",
    createdAt: minsAgo(140),
    read: false,
  },
  {
    id: "demo-6",
    title: "ESG interest signal",
    body: "Several HNW clients opened ESG fund commentary emails this week, including Alvarez, Annalise. Consider proactive outreach on sustainable options.",
    severity: "info",
    domain: "Client Deepening",
    agentSource: "Market Intelligence",
    clientId: "9034465995",
    suggestedAgentId: "sub-601",
    createdAt: minsAgo(60),
    read: false,
  },

  // Planning
  {
    id: "demo-7",
    title: "RMD deadline approaching",
    body: "Barber, Titus turns 73 this year and has not yet taken a Required Minimum Distribution. Deadline is December 31.",
    severity: "high",
    domain: "Planning",
    agentSource: "Wealth Planning Assistant",
    clientId: "8831428926",
    suggestedAgentId: "sub-404",
    createdAt: minsAgo(20),
    read: false,
  },
  {
    id: "demo-8",
    title: "Retirement readiness check is overdue",
    body: "Ashby, Maddie's last retirement projection was run over 18 months ago — market moves since then may have shifted her readiness score.",
    severity: "low",
    domain: "Planning",
    agentSource: "Wealth Planning Assistant",
    clientId: "300187364",
    suggestedAgentId: "sub-401",
    createdAt: minsAgo(200),
    read: false,
  },

  // Investments
  {
    id: "demo-9",
    title: "Portfolio drift beyond tolerance",
    body: "Aponte, Anya's equity allocation has drifted to 72% vs. a 60% target following the recent tech rally.",
    severity: "high",
    domain: "Investments",
    agentSource: "Investment Assistant",
    clientId: "9234993455",
    suggestedAgentId: "sub-301",
    createdAt: minsAgo(28),
    read: false,
  },
  {
    id: "demo-10",
    title: "Sector concentration flag",
    body: "Alfonso, Lily holds 34% of portfolio value in a single technology name — well above typical single-stock guidelines.",
    severity: "info",
    domain: "Investments",
    agentSource: "Investment Assistant",
    clientId: "1902207886",
    suggestedAgentId: "sub-302",
    createdAt: minsAgo(75),
    read: false,
  },

  // Supervisory
  {
    id: "demo-11",
    title: "Wire transfer intent detected",
    body: "Email from Andersen, Emilie mentions an upcoming wire of $250K. Review before close of business.",
    severity: "high",
    domain: "Supervisory",
    agentSource: "Email Assistant",
    clientId: "1138659790",
    suggestedAgentId: "sub-701",
    createdAt: minsAgo(9),
    read: false,
  },
  {
    id: "demo-12",
    title: "Suitability flag — concentration increase",
    body: "A recent trade increased Andrus, Jaylin's single-position concentration above policy limits. Review recommended before the next statement cycle.",
    severity: "high",
    domain: "Supervisory",
    agentSource: "Supervisory Review",
    clientId: "5097213397",
    suggestedAgentId: "sub-701",
    createdAt: minsAgo(150),
    read: false,
  },

  // My Practice
  {
    id: "demo-13",
    title: "Revenue pacing ahead of plan",
    body: "Fee-based revenue is pacing 6% ahead of your annual plan through this quarter, driven by AUM growth and new account openings.",
    severity: "low",
    domain: "My Practice",
    agentSource: "Practice Analytics",
    clientId: null,
    suggestedAgentId: "sub-901",
    createdAt: minsAgo(300),
    read: false,
  },
  {
    id: "demo-14",
    title: "Client retention dipped slightly",
    body: "12-month retention is 94.2%, down 0.6pt from last quarter. Two relationships transitioned to another advisor within the firm.",
    severity: "info",
    domain: "My Practice",
    agentSource: "Practice Analytics",
    clientId: null,
    suggestedAgentId: "sub-902",
    createdAt: minsAgo(400),
    read: false,
  },
];

// GET /api/insights
router.get("/", (req, res) => {
  res.json(insights);
});

// GET /api/insights/count — lightweight badge endpoint
router.get("/count", (req, res) => {
  res.json({ total: insights.length, unread: insights.filter(i => !i.read).length });
});

// POST /api/insights — external assistants call this
router.post("/", (req, res) => {
  const {
    title, body, severity = "info", agentSource = "Unknown Source",
    domain = "Client Financials", clientId = null, suggestedAgentId = null,
  } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title and body are required" });

  const insight = {
    id: `insight-${Date.now()}`,
    title,
    body,
    severity,
    domain,
    agentSource,
    clientId,
    suggestedAgentId,
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
