// client/src/components/WealthAssistant.jsx
import { useState, useRef, useCallback } from "react";
import {
  Users, BarChart2, TrendingUp, Map, UserPlus, Gift,
  Cloud, Activity, Briefcase, ChevronRight, Play, Pause,
  Bell, Settings, LayoutGrid, FileText, Clock, X,
  Send, Home, Zap, Search, Star,
} from "lucide-react";
import { api } from "../api.js";
import { useActivity } from "../hooks/useActivity.js";
import { useChat } from "../hooks/useChat.js";

// ── Icon registry ─────────────────────────────────────────────────────────────
const ICONS = { Users, BarChart2, TrendingUp, Map, UserPlus, Gift, Cloud, Activity, Briefcase, FileText, Clock, Send, Search, Star, LayoutGrid, Bell, Zap };
function getIcon(name) { return ICONS[name] || LayoutGrid; }

// ── Color palette ─────────────────────────────────────────────────────────────
const COLOR = {
  blue:   { bg: "#0e1e38", border: "#2a4a8a", text: "#7db8ff", dot: "#3a7de9" },
  teal:   { bg: "#0a2820", border: "#1a6a50", text: "#2dbe8a", dot: "#2dbe8a" },
  amber:  { bg: "#221800", border: "#5a3a10", text: "#e09040", dot: "#d08020" },
  purple: { bg: "#180f30", border: "#4a3080", text: "#a882ff", dot: "#7a5aed" },
  coral:  { bg: "#221008", border: "#6a3020", text: "#f07850", dot: "#e06030" },
};
const TYPE_COLOR = {
  agent:    { bg: "#152640", border: "#2a4a8a", text: "#7db8ff" },
  workflow: { bg: "#0a2820", border: "#1a6a50", text: "#2dbe8a" },
  prompt:   { bg: "#1e1240", border: "#4a3080", text: "#a882ff" },
  custom:   { bg: "#2a1e00", border: "#5a3a10", text: "#e09040" },
};

// ── @Mention variable registry ────────────────────────────────────────────────
// Each key maps to a variable type. Add new types here freely.
// The popup reads the @Token name to know which list to show.
const MENTION_REGISTRY = {
  Client: {
    label: "Select a Client",
    icon: Users,
    color: "#2dbe8a",
    items: [
      { id: "c-001", label: "Anderson, Robert",  sub: "HNW · $2.45M",  initials: "RA" },
      { id: "c-002", label: "Chen, Linda",        sub: "Mass · $890K",  initials: "LC" },
      { id: "c-003", label: "Williams, Sara",     sub: "HNW · $3.1M",  initials: "SW" },
      { id: "c-004", label: "Patel, Amit",        sub: "Mass · $560K",  initials: "AP" },
      { id: "c-006", label: "Thompson, David",    sub: "UHNW · $7.2M", initials: "DT" },
    ],
    searchAll: "Search all clients ↗",
  },
  Accounts: {
    label: "Select an Account",
    icon: BarChart2,
    color: "#7db8ff",
    items: [
      { id: "a-001", label: "Anderson IRA",    sub: "Rollover · $1.2M",  initials: "IR" },
      { id: "a-002", label: "Anderson Joint",  sub: "Taxable · $1.25M",  initials: "JT" },
      { id: "a-003", label: "Chen Roth IRA",   sub: "Roth · $340K",      initials: "RO" },
      { id: "a-004", label: "Williams Trust",  sub: "Trust · $3.1M",     initials: "TR" },
    ],
    searchAll: "Search all accounts ↗",
  },
  Agent: {
    label: "Select an Agent",
    icon: Zap,
    color: "#a882ff",
    items: [
      { id: "ag-01", label: "Portfolio Financials Intelligence", sub: "Agent", initials: "PF" },
      { id: "ag-02", label: "My Clients & Prospects",            sub: "Agent", initials: "CP" },
      { id: "ag-03", label: "Investment Agent",                  sub: "Agent", initials: "IA" },
      { id: "ag-05", label: "Client Acquisition Agent",          sub: "Agent", initials: "CA" },
      { id: "ag-08", label: "Market Data Intelligence",          sub: "Agent", initials: "MD" },
    ],
    searchAll: "Browse all agents ↗",
  },
  Results: {
    label: "Send Results to",
    icon: Send,
    color: "#e09040",
    items: [
      { id: "r-email",  label: "Email",           sub: "james.miller@firm.com", initials: "EM" },
      { id: "r-fav",    label: "My Favorites",    sub: "Saved reports",         initials: "★"  },
      { id: "r-report", label: "Reports Section", sub: "Dashboard > Reports",   initials: "RP" },
    ],
    searchAll: null,
  },
  Favorites: {
    label: "Select Favorites List",
    icon: Star,
    color: "#e09040",
    items: [
      { id: "f-001", label: "My Key Reports",  sub: "6 items", initials: "★" },
      { id: "f-002", label: "Weekly Workflow", sub: "3 items", initials: "★" },
    ],
    searchAll: null,
  },
  email: {
    label: "Select Email Recipient",
    icon: Send,
    color: "#7db8ff",
    items: [
      { id: "e-001", label: "james.miller@firm.com", sub: "Me",          initials: "JM" },
      { id: "e-002", label: "team@firm.com",          sub: "Team",       initials: "TM" },
      { id: "e-003", label: "compliance@firm.com",    sub: "Compliance", initials: "CO" },
    ],
    searchAll: null,
  },
  security: {
    label: "Select a Security",
    icon: TrendingUp,
    color: "#e09040",
    items: [
      { id: "s-001", label: "AAPL",  sub: "Apple Inc.",         initials: "AP" },
      { id: "s-002", label: "TSLA",  sub: "Tesla Inc.",         initials: "TS" },
      { id: "s-003", label: "NVDA",  sub: "NVIDIA Corp.",       initials: "NV" },
      { id: "s-004", label: "ARKK",  sub: "ARK Innovation ETF", initials: "AK" },
      { id: "s-005", label: "BOND",  sub: "PIMCO Active Bond",  initials: "BO" },
      { id: "s-006", label: "SPY",   sub: "S&P 500 ETF",        initials: "SP" },
    ],
    searchAll: "Search all securities u2197",
  },
};

// Resolve which mention type from a raw "@Token" string (case-insensitive fallback)
function resolveMentionType(token) {
  const key = token.replace(/^@/, "").trim();
  if (MENTION_REGISTRY[key]) return key;
  const lower = key.toLowerCase();
  return Object.keys(MENTION_REGISTRY).find(k => k.toLowerCase() === lower) || null;
}

// ── Filter bar config — no "Prompt", default "agent" ─────────────────────────
const FILTERS = [
  { key: "agent",    label: "Agents"    },
  { key: "workflow", label: "Workflows" },
  { key: "custom",   label: "Custom"    },
  { key: "all",      label: "All"       },
];

// ── Shared UI atoms ───────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const c = TYPE_COLOR[type] || TYPE_COLOR.agent;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {type}
    </span>
  );
}

function IconBox({ name, color }) {
  const Icon = getIcon(name);
  const c = COLOR[color] || COLOR.blue;
  return (
    <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={20} color={c.text} />
    </div>
  );
}

// ── @Mention Popup ────────────────────────────────────────────────────────────
function MentionPopup({ state, onSelect, onClose }) {
  if (!state.visible || !state.token) return null;
  const typeKey = resolveMentionType(state.token);
  const config  = typeKey ? MENTION_REGISTRY[typeKey] : null;
  const Icon    = config?.icon || Search;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 45 }} />
      <div style={{
        position: "fixed", left: state.x, top: state.y,
        background: "#13151e", border: "1px solid #2a3a60",
        borderRadius: 10, padding: 6, zIndex: 50,
        width: 250, boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
        animation: "fadeIn 0.12s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px 8px", borderBottom: "1px solid #1e2029", marginBottom: 4 }}>
          <Icon size={12} color={config?.color || "#7a7e94"} />
          <span style={{ fontSize: 11, fontWeight: 700, color: config?.color || "#7a7e94", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {config ? config.label : `Unknown: ${state.token}`}
          </span>
        </div>
        {/* Items */}
        {config ? config.items.map(item => (
          <div key={item.id} onClick={() => onSelect(state.token, item)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 6, cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1a2540"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a2a40", color: config.color, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${config.color}44` }}>
              {item.initials}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, color: "#dde0f0", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
              {item.sub && <div style={{ fontSize: 10, color: "#7a7e94", marginTop: 1 }}>{item.sub}</div>}
            </div>
          </div>
        )) : (
          <div style={{ padding: 8, fontSize: 12, color: "#7a7e94" }}>No options configured for {state.token}</div>
        )}
        {/* Search all */}
        {config?.searchAll && (
          <div onClick={onClose} style={{ fontSize: 12, color: "#7db8ff", padding: "8px 8px 4px", borderTop: "1px solid #1e2029", marginTop: 4, cursor: "pointer" }}>
            {config.searchAll}
          </div>
        )}
      </div>
    </>
  );
}

// ── Prompt Step ───────────────────────────────────────────────────────────────
// Splits on single-word @Tokens only (no spaces), tracks resolved state per token index.
function PromptStep({ item, onMentionClick }) {
  const [resolved, setResolved] = useState({});
  // Match @Word (single word, no spaces — avoids grabbing extra text)
  const parts = item.instruction.split(/(@\w+)/g);

  function handleTokenClick(e, token, idx) {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    onMentionClick({ clientX: rect.left, clientY: rect.bottom + 6 }, token, (selectedItem) => {
      setResolved(r => ({ ...r, [idx]: selectedItem }));
    });
  }

  return (
    <div style={{ background: "#0f1014", border: "1px solid #1e2029", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#3a7de9", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
        {item.label}
      </div>
      <div style={{ fontSize: 13, color: "#b0b8d0", lineHeight: 1.8 }}>
        {parts.map((part, idx) => {
          if (!part.startsWith("@")) return <span key={idx}>{part}</span>;
          const res = resolved[idx];
          return res ? (
            // Resolved — dotted-underline hyperlink chip, re-clickable to change
            <span key={idx} onClick={e => handleTokenClick(e, part, idx)} title="Click to change"
              style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#0a2820", color: "#2dbe8a", border: "1px solid #1a6a50", borderRadius: 5, padding: "1px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer", margin: "0 2px", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>
              @{res.label}
            </span>
          ) : (
            // Unresolved — blue variable placeholder
            <span key={idx} onClick={e => handleTokenClick(e, part, idx)} title={`Click to select ${part}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#0e1e38", color: "#7db8ff", border: "1px solid #2a4a8a", borderRadius: 5, padding: "1px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer", margin: "0 2px" }}>
              {part}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({ item, onDrill, onRun, isRunning }) {
  const [hovered, setHovered] = useState(false);
  const c = COLOR[item.color] || COLOR.blue;
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => onDrill(item)}
      style={{ background: hovered ? "#111520" : "#0f1014", border: `1px solid ${hovered ? "#2a3a60" : "#1e2029"}`, borderRadius: 10, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden", transition: "all 0.18s", transform: hovered ? "translateY(-1px)" : "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: hovered ? c.dot : "transparent", transition: "background 0.2s" }} />
      {item.runnable && (
        <button onClick={e => { e.stopPropagation(); onRun(item); }} title={isRunning ? "Running…" : "Run now"}
          style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 6, background: isRunning ? "#0a2820" : "#0e1e38", border: `1px solid ${isRunning ? "#1a6a56" : "#1a3a6a"}`, color: isRunning ? "#2dbe8a" : "#7db8ff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: hovered || isRunning ? 1 : 0, transition: "opacity 0.15s" }}>
          {isRunning ? <Pause size={10} /> : <Play size={10} />}
        </button>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <IconBox name={item.icon} color={item.color} />
        <div style={{ flex: 1, paddingRight: item.runnable ? 24 : 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#eceef5", lineHeight: 1.35, marginBottom: 4 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: "#8a8fa8", lineHeight: 1.55 }}>{item.desc}</div>
          {item.lastRun && (
            <div style={{ fontSize: 10, marginTop: 5, fontWeight: 500, color: item.lastRunState === "running" ? "#3a7de9" : "#2dbe8a" }}>
              {item.lastRunState === "running" ? "● running now" : `✓ ran ${item.lastRun}`}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TypeBadge type={item.type} />
        {item.subs
          ? <div style={{ width: 20, height: 20, borderRadius: 5, background: hovered ? "#1a2540" : "#1a1d28", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}><ChevronRight size={12} color={hovered ? "#7db8ff" : "#3a3d50"} /></div>
          : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2e3040" }} />
        }
      </div>
    </div>
  );
}

// ── Results Drawer ────────────────────────────────────────────────────────────
function ResultsDrawer({ open, onClose, jobId }) {
  const [results, setResults] = useState(null);
  useState(() => { if (open && jobId) api.getJobResults(jobId).then(setResults).catch(() => {}); }, [open, jobId]);
  const demo = {
    agentName: "Tax Loss Harvesting",
    summary: { accountsAnalyzed: 47, opportunitiesFound: 4, estimatedTaxSavings: 8215 },
    rows: [
      { client: "Anderson, R.", security: "ARKK", unrealizedLoss: -12400, action: "Harvest" },
      { client: "Chen, L.",     security: "BOND", unrealizedLoss: -8100,  action: "Harvest" },
      { client: "Williams, S.", security: "INTC", unrealizedLoss: -5650,  action: "Review"  },
      { client: "Patel, A.",    security: "XPEV", unrealizedLoss: -3200,  action: "Harvest" },
    ],
  };
  const data = results || demo;
  return (
    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 440, background: "#0c0d11", borderLeft: "1px solid #2a3a60", zIndex: 20, display: "flex", flexDirection: "column", transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s ease" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e2029", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#eceef5" }}>{data.agentName} — Results</div>
          <div style={{ fontSize: 11, color: "#8a8fa8", marginTop: 3 }}>{data.summary.accountsAnalyzed} accounts · {data.summary.opportunitiesFound} opportunities · Est. savings ${data.summary.estimatedTaxSavings.toLocaleString()}</div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, background: "#1a1d28", border: "1px solid #1e2029", color: "#8a8fa8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7a7e94", marginBottom: 8 }}>Opportunities</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr>{["Client","Security","Unrealized Loss","Action"].map(h => <th key={h} style={{ textAlign: "left", color: "#8a8fa8", fontWeight: 600, padding: "5px 8px", borderBottom: "1px solid #1e2029" }}>{h}</th>)}</tr></thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: "7px 8px", color: "#dde0f0", borderBottom: "1px solid #131620" }}>{row.client}</td>
                <td style={{ padding: "7px 8px", color: "#b0b8d0", borderBottom: "1px solid #131620" }}>{row.security}</td>
                <td style={{ padding: "7px 8px", color: "#f07850", borderBottom: "1px solid #131620" }}>-${Math.abs(row.unrealizedLoss).toLocaleString()}</td>
                <td style={{ padding: "7px 8px", color: row.action === "Harvest" ? "#7db8ff" : "#8a8fa8", borderBottom: "1px solid #131620" }}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16, marginBottom: 16 }}>
          {[["Total Harvestable", "-$29,350", "#f07850"], ["Est. Tax Savings", "+$8,215", "#2dbe8a"]].map(([label, val, color]) => (
            <div key={label} style={{ background: "#0f1014", border: "1px solid #1e2029", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: "#7a7e94", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
        <button style={{ width: "100%", padding: "9px 14px", borderRadius: 6, border: "1px solid #2a4a8a", background: "#0e1e38", color: "#7db8ff", fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600 }}>
          <Send size={12} /> Send Results to Email / Favorites
        </button>
      </div>
    </div>
  );
}

// ── Activity Rail ─────────────────────────────────────────────────────────────
function ActivityRail({ jobs }) {
  const stateColor  = { running: "#3a7de9", done: "#2dbe8a", queued: "#6a5acd", failed: "#e06030" };
  const statusStyle = {
    running: { bg: "#152640", border: "#2a5090", color: "#7db8ff", label: "Running"        },
    done:    { bg: "#0a2820", border: "#1a6a50", color: "#2dbe8a", label: "View Results →" },
    queued:  { bg: "#1e1240", border: "#4a3080", color: "#a882ff", label: "Queued"         },
    failed:  { bg: "#221008", border: "#6a3020", color: "#f07850", label: "Failed"         },
  };
  if (!jobs.length) return <div style={{ fontSize: 13, color: "#8a8fa8" }}>No recent activity.</div>;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8fa8", marginBottom: 12 }}>Recent & Running</div>
      {jobs.map((job, i) => {
        const s = statusStyle[job.status] || statusStyle.queued;
        return (
          <div key={job.jobId} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: i < jobs.length - 1 ? "1px solid #1e2130" : "none" }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: stateColor[job.status] || "#6a5acd", flexShrink: 0, marginTop: 4 }} />
            <div>
              <div style={{ fontSize: 13, color: "#dde0f0", fontWeight: 600 }}>{job.agentName}</div>
              <div style={{ fontSize: 11, color: "#8a8fa8", marginTop: 3 }}>{job.startedAt ? new Date(job.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Queued"}</div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, marginTop: 5, display: "inline-block", background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Chat Rail with @mention support ──────────────────────────────────────────
function ChatRail({ advisorName, onMentionClick }) {
  const { messages, loading, send } = useChat({ advisorName });
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  // Quick prompts — plain text segments and @Token chips interleaved
  // Each prompt is a string; @Word tokens render as clickable chips
  const quickPrompts = [
    "Clients with available cash today",
    "Which clients hold @security?",
    "Prepare client review for @Client",
  ];

  // Parse a prompt string into segments: { text } or { token }
  function parsePrompt(str) {
    return str.split(/(@\w+)/g).map(part =>
      part.startsWith("@") ? { token: part } : { text: part }
    );
  }

  // When a @token chip in a quick prompt is clicked, open the mention picker.
  // On selection, copy the resolved prompt text to the input box.
  function handleQuickPromptTokenClick(e, promptStr, token) {
    e.stopPropagation();
    onMentionClick(e, token, (selectedItem) => {
      const resolved = promptStr.replace(token, `@${selectedItem.label}`);
      setInput(resolved);
    });
  }

  function handleSend() {
    if (!input.trim()) return;
    send(input);
    setInput("");
  }

  function handleInputChange(e) {
    const val = e.target.value;
    setInput(val);
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const atMatch = before.match(/@(\w*)$/);
    if (atMatch && atMatch[1].length >= 1) {
      const token = `@${atMatch[1]}`;
      const rect = e.target.getBoundingClientRect();
      onMentionClick({ clientX: rect.left + 12, clientY: rect.top - 4 }, token, (selectedItem) => {
        const before2 = val.slice(0, cursor - atMatch[0].length);
        const after   = val.slice(cursor);
        setInput(`${before2}@${selectedItem.label}${after}`);
      });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 13, lineHeight: 1.55, maxWidth: "92%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? "#0e1e38" : "#13151e", color: m.role === "user" ? "#b8d0f0" : "#b0b8d0", border: `1px solid ${m.role === "user" ? "#1a3060" : "#1e2029"}` }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: "#7a7e94", padding: "4px 0" }}>Thinking…</div>}
      </div>
      <div style={{ borderTop: "1px solid #1a1d28", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {quickPrompts.map((prompt, i) => (
          <div key={i} style={{ fontSize: 12, color: "#7a90c0", padding: "3px 0", lineHeight: 1.8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
            <span style={{ marginRight: 2 }}>▸</span>
            {parsePrompt(prompt).map((seg, j) =>
              seg.token ? (
                // @Token chip — clicking opens the mention picker and copies resolved prompt to input
                <span key={j}
                  onClick={e => handleQuickPromptTokenClick(e, prompt, seg.token)}
                  style={{ display: "inline-flex", alignItems: "center", background: "#0e1e38", color: "#7db8ff", border: "1px solid #2a4a8a", borderRadius: 4, padding: "0 6px", fontSize: 11, fontWeight: 600, cursor: "pointer", lineHeight: "18px" }}>
                  {seg.token}
                </span>
              ) : (
                // Plain text — clicking sends the whole prompt as-is
                <span key={j} onClick={() => send(prompt)} style={{ cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#7db8ff"}
                  onMouseLeave={e => e.currentTarget.style.color = "#7a90c0"}
                >{seg.text}</span>
              )
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
        <textarea ref={textareaRef} value={input} onChange={handleInputChange}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask anything… type @ to reference a client or agent"
          rows={2}
          style={{ flex: 1, background: "#13151e", border: "1px solid #1e2029", borderRadius: 7, padding: "7px 10px", fontSize: 12, color: "#dde0f0", fontFamily: "inherit", resize: "none", outline: "none" }}
        />
        <button onClick={handleSend} style={{ width: 32, height: 32, borderRadius: 7, background: "#152640", border: "1px solid #2a4a8a", color: "#7db8ff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Insights Rail ─────────────────────────────────────────────────────────────
function InsightsRail() {
  const insights = [
    { title: "Action Needed",    body: "Approve 3 personalized outreach emails for Smith Prospect.", action: "Review & Approve" },
    { title: "Key Insight",      body: "High Net Worth segment showing increased ESG interest this week.", action: "View Details"    },
    { title: "Upcoming Reviews", body: "4 annual reviews due in 30 days. 2 have incomplete fact sheets.", action: "Prepare Reviews" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8fa8", marginBottom: 2 }}>Book of Business</div>
      {insights.map((c, i) => (
        <div key={i} style={{ background: "#0f1014", border: "1px solid #1e2029", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 13, color: "#eceef5", fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
          <div style={{ fontSize: 12, color: "#9096b0", lineHeight: 1.6 }}>{c.body}</div>
          <button style={{ marginTop: 8, padding: "5px 12px", borderRadius: 6, border: "1px solid #2a4a8a", background: "#0e1e38", color: "#7db8ff", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{c.action}</button>
        </div>
      ))}
    </div>
  );
}

// ── Main WealthAssistant ───────────────────────────────────────────────────────
export default function WealthAssistant({ agentData }) {
  const advisorName = "James Miller";

  const [stack, setStack]           = useState([{ key: "root", title: "Agent Workspace", sub: "hover a card to run, click to explore" }]);
  const [filter, setFilter]         = useState("agent");
  const [runningIds, setRunningIds] = useState({});
  const [railTab, setRailTab]       = useState("activity");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState("job-demo-2");
  const [toast, setToast]           = useState(null);
  const shellRef                    = useRef(null);

  // Unified mention popup — one instance shared by PromptStep and ChatRail
  const [mentionState, setMentionState] = useState({
    visible: false, x: 0, y: 0, token: null, callback: null,
  });

  const { jobs, addJob, activeCount, refresh: refreshActivity } = useActivity();

  const currentKey   = stack[stack.length - 1].key;
  const items        = agentData[currentKey] || [];
  const isPromptView = currentKey.startsWith("prompts-");
  const filtered = filter === "all" ? items : items.filter(i => i.type === filter);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 4000); }

  // Open mention popup — e is a MouseEvent or synthetic {clientX,clientY}
  const openMention = useCallback((e, token, callback) => {
    setMentionState({ visible: true, x: e.clientX, y: e.clientY + 10, token, callback });
  }, []);

  function handleMentionSelect(token, selectedItem) {
    mentionState.callback?.(selectedItem);
    setMentionState(s => ({ ...s, visible: false }));
  }

  async function handleRun(item) {
    setRunningIds(r => ({ ...r, [item.id]: true }));
    setRailTab("activity");
    showToast(`${item.name} is running — check Activity for updates`);
    try {
      const job = await api.runAgent(item.id, { agentName: item.name });
      addJob({ ...job, agentName: item.name });
      setTimeout(() => {
        setRunningIds(r => { const n = { ...r }; delete n[item.id]; return n; });
        setActiveJobId(job.jobId);
        setDrawerOpen(true);
        showToast(`${item.name} complete — results ready`);
        refreshActivity();
      }, 3500);
    } catch {
      setRunningIds(r => { const n = { ...r }; delete n[item.id]; return n; });
      showToast(`Failed to start ${item.name}`);
    }
  }

  function handleDrill(item) {
    if (!item.subs) return;
    const isPrompts = item.subs.startsWith("prompts-");
    const count     = agentData[item.subs]?.length || 0;
    const sub       = isPrompts ? `${count} steps · review and run the workflow` : `${count} sub-agents · hover to run, click to explore`;
    setStack(s => [...s, { key: item.subs, title: item.name, sub }]);
    setFilter("all");
  }

  function navigateTo(idx) { setStack(s => s.slice(0, idx + 1)); }

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", active: true, onClick: () => { setStack([{ key: "root", title: "Agent Workspace", sub: "hover a card to run, click to explore" }]); setFilter("agent"); } },
    { icon: Users,      label: "My Clients"  },
    { icon: FileText,   label: "My Agents"   },
    { icon: BarChart2,  label: "Reports"     },
    { icon: Clock,      label: "Activity",   badge: activeCount || null },
    { icon: Settings,   label: "Settings"    },
  ];

  return (
    <>
      <style>{`
        @keyframes pulseRun { 0%,100%{box-shadow:0 0 0 0 rgba(45,190,138,0)} 50%{box-shadow:0 0 0 4px rgba(45,190,138,0.15)} }
        @keyframes fadeIn   { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#2e3040;border-radius:4px;}
      `}</style>
      <div ref={shellRef} style={{ display: "flex", height: "100vh", background: "#0a0b0d", color: "#e8e9eb", fontFamily: "Roboto, sans-serif", fontSize: 13, overflow: "hidden", position: "relative" }}>

        {/* SIDEBAR */}
        <div style={{ width: 210, minWidth: 210, background: "#0f1014", borderRight: "1px solid #1e2029", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 16px 16px", borderBottom: "1px solid #1e2029", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#2a6dd9,#1a4fa3)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f1f3", letterSpacing: "0.01em" }}>Wealth Assistant</span>
          </div>
          <div style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7a7e94", padding: "10px 10px 4px" }}>Workspace</div>
            {navItems.map((nav, i) => (
              <div key={i} onClick={nav.onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, cursor: "pointer", color: nav.active ? "#7db8ff" : "#aab0c8", background: nav.active ? "#152640" : "transparent", transition: "all 0.15s" }}
                onMouseEnter={e => { if (!nav.active) e.currentTarget.style.background = "#181a22"; }}
                onMouseLeave={e => { if (!nav.active) e.currentTarget.style.background = "transparent"; }}
              >
                <nav.icon size={14} />
                <span style={{ fontSize: 13 }}>{nav.label}</span>
                {nav.badge ? <span style={{ marginLeft: "auto", background: "#152640", color: "#7db8ff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3 }}>{nav.badge}</span> : null}
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 8px", borderTop: "1px solid #1e2029" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7, background: "#13151e" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a3a6a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#7db8ff", flexShrink: 0 }}>JM</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#dde0f0" }}>{advisorName}</div>
                <div style={{ fontSize: 10, color: "#8a8fa8" }}>Senior Advisor</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* TOPBAR — breadcrumb + bell only, filters moved to grid header */}
          <div style={{ height: 52, borderBottom: "1px solid #1e2029", display: "flex", alignItems: "center", padding: "0 24px", gap: 12, background: "#0c0d11", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, flex: 1 }}>
              <Home size={13} style={{ cursor: "pointer", color: "#8a8fa8" }} onClick={() => navigateTo(0)} />
              {stack.map((s, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && <ChevronRight size={11} color="#3a3d50" />}
                  <span onClick={() => navigateTo(i)} style={{ cursor: i === stack.length - 1 ? "default" : "pointer", color: i === stack.length - 1 ? "#dde0f0" : "#8a8fa8", fontWeight: i === stack.length - 1 ? 500 : 400 }}>
                    {s.title}
                  </span>
                </span>
              ))}
            </div>
            <div onClick={() => setDrawerOpen(true)} style={{ position: "relative", width: 32, height: 32, borderRadius: 8, border: "1px solid #1e2029", background: "#13151e", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9096b0" }}>
              <Bell size={14} />
              {activeCount > 0 && <div style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: "#3a7de9", border: "2px solid #0c0d11", fontSize: 8, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{activeCount}</div>}
            </div>
          </div>

          {/* WORKSPACE BODY */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* GRID */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {/* Section header: title + subtitle LEFT, filter pills RIGHT — same row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#eceef5" }}>{stack[stack.length - 1].title}</div>
                  <div style={{ fontSize: 12, color: "#8a8fa8", marginTop: 2 }}>{stack[stack.length - 1].sub}</div>
                </div>
                {!isPromptView && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {FILTERS.map(f => (
                      <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: "6px 14px", borderRadius: 20,
                        border: `1px solid ${filter === f.key ? "#2a5090" : "#2a2d3a"}`,
                        background: filter === f.key ? "#152640" : "transparent",
                        color: filter === f.key ? "#7db8ff" : "#9096b0",
                        fontSize: 12, fontWeight: filter === f.key ? 600 : 400,
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                      }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isPromptView ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
                  {items.map(item => <PromptStep key={item.id} item={item} onMentionClick={openMention} />)}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => handleRun({ id: currentKey, name: stack[stack.length - 1].title })}
                      style={{ flex: 1, padding: "9px 16px", borderRadius: 6, border: "1px solid #2a4a8a", background: "#0e1e38", color: "#7db8ff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Play size={12} /> Run Full Workflow
                    </button>
                    <button style={{ padding: "9px 16px", borderRadius: 6, border: "1px solid #2a2d3a", background: "transparent", color: "#9096b0", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                      Run for One Client
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {filtered.map(item => <AgentCard key={item.id} item={item} onDrill={handleDrill} onRun={handleRun} isRunning={!!runningIds[item.id]} />)}
                  {filtered.length === 0 && (
                    <div style={{ gridColumn: "span 3", fontSize: 13, color: "#7a7e94", padding: "40px 0", textAlign: "center" }}>
                      No {filter === "all" ? "items" : `${filter}s`} at this level.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT RAIL */}
            <div style={{ width: 264, minWidth: 264, borderLeft: "1px solid #1e2029", background: "#0c0d11", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #1e2029", flexShrink: 0 }}>
                {[["activity","Activity"],["chat","Quick Chat"],["insights","Insights"]].map(([key, label]) => (
                  <div key={key} onClick={() => setRailTab(key)} style={{ flex: 1, padding: "11px 4px", textAlign: "center", fontSize: 12, fontWeight: railTab === key ? 600 : 400, color: railTab === key ? "#7db8ff" : "#9096b0", borderBottom: `2px solid ${railTab === key ? "#3a7de9" : "transparent"}`, cursor: "pointer", transition: "all 0.15s" }}>
                    {label}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column" }}>
                {railTab === "activity" && <ActivityRail jobs={jobs} />}
                {railTab === "chat"     && <ChatRail advisorName={advisorName} onMentionClick={openMention} />}
                {railTab === "insights" && <InsightsRail />}
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS DRAWER */}
        <ResultsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} jobId={activeJobId} />

        {/* SHARED @MENTION POPUP */}
        <MentionPopup state={mentionState} onSelect={handleMentionSelect} onClose={() => setMentionState(s => ({ ...s, visible: false }))} />

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#13151e", border: "1px solid #2a3a60", borderRadius: 8, padding: "10px 18px", fontSize: 13, color: "#b0b8d0", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 60 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3a7de9", flexShrink: 0 }} />
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
