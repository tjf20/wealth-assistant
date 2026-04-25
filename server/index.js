// server/index.js
// Wealth Assistant — Express API Server

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const agentRoutes = require("./routes/agents");
const activityRoutes = require("./routes/activity");
const clientRoutes = require("./routes/clients");
const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP handled by Azure in prod
app.use(cors({ origin: isProd ? false : "http://localhost:5173" }));
app.use(morgan(isProd ? "combined" : "dev"));
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/agents", agentRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/chat", chatRoutes);

// Health check (useful for Azure App Service)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date().toISOString() });
});

// ── Serve React in production ─────────────────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, "../client/dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`\n🚀 Wealth Assistant server running on http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV}`);
  if (!isProd) console.log(`   React dev server: http://localhost:5173\n`);
});
