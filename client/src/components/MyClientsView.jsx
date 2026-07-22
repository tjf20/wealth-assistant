// client/src/components/MyClientsView.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronDown, X, Users, BarChart2, Filter, Play, Monitor, ArrowUpDown, ArrowUp, ArrowDown, Send, Trash2 } from "lucide-react";
import { useTheme } from "../theme.js";

const PAGE_SIZE = 25;
const CURRENT_PRODUCER = { id: "702-1782", name: "James Miller" };

const TYPE_FILTER_OPTIONS = [
  { key: "all",        label: "All"              },
  { key: "clients",    label: "Clients Only"     },
  { key: "prospects",  label: "Prospects Only"   },
  { key: "salesforce", label: "Salesforce"       },
  { key: "prof_rel",   label: "Prof. Relationship" },
];

// Quick agents available for per-row runs
const QUICK_AGENTS = [
  { id: "sub-105", name: "Client Outreach Draft",   scope: "individual" },
  { id: "sub-101", name: "Tax Loss Harvesting",     scope: "both"       },
  { id: "sub-106", name: "Annual Review Prep",      scope: "individual" },
  { id: "sub-403", name: "Retirement Projection",   scope: "individual" },
  { id: "sub-301", name: "Portfolio Rebalancing",   scope: "individual" },
];

function fmt(n) { return n ? "$" + Math.round(n).toLocaleString("en-US") : "—"; }
function totalAUM(accounts) { return (accounts || []).reduce((s, a) => s + (a.netValue || 0), 0); }
function fmtAUM(accounts) {
  const t = totalAUM(accounts);
  return t >= 1e9 ? `$${(t/1e9).toFixed(2)}B` : t >= 1e6 ? `$${(t/1e6).toFixed(1)}M` : fmt(t);
}

// ── Badges ────────────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const C = useTheme();
  const map = { Individual: { bg: C.blueBg, border: C.blueBorder, color: C.blue }, Business: { bg: C.tealBg, border: C.tealBorder, color: C.teal }, Estate: { bg: C.amberBg, border: C.amberBorder, color: C.amber } };
  const s = map[type] || map.Individual;
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{type}</span>;
}
function CPBadge({ cp }) {
  const C = useTheme();
  const isPros = cp === "P";
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, background: isPros ? C.purpleBg : C.surface2, color: isPros ? C.purple : C.textMuted, border: `1px solid ${isPros ? C.purpleBorder : C.border}` }}>{isPros ? "Prospect" : "Client"}</span>;
}

// ── Agent picker popover ────────────────────────────────────────────────────────────────────
function AgentPicker({ onSelect, onClose }) {
  const C = useTheme();
  return (
    <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 99, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, width: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", overflow: "hidden", marginTop: 4 }}>
      <div style={{ padding: "5px 10px", fontSize: 10, color: C.textHint, background: C.surface2, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase", letterSpacing: ".07em" }}>
        Run Assistant For Client
      </div>
      {QUICK_AGENTS.map(a => (
        <div key={a.id} onClick={() => onSelect(a)}
          style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, color: C.text, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentBg}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Play size={11} color={C.accent} />
          <span style={{ flex: 1 }}>{a.name}</span>
          <span style={{ fontSize: 9, color: C.textDim }}>{a.scope === "individual" ? "Indiv." : "Both"}</span>
        </div>
      ))}
    </div>
  );
}

// ── Accounts Drawer ─────────────────────────────────────────────────────────────────────────
function AccountsDrawer({ client, open, onClose, onAddToQueue }) {
  const C = useTheme();
  const [sel, setSel] = useState(new Set());
  useEffect(() => { if (open) setSel(new Set()); }, [open, client]);
  if (!open || !client) return null;
  const accounts = client.accounts || [];
  function toggleAcct(num) { setSel(p => { const n = new Set(p); n.has(num) ? n.delete(num) : n.add(num); return n; }); }
  return (
    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 480, background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 15, display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.4)" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{client.name}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{client.type} · {client.producerId} · {fmtAUM(client.accounts)} AUM</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}><X size={16} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.surface2 }}>
              <th style={{ width: 36, padding: "8px 8px 8px 16px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}></th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: ".06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Account #</th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: ".06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Type</th>
              <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: ".06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acct, i) => {
              const selected = sel.has(acct.accountNumber);
              return (
                <tr key={acct.accountNumber} style={{ background: selected ? `${C.tealBg}88` : "transparent", transition: "background 0.1s", cursor: "pointer" }} onClick={() => toggleAcct(acct.accountNumber)}>
                  <td style={{ padding: "8px 8px 8px 16px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", textAlign: "center" }}>
                    <input type="checkbox" checked={selected} onChange={() => {}} style={{ accentColor: C.teal, width: 13, height: 13 }} />
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", fontFamily: "monospace", color: C.blue, fontWeight: 500 }}>{acct.accountNumber}</td>
                  <td style={{ padding: "8px 12px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", color: C.textMid }}>{acct.acctType}</td>
                  <td style={{ padding: "8px 12px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", textAlign: "right", color: C.text, fontWeight: 500 }}>{fmt(acct.netValue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <button onClick={() => { onAddToQueue({ type: "client", client }); onClose(); }}
          style={{ flex: 1, padding: "7px 12px", background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Send size={12} />Add Client to Queue
        </button>
        {sel.size > 0 && (
          <button onClick={() => { onAddToQueue({ type: "accounts", client, accounts: accounts.filter(a => sel.has(a.accountNumber)) }); onClose(); }}
            style={{ flex: 1, padding: "7px 12px", background: C.tealBg, color: C.teal, border: `1px solid ${C.tealBorder}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <BarChart2 size={12} />Add {sel.size} Account{sel.size !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────────
export default function MyClientsView({ allClients, onSendToAgent, onRunAgentForClients, onSetWorkstationClient }) {
  const C = useTheme();

  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [sortField,   setSortField]   = useState("name");
  const [sortDir,     setSortDir]     = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [drawerClient,setDrawerClient]= useState(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [queueItems,  setQueueItems]  = useState([]);
  const [queueExpanded,setQueueExpanded]=useState(false);
  const [agentPickRow, setAgentPickRow]= useState(null); // clientId with picker open
  const [multiAgentOpen,setMultiAgentOpen]=useState(false);
  const filterRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setAgentPickRow(null);
      if (multiAgentOpen) setMultiAgentOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [multiAgentOpen]);

  const myClients = useMemo(() => allClients.filter(c => c.producerId === CURRENT_PRODUCER.id), [allClients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = myClients.filter(c => {
      if (typeFilter === "clients")   return c.cp === "C";
      if (typeFilter === "prospects") return c.cp === "P";
      return true;
    });
    if (q) result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.ssn.replace(/-/g, "").includes(q.replace(/-/g, "")) ||
      c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      (c.accounts || []).some(a => a.accountNumber.replace(/-/g, "").includes(q.replace(/-/g, "")))
    );
    return result;
  }, [myClients, search, typeFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const vals = { name: [a.name, b.name], phone: [a.phone, b.phone], producerId: [a.producerId, b.producerId], type: [a.type, b.type], cp: [a.cp, b.cp], accounts: [a.accounts.length, b.accounts.length] };
      const [av, bv] = vals[sortField] || vals.name;
      return av < bv ? -1 * sortDir : av > bv ? 1 * sortDir : 0;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, typeFilter, sortField, sortDir]);

  function handleSort(field) { if (sortField === field) setSortDir(d => d * -1); else { setSortField(field); setSortDir(1); } }
  function toggleSelect(id) { setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleSelectAll() {
    const ids = new Set(pageSlice.map(c => c.clientId));
    const all = pageSlice.every(c => selectedIds.has(c.clientId));
    setSelectedIds(p => { const n = new Set(p); if (all) ids.forEach(id => n.delete(id)); else ids.forEach(id => n.add(id)); return n; });
  }
  const pageAll  = pageSlice.length > 0 && pageSlice.every(c => selectedIds.has(c.clientId));
  const pageSome = pageSlice.some(c => selectedIds.has(c.clientId)) && !pageAll;

  function openDrawer(client) { setDrawerClient(client); setDrawerOpen(true); }

  function addToQueue(payload) {
    if (payload.type === "client") {
      const already = queueItems.some(i => i.type === "client" && i.client.clientId === payload.client.clientId);
      if (!already) setQueueItems(p => [...p, { type: "client", client: payload.client }]);
    } else if (payload.type === "accounts") {
      const newItems = payload.accounts.filter(a => !queueItems.some(i => i.type === "account" && i.account.accountNumber === a.accountNumber)).map(a => ({ type: "account", client: payload.client, account: a }));
      setQueueItems(p => [...p, ...newItems]);
    }
    setQueueExpanded(true);
  }

  // Per-row: run agent for single client
  function handleRowRunAgent(client, agent) {
    setAgentPickRow(null);
    if (onRunAgentForClients) onRunAgentForClients([client], agent.id, agent.name);
    if (onSetWorkstationClient) onSetWorkstationClient(client);
  }

  // Multi-select: run agent for all selected
  function handleMultiRunAgent(agent) {
    setMultiAgentOpen(false);
    const clients = myClients.filter(c => selectedIds.has(c.clientId));
    if (onRunAgentForClients) onRunAgentForClients(clients, agent.id, agent.name);
    setSelectedIds(new Set());
  }

  // Queue "Send to Agent" (legacy Custom Workspace path)
  function handleQueueSend() {
    if (onSendToAgent) onSendToAgent(queueItems);
    setQueueItems([]);
    setQueueExpanded(false);
  }

  function Th({ field, label, style = {} }) {
    const active = sortField === field;
    const Icon = active ? (sortDir === 1 ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th onClick={() => handleSort(field)} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: active ? C.accent : C.textDim, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none", borderBottom: `1px solid ${C.border}`, background: C.surface, ...style }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{label}<Icon size={10} /></span>
      </th>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative", background: C.bg }}>

      {/* Toolbar */}
      <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>My Clients</div>
          <span style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{myClients.length} clients · {CURRENT_PRODUCER.name} ({CURRENT_PRODUCER.id})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textDim, pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SSN, or account number…"
              style={{ width: "100%", padding: "7px 32px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", paddingLeft: 32 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textDim, cursor: "pointer" }}><X size={12} /></button>}
          </div>
          <div ref={filterRef} style={{ position: "relative" }}>
            <button onClick={() => setFilterOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7, border: `1px solid ${typeFilter !== "all" ? C.accentBorder : C.border}`, background: typeFilter !== "all" ? C.accentBg : C.surface2, color: typeFilter !== "all" ? C.accent : C.textMid, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Filter size={13} />All<ChevronDown size={12} />
            </button>
            {filterOpen && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, width: 180, overflow: "hidden", marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                {TYPE_FILTER_OPTIONS.map(o => (
                  <div key={o.key} onClick={() => { setTypeFilter(o.key); setFilterOpen(false); }}
                    style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, color: typeFilter === o.key ? C.accent : C.text, background: typeFilter === o.key ? C.accentBg : "transparent", fontWeight: typeFilter === o.key ? 600 : 400 }}
                    onMouseEnter={e => { if (typeFilter !== o.key) e.currentTarget.style.background = C.surface2; }}
                    onMouseLeave={e => { if (typeFilter !== o.key) e.currentTarget.style.background = "transparent"; }}>
                    {o.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.textDim }}>{filtered.length.toLocaleString()} results</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: queueExpanded ? 200 : 60 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: 42, padding: "10px 8px 10px 20px", borderBottom: `1px solid ${C.border}`, background: C.surface, textAlign: "center" }}>
                <input type="checkbox" checked={pageAll} ref={el => { if (el) el.indeterminate = pageSome; }} onChange={toggleSelectAll} style={{ accentColor: C.teal, width: 14, height: 14, cursor: "pointer" }} />
              </th>
              <Th field="name"       label="Full Name"   style={{ paddingLeft: 8 }} />
              <Th field="phone"      label="Phone"        />
              <Th field="producerId" label="Producer ID"  />
              <Th field="type"       label="Type"         />
              <Th field="cp"         label="C / P"        />
              <Th field="accounts"   label="Accounts"     style={{ textAlign: "center" }} />
              <th style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: C.surface, fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "60px 20px", textAlign: "center", color: C.textDim }}>
                <Search size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
                <div style={{ fontSize: 14 }}>No clients found</div>
              </td></tr>
            ) : pageSlice.map((client, i) => {
              const selected = selectedIds.has(client.clientId);
              return (
                <tr key={client.clientId} style={{ background: selected ? `${C.tealBg}88` : "transparent", transition: "background 0.1s" }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = C.surface2; }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.background = selected ? `${C.tealBg}88` : "transparent"; }}>
                  <td style={{ padding: "9px 8px 9px 20px", borderBottom: `1px solid ${C.border}`, textAlign: "center" }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleSelect(client.clientId)} style={{ accentColor: C.teal, width: 13, height: 13, cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "9px 14px 9px 8px", borderBottom: `1px solid ${C.border}` }}>
                    <span onClick={() => openDrawer(client)} style={{ color: C.blue, fontWeight: 500, cursor: "pointer", fontSize: 13 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                      {client.name}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12 }}>{client.phone}</td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, color: C.textDim, fontSize: 12, fontFamily: "monospace" }}>{client.producerId}</td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}` }}><TypeBadge type={client.type} /></td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}` }}><CPBadge cp={client.cp} /></td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, textAlign: "center" }}>
                    <span onClick={() => openDrawer(client)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, background: C.surface2, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, cursor: "pointer", fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accentBorder; e.currentTarget.style.color = C.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                      {client.accounts.length}
                    </span>
                  </td>
                  {/* Per-row actions */}
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
                      {/* Run Agent button */}
                      <div ref={agentPickRow === client.clientId ? pickerRef : null} style={{ position: "relative" }}>
                        <button onClick={() => setAgentPickRow(agentPickRow === client.clientId ? null : client.clientId)}
                          style={{ padding: "4px 9px", background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                          <Play size={10} />Run Assistant
                        </button>
                        {agentPickRow === client.clientId && (
                          <AgentPicker onSelect={a => handleRowRunAgent(client, a)} onClose={() => setAgentPickRow(null)} />
                        )}
                      </div>
                      {/* Sync to Chat button */}
                      {onSetWorkstationClient && (
                        <button onClick={() => onSetWorkstationClient(client)} title="Sync to Wealth Chat"
                          style={{ padding: "4px 7px", background: "transparent", color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center" }}>
                          <Monitor size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ position: "absolute", bottom: queueExpanded ? 200 : 44, left: 0, right: 0, padding: "8px 20px", background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: C.textDim }}>
        <span>{((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
            style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: safePage <= 1 ? C.textHint : C.textMid, cursor: safePage <= 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={14} />
          </button>
          <span>Page {safePage} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
            style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: safePage >= totalPages ? C.textHint : C.textMid, cursor: safePage >= totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Multi-select floating action bar */}
      {selectedCount > 0 && (
        <div style={{ position: "absolute", bottom: queueExpanded ? 220 : 60, left: "50%", transform: "translateX(-50%)", background: C.surface, border: `1px solid ${C.accentBorder}`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 20, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{selectedCount} client{selectedCount !== 1 ? "s" : ""} selected</span>
          <div style={{ width: 1, height: 20, background: C.border }} />
          <div style={{ position: "relative" }}>
            <button onClick={() => setMultiAgentOpen(o => !o)}
              style={{ padding: "6px 12px", background: C.accent, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
              <Play size={12} />Run Assistant <ChevronDown size={12} />
            </button>
            {multiAgentOpen && (
              <div style={{ position: "absolute", bottom: "100%", left: 0, zIndex: 99, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, width: 220, overflow: "hidden", marginBottom: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                <div style={{ padding: "5px 10px", fontSize: 10, color: C.textHint, background: C.surface2, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase", letterSpacing: ".07em" }}>
                  Run Assistant for {selectedCount} clients
                </div>
                {QUICK_AGENTS.filter(a => a.scope !== "book").map(a => (
                  <div key={a.id} onClick={() => handleMultiRunAgent(a)}
                    style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, color: C.text, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.accentBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Play size={11} color={C.accent} />{a.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {onSetWorkstationClient && selectedCount === 1 && (
            <button onClick={() => { const c = myClients.find(cl => selectedIds.has(cl.clientId)); if (c && onSetWorkstationClient) onSetWorkstationClient(c); setSelectedIds(new Set()); }}
              style={{ padding: "6px 12px", background: "transparent", color: C.textMid, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              <Monitor size={12} />Sync to Chat
            </button>
          )}
          <button onClick={() => setSelectedIds(new Set())} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}><X size={14} /></button>
        </div>
      )}

      {/* Agent Queue tray (legacy Custom Workspace path) */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface, border: `1px solid ${queueItems.length > 0 ? C.accentBorder : C.border}`, borderRadius: "8px 8px 0 0", zIndex: 10 }}>
        <div onClick={() => queueItems.length > 0 && setQueueExpanded(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", height: 38, cursor: queueItems.length > 0 ? "pointer" : "default" }}>
          <Send size={14} color={queueItems.length > 0 ? C.accent : C.textDim} />
          <span style={{ fontSize: 12, fontWeight: 600, color: queueItems.length > 0 ? C.accent : C.textMuted }}>Assistant Queue</span>
          {queueItems.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}` }}>{queueItems.length}</span>}
          {queueItems.length === 0 && <span style={{ fontSize: 11, color: C.textDim }}>— click a client's Run Assistant button above</span>}
          {queueItems.length > 0 && <ChevronDown size={13} style={{ marginLeft: "auto", color: C.textDim, transform: queueExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />}
        </div>

        {queueExpanded && queueItems.length > 0 && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px", maxHeight: 160, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {queueItems.map((item, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: item.type === "client" ? C.accentBg : C.tealBg, border: `1px solid ${item.type === "client" ? C.accentBorder : C.tealBorder}`, fontSize: 12 }}>
                  {item.type === "client" ? <Users size={11} color={C.accent} /> : <BarChart2 size={11} color={C.teal} />}
                  <span style={{ color: item.type === "client" ? C.accent : C.teal, fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.type === "client" ? item.client.name : `${item.account.accountNumber} (${item.client.name})`}
                  </span>
                  <button onClick={() => setQueueItems(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: item.type === "client" ? C.accent : C.teal, cursor: "pointer", padding: 0, display: "flex" }}><X size={10} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleQueueSend} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.accentBorder}`, background: C.accentBg, color: C.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Send size={12} />Send to Custom Workspace
              </button>
              <button onClick={() => { setQueueItems([]); setQueueExpanded(false); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                <Trash2 size={11} />Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Accounts Drawer */}
      <AccountsDrawer client={drawerClient} open={drawerOpen} onClose={() => setDrawerOpen(false)} onAddToQueue={addToQueue} />
    </div>
  );
}
