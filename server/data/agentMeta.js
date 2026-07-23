// server/data/agentMeta.js
// Central agent/workflow/prompt registry.
// scope: "book" | "individual" | "both"
//   "book"       — runs across the entire book of business only
//   "individual" — runs against a single selected client/account
//   "both"       — can run either way (FA chooses at run time)
// domain: which of the 7 Insights categories this root agent belongs to —
//   Client Financials, Prospecting, Client Deepening, Planning, Investments,
//   Supervisory, My Practice. Lets Command Center filter by the same
//   categories Insights groups by. Workflows (sub-ag-* items) inherit their
//   parent root agent's domain client-side via the `subs` key match.

const AGENT_META = {
  root: [
    {
      id: "ag-01", name: "Portfolio Financials Intelligence", type: "agent",
      icon: "BarChart2", color: "blue", scope: "both", domain: "Client Financials",
      desc: "Realized gains, tax lots, holdings & activity",
      subs: "sub-ag-01", runnable: true, lastRun: "14 min ago", lastRunState: "done",
    },
    {
      id: "ag-02", name: "My Clients & Prospects", type: "agent",
      icon: "Users", color: "teal", scope: "book", domain: "My Practice",
      desc: "Client search, AUM view, household overview & prospect pipeline",
      subs: "sub-ag-02", runnable: false,
    },
    {
      id: "ag-03", name: "Investment Assistant", type: "agent",
      icon: "TrendingUp", color: "blue", scope: "both", domain: "Investments",
      desc: "Portfolio analysis, allocation modeling & rebalancing recommendations",
      subs: "sub-ag-03", runnable: false,
    },
    {
      id: "ag-04", name: "Wealth Planning Assistant", type: "agent",
      icon: "Map", color: "purple", scope: "individual", domain: "Planning",
      desc: "Retirement, estate, education & tax planning workflows",
      subs: "sub-ag-04", runnable: false,
    },
    {
      id: "ag-05", name: "Client Acquisition Assistant", type: "agent",
      icon: "UserPlus", color: "teal", scope: "book", domain: "Prospecting",
      desc: "Prospect scoring, outreach drafts & referral opportunity surfacing",
      subs: "sub-ag-05", runnable: false,
    },
    {
      id: "ag-06", name: "Client Deepening Assistant", type: "agent",
      icon: "Gift", color: "coral", scope: "both", domain: "Client Deepening",
      desc: "Opportunities, product recommendations & relationship insights",
      subs: "sub-ag-06", runnable: false,
    },
    {
      id: "ag-07", name: "Salesforce AgentForce", type: "agent",
      icon: "Cloud", color: "blue", scope: "both", domain: "My Practice",
      desc: "CRM, notes, activity logging, opportunity & pipeline tracking",
      subs: "sub-ag-07", runnable: false,
    },
    {
      id: "ag-08", name: "Market Data Intelligence", type: "agent",
      icon: "Activity", color: "amber", scope: "book", domain: "My Practice",
      desc: "Live market data, economic indicators & personalized news digest",
      subs: "sub-ag-08", runnable: false,
    },
    {
      id: "ag-09", name: "My Practice", type: "agent",
      icon: "Briefcase", color: "purple", scope: "book", domain: "My Practice",
      desc: "Book of business KPIs, revenue tracking & practice performance",
      subs: "sub-ag-09", runnable: false,
    },
  ],

  "sub-ag-01": [
    { id: "sub-101", name: "Tax Loss Harvesting",   type: "workflow", icon: "TrendingUp", color: "teal",  scope: "both",       desc: "Identify unrealized losses across client portfolios", subs: "prompts-101", runnable: true,  lastRun: "running now", lastRunState: "running" },
    { id: "sub-102", name: "Gain/Loss Summary",     type: "workflow", icon: "BarChart2",  color: "coral", scope: "both",       desc: "Realized gain/loss reporting by account and period",  subs: null,           runnable: true,  lastRun: "yesterday",   lastRunState: "done"    },
    { id: "sub-103", name: "Holdings Audit",        type: "workflow", icon: "FileText",   color: "blue",  scope: "both",       desc: "Full holdings with cost basis and tax lot detail",    subs: null,           runnable: true                                                  },
    { id: "sub-104", name: "Morning Briefing",      type: "workflow", icon: "Sun",        color: "amber", scope: "book",       desc: "Daily book health snapshot with market alerts at open",subs: null,           runnable: true,  lastRun: "today 7:00 AM", lastRunState: "done", scheduledFrequency: "daily" },
    { id: "sub-105", name: "Client Outreach Draft", type: "workflow", icon: "Mail",       color: "teal",  scope: "individual", desc: "Personalized outreach emails based on portfolio events and contact gaps", subs: null, runnable: true, lastRun: "2 hrs ago", lastRunState: "done" },
    { id: "sub-106", name: "Annual Review Prep",    type: "workflow", icon: "ClipboardList", color: "purple", scope: "individual", desc: "Assembles review packages: performance, goals, discussion topics", subs: null, runnable: true },
  ],

  "prompts-101": [
    { id: "p1", type: "prompt", label: "Step 1", instruction: "Search for @client, using the @assistant." },
    { id: "p2", type: "prompt", label: "Step 2", instruction: "Get the latest Realized Gain/Loss information from the CF Assistant." },
    { id: "p3", type: "prompt", label: "Step 3", instruction: "Get the latest Holdings including tax lots information from the CF Assistant." },
    { id: "p4", type: "prompt", label: "Step 4", instruction: "Send the output of steps 2 and 3 to the Investment Assistant." },
    { id: "p5", type: "prompt", label: "Step 5", instruction: "Publish the results to my @activity." },
  ],

  "sub-ag-02": [
    { id: "sub-201", name: "Client Search & Lookup",      type: "workflow", icon: "Search",     color: "teal",   scope: "book",       desc: "Find any client, account or household across all data sources", subs: null, runnable: false },
    { id: "sub-202", name: "Book of Business Snapshot",   type: "workflow", icon: "LayoutGrid", color: "blue",   scope: "book",       desc: "AUM by tier, idle cash, RMD alerts & concentration flags",    subs: null, runnable: true  },
    { id: "sub-203", name: "At-Risk Client Alerts",       type: "workflow", icon: "Bell",       color: "coral",  scope: "book",       desc: "Clients with large withdrawals, long contact gaps or life events", subs: null, runnable: true, lastRun: "1 hr ago", lastRunState: "done" },
    { id: "sub-204", name: "Prospect Pipeline",           type: "workflow", icon: "UserPlus",   color: "purple", scope: "book",       desc: "New leads, follow-up reminders & conversion probability scoring", subs: null, runnable: false },
  ],

  "sub-ag-03": [
    { id: "sub-301", name: "Portfolio Rebalancing", type: "workflow", icon: "TrendingUp", color: "blue",  scope: "both", desc: "Drift analysis and rebalancing trade recommendations", subs: null, runnable: true  },
    { id: "sub-302", name: "Allocation Analysis",   type: "workflow", icon: "BarChart2",  color: "teal",  scope: "both", desc: "Asset allocation vs. model comparison across all accounts", subs: null, runnable: true  },
    { id: "sub-303", name: "Risk Assessment",       type: "workflow", icon: "Activity",   color: "coral", scope: "both", desc: "Portfolio risk scoring, volatility flags & stress testing",  subs: null, runnable: false },
    { id: "sub-304", name: "ESG Screening",         type: "workflow", icon: "Star",       color: "teal",  scope: "both", desc: "Screen holdings for ESG criteria and flag misalignments",    subs: null, runnable: false },
  ],

  "sub-ag-04": [
    { id: "sub-401", name: "Retirement Projection", type: "workflow", icon: "Map",      color: "purple", scope: "individual", desc: "Monte Carlo retirement readiness modeling per client",      subs: null, runnable: true  },
    { id: "sub-402", name: "Estate Planning Review",type: "workflow", icon: "FileText", color: "blue",   scope: "individual", desc: "Beneficiary gaps, trust structures & estate tax exposure",  subs: null, runnable: false },
    { id: "sub-403", name: "Education Funding",     type: "workflow", icon: "Star",     color: "amber",  scope: "individual", desc: "529 plan analysis and education savings gap identification", subs: null, runnable: false },
    { id: "sub-404", name: "Tax Optimization",      type: "workflow", icon: "TrendingUp",color: "teal",  scope: "individual", desc: "Roth conversion, RMD planning & charitable giving strategies", subs: null, runnable: true },
  ],

  "sub-ag-05": [
    { id: "sub-501", name: "Prospect Scoring",       type: "workflow", icon: "Star",      color: "teal",   scope: "book",       desc: "Rank prospects by conversion likelihood",               subs: null, runnable: true  },
    { id: "sub-502", name: "Outreach Drafts",        type: "workflow", icon: "Send",      color: "blue",   scope: "individual", desc: "AI-personalized emails and talking points per prospect",subs: null, runnable: true, lastRun: "2 hrs ago", lastRunState: "done" },
    { id: "sub-503", name: "Referral Opportunities", type: "workflow", icon: "Users",     color: "coral",  scope: "book",       desc: "Identify clients most likely to refer",                 subs: null, runnable: false },
    { id: "sub-504", name: "Pipeline View",          type: "workflow", icon: "LayoutGrid",color: "purple", scope: "book",       desc: "Full funnel from new lead through to closed client",    subs: null, runnable: false },
  ],

  "sub-ag-06": [
    { id: "sub-601", name: "Upsell Opportunities",   type: "workflow", icon: "Gift",    color: "coral",  scope: "both",       desc: "Clients eligible for additional products or higher-tier services", subs: null, runnable: true  },
    { id: "sub-602", name: "Product Recommendations",type: "workflow", icon: "Star",    color: "amber",  scope: "individual", desc: "Match client profiles to appropriate financial products",          subs: null, runnable: false },
    { id: "sub-603", name: "Relationship Insights",  type: "workflow", icon: "Users",   color: "teal",   scope: "both",       desc: "Engagement scores, satisfaction signals & churn risk flags",      subs: null, runnable: true  },
    { id: "sub-604", name: "Life Event Triggers",    type: "workflow", icon: "Bell",    color: "purple", scope: "book",       desc: "Surface clients with recent births, marriages, retirements",      subs: null, runnable: true, lastRun: "this morning", lastRunState: "done" },
  ],

  "sub-ag-07": [
    { id: "sub-701", name: "CRM Sync",          type: "workflow", icon: "Cloud",      color: "blue",  scope: "both", desc: "Bi-directional sync of client records with Salesforce",       subs: null, runnable: true  },
    { id: "sub-702", name: "Activity Logging",  type: "workflow", icon: "Clock",      color: "teal",  scope: "both", desc: "Auto-log calls, emails and meetings to Salesforce records",    subs: null, runnable: false },
    { id: "sub-703", name: "Opportunity Tracking",type:"workflow", icon: "TrendingUp",color: "amber", scope: "both", desc: "Pipeline opportunities and stage progression in Salesforce",   subs: null, runnable: false },
    { id: "sub-704", name: "AgentForce Tasks",  type: "workflow", icon: "Zap",        color: "coral", scope: "both", desc: "Trigger and monitor Salesforce AgentForce automation flows",   subs: null, runnable: true  },
  ],

  "sub-ag-08": [
    { id: "sub-801", name: "Market Summary",       type: "workflow", icon: "Activity", color: "amber", scope: "book", desc: "Daily market snapshot — indices, rates & sector moves",               subs: null, runnable: true, lastRun: "this morning", lastRunState: "done" },
    { id: "sub-802", name: "Client News Digest",   type: "workflow", icon: "FileText", color: "blue",  scope: "both", desc: "News personalized to each client's holdings and sectors",             subs: null, runnable: true  },
    { id: "sub-803", name: "Economic Indicators",  type: "workflow", icon: "BarChart2",color: "teal",  scope: "book", desc: "CPI, Fed rate, GDP and leading indicators dashboard",                 subs: null, runnable: false },
    { id: "sub-804", name: "Earnings Alerts",      type: "workflow", icon: "Bell",     color: "coral", scope: "book", desc: "Upcoming earnings for securities held across client accounts",         subs: null, runnable: true  },
  ],

  "sub-ag-09": [
    { id: "sub-901", name: "Revenue Dashboard",   type: "workflow", icon: "BarChart2", color: "purple", scope: "book", desc: "Fee income, AUM trends and revenue by client tier",                subs: null, runnable: true  },
    { id: "sub-902", name: "Practice KPIs",       type: "workflow", icon: "Activity",  color: "blue",   scope: "book", desc: "Client count, retention rate, NPS and growth metrics",             subs: null, runnable: true, lastRun: "Monday", lastRunState: "done" },
    { id: "sub-903", name: "Compliance Checklist",type: "workflow", icon: "FileText",  color: "teal",   scope: "book", desc: "Suitability reviews, disclosure status & audit trail",             subs: null, runnable: false },
    { id: "sub-904", name: "Team Performance",    type: "workflow", icon: "Users",     color: "amber",  scope: "book", desc: "Staff activity, client coverage and workload distribution",        subs: null, runnable: false },
  ],
};

module.exports = AGENT_META;
