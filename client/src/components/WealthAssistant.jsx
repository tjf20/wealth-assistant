// client/src/components/WealthAssistant.jsx
import { useState, useRef } from "react";
import {
  Users, BarChart2, TrendingUp, Map, UserPlus, Gift,
  Cloud, Activity, Briefcase, ChevronRight, Play, Pause,
  Bell, Settings, LayoutGrid, FileText, Clock, X,
  Send, Home, Zap, Search, Star,
} from "lucide-react";
import { api } from "../api.js";
import { useActivity } from "../hooks/useActivity.js";
import { useChat } from "../hooks/useChat.js";

// ── Icon registry (maps string names from agentMeta.js to components) ─────────
const ICONS = { Users, BarChart2, TrendingUp, Map, UserPlus, Gift, Cloud, Activity, Briefcase, FileText, Clock, Send, Search, Star, LayoutGrid, Bell, Zap };
function getIcon(name) { return ICONS[name] || LayoutGrid; }

// ── Color palette ─────────────────────────────────────────────────────────────
const COLOR = {
  blue:   { bg: "#0e1e38", border: "#1a3a6a", text: "#6fa3ef", dot: "#2a6dd9" },
  teal:   { bg: "#0a2420", border: "#1a5a46", text: "#1d9e75", dot: "#1d9e75" },
  amber:  { bg: "#1e1404", border: "#4a3010", text: "#c88030", dot: "#ba7517" },
  purple: { bg: "#16112e", border: "#3a2a6a", text: "#8a72dd", dot: "#6a52cd" },
  coral:  { bg: "#1e100a", border: "#5a2a1a", text: "#d07050", dot: "#d85a30" },
};
const TYPE_COLOR = {
  agent:    { bg: "#0e1e38", text: "#4a8fd4" },
  workflow: { bg: "#0a2420", text: "#1d9e75" },
  prompt:   { bg: "#16112e", text: "#8a72dd" },
  custom:   { bg: "#1e1404", text: "#c88030" },
};

// ── Small shared components ───────────────────────────────────────────────────
function TypeBadge({ type }) {
  const c = TYPE_COLOR[type] || TYPE_COLOR.agent;
  return <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", padding: "3px 7px", borderRadius: 4, background: c.bg, color: c.text }}>{type}</span>;
}

function IconBox({ name, color }) {
  const Icon = getIcon(name);
  const c = COLOR[color] || COLOR.blue;
  return (
    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={17} color={c.text} />
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({ item, onDrill, onRun, isRunning }) {
  const [hovered, setHovered] = useState(false);
  const c = COLOR[item.color] || COLOR.blue;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onDrill(item)}
      style={{ background: hovered ? "#111520" : "#0f1014", border: `1px solid ${hovered ? "#2a3a60" : "#1e2029"}`, borderRadius: 10, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden", transition: "all 0.18s", transform: hovered ? "translateY(-1px)" : "none" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: hovered ? c.dot : "transparent", transition: "background 0.2s" }} />

      {item.runnable && (
        <button
          onClick={e => { e.stopPropagation(); onRun(item); }}
          title={isRunning ? "Running…" : "Run now"}
          style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 6, background: isRunning ? "#0a2420" : "#0e1e38", border: `1px solid ${isRunning ? "#1a6a56" : "#1a3a6a"}`, color: isRunning ? "#1d9e75" : "#4a8fd4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: hovered || isRunning ? 1 : 0, transition: "opacity 0.15s" }}
        >
          {isRunning ? <Pause size={10} /> : <Play size={10} />}
        </button>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <IconBox name={item.icon} color={item.color} />
        <div style={{ flex: 1, paddingRight: item.runnable ? 24 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#d8dae6", lineHeight: 1.35, fontFamily: "'Syne', sans-serif", marginBottom: 3 }}>{item.name}</div>
          <div style={{ fontSize: 11, color: "#4a4d5a", lineHeight: 1.5 }}>{item.desc}</div>
          {item.lastRun && (
            <div style={{ fontSize: 9, marginTop: 4, color: item.lastRunState === "running" ? "#2a6dd9" : "#1a6a4a" }}>
              {item.lastRunState === "running" ? "● running now" : `✓ ran ${item.lastRun}`}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TypeBadge type={item.type} />
        {item.subs
          ? <div style={{ width: 20, height: 20, borderRadius: 5, background: hovered ? "#1a2540" : "#1a1d28", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}><ChevronRight size={12} color={hovered ? "#6fa3ef" : "#3a3d50"} /></div>
          : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2e3040" }} />
        }
      </div>
    </div>
  );
}

// ── Prompt Step ───────────────────────────────────────────────────────────────
function PromptStep({ item, onMentionClick }) {
  const parts = item.instruction.split(/(@[\w&/\s,]+)/g);
  return (
    <div style={{ background: "#0f1014", border: "1px solid #1e2029", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#2a6dd9", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{item.label}</div>
      <div style={{ fontSize: 12, color: "#9aa3c0", lineHeight: 1.7 }}>
        {parts.map((part, i) =>
          part.startsWith("@")
            ? <span key={i} onClick={e => { e.stopPropagation(); onMentionClick(e, part); }} style={{ display: "inline-block", background: "#0e1e38", color: "#6fa3ef", border: "1px solid #1a3a6a", borderRadius: 4, padding: "0 5px", fontSize: 11, fontWeight: 500, cursor: "pointer", margin: "0 1px" }}>{part}</span>
            : <span key={i}>{part}</span>
        )}
      </div>
    </div>
  );
}

// ── Mention Popup ─────────────────────────────────────────────────────────────
function MentionPopup({ visible, pos, onClose }) {
  const clients = [
    { name: "Anderson, Robert", initials: "RA" },
    { name: "Chen, Linda",      initials: "LC" },
    { name: "Williams, Sara",   initials: "SW" },
    { name: "Patel, Amit",      initials: "AP" },
  ];
  if (!visible) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 45 }} />
      <div style={{ position: "absolute", left: pos.x, top: pos.y, background: "#13151e", border: "1px solid #2a3a60", borderRadius: 8, padding: 6, zIndex: 50, width: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 10, color: "#4a4d5a", padding: "4px 6px 6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Select Client</div>
        {clients.map(c => (
          <div key={c.name} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 5, cursor: "pointer", fontSize: 12, color: "#9aa3c0" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1a2540"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a3a6a", color: "#6fa3ef", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.initials}</div>
            {c.name}
          </div>
        ))}
        <div style={{ fontSize: 11, color: "#4a6090", padding: "6px 8px", borderTop: "1px solid #1a1d28", marginTop: 2, cursor: "pointer" }}>Search all clients ↗</div>
      </div>
    </>
  );
}

// ── Results Drawer ─────────────────────────────────────────────────────────────
function ResultsDrawer({ open, onClose, jobId }) {
  const [results, setResults] = useState(null);

  useState(() => {
    if (open && jobId) {
      api.getJobResults(jobId).then(setResults).catch(() => {});
    }
  }, [open, jobId]);

  const demo = {
    agentName: "Tax Loss Harvesting",
    completedAt: new Date().toISOString(),
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
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#d8dae6" }}>{data.agentName} — Results</div>
          <div style={{ fontSize: 10, color: "#4a4d5a", marginTop: 2 }}>
            {data.summary.accountsAnalyzed} accounts · {data.summary.opportunitiesFound} opportunities · Est. savings ${data.summary.estimatedTaxSavings.toLocaleString()}
          </div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, background: "#1a1d28", border: "1px solid #1e2029", color: "#5a5d6a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4a4d5a", marginBottom: 8 }}>Opportunities</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr>{["Client","Security","Unrealized Loss","Action"].map(h => <th key={h} style={{ textAlign: "left", color: "#5a5d6a", fontWeight: 500, padding: "5px 8px", borderBottom: "1px solid #1e2029" }}>{h}</th>)}</tr></thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: "6px 8px", color: "#9aa3c0", borderBottom: "1px solid #131620" }}>{row.client}</td>
                <td style={{ padding: "6px 8px", color: "#9aa3c0", borderBottom: "1px solid #131620" }}>{row.security}</td>
                <td style={{ padding: "6px 8px", color: "#d85a30", borderBottom: "1px solid #131620" }}>${Math.abs(row.unrealizedLoss).toLocaleString()}</td>
                <td style={{ padding: "6px 8px", color: row.action === "Harvest" ? "#6fa3ef" : "#5a5d6a", borderBottom: "1px solid #131620" }}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16, marginBottom: 16 }}>
          {[["Total Harvestable", `-$${(29350).toLocaleString()}`, "#d85a30"], ["Est. Tax Savings", `+$${data.summary.estimatedTaxSavings.toLocaleString()}`, "#1d9e75"]].map(([label, val, color]) => (
            <div key={label} style={{ background: "#0f1014", border: "1px solid #1e2029", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#4a4d5a", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color }}>{val}</div>
            </div>
          ))}
        </div>
        <button style={{ width: "100%", padding: "9px 14px", borderRadius: 6, border: "1px solid #1a3a6a", background: "#0e1e38", color: "#6fa3ef", fontSize: 11, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Send size={12} /> Send Results to Email / Favorites
        </button>
      </div>
    </div>
  );
}

// ── Activity Rail ─────────────────────────────────────────────────────────────
function ActivityRail({ jobs }) {
  const stateColor = { running: "#2a6dd9", done: "#1d9e75", queued: "#3a3d50", failed: "#d85a30" };
  const statusStyle = { running: { bg: "#0e1e38", color: "#4a8fd4", label: "Running" }, done: { bg: "#0a2420", color: "#1d9e75", label: "View Results →" }, queued: { bg: "#16112e", color: "#6a5acd", label: "Queued" }, failed: { bg: "#1e100a", color: "#d07050", label: "Failed" } };

  if (!jobs.length) return <div style={{ fontSize: 12, color: "#4a4d5a" }}>No recent activity.</div>;

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4a4d5a", marginBottom: 10 }}>Recent & Running</div>
      {jobs.map((job, i) => {
        const s = statusStyle[job.status] || statusStyle.queued;
        return (
          <div key={job.jobId} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < jobs.length - 1 ? "1px solid #1a1d28" : "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stateColor[job.status] || "#3a3d50", flexShrink: 0, marginTop: 4 }} />
            <div>
              <div style={{ fontSize: 12, color: "#c8cad4", fontWeight: 500 }}>{job.agentName}</div>
              <div style={{ fontSize: 10, color: "#4a4d5a", marginTop: 2 }}>{job.startedAt ? new Date(job.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Queued"}</div>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, marginTop: 4, display: "inline-block", background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Chat Rail ─────────────────────────────────────────────────────────────────
function ChatRail({ advisorName }) {
  const { messages, loading, send } = useChat({ advisorName });
  const [input, setInput] = useState("");
  const quickPrompts = ["Clients with available cash today", "Which clients hold @Tesla?", "Prepare client review for @Client"];

  function handleSend() {
    if (!input.trim()) return;
    send(input);
    setInput("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 12, lineHeight: 1.5, maxWidth: "90%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? "#0e1e38" : "#13151e", color: m.role === "user" ? "#9ab8e0" : "#9aa3c0", border: `1px solid ${m.role === "user" ? "#1a3060" : "#1e2029"}` }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ fontSize: 11, color: "#4a4d5a", padding: "4px 0" }}>Thinking…</div>}
      </div>
      <div style={{ borderTop: "1px solid #1a1d28", paddingTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
        {quickPrompts.map((p, i) => (
          <div key={i} onClick={() => send(p)} style={{ fontSize: 11, color: "#4a6090", cursor: "pointer", padding: "3px 0" }}
            onMouseEnter={e => e.currentTarget.style.color = "#6fa3ef"}
            onMouseLeave={e => e.currentTarget.style.color = "#4a6090"}
          >▸ {p}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}} placeholder="Ask anything about your book…" rows={2} style={{ flex: 1, background: "#13151e", border: "1px solid #1e2029", borderRadius: 7, padding: "7px 10px", fontSize: 12, color: "#c8cad4", fontFamily: "inherit", resize: "none", outline: "none" }} />
        <button onClick={handleSend} style={{ width: 30, height: 30, borderRadius: 7, background: "#1a2540", border: "1px solid #2a4070", color: "#6fa3ef", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Send size={12} /></button>
      </div>
    </div>
  );
}

// ── Insights Rail ─────────────────────────────────────────────────────────────
function InsightsRail() {
  const insights = [
    { title: "Action Needed", body: "Approve 3 personalized outreach emails for Smith Prospect.", action: "Review & Approve" },
    { title: "Key Insight", body: "High Net Worth segment showing increased ESG interest this week.", action: "View Details" },
    { title: "Upcoming Reviews", body: "4 annual reviews due in 30 days. 2 have incomplete fact sheets.", action: "Prepare Reviews" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4a4d5a", marginBottom: 2 }}>Book of Business</div>
      {insights.map((c, i) => (
        <div key={i} style={{ background: "#0f1014", border: "1px solid #1e2029", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#d0d2db", fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
          <div style={{ fontSize: 11, color: "#6a7090", lineHeight: 1.6 }}>{c.body}</div>
          <button style={{ marginTop: 8, padding: "4px 10px", borderRadius: 6, border: "1px solid #1a3a6a", background: "#0e1e38", color: "#6fa3ef", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>{c.action}</button>
        </div>
      ))}
    </div>
  );
}

// ── Main WealthAssistant ───────────────────────────────────────────────────────
export default function WealthAssistant({ agentData }) {
  const advisorName = "James Miller";

  const [stack, setStack] = useState([{ key: "root", title: "Agent Workspace", sub: "9 services · hover a card to run, click to explore" }]);
  const [filter, setFilter] = useState("all");
  const [runningIds, setRunningIds] = useState({});
  const [railTab, setRailTab] = useState("activity");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState("job-demo-2");
  const [toast, setToast] = useState(null);
  const [mentionPopup, setMentionPopup] = useState({ visible: false, x: 0, y: 0 });
  const shellRef = useRef(null);
  const { jobs, addJob, activeCount, refresh: refreshActivity } = useActivity();

  const currentKey = stack[stack.length - 1].key;
  const items = agentData[currentKey] || [];
  const isPromptView = currentKey.startsWith("prompts-");
  const filtered = filter === "all" ? items : items.filter(i => i.type === filter);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 4000); }

  async function handleRun(item) {
    setRunningIds(r => ({ ...r, [item.id]: true }));
    setRailTab("activity");
    showToast(`${item.name} is running — check Activity for updates`);
    try {
      const job = await api.runAgent(item.id, { agentName: item.name });
      addJob({ ...job, agentName: item.name });
      // Simulate completion for demo (remove in production — poll instead)
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
    const count = agentData[item.subs]?.length || 0;
    const sub = isPrompts ? `${count} steps · review and run the workflow` : `${count} sub-agents · hover to run, click to explore`;
    setStack(s => [...s, { key: item.subs, title: item.name, sub }]);
    setFilter("all");
  }

  function navigateTo(idx) { setStack(s => s.slice(0, idx + 1)); }

  function handleMentionClick(e, token) {
    if (!shellRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const shellRect = shellRef.current.getBoundingClientRect();
    setMentionPopup({ visible: true, x: rect.left - shellRect.left, y: rect.bottom - shellRect.top + 4 });
  }

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", active: true, onClick: () => setStack([{ key: "root", title: "Agent Workspace", sub: "9 services · hover a card to run, click to explore" }]) },
    { icon: Users,      label: "My Clients" },
    { icon: FileText,   label: "My Agents" },
    { icon: BarChart2,  label: "Reports" },
    { icon: Clock,      label: "Activity", badge: activeCount || null },
    { icon: Settings,   label: "Settings" },
  ];

  return (
    <>
      <style>{`
        @keyframes pulseRun { 0%,100%{box-shadow:0 0 0 0 rgba(29,158,117,0)} 50%{box-shadow:0 0 0 4px rgba(29,158,117,0.15)} }
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#2e3040;border-radius:4px;}
      `}</style>
      <div ref={shellRef} style={{ display: "flex", height: "100vh", background: "#0a0b0d", color: "#e8e9eb", fontFamily: "'DM Sans', sans-serif", fontSize: 13, overflow: "hidden", position: "relative" }}>

        {/* SIDEBAR */}
        <div style={{ width: 210, minWidth: 210, background: "#0f1014", borderRight: "1px solid #1e2029", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 16px 16px", borderBottom: "1px solid #1e2029", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#2a6dd9,#1a4fa3)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={14} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#f0f1f3", letterSpacing: "0.01em" }}>Wealth Assistant</span>
          </div>
          <div style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4a4d5a", padding: "10px 10px 4px" }}>Workspace</div>
            {navItems.map((nav, i) => (
              <div key={i} onClick={nav.onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, cursor: "pointer", color: nav.active ? "#6fa3ef" : "#8a8d99", background: nav.active ? "#1a2540" : "transparent", transition: "all 0.15s" }}
                onMouseEnter={e => { if (!nav.active) e.currentTarget.style.background = "#181a22"; }}
                onMouseLeave={e => { if (!nav.active) e.currentTarget.style.background = "transparent"; }}
              >
                <nav.icon size={14} />
                <span style={{ fontSize: 13 }}>{nav.label}</span>
                {nav.badge ? <span style={{ marginLeft: "auto", background: "#1a2540", color: "#4a8fd4", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>{nav.badge}</span> : null}
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 8px", borderTop: "1px solid #1e2029" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7, background: "#13151e" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a3a6a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#6fa3ef", flexShrink: 0 }}>JM</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#d0d2db" }}>{advisorName}</div>
                <div style={{ fontSize: 10, color: "#5a5d6a" }}>Senior Advisor</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* TOPBAR */}
          <div style={{ height: 52, borderBottom: "1px solid #1e2029", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, background: "#0c0d11", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5a5d6a", flex: 1 }}>
              <Home size={12} style={{ cursor: "pointer", color: "#5a5d6a" }} onClick={() => navigateTo(0)} />
              {stack.map((s, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && <ChevronRight size={10} color="#2e3040" />}
                  <span onClick={() => navigateTo(i)} style={{ cursor: i === stack.length - 1 ? "default" : "pointer", color: i === stack.length - 1 ? "#c8cad4" : "#5a5d6a" }}>{s.title}</span>
                </span>
              ))}
            </div>
            {!isPromptView && (
              <div style={{ display: "flex", gap: 6 }}>
                {["all","agent","workflow","prompt","custom"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filter === f ? "#2a4070" : "#1e2029"}`, background: filter === f ? "#1a2540" : "transparent", color: filter === f ? "#6fa3ef" : "#6a6d7a", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <div onClick={() => setDrawerOpen(true)} style={{ position: "relative", width: 32, height: 32, borderRadius: 8, border: "1px solid #1e2029", background: "#13151e", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6a6d7a" }}>
              <Bell size={14} />
              {activeCount > 0 && <div style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: "#2a6dd9", border: "2px solid #0c0d11", fontSize: 8, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{activeCount}</div>}
            </div>
          </div>

          {/* WORKSPACE BODY */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* GRID */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#e8e9eb" }}>{stack[stack.length - 1].title}</div>
                <div style={{ fontSize: 11, color: "#4a4d5a" }}>{stack[stack.length - 1].sub}</div>
              </div>

              {isPromptView ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
                  {items.map(item => <PromptStep key={item.id} item={item} onMentionClick={handleMentionClick} />)}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => handleRun({ id: currentKey, name: stack[stack.length - 1].title })} style={{ flex: 1, padding: "9px 16px", borderRadius: 6, border: "1px solid #1a3a6a", background: "#0e1e38", color: "#6fa3ef", fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Play size={11} /> Run Full Workflow
                    </button>
                    <button style={{ padding: "9px 16px", borderRadius: 6, border: "1px solid #1e2029", background: "transparent", color: "#6a6d7a", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      Run for One Client
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {filtered.map(item => <AgentCard key={item.id} item={item} onDrill={handleDrill} onRun={handleRun} isRunning={!!runningIds[item.id]} />)}
                </div>
              )}
            </div>

            {/* RIGHT RAIL */}
            <div style={{ width: 264, minWidth: 264, borderLeft: "1px solid #1e2029", background: "#0c0d11", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #1e2029", flexShrink: 0 }}>
                {[["activity","Activity"],["chat","Quick Chat"],["insights","Insights"]].map(([key, label]) => (
                  <div key={key} onClick={() => setRailTab(key)} style={{ flex: 1, padding: "10px 4px", textAlign: "center", fontSize: 11, color: railTab === key ? "#6fa3ef" : "#5a5d6a", borderBottom: `2px solid ${railTab === key ? "#2a6dd9" : "transparent"}`, cursor: "pointer", transition: "all 0.15s" }}>{label}</div>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column" }}>
                {railTab === "activity" && <ActivityRail jobs={jobs} />}
                {railTab === "chat"     && <ChatRail advisorName={advisorName} />}
                {railTab === "insights" && <InsightsRail />}
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS DRAWER */}
        <ResultsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} jobId={activeJobId} />

        {/* MENTION POPUP */}
        <MentionPopup visible={mentionPopup.visible} pos={{ x: mentionPopup.x, y: mentionPopup.y }} onClose={() => setMentionPopup(p => ({ ...p, visible: false }))} />

        {/* TOAST */}
        {toast && (
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#13151e", border: "1px solid #2a3a60", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#9aa3c0", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 40 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2a6dd9", flexShrink: 0 }} />
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
