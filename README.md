# Wealth Assistant

AI-powered agentic dashboard for Financial Advisors.
Built with Node.js / Express (API) + React / Vite (frontend).

---

## Quick Start

### 1. Clone & install

```bash
# Install root dependencies (Express, concurrently, nodemon)
npm install

# Install React client dependencies (Vite, lucide-react, React)
npm --prefix client install
```

### 2. Configure environment

```bash
cp .env.example .env
# Open .env and add your ANTHROPIC_API_KEY
```

### 3. Run in development

```bash
npm run dev
```

This starts two processes concurrently:
- **Express API** on http://localhost:3001
- **React dev server** on http://localhost:5173 (proxies /api/* to Express)

Open http://localhost:5173 in your browser.

---

## Project Structure

```
wealth-assistant/
├── server/
│   ├── index.js              # Express entry point
│   ├── data/
│   │   └── agentMeta.js      # Agent/workflow/prompt registry (edit to add agents)
│   └── routes/
│       ├── agents.js         # GET /api/agents, POST /api/agents/:id/run
│       ├── activity.js       # Job tracking (running, done, queued)
│       ├── clients.js        # Client data (stub — wire to your CRM/custodian)
│       └── chat.js           # Anthropic Claude API proxy
│
├── client/
│   ├── index.html
│   ├── vite.config.js        # Dev proxy: /api → localhost:3001
│   └── src/
│       ├── main.jsx          # React entry
│       ├── App.jsx           # Loads agent data from API, renders WealthAssistant
│       ├── api.js            # All fetch calls in one place
│       ├── hooks/
│       │   ├── useActivity.js  # Polls /api/activity every 10s
│       │   └── useChat.js      # Chat message history + Anthropic API calls
│       └── components/
│           └── WealthAssistant.jsx  # Main dashboard component
│
├── .env.example
├── .gitignore
└── package.json
```

---

## Adding a New Agent

1. Open `server/data/agentMeta.js`
2. Add an entry to `root` (or a sub-level key):

```js
{
  id: "ag-10",
  name: "Compliance Agent",
  type: "agent",
  icon: "Shield",        // any Lucide icon name
  color: "amber",        // blue | teal | amber | purple | coral
  desc: "Suitability checks and regulatory compliance workflows",
  subs: "sub-ag-10",     // key for sub-agents, or null
  runnable: false,
}
```

3. Add sub-agents under the matching key:

```js
"sub-ag-10": [
  { id: "sub-1001", name: "Suitability Review", type: "workflow", ... },
]
```

No frontend changes needed — the React app reads from the API.

---

## Wiring a Real Agent Run

In `server/routes/agents.js`, find the `POST /:id/run` handler and replace the stub with your real execution logic:

```js
router.post("/:id/run", async (req, res) => {
  // Call your data services, Anthropic API, Salesforce AgentForce, etc.
});
```

---

## Production Build (Azure)

```bash
# Build the React app
npm run build

# Start in production mode (Express serves the built React app)
NODE_ENV=production npm start
```

For Azure App Service, set `NODE_ENV=production` and `ANTHROPIC_API_KEY` in Application Settings.
The app listens on `process.env.PORT` which Azure sets automatically.

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Server   | Node.js, Express 4                 |
| Frontend | React 18, Vite 5                   |
| Icons    | lucide-react                       |
| Fonts    | Syne (headings), DM Sans (body)    |
| AI       | Anthropic Claude API (claude-sonnet-4-20250514) |
| Deploy   | Azure App Service                  |
