// server/data/agentMeta.js
// Central agent/workflow/prompt registry.
// Modify this file to add new agents, sub-agents, and prompts.
// The frontend reads this via GET /api/agents

const AGENT_META = {
  root: [
    {
      id: "ag-01", name: "Portfolio Financials Intelligence", type: "agent",
      icon: "BarChart2", color: "blue",
      desc: "Realized gains, tax lots, holdings & activity",
      subs: "sub-ag-01", runnable: true, lastRun: "14 min ago", lastRunState: "done",
    },
    {
      id: "ag-02", name: "My Clients & Prospects", type: "agent",
      icon: "Users", color: "teal",
      desc: "Client search, AUM view, household overview & prospect pipeline",
      subs: "sub-ag-02", runnable: false,
    },
    {
      id: "ag-03", name: "Investment Agent", type: "agent",
      icon: "TrendingUp", color: "blue",
      desc: "Portfolio analysis, allocation modeling & rebalancing recommendations",
      subs: "sub-ag-03", runnable: false,
    },
    {
      id: "ag-04", name: "Wealth Planning Agent", type: "agent",
      icon: "Map", color: "purple",
      desc: "Retirement, estate, education & tax planning workflows",
      subs: "sub-ag-04", runnable: false,
    },
    {
      id: "ag-05", name: "Client Acquisition Agent", type: "agent",
      icon: "UserPlus", color: "teal",
      desc: "Prospect scoring, outreach drafts & referral opportunity surfacing",
      subs: "sub-ag-05", runnable: false,
    },
    {
      id: "ag-06", name: "Client Deepening Agent", type: "agent",
      icon: "Gift", color: "coral",
      desc: "Upsell opportunities, product recommendations & relationship insights",
      subs: "sub-ag-06", runnable: false,
    },
    {
      id: "ag-07", name: "Salesforce AgentForce", type: "agent",
      icon: "Cloud", color: "blue",
      desc: "CRM sync, activity logging, opportunity & pipeline tracking",
      subs: "sub-ag-07", runnable: false,
    },
    {
      id: "ag-08", name: "Market Data Intelligence", type: "agent",
      icon: "Activity", color: "amber",
      desc: "Live market data, economic indicators & personalized news digest",
      subs: "sub-ag-08", runnable: false,
    },
    {
      id: "ag-09", name: "My Practice", type: "agent",
      icon: "Briefcase", color: "purple",
      desc: "Book of business KPIs, revenue tracking & practice performance",
      subs: "sub-ag-09", runnable: false,
    },
  ],

  "sub-ag-01": [
    { id: "sub-101", name: "Tax Loss Harvesting", type: "workflow", icon: "TrendingUp", color: "teal", desc: "Identify unrealized losses across all client portfolios", subs: "prompts-101", runnable: true, lastRun: "running now", lastRunState: "running" },
    { id: "sub-102", name: "Gain/Loss Summary", type: "workflow", icon: "BarChart2", color: "coral", desc: "Realized gain/loss reporting by account and period", subs: null, runnable: true, lastRun: "yesterday", lastRunState: "done" },
    { id: "sub-103", name: "Holdings Audit", type: "workflow", icon: "FileText", color: "blue", desc: "Full holdings with cost basis and tax lot detail", subs: null, runnable: true },
  ],
  "prompts-101": [
    { id: "p1", type: "prompt", label: "Step 1", instruction: "Search for @client, using the @agent." },
    { id: "p2", type: "prompt", label: "Step 2", instruction: "Get the latest Realized Gain/Loss information from the CF Agent." },
    { id: "p3", type: "prompt", label: "Step 3", instruction: "Get the latest Holdings including tax lots information from the CF Agent." },
    { id: "p4", type: "prompt", label: "Step 4", instruction: "Send the output of steps 2 and 3 to the Investment Agent." },
    { id: "p5", type: "prompt", label: "Step 5", instruction: "Publish the results to my @activity." },
  ],

  "sub-ag-02": [
    { id: "sub-201", name: "Client Search & Lookup", type: "workflow", icon: "Search", color: "teal", desc: "Find any client, account or household across all data sources", subs: null, runnable: false },
    { id: "sub-202", name: "Book of Business Snapshot", type: "workflow", icon: "LayoutGrid", color: "blue", desc: "AUM by tier, idle cash, RMD alerts & concentration flags", subs: null, runnable: true },
    { id: "sub-203", name: "At-Risk Client Alerts", type: "workflow", icon: "Bell", color: "coral", desc: "Clients with large withdrawals, long contact gaps or life events", subs: null, runnable: true, lastRun: "1 hr ago", lastRunState: "done" },
    { id: "sub-204", name: "Prospect Pipeline", type: "workflow", icon: "UserPlus", color: "purple", desc: "New leads, follow-up reminders & conversion probability scoring", subs: null, runnable: false },
  ],

  "sub-ag-03": [
    { id: "sub-301", name: "Portfolio Rebalancing", type: "workflow", icon: "TrendingUp", color: "blue", desc: "Drift analysis and rebalancing trade recommendations", subs: null, runnable: true },
    { id: "sub-302", name: "Allocation Analysis", type: "workflow", icon: "BarChart2", color: "teal", desc: "Asset allocation vs. model comparison across all accounts", subs: null, runnable: true },
    { id: "sub-303", name: "Risk Assessment", type: "workflow", icon: "Activity", color: "coral", desc: "Portfolio risk scoring, volatility flags & stress testing", subs: null, runnable: false },
    { id: "sub-304", name: "ESG Screening", type: "workflow", icon: "Star", color: "teal", desc: "Screen holdings for ESG criteria and flag misalignments", subs: null, runnable: false },
  ],

  "sub-ag-04": [
    { id: "sub-401", name: "Retirement Projection", type: "workflow", icon: "Map", color: "purple", desc: "Monte Carlo retirement readiness modeling per client", subs: null, runnable: true },
    { id: "sub-402", name: "Estate Planning Review", type: "workflow", icon: "FileText", color: "blue", desc: "Beneficiary gaps, trust structures & estate tax exposure", subs: null, runnable: false },
    { id: "sub-403", name: "Education Funding", type: "workflow", icon: "Star", color: "amber", desc: "529 plan analysis and education savings gap identification", subs: null, runnable: false },
    { id: "sub-404", name: "Tax Optimization", type: "workflow", icon: "TrendingUp", color: "teal", desc: "Roth conversion, RMD planning & charitable giving strategies", subs: null, runnable: true },
  ],

  "sub-ag-05": [
    { id: "sub-501", name: "Prospect Scoring", type: "workflow", icon: "Star", color: "teal", desc: "Rank prospects by conversion likelihood using CRM & external data", subs: null, runnable: true },
    { id: "sub-502", name: "Outreach Drafts", type: "workflow", icon: "Send", color: "blue", desc: "AI-personalized emails and talking points per prospect", subs: null, runnable: true, lastRun: "2 hrs ago", lastRunState: "done" },
    { id: "sub-503", name: "Referral Opportunities", type: "workflow", icon: "Users", color: "coral", desc: "Identify clients most likely to refer and the right moment to ask", subs: null, runnable: false },
    { id: "sub-504", name: "Pipeline View", type: "workflow", icon: "LayoutGrid", color: "purple", desc: "Full funnel from new lead through to closed client", subs: null, runnable: false },
  ],

  "sub-ag-06": [
    { id: "sub-601", name: "Upsell Opportunities", type: "workflow", icon: "Gift", color: "coral", desc: "Clients eligible for additional products or higher-tier services", subs: null, runnable: true },
    { id: "sub-602", name: "Product Recommendations", type: "workflow", icon: "Star", color: "amber", desc: "Match client profiles to appropriate financial products", subs: null, runnable: false },
    { id: "sub-603", name: "Relationship Insights", type: "workflow", icon: "Users", color: "teal", desc: "Engagement scores, satisfaction signals & churn risk flags", subs: null, runnable: true },
    { id: "sub-604", name: "Life Event Triggers", type: "workflow", icon: "Bell", color: "purple", desc: "Surface clients with recent births, marriages, retirements or deaths", subs: null, runnable: true, lastRun: "this morning", lastRunState: "done" },
  ],

  "sub-ag-07": [
    { id: "sub-701", name: "CRM Sync", type: "workflow", icon: "Cloud", color: "blue", desc: "Bi-directional sync of client records with Salesforce", subs: null, runnable: true },
    { id: "sub-702", name: "Activity Logging", type: "workflow", icon: "Clock", color: "teal", desc: "Auto-log calls, emails and meetings to Salesforce records", subs: null, runnable: false },
    { id: "sub-703", name: "Opportunity Tracking", type: "workflow", icon: "TrendingUp", color: "amber", desc: "Pipeline opportunities and stage progression in Salesforce", subs: null, runnable: false },
    { id: "sub-704", name: "AgentForce Tasks", type: "workflow", icon: "Zap", color: "coral", desc: "Trigger and monitor Salesforce AgentForce automation flows", subs: null, runnable: true },
  ],

  "sub-ag-08": [
    { id: "sub-801", name: "Market Summary", type: "workflow", icon: "Activity", color: "amber", desc: "Daily market snapshot — indices, rates & sector moves", subs: null, runnable: true, lastRun: "this morning", lastRunState: "done" },
    { id: "sub-802", name: "Client News Digest", type: "workflow", icon: "FileText", color: "blue", desc: "News personalized to each client's holdings and sectors", subs: null, runnable: true },
    { id: "sub-803", name: "Economic Indicators", type: "workflow", icon: "BarChart2", color: "teal", desc: "CPI, Fed rate, GDP and leading indicators dashboard", subs: null, runnable: false },
    { id: "sub-804", name: "Earnings Alerts", type: "workflow", icon: "Bell", color: "coral", desc: "Upcoming earnings for securities held across client accounts", subs: null, runnable: true },
  ],

  "sub-ag-09": [
    { id: "sub-901", name: "Revenue Dashboard", type: "workflow", icon: "BarChart2", color: "purple", desc: "Fee income, AUM trends and revenue by client tier", subs: null, runnable: true },
    { id: "sub-902", name: "Practice KPIs", type: "workflow", icon: "Activity", color: "blue", desc: "Client count, retention rate, NPS and growth metrics", subs: null, runnable: true, lastRun: "Monday", lastRunState: "done" },
    { id: "sub-903", name: "Compliance Checklist", type: "workflow", icon: "FileText", color: "teal", desc: "Suitability reviews, disclosure status & audit trail", subs: null, runnable: false },
    { id: "sub-904", name: "Team Performance", type: "workflow", icon: "Users", color: "amber", desc: "Staff activity, client coverage and workload distribution", subs: null, runnable: false },
  ],
};

module.exports = AGENT_META;
