// server/routes/chat.js
// Proxies chat messages to Anthropic Claude API.
// Keeping the API key server-side — never expose it to the browser.

const express = require("express");
const router = express.Router();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";

// POST /api/chat
// Body: { messages: [{role, content}], systemContext?: string, advisorName?: string }
router.post("/", async (req, res) => {
  const { messages, systemContext, advisorName } = req.body;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured in .env" });
  }

  const systemPrompt = systemContext || buildDefaultSystem(advisorName || "the advisor");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages || [],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    res.json({ reply: text, usage: data.usage });

  } catch (err) {
    console.error("[CHAT ERROR]", err);
    res.status(500).json({ error: "Failed to reach Anthropic API", detail: err.message });
  }
});

function buildDefaultSystem(advisorName) {
  return `You are Wealth Assistant, an AI co-pilot for ${advisorName}, a financial advisor.
You have access to their book of business, client data, portfolio analytics, and market intelligence.
You help advisors save time, surface opportunities, and serve their clients better.
Be concise, professional, and always oriented toward actionable next steps.
When referencing clients, use their last name (e.g., "Anderson" not "Robert").
Never fabricate financial data — if you don't have real data, say so clearly.`;
}

module.exports = router;
