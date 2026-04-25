// server/routes/clients.js
// Stub client data — replace with calls to your actual custodian / CRM APIs

const express = require("express");
const router = express.Router();

const CLIENTS = [
  { id: "c-001", name: "Anderson, Robert",  initials: "RA", aum: 2_450_000, tier: "HNW",    lastContact: "2025-04-10", risk: "Moderate",      status: "active"   },
  { id: "c-002", name: "Chen, Linda",        initials: "LC", aum: 890_000,   tier: "Mass",   lastContact: "2025-03-28", risk: "Conservative",  status: "active"   },
  { id: "c-003", name: "Williams, Sara",     initials: "SW", aum: 3_100_000, tier: "HNW",    lastContact: "2025-04-18", risk: "Aggressive",    status: "active"   },
  { id: "c-004", name: "Patel, Amit",        initials: "AP", aum: 560_000,   tier: "Mass",   lastContact: "2025-02-14", risk: "Moderate",      status: "at-risk"  },
  { id: "c-005", name: "Smith, Jennifer",    initials: "JS", aum: 0,         tier: "Prospect",lastContact: "2025-04-20", risk: null,            status: "prospect" },
  { id: "c-006", name: "Thompson, David",    initials: "DT", aum: 7_200_000, tier: "UHNW",   lastContact: "2025-04-22", risk: "Moderate",      status: "active"   },
];

// GET /api/clients
// Optional query: ?search=anderson&tier=HNW&status=active
router.get("/", (req, res) => {
  const { search, tier, status } = req.query;
  let results = [...CLIENTS];
  if (search) results = results.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  if (tier)   results = results.filter(c => c.tier === tier);
  if (status) results = results.filter(c => c.status === status);
  res.json(results);
});

// GET /api/clients/:id
router.get("/:id", (req, res) => {
  const client = CLIENTS.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json(client);
});

module.exports = router;
