// client/src/components/ProjectDetailView.jsx  (v2)
// - "Select Agent" button opens modal before running
// - Vertical result list (no horizontal scroll)
// - Skills terminology
// - Save to Reports

import { useState, useRef } from "react";
import {
  ChevronLeft, Plus, Users, FileText, Upload,
  X, Play, Send, BarChart2, Download, Mail, Search,
  CheckCircle, BookOpen,
} from "lucide-react";

const C = {
  bg: "#0d0f16", surface: "#13161f", surface2: "#191c28", surface3: "#1e2233",
  border: "#22253a", border2: "#2e3250",
  text: "#eceef5", textMid: "#b0b8d0", textMuted: "#8a8fa8", textDim: "#6a6e88",
  blue: "#7db8ff", blueBg: "#0e1e38", blueBorder: "#2a4a8a",
  teal: "#2dbe8a", tealBg: "#0a2820", tealBorder: "#1a6a50",
  amber: "#e09040", amberBg: "#221800", amberBorder: "#5a3a10",
  purple: "#a882ff", purpleBg: "#180f30", purpleBorder: "#4a3080",
  coral: "#f07850", coralBg: "#221008", coralBorder: "#6a3020",
};

const AGENT_OPTIONS = [
  { id: "ag-01", name: "Portfolio Financials Intelligence", icon: BarChart2, color: C.blue   },
  { id: "ag-03", name: "Investment Agent",                  icon: BarChart2, color: C.purple },
  { id: "ag-05", name: "Client Acquisition Agent",          icon: Users,     color: C.teal   },
  { id: "ag-06", name: "Client Deepening Agent",            icon: Users,     color: C.amber  },
  { id: "ag-07", name: "Wealth Planning Agent",             icon: FileText,  color: C.coral  },
];

const SKILL_OPTIONS = {
  "ag-01": [
    { id: "sk-101", name: "Tax Loss Harvesting" },
    { id: "sk-102", name: "Gain/Loss Summary"   },
    { id: "sk-103", name: "Holdings Audit"       },
  ],
  "ag-03": [{ id: "sk-201", name: "Portfolio Rebalance" }, { id: "sk-202", name: "Allocation Analysis" }],
  "ag-05": [{ id: "sk-301", name: "Prospect Outreach Draft" }, { id: "sk-302", name: "Referral Opportunity" }],
  "ag-06": [{ id: "sk-401", name: "Product Upsell Analysis" }, { id: "sk-402", name: "Relationship Insights" }],
  "ag-07": [{ id: "sk-501", name: "Retirement Plan Review" }, { id: "sk-502", name: "Estate Planning Summary" }],
};

const DEMO = {
  summary: "3 tax loss harvesting opportunities identified. Estimated tax savings: $14,200 across 2 of 3 clients.",
  rows: [
    { client: "Smith, Robert", security: "ARKK", unrealizedLoss: -9200, action: "Harvest"   },
    { client: "Smith, Janet",  security: "BOND", unrealizedLoss: -5000, action: "Harvest"   },
    { client: "Smith, Tyler",  security: "—",    unrealizedLoss: 0,     action: "No action" },
  ],
  totalSavings: 14200,
};

// ── Select Agent Modal ────────────────────────────────────────────────────────
function SelectAgentModal({ open, onClose, onRun }) {
  const [selAgent, setSelAgent] = useState(null);
  const [selSkill, setSelSkill] = useState(null);
  function handleRun() {
    if (!selAgent || !selSkill) return;
    onRun({ agent: selAgent, skill: selSkill });
    setSelAgent(null); setSelSkill(null); onClose();
  }
  if (!open) return null;
  const skills = selAgent ? (SKILL_OPTIONS[selAgent.id] || []) : [];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 28, width: 440, boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Select Agent & Skill</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>1 · Agent</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
          {AGENT_OPTIONS.map(agent => {
            const Icon = agent.icon;
            const sel = selAgent?.id === agent.id;
            return (
              <div key={agent.id} onClick={() => { setSelAgent(agent); setSelSkill(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, border: `1px solid ${sel ? C.blueBorder : C.border}`, background: sel ? C.blueBg : C.surface2, cursor: "pointer" }}>
                <Icon size={14} color={sel ? C.blue : C.textDim} />
                <span style={{ fontSize: 13, color: sel ? C.blue : C.textMid, fontWeight: sel ? 600 : 400, flex: 1 }}>{agent.name}</span>
                {sel && <CheckCircle size={12} color={C.blue} />}
              </div>
            );
          })}
        </div>
        {selAgent && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>2 · Skill</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              {skills.map(sk => {
                const sel = selSkill?.id === sk.id;
                return (
                  <div key={sk.id} onClick={() => setSelSkill(sk)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, border: `1px solid ${sel ? C.tealBorder : C.border}`, background: sel ? C.tealBg : C.surface2, cursor: "pointer" }}>
                    <span style={{ fontSize: 13, color: sel ? C.teal : C.textMid, fontWeight: sel ? 600 : 400, flex: 1 }}>{sk.name}</span>
                    {sel && <CheckCircle size={12} color={C.teal} />}
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleRun} disabled={!selAgent || !selSkill}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 6, border: `1px solid ${selSkill ? C.blueBorder : C.border}`, background: selSkill ? C.blueBg : "transparent", color: selSkill ? C.blue : C.textDim, fontSize: 13, fontWeight: 600, cursor: selSkill ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            <Play size={12} /> Run Skill
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Client Modal ──────────────────────────────────────────────────────────
function AddClientModal({ open, onClose, onAdd, allClients, existingIds }) {
  const [search, setSearch] = useState("");
  const filtered = (allClients || []).filter(c =>
    !existingIds.has(c.clientId) && (!search.trim() || c.name.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 30);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, width: 440, maxHeight: 520, display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Add Client to Project</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.textDim }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
              style={{ width: "100%", padding: "7px 10px 7px 28px", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 6, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0
            ? <div style={{ padding: 24, textAlign: "center", color: C.textDim, fontSize: 13 }}>No clients found</div>
            : filtered.map(client => (
              <div key={client.clientId} onClick={() => { onAdd(client); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.blue, flexShrink: 0 }}>
                  {client.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{client.cp === "P" ? "Prospect" : "Client"} · {client.accounts?.length || 0} accounts</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── Save to Reports Modal ─────────────────────────────────────────────────────
function SaveReportModal({ open, result, projectName, onSave, onClose }) {
  const [name, setName] = useState("");
  function handleSave() { if (name.trim()) { onSave(name.trim(), result); setName(""); onClose(); } }
  if (!open || !result) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 28, width: 400, boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Save to Reports</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 16, lineHeight: 1.6 }}>
          Saved to the global Reports library — viewable and exportable anytime.
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Report name</div>
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          placeholder={`${result.workflowName} — ${projectName}`}
          style={{ width: "100%", padding: "9px 12px", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 7, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}
            style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${name.trim() ? C.tealBorder : C.border}`, background: name.trim() ? C.tealBg : "transparent", color: name.trim() ? C.teal : C.textDim, fontSize: 13, fontWeight: 600, cursor: name.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            Save Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    running: { bg: C.blueBg,   border: C.blueBorder,   color: C.blue,   label: "● Running"  },
    done:    { bg: C.tealBg,   border: C.tealBorder,   color: C.teal,   label: "✓ Complete" },
    queued:  { bg: C.purpleBg, border: C.purpleBorder, color: C.purple, label: "Queued"     },
    failed:  { bg: C.coralBg,  border: C.coralBorder,  color: C.coral,  label: "Failed"     },
  };
  const s = map[status] || map.queued;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>{s.label}</span>;
}

// ── Quick Chat ────────────────────────────────────────────────────────────────
function QuickChat({ projectName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const suggestions = ["What is the total tax savings?", "Which clients have idle cash?", "Summarize results"];

  async function send(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are a financial advisor assistant for a project called "${projectName}". Answer concisely in 2-3 sentences.`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "Unable to respond.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {messages.length === 0 && <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: "12px 0" }}>Ask anything about this project</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ padding: "7px 9px", borderRadius: 7, fontSize: 11, lineHeight: 1.6, maxWidth: "95%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? C.blueBg : C.surface2, color: m.role === "user" ? C.blue : C.textMid, border: `1px solid ${m.role === "user" ? C.blueBorder : C.border}` }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ fontSize: 10, color: C.textDim }}>Thinking…</div>}
      </div>
      {messages.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => send(s)} style={{ fontSize: 11, color: C.blue, cursor: "pointer", padding: "2px 0" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>› {s}</div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask about this project…" rows={2}
          style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 6, padding: "6px 8px", fontSize: 11, color: C.text, fontFamily: "inherit", resize: "none", outline: "none" }} />
        <button onClick={() => send(input)} style={{ width: 28, height: 28, borderRadius: 6, background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Main ProjectDetailView ────────────────────────────────────────────────────
export default function ProjectDetailView({
  project, allClients, onBack,
  onAddClients, onRemoveClient,
  onUploadDocument, onRemoveDocument,
  onRunAgent, onSaveReport,
}) {
  // Vertical list selection — no horizontal scroll
  const [selectedResultId, setSelectedResultId] = useState(project.results?.[0]?.id || null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [saveReportModal, setSaveReportModal] = useState({ open: false, result: null });
  const [savedResultIds, setSavedResultIds] = useState(new Set());
  const fileInputRef = useRef(null);

  const existingClientIds = new Set(project.clients.map(c => c.clientId));
  const selectedResult = project.results.find(r => r.id === selectedResultId) || null;

  function fmtDate(iso) {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onUploadDocument({ id: `doc-${Date.now()}`, name: file.name, size: file.size, uploadedAt: new Date().toISOString(), dataUrl: ev.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleRunAgent({ agent, skill }) {
    const result = {
      id: `result-${Date.now()}`,
      agentId: agent.id, agentName: agent.name,
      workflowName: skill.name,
      ranAt: new Date().toISOString(),
      status: "running", summary: null, rows: [],
    };
    onRunAgent(result);
    setSelectedResultId(result.id);

    // Build demo rows using actual client names from the project
    const clients = project.clients;
    const securities = ["ARKK", "BOND", "INTC", "XPEV", "TSLA", "NVDA", "SPY", "AAPL"];
    const losses = [-9200, -5000, -12400, -3800, -7600, -4500, -11200, -6300];
    const demoRows = clients.length > 0
      ? clients.map((client, i) => {
          const hasLoss = i < Math.ceil(clients.length * 0.7); // ~70% have losses
          return {
            client: client.name,
            security: hasLoss ? securities[i % securities.length] : "—",
            unrealizedLoss: hasLoss ? losses[i % losses.length] : 0,
            action: hasLoss ? (i % 3 === 2 ? "Review" : "Harvest") : "No action",
          };
        })
      : DEMO.rows;

    const harvestableLosses = demoRows.filter(r => r.action === "Harvest");
    const totalSavings = Math.abs(harvestableLosses.reduce((s, r) => s + r.unrealizedLoss, 0)) * 0.37;
    const clientNames = clients.length > 0
      ? clients.slice(0, 2).map(c => c.name).join(", ") + (clients.length > 2 ? ` + ${clients.length - 2} more` : "")
      : "Smith Family";

    const demoResult = {
      summary: `${harvestableLosses.length} ${skill.name.toLowerCase()} opportunit${harvestableLosses.length !== 1 ? "ies" : "y"} identified across ${clientNames}. Estimated tax savings: $${Math.round(totalSavings).toLocaleString()}.`,
      rows: demoRows,
      totalSavings: Math.round(totalSavings),
    };

    setTimeout(() => { onRunAgent({ ...result, status: "done", ...demoResult }); }, 3500);
  }

  function handleSaveReport(reportName, result) {
    onSaveReport(reportName, result, project.name);
    setSavedResultIds(prev => new Set([...prev, result.id]));
  }

  const rows = selectedResult?.rows?.length > 0 ? selectedResult.rows : DEMO.rows;
  const summary = selectedResult?.summary || DEMO.summary;
  const savings = selectedResult?.totalSavings ?? DEMO.totalSavings;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg }}>

      {/* Header */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: "#0c0d11", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit" }}>
            <ChevronLeft size={13} /> Project Center
          </button>
          <span style={{ color: C.textDim, fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, color: C.text }}>{project.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{project.name}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
              {project.clients.length} client{project.clients.length !== 1 ? "s" : ""} · {project.documents.length} doc{project.documents.length !== 1 ? "s" : ""} · {project.results.length} result{project.results.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button onClick={() => setAgentModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: `1px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Play size={12} /> Select Agent
          </button>
        </div>
      </div>

      {/* 4-column body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Col 1 — Clients + Docs */}
        <div style={{ width: 200, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Clients */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Clients</span>
              <button onClick={() => setAddClientModalOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: `1px solid ${C.border2}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "2px 7px", fontSize: 10, fontFamily: "inherit" }}>
                <Plus size={9} /> Add
              </button>
            </div>
            {project.clients.length === 0
              ? <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: "8px 0" }}>No clients yet</div>
              : project.clients.map(client => (
                <div key={client.clientId} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 6px", borderRadius: 5, background: C.surface2, marginBottom: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: C.blue, flexShrink: 0 }}>
                    {client.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: C.textMid, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                    <div style={{ fontSize: 9, color: C.textDim }}>{client.cp === "P" ? "Prospect" : "Client"}</div>
                  </div>
                  <button onClick={() => onRemoveClient(client.clientId)}
                    style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", padding: 1, flexShrink: 0 }}>
                    <X size={9} />
                  </button>
                </div>
              ))
            }
          </div>
          {/* Docs */}
          <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Documents</span>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: `1px solid ${C.border2}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "2px 7px", fontSize: 10, fontFamily: "inherit" }}>
                <Upload size={9} /> Upload
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.csv,.docx,.txt" onChange={handleFileUpload} style={{ display: "none" }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {project.documents.length === 0
                ? <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", lineHeight: 1.6 }}>No docs yet.<br />Upload PDFs or spreadsheets.</div>
                : project.documents.map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", borderRadius: 5, background: C.surface2 }}>
                    <FileText size={11} color={C.amber} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                      <div style={{ fontSize: 9, color: C.textDim }}>{fmtSize(doc.size)}</div>
                    </div>
                    <button onClick={() => onRemoveDocument(doc.id)}
                      style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", padding: 1, flexShrink: 0 }}>
                      <X size={9} />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Col 2 — Result list (VERTICAL — no horizontal scroll) */}
        <div style={{ width: 185, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "10px 12px 6px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Results</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {project.results.length === 0 ? (
              <div style={{ padding: "14px 12px", fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
                No results yet.<br />Click "Select Agent" to run a skill.
              </div>
            ) : project.results.map(result => {
              const active = selectedResultId === result.id;
              return (
                <div key={result.id} onClick={() => setSelectedResultId(result.id)}
                  style={{ padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${active ? C.blue : "transparent"}`, background: active ? C.surface2 : "transparent", transition: "all 0.12s" }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surface; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ fontSize: 12, color: active ? C.text : C.textMid, fontWeight: active ? 600 : 400, marginBottom: 4, lineHeight: 1.3 }}>{result.workflowName}</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginBottom: 5 }}>{result.agentName?.split(" ")[0]}</div>
                  <StatusBadge status={result.status} />
                  {savedResultIds.has(result.id) && (
                    <div style={{ fontSize: 9, color: C.teal, marginTop: 4 }}>✓ In Reports</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 3 — Result detail */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selectedResult ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: C.textDim }}>
              <BarChart2 size={34} style={{ opacity: 0.15 }} />
              <div style={{ fontSize: 13 }}>Select a result or run a skill</div>
            </div>
          ) : selectedResult.status === "running" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={22} color={C.blue} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 6 }}>{selectedResult.workflowName} is running…</div>
                <div style={{ fontSize: 12, color: C.textDim }}>Analyzing {project.clients.length} client{project.clients.length !== 1 ? "s" : ""}.</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, opacity: 0.6, animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>{selectedResult.workflowName}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{selectedResult.agentName} · {fmtDate(selectedResult.ranAt)}</div>
                </div>
                <StatusBadge status={selectedResult.status} />
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.tealBorder}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{summary}</div>
                {savings && (
                  <div style={{ marginTop: 10, display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.teal }}>Est. Tax Savings</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: C.teal }}>+${savings.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {rows.length > 0 && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["Client","Security","Unrealized Loss","Action"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "8px 12px", color: C.textMid }}>{row.client}</td>
                          <td style={{ padding: "8px 12px", color: C.textMid }}>{row.security}</td>
                          <td style={{ padding: "8px 12px", color: row.unrealizedLoss < 0 ? C.coral : C.textDim }}>
                            {row.unrealizedLoss < 0 ? `-$${Math.abs(row.unrealizedLoss).toLocaleString()}` : "—"}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: row.action === "Harvest" ? C.blueBg : C.surface2, color: row.action === "Harvest" ? C.blue : C.textDim, border: `1px solid ${row.action === "Harvest" ? C.blueBorder : C.border}` }}>
                              {row.action}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Download size={11} /> Export PDF
                </button>
                <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Mail size={11} /> Email Results
                </button>
                {!savedResultIds.has(selectedResult.id) ? (
                  <button onClick={() => setSaveReportModal({ open: true, result: selectedResult })}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.tealBorder}`, background: C.tealBg, color: C.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    <BookOpen size={11} /> Save to Reports
                  </button>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 12, color: C.teal }}>
                    <CheckCircle size={11} /> Saved to Reports
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Col 4 — Quick Chat */}
        <div style={{ width: 200, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Chat</div>
          </div>
          <div style={{ flex: 1, overflow: "hidden", padding: 10 }}>
            <QuickChat projectName={project.name} />
          </div>
        </div>
      </div>

      <SelectAgentModal open={agentModalOpen} onClose={() => setAgentModalOpen(false)} onRun={handleRunAgent} />
      <AddClientModal open={addClientModalOpen} onClose={() => setAddClientModalOpen(false)} onAdd={client => onAddClients([client])} allClients={allClients} existingIds={existingClientIds} />
      <SaveReportModal open={saveReportModal.open} result={saveReportModal.result} projectName={project.name} onSave={handleSaveReport} onClose={() => setSaveReportModal({ open: false, result: null })} />

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}
