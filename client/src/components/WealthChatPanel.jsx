// client/src/components/WealthChatPanel.jsx
// Faithful React port of the WMA chat UI.
// Panels: Chat | Prompt Library | Agents | Memory | Attachments | Settings
// @mention chips in contentEditable input, agent progress cards, memory extraction.

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../theme.js";
import clientsData from "../data/clients.json";

const CLIENTS_DATA = Array.isArray(clientsData) ? clientsData : [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtAUM(accounts) {
  const t = (Array.isArray(accounts) ? accounts : []).reduce((s, a) => s + (a.netValue || 0), 0);
  return t >= 1e9 ? `$${(t/1e9).toFixed(2)}B` : t >= 1e6 ? `$${(t/1e6).toFixed(1)}M` : `$${(t/1e3).toFixed(0)}K`;
}
function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function fmtTime(d = new Date()) { return new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }

function md2html(md) {
  if (!md) return "";
  let h = esc(md);
  h = h.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) => `<pre><code>${c.trim()}</code></pre>`);
  h = h.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  h = h.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  h = h.replace(/^## (.+)$/gm,  "<h3>$1</h3>");
  h = h.replace(/^# (.+)$/gm,   "<h3>$1</h3>");
  // Tables
  const lines = h.split("\n"); let inT = false, tHtml = "", out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/^\|.+\|$/.test(ln.trim())) {
      if (!inT) { inT = true; tHtml = "<table>"; }
      const cells = ln.trim().replace(/^\||\\|$/g,"").split("|").map(c=>c.trim());
      if (/^[\s\-:|]+$/.test(cells.join(""))) {
        tHtml = tHtml.replace("<table>","<table><thead>").replace(/<tr>([^<]*)$/, "<tr>$1").replace(/<\/tr>(\n?)$/,"</tr></thead><tbody>");
      } else tHtml += "<tr>"+cells.map(c=>`<td>${c}</td>`).join("")+"</tr>";
    } else { if (inT) { tHtml += "</tbody></table>"; out.push(tHtml); inT=false; tHtml=""; } out.push(ln); }
  }
  if (inT) { tHtml += "</tbody></table>"; out.push(tHtml); }
  h = out.join("\n");
  h = h.replace(/<thead>([\s\S]*?)<\/thead>/g, (_,m) => "<thead>"+m.replace(/<td>/g,"<th>").replace(/<\/td>/g,"</th>")+"</thead>");
  h = h.replace(/^\* (.+)$/gm,"<li>$1</li>").replace(/^- (.+)$/gm,"<li>$1</li>").replace(/^\d+\. (.+)$/gm,"<li>$1</li>");
  h = h.replace(/(<li>.*<\/li>\n?)+/gs, m => "<ul>"+m+"</ul>");
  h = h.split(/\n\n+/).map(p => { p=p.trim(); if(!p)return""; if(/^<(h[123]|ul|ol|pre|table)/.test(p))return p; return "<p>"+p.replace(/\n/g,"<br>")+"</p>"; }).join("");
  return h;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const MENTION_CLIENTS = CLIENTS_DATA.slice(0, 100).map(c => ({
  id: c.clientId, name: c.name, type: "client",
  sub: `${c.type} · ${Array.isArray(c.accounts)?c.accounts.length:0} accts · ${fmtAUM(c.accounts)}`,
}));

const MENTION_ACCOUNTS = CLIENTS_DATA.slice(0, 20).flatMap(c =>
  (c.accounts||[]).slice(0,2).map(a => ({
    id: a.accountNumber, name: a.acctType+" "+a.accountNumber.slice(-4),
    type: "account", sub: `${c.name} · ${a.acctType}`,
  }))
).slice(0, 30);

const AGENTS_DEF = {
  tlh: {
    name:"Tax-Loss Harvesting", sub:"Identify harvest opportunities",
    desc:"Analyzes unrealized losses, flags wash-sale risks, and suggests replacement securities to maintain market exposure while realizing tax benefits.",
    steps:["Loading portfolio positions…","Scanning for unrealized losses…","Checking wash-sale rule (30-day window)…","Identifying replacement securities…","Calculating estimated tax savings…","Compiling recommendations…"],
    prompt: c => `You are a tax optimization specialist. Analyze the portfolio for tax-loss harvesting.\n\nClient: ${c?.name||"Current client"}${c?.aum?" | AUM: "+c.aum:""}\n\n1. **Executive summary** (2-3 sentences)\n2. **Positions to harvest** — table: Symbol | Cost Basis | Current Value | Unrealized Loss | Suggested Replacement\n3. **Estimated tax savings** (assume 23.8% combined rate)\n4. **Wash-sale warnings** for positions sold in last 30 days\n5. **Implementation priority** (High/Medium/Low)\n\nIf no portfolio data is provided, use illustrative example positions.`,
    resultTitle: "Tax-Loss Harvesting Analysis",
  },
  risk: {
    name:"Risk Profiler", sub:"Score portfolio risk dimensions",
    desc:"Scores the portfolio across concentration, duration, volatility, liquidity, and suitability — comparing to the client's stated risk tolerance.",
    steps:["Retrieving client risk profile…","Analyzing concentration exposure…","Calculating duration and rate sensitivity…","Measuring volatility vs benchmark…","Checking liquidity profile…","Scoring against tolerance…"],
    prompt: c => `You are a portfolio risk analyst. Risk assessment for ${c?.name||"this client"}.\n\nScore each 1–10 (10=highest risk):\n1. **Risk scorecard**: Dimension | Score | Key Finding (for: Concentration, Duration, Volatility, Liquidity, Suitability)\n2. **Overall risk score** with summary\n3. **Top 3 risk reduction recommendations**\n4. **Monitoring triggers**`,
    resultTitle: "Risk Profile Assessment",
  },
  rebal: {
    name:"Rebalancer", sub:"Drift analysis and trade list",
    desc:"Calculates allocation drift from targets and generates a tax-efficient rebalancing trade list, prioritizing tax-advantaged accounts.",
    steps:["Loading target allocation…","Calculating current weights…","Measuring drift by asset class…","Identifying accounts for trades…","Optimizing for tax efficiency…","Generating trade list…"],
    prompt: c => `You are a portfolio rebalancer. Rebalancing analysis for ${c?.name||"this client"}.\n\n1. **Allocation drift table**: Asset Class | Target % | Current % | Drift | Action\n2. **Prioritized trade list**: Account | Security | Action | Rationale\n3. **Tax efficiency notes**\n4. **Estimated turnover %**\nFlag only drifts >5% as actionable`,
    resultTitle: "Rebalancing Analysis",
  },
  comply: {
    name:"Compliance Review", sub:"Flag issues by severity",
    desc:"Reviews portfolio and activity for concentration limits, suitability, documentation gaps — flagged HIGH/MEDIUM/LOW.",
    steps:["Checking concentration limits…","Reviewing suitability vs profile…","Scanning for documentation gaps…","Checking trading patterns…","Cross-referencing compliance rules…","Generating issue report…"],
    prompt: c => `You are a compliance officer. Review ${c?.name||"this client"}'s portfolio.\n\nTable: Severity | Category | Finding | Required Action | Deadline\n\nCheck: position concentration (>10% single, >25% sector), suitability, documentation, unusual patterns, leverage.\nSeverity: HIGH=regulatory risk, MEDIUM=policy risk, LOW=best practice gap`,
    resultTitle: "Compliance Review",
  },
  report: {
    name:"Report Generator", sub:"Client-ready quarterly report",
    desc:"Generates a professional quarterly portfolio review for direct client delivery.",
    steps:["Gathering performance data…","Analyzing asset allocation…","Drafting market commentary…","Writing performance narrative…","Adding disclosures…","Finalizing report…"],
    prompt: c => `You are a financial report writer. Quarterly portfolio review for ${c?.name||"this client"}.\n\n1. **Executive Summary** (3-4 sentences)\n2. **Portfolio Performance** vs benchmark (YTD, QTD, 1yr)\n3. **Asset Allocation** — current vs target table\n4. **Notable Changes** this quarter\n5. **Market Commentary** (2 paragraphs)\n6. **Outlook & Next Steps** (3 bullets)\n7. **Disclosures** (placeholder)\n\nTone: professional, clear, client-appropriate.`,
    resultTitle: "Quarterly Client Report",
  },
};

const BUILTIN_PROMPTS = [
  { cat:"Portfolio Analysis", title:"Portfolio summary",        prompt:"Provide a concise summary of the current portfolio: asset allocation, top holdings, concentration risks, and YTD performance." },
  { cat:"Portfolio Analysis", title:"Benchmark comparison",     prompt:"Compare portfolio performance to the appropriate benchmark. Identify alpha/beta, tracking error, and areas of over/underperformance." },
  { cat:"Portfolio Analysis", title:"Sector concentration",     prompt:"Identify sector concentrations above 25% of portfolio value and explain the risk implications for this client." },
  { cat:"Tax Strategy",       title:"Year-end tax planning",    prompt:"What year-end tax strategies should we consider? Include tax-loss harvesting, Roth conversions, charitable giving, and RMD planning." },
  { cat:"Tax Strategy",       title:"Capital gains optimization",prompt:"Analyze short-term vs long-term capital gains and suggest ways to optimize the tax impact of any planned liquidations." },
  { cat:"Communication",      title:"Market volatility email",  prompt:"Draft a professional, reassuring client email addressing recent market volatility. Explain our positioning and long-term perspective." },
  { cat:"Communication",      title:"Quarterly review prep",    prompt:"Prepare talking points for this client's quarterly review: performance highlights, strategic changes, and 3 key engagement questions." },
  { cat:"Planning",           title:"Retirement income analysis",prompt:"Analyze whether this portfolio can sustainably support the client's retirement income needs using a 4% baseline withdrawal rate." },
  { cat:"Planning",           title:"Estate planning flags",    prompt:"Flag estate planning considerations: beneficiary updates, titling issues, charitable strategies, or trust opportunities." },
  { cat:"Compliance",         title:"Suitability review",       prompt:"Review the portfolio for suitability given the client's stated risk tolerance, time horizon, and investment objectives." },
];

// ── SVG Icons (matching WMA rail) ─────────────────────────────────────────────
const ICO = {
  logo:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  chat:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  lib:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  agents:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>,
  mem:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  attach:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  settings:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  send:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  file:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  run:     <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  check:   <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  tlh:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  sync:    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clear:   <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  finder:  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function WealthChatPanel({
  advisorName, navView, agentData,
  workstationClient, onClearWorkstation,
  collapsed, onToggleCollapse,
}) {
  const C = useTheme();
  const isDark = C.bg === "#0a0b0d";

  // Panel state
  const [panel,       setPanel]      = useState("chat");
  const [trayOpen,    setTrayOpen]   = useState(false);
  const [libTab,      setLibTab]     = useState("builtin");
  const [libSearch,   setLibSearch]  = useState("");
  const [customPrompts, setCustomPrompts] = useState(() => { try { return JSON.parse(localStorage.getItem("wa_custom")||"[]"); } catch { return []; } });
  const [memFacts,    setMemFacts]   = useState(() => { try { return JSON.parse(localStorage.getItem("wa_memory")||"[]"); } catch { return []; } });
  const [settings,    setSettings]   = useState(() => { try { return { model:"claude-sonnet-4-20250514", memory:true, autoextract:true, clientctx:true, systemPrompt:"You are a knowledgeable, precise wealth management assistant for financial advisors. Provide specific, actionable insights. Be concise and professional.", ...JSON.parse(localStorage.getItem("wa_settings")||"{}") }; } catch { return { model:"claude-sonnet-4-20250514", memory:true, autoextract:true, clientctx:true, systemPrompt:"You are a knowledgeable, precise wealth management assistant for financial advisors." }; } });

  // Chat state
  const [msgs,        setMsgs]       = useState([{ role:"ai", html:`<p>Hello. I'm your Wealth Assistant — ready to help with portfolio analysis, client communication, compliance, and planning.</p><p>Select a client from the Finder, or start asking. Type <strong>@</strong> to mention clients, accounts, or agents.</p>`, ts: fmtTime() }]);
  const [loading,     setLoading]    = useState(false);
  const [history,     setHistory]    = useState([]);
  const [mentionData, setMentionData]= useState(null); // { query, items }
  const [pendingFiles,setPendingFiles]= useState([]);
  const [progCard,    setProgCard]   = useState(null); // { title, steps, currentStep }

  const inputRef   = useRef(null);
  const msgsEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading, progCard]);

  // Save settings/memory
  function saveSetting(key, val) {
    const next = { ...settings, [key]:val };
    setSettings(next);
    localStorage.setItem("wa_settings", JSON.stringify(next));
  }
  function saveMemFacts(facts) { setMemFacts(facts); localStorage.setItem("wa_memory", JSON.stringify(facts)); }
  function saveCustomPrompts(prompts) { setCustomPrompts(prompts); localStorage.setItem("wa_custom", JSON.stringify(prompts)); }

  // ── Input handling ───────────────────────────────────────────────────────────
  function extractInputContent() {
    const ce = inputRef.current;
    if (!ce) return { text:"", displayHtml:"", tokens:[] };
    let text = "", displayHtml = "";
    const tokens = [];
    ce.childNodes.forEach(n => {
      if (n.nodeType === 3) { text += n.textContent; displayHtml += esc(n.textContent); }
      else if (n.nodeType === 1 && n.classList.contains("m-token")) {
        const type = n.dataset.type, name = n.dataset.name;
        tokens.push({ type, name, id: n.dataset.id });
        text += "@" + name;
        displayHtml += `<span class="wma-mention-chip" data-type="${type}">@${esc(name)}</span>`;
      } else { text += n.textContent; displayHtml += esc(n.textContent); }
    });
    return { text: text.trim(), displayHtml: displayHtml.trim(), tokens };
  }

  function handleCEInput(e) {
    const ce = e.target;
    const sel = window.getSelection();
    if (!sel.rangeCount) { setMentionData(null); return; }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== 3) { setMentionData(null); return; }
    const before = node.textContent.slice(0, range.startOffset);
    const atIdx = before.lastIndexOf("@");
    if (atIdx === -1 || (/\s/.test(before.slice(atIdx + 1)) && before.slice(atIdx + 1).length > 0)) {
      setMentionData(null); return;
    }
    const q = before.slice(atIdx + 1).toLowerCase();
    const clients = MENTION_CLIENTS.filter(c => c.name.toLowerCase().includes(q)).slice(0, 4);
    const accounts = MENTION_ACCOUNTS.filter(a => a.name.toLowerCase().includes(q)).slice(0, 2);
    const agents = Object.entries(AGENTS_DEF).filter(([k,a]) => a.name.toLowerCase().includes(q)).map(([k,a]) => ({ type:"agent", id:k, name:a.name, sub:a.sub })).slice(0, 3);
    const items = [...clients, ...accounts, ...agents];
    setMentionData(items.length ? { query:q, items, atIdx, textNode:node } : null);
  }

  function insertMentionToken(item) {
    const { atIdx, textNode } = mentionData || {};
    if (!textNode) { setMentionData(null); return; }
    const sel = window.getSelection();
    const offset = sel.rangeCount ? sel.getRangeAt(0).startOffset : textNode.textContent.length;
    textNode.textContent = textNode.textContent.slice(0, atIdx) + textNode.textContent.slice(offset);
    const chip = document.createElement("span");
    chip.className = "m-token";
    chip.dataset.type = item.type; chip.dataset.id = item.id||""; chip.dataset.name = item.name;
    chip.contentEditable = "false"; chip.textContent = "@" + item.name;
    const ce = inputRef.current;
    const next = textNode.nextSibling;
    ce.insertBefore(chip, next || null);
    const sp = document.createTextNode("\u00A0"); ce.insertBefore(sp, chip.nextSibling || null);
    const r = document.createRange(); r.setStart(sp, 1); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
    setMentionData(null);
  }

  function handleCEKeydown(e) {
    if (mentionData) {
      if (e.key === "Escape") { e.preventDefault(); setMentionData(null); return; }
      if (e.key === "Enter" || e.key === "Tab") {
        if (mentionData.items.length) { e.preventDefault(); insertMentionToken(mentionData.items[0]); return; }
      }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // ── API call ─────────────────────────────────────────────────────────────────
  async function apiChat(messages, system, maxTokens = 2048) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, systemContext: system, advisorName, model: settings.model }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.reply === "string") return data.reply;
    if (data.content) return data.content.map(b => b.text||"").join(""); // fallback to raw Anthropic format
    throw new Error(data.error || "Unknown error");
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  async function sendMessage() {
    const ce = inputRef.current;
    const { text, displayHtml, tokens } = extractInputContent();
    if (!text && !pendingFiles.length) return;

    // Build display HTML (with mention chips shown nicely)
    const displayFull = displayHtml || text;
    addMsg("user", displayFull, true);
    if (ce) ce.innerHTML = "";

    // Build system prompt
    const sysParts = [settings.systemPrompt];
    if (settings.clientctx && workstationClient) sysParts.push(`\nClient: ${workstationClient.name} | AUM: ${fmtAUM(workstationClient.accounts)} | Type: ${workstationClient.type}`);
    if (memFacts.length) sysParts.push("\nClient facts:\n" + memFacts.map(f => `- ${f.key}: ${f.value}`).join("\n"));
    const system = sysParts.join("\n");

    // Build conversation entry
    let finalText = text;
    tokens.forEach(t => { if (t.type === "client") finalText += `\n[Referenced client: ${t.name}]`; });
    const newHistory = [...history, { role:"user", content: finalText }];
    setHistory(newHistory); setLoading(true);

    const saved = [...pendingFiles]; setPendingFiles([]);

    try {
      const reply = await apiChat(newHistory.slice(-30), system);
      addMsg("ai", md2html(reply));
      const updatedHistory = [...newHistory, { role:"assistant", content:reply }];
      setHistory(updatedHistory);
      if (settings.memory) localStorage.setItem("wa_history", JSON.stringify(updatedHistory.slice(-60)));
      if (settings.autoextract && updatedHistory.length % 8 === 0) autoExtractMemory(updatedHistory, true);
    } catch (err) {
      addMsg("ai", `<p><strong>Error:</strong> ${esc(err.message)}. Check that your server is running and ANTHROPIC_API_KEY is set in .env</p>`);
    } finally { setLoading(false); }
  }

  function addMsg(role, html, rawDisplay = false) {
    setMsgs(prev => [...prev, { role, html, ts: fmtTime() }]);
  }

  // ── Run agent ────────────────────────────────────────────────────────────────
  async function runAgent(key) {
    const agent = AGENTS_DEF[key]; if (!agent) return;
    setPanel("chat");
    const clientCtx = workstationClient ? { name: workstationClient.name, aum: fmtAUM(workstationClient.accounts) } : null;
    const steps = agent.steps;
    const prog = { title: agent.name, steps, currentStep: 0, key };
    setProgCard(prog);
    const timer = setInterval(() => { setProgCard(p => p && p.currentStep < steps.length - 1 ? { ...p, currentStep: p.currentStep + 1 } : p); }, 600);
    try {
      const reply = await apiChat([{ role:"user", content: agent.prompt(clientCtx) }], settings.systemPrompt);
      clearInterval(timer);
      setProgCard(null);
      setMsgs(prev => [...prev, { role:"agent", html: md2html(reply), title: agent.resultTitle, agentKey: key, ts: fmtTime() }]);
      const newH = [...history, { role:"user", content:`[${agent.name} run]` }, { role:"assistant", content:reply }];
      setHistory(newH);
    } catch (err) {
      clearInterval(timer);
      setProgCard(null);
      addMsg("ai", `<p><strong>Agent error:</strong> ${esc(err.message)}</p>`);
    }
  }

  // ── Memory extraction ────────────────────────────────────────────────────────
  async function autoExtractMemory(hist, silent = false) {
    if (!hist.length) return;
    const recent = hist.slice(-16).map(m => `${m.role}: ${typeof m.content==="string"?m.content:"[complex]"}`).join("\n");
    const p = `Extract key facts about the client from this conversation. Return ONLY a JSON array: [{"type":"Goals|Risk|Tax|Family|Preferences","key":"fact name","value":"fact value"}]. Max 8 items. No markdown fences.\n\n${recent}`;
    try {
      const raw = await apiChat([{ role:"user", content:p }], "You extract structured facts from conversations.", 512);
      const cleaned = raw.replace(/```json|```/g,"").trim();
      const facts = JSON.parse(cleaned);
      const merged = [...memFacts];
      facts.forEach(f => { if (!merged.find(m => m.key === f.key)) merged.push(f); });
      saveMemFacts(merged);
      if (!silent) addMsg("ai", `<p>Extracted ${facts.length} memory fact(s) from conversation.</p>`);
    } catch { if (!silent) addMsg("ai", "<p>Memory extraction failed.</p>"); }
  }

  // ── Use prompt — deferred fill because inputRef is null when panel !== "chat" ──
  const pendingPromptRef = useRef(null);

  function usePrompt(text) {
    pendingPromptRef.current = text;
    setPanel("chat"); // triggers re-render → chat panel mounts → useEffect below fires
  }

  // After panel switches to "chat", the contentEditable is now in the DOM → fill it
  useEffect(() => {
    if (panel !== "chat") return;
    const text = pendingPromptRef.current;
    if (!text) return;
    pendingPromptRef.current = null;
    // Small timeout to ensure the DOM has updated
    setTimeout(() => {
      const ce = inputRef.current;
      if (!ce) return;
      ce.textContent = text;
      ce.focus();
      try {
        const r = document.createRange();
        r.selectNodeContents(ce); r.collapse(false);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(r);
      } catch {}
    }, 50);
  }, [panel]);

  // ── CSS: WMA design adapted for light/dark ────────────────────────────────────
  const css = `
    .wma-wrap{display:flex;height:100%;overflow:hidden;font-family:'Inter',system-ui,sans-serif;font-size:13px;line-height:1.5;color:${isDark?"#eceef5":"#1a1f2e"};background:${isDark?"#0f1014":"#f8f9fb"}}
    .wma-rail{width:46px;min-width:46px;background:${isDark?"#0f1014":"#fff"};border-right:1px solid ${isDark?"#1e2029":"#e2e5ec"};display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px;z-index:20}
    .wma-logo{width:28px;height:28px;border-radius:7px;background:#2563eb;display:flex;align-items:center;justify-content:center;margin-bottom:8px;flex-shrink:0}
    .wma-rbtn{width:32px;height:32px;border-radius:5px;background:none;border:none;color:${isDark?"#8a8fa8":"#9ca3af"};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s;position:relative}
    .wma-rbtn:hover{background:${isDark?"#181a22":"#f1f3f7"};color:${isDark?"#dde0f0":"#4b5568"}}
    .wma-rbtn.active{background:${isDark?"#152640":"#eff4ff"};color:#2563eb}
    .wma-rbtn .tip{position:absolute;left:calc(100% + 8px);top:50%;transform:translateY(-50%);background:${isDark?"#eceef5":"#1a1f2e"};color:${isDark?"#13151e":"#fff"};font-size:11px;white-space:nowrap;padding:4px 8px;border-radius:4px;pointer-events:none;opacity:0;transition:opacity .12s;z-index:100}
    .wma-rbtn:hover .tip{opacity:1}
    .wma-spacer{flex:1}
    .wma-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .wma-cbar{height:42px;min-height:42px;background:${isDark?"#0f1014":"#fff"};border-bottom:1px solid ${isDark?"#1e2029":"#e2e5ec"};display:flex;align-items:center;padding:0 12px;gap:8px}
    .wma-cav{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#fff;flex-shrink:0}
    .wma-cname{font-weight:500;font-size:12px;color:${isDark?"#eceef5":"#1a1f2e"}}
    .wma-caum{font-size:11px;color:${isDark?"#c9a227":"#92691a"};font-family:'JetBrains Mono',monospace;font-weight:500}
    .wma-pill{font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid;cursor:pointer;background:none;transition:all .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:3px}
    .wma-pill-sync{border-color:#86efac;color:#16a34a;background:${isDark?"rgba(22,163,74,.1)":"#f0fdf4"}}
    .wma-pill-finder{border-color:${isDark?"#2a2d3a":"#c8cdd8"};color:${isDark?"#8a8fa8":"#9ca3af"}}
    .wma-pill-finder:hover{border-color:#2563eb;color:#2563eb;background:${isDark?"#152640":"#eff4ff"}}
    .wma-pill-clear{border-color:${isDark?"#2a2d3a":"#c8cdd8"};color:${isDark?"#8a8fa8":"#9ca3af"}}
    .wma-pill-clear:hover{border-color:#dc2626;color:#dc2626;background:${isDark?"rgba(220,38,38,.1)":"#fef2f2"}}
    .wma-mtag{font-size:9px;font-family:'JetBrains Mono',monospace;color:${isDark?"#8a8fa8":"#9ca3af"};border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};border-radius:3px;padding:1px 5px}
    .wma-msgs{flex:1;overflow-y:auto;padding:12px 12px 6px;display:flex;flex-direction:column;gap:8px;background:${isDark?"#0a0b0d":"#f8f9fb"};scroll-behavior:smooth}
    .wma-msgs::-webkit-scrollbar{width:4px}
    .wma-msgs::-webkit-scrollbar-thumb{background:${isDark?"#2a2d3a":"#e8eaf0"};border-radius:2px}
    .wma-msg{display:flex;gap:8px;animation:wmaFU .18s ease}
    @keyframes wmaFU{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .wma-msg.user{flex-direction:row-reverse}
    .wma-mav{width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;margin-top:2px}
    .wma-mav.ai{background:#2563eb;color:#fff}
    .wma-mav.user{background:${isDark?"#2a2d3a":"#e8eaf0"};color:${isDark?"#dde0f0":"#4b5568"}}
    .wma-mbody{max-width:84%}
    .wma-bbl{padding:8px 11px;border-radius:10px;font-size:12.5px;line-height:1.55;word-break:break-word}
    .wma-msg.ai .wma-bbl{background:${isDark?"#13151e":"#fff"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-radius:3px 10px 10px 10px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
    .wma-msg.user .wma-bbl{background:#2563eb;color:#fff;border-radius:10px 3px 10px 10px}
    .wma-mmeta{font-size:10px;color:${isDark?"#5a5d6a":"#c4cad6"};margin-top:3px;padding:0 3px}
    .wma-msg.user .wma-mmeta{text-align:right}
    .wma-bbl code{font-family:'JetBrains Mono',monospace;font-size:11px;background:${isDark?"#181a22":"#f1f3f7"};padding:1px 4px;border-radius:3px;color:${isDark?"#7db8ff":"#1d4ed8"}}
    .wma-bbl pre{background:${isDark?"#181a22":"#f1f3f7"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-radius:6px;padding:10px;margin:8px 0;overflow-x:auto}
    .wma-bbl pre code{background:none;padding:0;font-size:11px;color:${isDark?"#eceef5":"#1a1f2e"}}
    .wma-bbl strong{font-weight:600;color:${isDark?"#eceef5":"#1a1f2e"}}
    .wma-bbl em{font-style:italic}
    .wma-bbl ul,.wma-bbl ol{padding-left:16px;margin:4px 0}
    .wma-bbl li{margin:2px 0;color:${isDark?"#b0b8d0":"#4b5568"}}
    .wma-bbl p{margin:3px 0;color:${isDark?"#b0b8d0":"#4b5568"}}
    .wma-bbl h3{font-size:12px;font-weight:600;margin:8px 0 4px;color:${isDark?"#eceef5":"#1a1f2e"}}
    .wma-bbl table{width:100%;border-collapse:collapse;font-size:11px;margin:8px 0}
    .wma-bbl th{background:${isDark?"#181a22":"#f1f3f7"};padding:5px 8px;text-align:left;border-bottom:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};font-weight:600;font-size:10.5px;color:${isDark?"#8a8fa8":"#4b5568"}}
    .wma-bbl td{padding:4px 8px;border-bottom:1px solid ${isDark?"#1e2029":"#e2e5ec"};color:${isDark?"#b0b8d0":"#4b5568"}}
    .wma-sys{display:flex;align-items:center;gap:8px;padding:4px 0}
    .wma-sys span{font-size:10.5px;color:${isDark?"#5a5d6a":"#9ca3af"};white-space:nowrap}
    .wma-sys hr{flex:1;border:none;border-top:1px solid ${isDark?"#1e2029":"#e2e5ec"}}
    .wma-mention-chip,.m-token{display:inline-flex;align-items:center;gap:3px;background:${isDark?"#152640":"#eff4ff"};color:${isDark?"#7db8ff":"#1d4ed8"};border-radius:4px;padding:0 5px;font-weight:500;font-size:12px}
    .m-token[data-type=agent]{background:${isDark?"#221800":"#fef3c7"};color:${isDark?"#e09040":"#92400e"};border:1px solid ${isDark?"#5a3a10":"#fde68a"}}
    .m-token[data-type=client]{background:${isDark?"#0a2820":"#f0fdfa"};color:${isDark?"#2dbe8a":"#0f766e"};border:1px solid ${isDark?"#1a6a50":"#99f6e4"}}
    .m-token[data-type=account]{background:${isDark?"#180f30":"#f5f3ff"};color:${isDark?"#a882ff":"#6d28d9"};border:1px solid ${isDark?"#4a3080":"#ddd6fe"}}
    .wma-msg.user .wma-mention-chip{background:rgba(255,255,255,.2);color:#fff}
    .wma-tdot{width:5px;height:5px;border-radius:50%;background:${isDark?"#8a8fa8":"#9ca3af"};display:inline-block;margin:0 1.5px;animation:wmaTB 1s infinite}
    .wma-tdot:nth-child(2){animation-delay:.15s}
    .wma-tdot:nth-child(3){animation-delay:.3s}
    @keyframes wmaTB{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
    .wma-acard{background:${isDark?"#13151e":"#fff"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-left:3px solid #2563eb;border-radius:8px;overflow:hidden;margin:2px 0}
    .wma-achdr{display:flex;align-items:center;gap:8px;padding:7px 11px;cursor:pointer;border-bottom:1px solid transparent;transition:background .15s}
    .wma-achdr:hover{background:${isDark?"#181a22":"#f1f3f7"}}
    .wma-atitle{font-weight:600;font-size:11.5px;flex:1;color:${isDark?"#eceef5":"#1a1f2e"}}
    .wma-abadge{font-size:9.5px;padding:2px 7px;border-radius:20px;background:${isDark?"#152640":"#eff4ff"};color:${isDark?"#7db8ff":"#1d4ed8"};font-weight:500}
    .wma-abody{padding:10px 11px;font-size:12px;display:block}
    .wma-aacts{display:flex;gap:5px;margin-top:10px;padding-top:8px;border-top:1px solid ${isDark?"#1e2029":"#e2e5ec"}}
    .wma-abtn{font-size:10.5px;padding:4px 10px;border-radius:5px;border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};background:${isDark?"#181a22":"#f1f3f7"};color:${isDark?"#b0b8d0":"#4b5568"};cursor:pointer;transition:all .15s}
    .wma-abtn:hover{background:${isDark?"#1e2029":"#e8eaf0"}}
    .wma-abtn.primary{border-color:${isDark?"#2a4a8a":"#bfdbfe"};color:${isDark?"#7db8ff":"#2563eb"};background:${isDark?"#152640":"#eff4ff"}}
    .wma-abtn.primary:hover{background:${isDark?"#1a3060":"#dbeafe"}}
    .wma-prog-step{display:flex;align-items:center;gap:7px;padding:3px 0}
    .wma-prog-step .ps-ic{width:14px;height:14px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px}
    .wma-prog-step.done .ps-ic{background:${isDark?"rgba(22,163,74,.15)":"#f0fdf4"};color:#16a34a}
    .wma-prog-step.active .ps-ic{background:${isDark?"#152640":"#eff4ff"}}
    .wma-prog-step.wait .ps-ic{background:${isDark?"#181a22":"#f1f3f7"}}
    .wma-prog-step .ps-txt{font-size:11.5px;color:${isDark?"#b0b8d0":"#4b5568"}}
    .wma-prog-step.done .ps-txt{color:${isDark?"#5a5d6a":"#9ca3af"}}
    .wma-prog-step.active .ps-txt{color:${isDark?"#eceef5":"#1a1f2e"};font-weight:500}
    .wma-prog-step.wait .ps-txt{color:${isDark?"#5a5d6a":"#c4cad6"}}
    .wma-spin{width:9px;height:9px;border:1.5px solid ${isDark?"#2a4a8a":"#bfdbfe"};border-top-color:#2563eb;border-radius:50%;animation:wmaSpin .7s linear infinite;flex-shrink:0}
    @keyframes wmaSpin{to{transform:rotate(360deg)}}
    .wma-tray{background:${isDark?"#0f1014":"#fff"};border-top:1px solid ${isDark?"#1e2029":"#e2e5ec"};overflow:hidden;transition:height .22s ease}
    .wma-tray.closed{height:28px}
    .wma-tray.open{height:100px}
    .wma-tray-hdr{display:flex;align-items:center;gap:5px;padding:5px 11px;cursor:pointer;height:28px}
    .wma-tray-lbl{font-size:10px;color:${isDark?"#8a8fa8":"#9ca3af"};font-weight:600;letter-spacing:.05em;text-transform:uppercase}
    .wma-tray-agents{display:flex;gap:6px;padding:2px 10px 8px;overflow-x:auto;scrollbar-width:none}
    .wma-tray-agents::-webkit-scrollbar{display:none}
    .wma-apill{display:flex;align-items:center;gap:6px;flex-shrink:0;background:${isDark?"#181a22":"#f1f3f7"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-radius:8px;padding:5px 10px;cursor:pointer;transition:all .15s}
    .wma-apill:hover{border-color:#2563eb;background:${isDark?"#152640":"#eff4ff"}}
    .wma-apill:hover .wma-aplbl{color:#2563eb}
    .wma-aplbl{font-size:11px;font-weight:500;color:${isDark?"#b0b8d0":"#4b5568"};white-space:nowrap}
    .wma-input-area{background:${isDark?"#0f1014":"#fff"};border-top:1px solid ${isDark?"#1e2029":"#e2e5ec"};padding:8px 10px;position:relative}
    .wma-mention-popup{position:absolute;bottom:calc(100% + 4px);left:0;right:0;background:${isDark?"#13151e":"#fff"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-radius:8px;overflow:hidden;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,.15);max-height:200px;overflow-y:auto}
    .wma-mp-sec{font-size:10px;color:${isDark?"#8a8fa8":"#9ca3af"};text-transform:uppercase;letter-spacing:.05em;padding:6px 10px 2px;font-weight:600;background:${isDark?"#181a22":"#f8f9fb"}}
    .wma-mp-item{display:flex;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;transition:background .12s;border-bottom:1px solid ${isDark?"#1e2029":"#f1f3f7"}}
    .wma-mp-item:hover{background:${isDark?"#181a22":"#f1f3f7"}}
    .wma-mp-icon{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${isDark?"#152640":"#eff4ff"};color:#2563eb}
    .wma-mp-name{font-size:12px;font-weight:500;color:${isDark?"#eceef5":"#1a1f2e"}}
    .wma-mp-sub{font-size:10.5px;color:${isDark?"#8a8fa8":"#9ca3af"}}
    .wma-input-row{display:flex;align-items:flex-end;gap:6px}
    .wma-ce{flex:1;background:${isDark?"#181a22":"#f1f3f7"};border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};border-radius:8px;color:${isDark?"#eceef5":"#1a1f2e"};font-family:'Inter',system-ui,sans-serif;font-size:12.5px;padding:8px 11px;outline:none;max-height:110px;min-height:36px;overflow-y:auto;line-height:1.5;transition:border-color .15s;word-break:break-word}
    .wma-ce:focus{border-color:#2563eb}
    .wma-ce:empty::before{content:attr(data-ph);color:${isDark?"#5a5d6a":"#c4cad6"};pointer-events:none}
    .wma-ibtn{width:32px;height:32px;border-radius:5px;border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};background:${isDark?"#181a22":"#f1f3f7"};color:${isDark?"#8a8fa8":"#9ca3af"};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
    .wma-ibtn:hover{background:${isDark?"#1e2029":"#e8eaf0"};color:${isDark?"#dde0f0":"#4b5568"}}
    .wma-send{background:#2563eb;border-color:#2563eb;color:#fff}
    .wma-send:hover{background:#1d4ed8}
    .wma-send:disabled{opacity:.4;cursor:default}
    .wma-panel{flex:1;overflow:hidden;position:relative;display:flex;flex-direction:column}
    .wma-phdr{padding:10px 12px 8px;border-bottom:1px solid ${isDark?"#1e2029":"#e2e5ec"};display:flex;align-items:center;gap:8px;flex-shrink:0;background:${isDark?"#0f1014":"#fff"}}
    .wma-phdr h2{font-size:12px;font-weight:600;color:${isDark?"#eceef5":"#1a1f2e"};flex:1}
    .wma-phdr button{font-size:11px;padding:3px 9px;border-radius:20px;border:1px solid ${isDark?"#2a4a8a":"#bfdbfe"};background:${isDark?"#152640":"#eff4ff"};color:#2563eb;cursor:pointer}
    .wma-wrap-scroll{padding:10px 12px;overflow-y:auto;flex:1;scrollbar-width:thin;scrollbar-color:${isDark?"#2a2d3a":"#e8eaf0"} transparent}
    .wma-lib-tabs{display:flex;border-bottom:1px solid ${isDark?"#1e2029":"#e2e5ec"};flex-shrink:0;background:${isDark?"#0f1014":"#fff"}}
    .wma-lib-tab{flex:1;padding:7px 0;font-size:11.5px;font-weight:500;text-align:center;background:none;border:none;border-bottom:2px solid transparent;color:${isDark?"#8a8fa8":"#9ca3af"};cursor:pointer;transition:color .15s;margin-bottom:-1px}
    .wma-lib-tab.active{color:#2563eb;border-bottom-color:#2563eb}
    .wma-lib-search{background:${isDark?"#181a22":"#f1f3f7"};border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};border-radius:8px;color:${isDark?"#eceef5":"#1a1f2e"};font-size:12px;padding:7px 10px;outline:none;width:100%;margin-bottom:10px}
    .wma-lib-search:focus{border-color:#2563eb}
    .wma-lib-search::placeholder{color:${isDark?"#5a5d6a":"#c4cad6"}}
    .wma-lib-cat{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:${isDark?"#8a8fa8":"#9ca3af"};margin:10px 0 5px;font-weight:600}
    .wma-lib-card{background:${isDark?"#13151e":"#fff"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-radius:8px;padding:9px 11px;cursor:pointer;transition:all .15s;margin-bottom:5px;display:flex;align-items:flex-start;gap:8px}
    .wma-lib-card:hover{border-color:#2563eb;background:${isDark?"#152640":"#eff4ff"}}
    .wma-lc-title{font-weight:500;font-size:12px;color:${isDark?"#eceef5":"#1a1f2e"};margin-bottom:2px}
    .wma-lc-prev{font-size:11px;color:${isDark?"#8a8fa8":"#9ca3af"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .wma-afc{background:${isDark?"#13151e":"#fff"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-radius:8px;padding:11px;margin-bottom:8px}
    .wma-afc-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .wma-afc-ic{width:28px;height:28px;border-radius:5px;background:${isDark?"#152640":"#eff4ff"};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#2563eb}
    .wma-afc-title{font-weight:600;font-size:12px;color:${isDark?"#eceef5":"#1a1f2e"}}
    .wma-afc-sub{font-size:10.5px;color:${isDark?"#8a8fa8":"#9ca3af"}}
    .wma-afc-desc{font-size:11.5px;color:${isDark?"#b0b8d0":"#4b5568"};line-height:1.55;margin-bottom:8px}
    .wma-run-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:7px;border-radius:5px;background:#2563eb;border:none;color:#fff;font-weight:600;font-size:12px;cursor:pointer;transition:background .15s}
    .wma-run-btn:hover{background:#1d4ed8}
    .wma-run-btn:disabled{opacity:.45;cursor:default}
    .wma-mem-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:${isDark?"#8a8fa8":"#9ca3af"};margin:8px 0 4px;font-weight:600}
    .wma-mem-card{background:${isDark?"#13151e":"#fff"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-radius:8px;padding:8px 11px;margin-bottom:5px;display:flex;align-items:flex-start;gap:8px}
    .wma-mc-key{font-size:10.5px;color:${isDark?"#8a8fa8":"#9ca3af"}}
    .wma-mc-val{font-size:12px;color:${isDark?"#eceef5":"#1a1f2e"};font-weight:500;margin-top:1px}
    .wma-set-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:${isDark?"#8a8fa8":"#9ca3af"};margin:12px 0 5px;font-weight:600}
    .wma-set-lbl:first-child{margin-top:0}
    .wma-set-row{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:${isDark?"#13151e":"#fff"};border:1px solid ${isDark?"#1e2029":"#e2e5ec"};border-radius:8px;margin-bottom:4px}
    .wma-sr-lbl{font-size:12px;color:${isDark?"#b0b8d0":"#4b5568"}}
    .wma-sr-sub{font-size:10.5px;color:${isDark?"#8a8fa8":"#9ca3af"};margin-top:1px}
    .wma-toggle{width:32px;height:18px;border-radius:9px;background:${isDark?"#2a2d3a":"#e8eaf0"};border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};cursor:pointer;position:relative;transition:background .18s;flex-shrink:0}
    .wma-toggle.on{background:#2563eb;border-color:#2563eb}
    .wma-toggle::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:left .18s}
    .wma-toggle.on::after{left:16px}
    .wma-set-row select{background:${isDark?"#181a22":"#f1f3f7"};border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};border-radius:5px;color:${isDark?"#eceef5":"#1a1f2e"};font-size:12px;padding:3px 7px;outline:none}
    .wma-danger-btn{display:flex;align-items:center;justify-content:center;gap:5px;width:100%;padding:7px;border-radius:5px;border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};background:none;color:#dc2626;font-size:12px;margin-bottom:4px;cursor:pointer;transition:background .15s}
    .wma-danger-btn:hover{background:${isDark?"rgba(220,38,38,.1)":"#fef2f2"}}
    .wma-fpreview-bar{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}
    .wma-fp{display:flex;align-items:center;gap:4px;background:${isDark?"#181a22":"#f1f3f7"};border:1px solid ${isDark?"#2a2d3a":"#e2e5ec"};border-radius:5px;padding:3px 8px;font-size:11px;color:${isDark?"#b0b8d0":"#4b5568"}}
    .wma-note{font-size:11.5px;background:${isDark?"rgba(22,163,74,.1)":"#f0fdf4"};border:1px solid #86efac;border-radius:5px;padding:8px 10px;line-height:1.6;margin-bottom:8px;color:${isDark?"#2dbe8a":"#16a34a"}}
  `;

  // ── Collapsed state ───────────────────────────────────────────────────────────
  if (collapsed) return (
    <>
      <style>{css}</style>
      <div style={{ width:46, background: isDark?"#0f1014":"#fff", borderLeft:`1px solid ${isDark?"#1e2029":"#e2e5ec"}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:8, flexShrink:0, gap:2 }}>
        <button className="wma-rbtn active" onClick={onToggleCollapse} title="Open Chat">
          {ICO.chat}
        </button>
      </div>
    </>
  );

  const clientInfo = workstationClient;
  const cIni = clientInfo ? String(clientInfo.name||"").split(",")[0].trim().slice(0,2).toUpperCase() : "—";

  // Group library items by category
  const libSource = libTab === "builtin" ? BUILTIN_PROMPTS : customPrompts;
  const libFiltered = libSearch ? libSource.filter(p => p.title.toLowerCase().includes(libSearch.toLowerCase()) || p.cat.toLowerCase().includes(libSearch.toLowerCase()) || p.prompt.toLowerCase().includes(libSearch.toLowerCase())) : libSource;
  const byCat = {};
  libFiltered.forEach(p => { if (!byCat[p.cat]) byCat[p.cat] = []; byCat[p.cat].push(p); });

  const memByCat = {};
  memFacts.forEach(f => { if (!memByCat[f.type]) memByCat[f.type] = []; memByCat[f.type].push(f); });

  return (
    <>
      <style>{css}</style>
      <div className="wma-wrap" style={{ width:434, minWidth:434, flexShrink:0, borderLeft:`1px solid ${isDark?"#1e2029":"#e2e5ec"}` }}>

        {/* Rail */}
        <nav className="wma-rail">
          <div className="wma-logo">{ICO.logo}</div>
          {[
            { id:"chat",        label:"Chat",           icon:ICO.chat    },
            { id:"library",     label:"Prompt Library", icon:ICO.lib     },
            { id:"agents",      label:"Agents",         icon:ICO.agents  },
            { id:"memory",      label:"Memory",         icon:ICO.mem     },
            { id:"attachments", label:"Attachments",    icon:ICO.attach  },
          ].map(r => (
            <button key={r.id} className={`wma-rbtn ${panel===r.id?"active":""}`} onClick={()=>setPanel(r.id)}>
              {r.icon}<span className="tip">{r.label}</span>
            </button>
          ))}
          <div className="wma-spacer"/>
          {/* Collapse toggle — always visible in rail */}
          <button className="wma-rbtn" onClick={onToggleCollapse} title="Collapse chat panel"
            style={{marginBottom:2}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 19l-7-7 7-7"/><path d="M21 19l-7-7 7-7"/></svg>
            <span className="tip">Collapse Panel</span>
          </button>
          <button className={`wma-rbtn ${panel==="settings"?"active":""}`} onClick={()=>setPanel("settings")}>
            {ICO.settings}<span className="tip">Settings</span>
          </button>
        </nav>

        {/* Main */}
        <div className="wma-main">

          {/* Client bar */}
          <div className="wma-cbar">
            <div className="wma-cav">{cIni}</div>
            <span className="wma-cname">{clientInfo ? clientInfo.name : "No client selected"}</span>
            {clientInfo && <span className="wma-caum">{fmtAUM(clientInfo.accounts)}</span>}
            {clientInfo
              ? <button className="wma-pill wma-pill-sync">{ICO.sync}Synced</button>
              : <button className="wma-pill wma-pill-finder" onClick={()=>{}}>{ICO.finder}Finder Sync</button>
            }
            {clientInfo && <button className="wma-pill wma-pill-clear" onClick={onClearWorkstation}>{ICO.clear}Clear</button>}
            <span style={{flex:1}}/>
            <span className="wma-mtag">{settings.model.replace("claude-","").replace(/-\d{8}$/,"")}</span>
          </div>

          {/* ── CHAT PANEL ── */}
          {panel === "chat" && (
            <div className="wma-panel" style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
              {/* Messages */}
              <div className="wma-msgs" style={{flex:1}}>
                <div className="wma-sys"><hr/><span>Wealth Assistant · Session started</span><hr/></div>

                {msgs.map((m, i) => {
                  if (m.role === "sys") return (
                    <div key={i} className="wma-sys"><hr/><span>{m.text}</span><hr/></div>
                  );
                  if (m.role === "agent") return (
                    <div key={i} className="wma-msg ai" style={{animation:"wmaFU .18s ease"}}>
                      <div className="wma-mav ai" style={{background:"#2563eb"}}>{ICO.agents}</div>
                      <div className="wma-mbody" style={{maxWidth:"92%"}}>
                        <div className="wma-acard">
                          <div className="wma-achdr">
                            <span className="wma-atitle">{m.title}</span>
                            <span className="wma-abadge">Agent result</span>
                          </div>
                          <div className="wma-abody">
                            <div dangerouslySetInnerHTML={{__html: m.html}}/>
                            <div className="wma-aacts">
                              <button className="wma-abtn primary">Follow-up</button>
                              <button className="wma-abtn" onClick={()=>{ navigator.clipboard.writeText(m.html.replace(/<[^>]+>/g,"")); }}>Copy</button>
                              <button className="wma-abtn">Add to notes</button>
                            </div>
                          </div>
                        </div>
                        <div className="wma-mmeta">{m.ts}</div>
                      </div>
                    </div>
                  );
                  return (
                    <div key={i} className={`wma-msg ${m.role}`}>
                      <div className={`wma-mav ${m.role}`}>{m.role==="ai"?ICO.logo:"A"}</div>
                      <div className="wma-mbody">
                        <div className="wma-bbl" dangerouslySetInnerHTML={{__html: m.html}}/>
                        <div className="wma-mmeta">{m.ts}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Progress card */}
                {progCard && (
                  <div className="wma-msg ai">
                    <div className="wma-mav ai" style={{background:"#2563eb"}}>{ICO.agents}</div>
                    <div className="wma-mbody" style={{maxWidth:"92%"}}>
                      <div className="wma-acard" style={{borderLeftColor:"#d97706"}}>
                        <div className="wma-achdr" style={{cursor:"default"}}>
                          <div className="wma-spin"/>
                          <span className="wma-atitle">{progCard.title}</span>
                          <span className="wma-abadge" style={{background:isDark?"#221800":"#fffbeb",color:"#d97706"}}>Running…</span>
                        </div>
                        <div className="wma-abody">
                          {progCard.steps.map((s, i) => {
                            const st = i < progCard.currentStep ? "done" : i === progCard.currentStep ? "active" : "wait";
                            return (
                              <div key={i} className={`wma-prog-step ${st}`}>
                                <span className="ps-ic">
                                  {st==="done" ? ICO.check : st==="active" ? <div className="wma-spin"/> : <span style={{width:6,height:6,borderRadius:"50%",background:isDark?"#2a2d3a":"#e8eaf0",display:"inline-block"}}/>}
                                </span>
                                <span className="ps-txt">{s}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {loading && !progCard && (
                  <div className="wma-msg ai">
                    <div className="wma-mav ai">{ICO.logo}</div>
                    <div className="wma-mbody">
                      <div className="wma-bbl" style={{padding:"10px 14px"}}>
                        <span className="wma-tdot"/><span className="wma-tdot"/><span className="wma-tdot"/>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={msgsEndRef}/>
              </div>

              {/* Agent tray */}
              <div className={`wma-tray ${trayOpen?"open":"closed"}`}>
                <div className="wma-tray-hdr" onClick={()=>setTrayOpen(o=>!o)}>
                  {ICO.agents}
                  <span className="wma-tray-lbl">Quick Agents</span>
                  <span style={{marginLeft:"auto",fontSize:9,color:isDark?"#8a8fa8":"#9ca3af"}}>{trayOpen?"▼":"▲"}</span>
                </div>
                <div className="wma-tray-agents">
                  {Object.entries(AGENTS_DEF).map(([k,a]) => (
                    <div key={k} className="wma-apill" onClick={()=>runAgent(k)}>
                      <span style={{color:"#2563eb",display:"flex"}}>{ICO.tlh}</span>
                      <span className="wma-aplbl">{a.name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="wma-input-area">
                {/* Mention popup */}
                {mentionData && (
                  <div className="wma-mention-popup">
                    {[{label:"Clients",items:mentionData.items.filter(i=>i.type==="client")},{label:"Accounts",items:mentionData.items.filter(i=>i.type==="account")},{label:"Agents",items:mentionData.items.filter(i=>i.type==="agent")}].filter(s=>s.items.length>0).map(sec => (
                      <div key={sec.label}>
                        <div className="wma-mp-sec">{sec.label}</div>
                        {sec.items.map(item => (
                          <div key={item.id||item.name} className="wma-mp-item" onMouseDown={()=>insertMentionToken(item)}>
                            <div className="wma-mp-icon" style={item.type==="agent"?{background:isDark?"#221800":"#fef3c7",color:"#92400e"}:item.type==="account"?{background:isDark?"#180f30":"#f5f3ff",color:"#6d28d9"}:{}}>
                              {item.type==="client"?"👤":item.type==="account"?"💳":"🤖"}
                            </div>
                            <div>
                              <div className="wma-mp-name">@{item.name}</div>
                              <div className="wma-mp-sub">{item.sub||item.aum||""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* File previews */}
                {pendingFiles.length > 0 && (
                  <div className="wma-fpreview-bar">
                    {pendingFiles.map((f,i) => (
                      <div key={i} className="wma-fp">
                        {f.type?.includes("pdf")?"📕":f.type?.startsWith("image")?"🖼":"📄"} {f.name}
                        <button style={{background:"none",border:"none",color:isDark?"#8a8fa8":"#9ca3af",cursor:"pointer",fontSize:13,lineHeight:1,padding:"0 0 0 3px"}} onClick={()=>setPendingFiles(p=>p.filter((_,j)=>j!==i))}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="wma-input-row">
                  <label className="wma-ibtn" title="Attach file" style={{cursor:"pointer"}}>
                    {ICO.file}
                    <input type="file" multiple accept=".pdf,.csv,.xlsx,.txt,.json,.png,.jpg" style={{display:"none"}}
                      onChange={e=>{ Array.from(e.target.files||[]).forEach(f=>{ const reader = new FileReader(); reader.onload=()=>setPendingFiles(p=>[...p,{name:f.name,type:f.type,size:f.size,content:reader.result}]); reader.readAsText(f); }); e.target.value=""; }}/>
                  </label>
                  <div
                    ref={inputRef}
                    className="wma-ce"
                    contentEditable
                    suppressContentEditableWarning
                    data-ph="Ask anything… or type @ to mention clients, accounts, or agents"
                    onInput={handleCEInput}
                    onKeyDown={handleCEKeydown}
                    onPaste={e=>{ e.preventDefault(); document.execCommand("insertText",false,e.clipboardData.getData("text/plain")); }}
                  />
                  <button className="wma-ibtn wma-send" disabled={loading||!!progCard} onClick={sendMessage} title="Send (Enter)">
                    {ICO.send}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── LIBRARY ── */}
          {panel === "library" && (
            <div className="wma-panel">
              <div className="wma-phdr">
                {ICO.lib}<h2>Prompt Library</h2>
                <button onClick={()=>{ const t = prompt("Prompt title:"); const p = prompt("Prompt text:"); if(t&&p) { saveCustomPrompts([...customPrompts, {cat:"Custom",title:t,prompt:p}]); setLibTab("custom"); } }}>+ New</button>
              </div>
              <div className="wma-lib-tabs">
                <button className={`wma-lib-tab ${libTab==="builtin"?"active":""}`} onClick={()=>setLibTab("builtin")}>Built-in</button>
                <button className={`wma-lib-tab ${libTab==="custom"?"active":""}`} onClick={()=>setLibTab("custom")}>My Prompts</button>
              </div>
              <div className="wma-wrap-scroll">
                <input className="wma-lib-search" placeholder="Search prompts…" value={libSearch} onChange={e=>setLibSearch(e.target.value)}/>
                {!libFiltered.length
                  ? <div style={{color:isDark?"#8a8fa8":"#9ca3af",fontSize:12,textAlign:"center",padding:"24px 0"}}>{libTab==="custom"?"No custom prompts yet. Click + New.":"No prompts match."}</div>
                  : Object.entries(byCat).map(([cat,items]) => (
                      <div key={cat}>
                        <div className="wma-lib-cat">{cat}</div>
                        {items.map((p,i) => (
                          <div key={i} className="wma-lib-card" onClick={()=>usePrompt(p.prompt)}>
                            <div style={{flex:1,minWidth:0}}>
                              <div className="wma-lc-title">{p.title}</div>
                              <div className="wma-lc-prev">{p.prompt.slice(0,72)}…</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {/* ── AGENTS ── */}
          {panel === "agents" && (
            <div className="wma-panel">
              <div className="wma-phdr">{ICO.agents}<h2>Agents</h2></div>
              <div className="wma-wrap-scroll">
                {Object.entries(AGENTS_DEF).map(([k,a]) => (
                  <div key={k} className="wma-afc">
                    <div className="wma-afc-head">
                      <div className="wma-afc-ic">{ICO.tlh}</div>
                      <div><div className="wma-afc-title">{a.name}</div><div className="wma-afc-sub">{a.sub}</div></div>
                    </div>
                    <div className="wma-afc-desc">{a.desc}</div>
                    <button className="wma-run-btn" disabled={!!progCard||loading} onClick={()=>runAgent(k)}>
                      {ICO.run}Run Agent
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MEMORY ── */}
          {panel === "memory" && (
            <div className="wma-panel">
              <div className="wma-phdr">
                {ICO.mem}<h2>Memory</h2>
                <button onClick={()=>autoExtractMemory(history,false)}>Extract from chat</button>
              </div>
              <div className="wma-wrap-scroll">
                {!memFacts.length
                  ? <div style={{color:isDark?"#8a8fa8":"#9ca3af",fontSize:12,textAlign:"center",padding:"28px 0"}}>No memory facts yet.<br/>Chat with a client or use "Extract from chat".</div>
                  : Object.entries(memByCat).map(([type,facts]) => (
                      <div key={type}>
                        <div className="wma-mem-lbl">{type}</div>
                        {facts.map((f,i) => (
                          <div key={i} className="wma-mem-card">
                            <div style={{flex:1}}><div className="wma-mc-key">{f.key}</div><div className="wma-mc-val">{f.value}</div></div>
                            <button style={{background:"none",border:"none",color:isDark?"#8a8fa8":"#9ca3af",cursor:"pointer",fontSize:14}} onClick={()=>saveMemFacts(memFacts.filter(m=>m.key!==f.key))}>×</button>
                          </div>
                        ))}
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {/* ── ATTACHMENTS ── */}
          {panel === "attachments" && (
            <div className="wma-panel">
              <div className="wma-phdr">{ICO.attach}<h2>Attachments</h2></div>
              <div className="wma-wrap-scroll">
                <div style={{color:isDark?"#8a8fa8":"#9ca3af",fontSize:12,textAlign:"center",padding:"28px 0"}}>Drag & drop files into the chat, or use the 📎 button.</div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {panel === "settings" && (
            <div className="wma-panel">
              <div className="wma-phdr">{ICO.settings}<h2>Settings</h2></div>
              <div className="wma-wrap-scroll">
                <div className="wma-note">✓ <strong>Connected:</strong> API calls route through <code>/api/chat</code>. Your API key stays server-side.</div>
                <div className="wma-set-lbl">Model</div>
                <div className="wma-set-row">
                  <div><div className="wma-sr-lbl">Active model</div></div>
                  <select value={settings.model} onChange={e=>saveSetting("model",e.target.value)}>
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-opus-4-20250514">Claude Opus 4</option>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                  </select>
                </div>
                <div className="wma-set-lbl">Behavior</div>
                {[
                  { key:"memory",      label:"Persist memory",     sub:"Save summaries per client" },
                  { key:"autoextract", label:"Auto-extract facts",  sub:"Detect risk, goals automatically" },
                  { key:"clientctx",   label:"Inject client context",sub:"Include AUM, profile in prompts" },
                ].map(s => (
                  <div key={s.key} className="wma-set-row">
                    <div><div className="wma-sr-lbl">{s.label}</div><div className="wma-sr-sub">{s.sub}</div></div>
                    <button className={`wma-toggle ${settings[s.key]?"on":""}`} onClick={()=>saveSetting(s.key,!settings[s.key])}/>
                  </div>
                ))}
                <div className="wma-set-lbl">Data</div>
                <button className="wma-danger-btn" onClick={()=>{ if(confirm("Clear conversation history?")){ setHistory([]); setMsgs([{role:"ai",html:"<p>Conversation cleared.</p>",ts:fmtTime()}]); localStorage.removeItem("wa_history"); } }}>
                  🗑 Clear conversation history
                </button>
                <button className="wma-danger-btn" style={{color:isDark?"#8a8fa8":"#9ca3af"}} onClick={()=>{ if(confirm("Clear all memory?")){ saveMemFacts([]); } }}>
                  Clear all memory facts
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
