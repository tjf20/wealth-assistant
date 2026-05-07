// client/src/components/MyClientsView.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, X,
  Users, BarChart2, Briefcase, Star, Filter, Send,
  Plus, Trash2, FolderOpen, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25;

const CURRENT_PRODUCER = { id: "702-1782", name: "James Miller" };

// Filter options for the Type/Relationship dropdown
const TYPE_FILTER_OPTIONS = [
  { key: "all",          label: "All"                  },
  { key: "clients",      label: "Clients Only"         },
  { key: "prospects",    label: "Prospects Only"       },
  { key: "salesforce",   label: "Salesforce"           },
  { key: "prof_rel",     label: "Prof. Relationship"   },
  { key: "client_rel",   label: "Client Related"       },
];

// ── Color palette (matches WealthAssistant.jsx) ────────────────────────────────
const C = {
  bg:         "#0a0b0d",
  surface:    "#0f1014",
  surface2:   "#13151e",
  border:     "#1e2029",
  border2:    "#2a2d3a",
  text:       "#eceef5",
  textMid:    "#b0b8d0",
  textMuted:  "#8a8fa8",
  textDim:    "#7a7e94",
  blue:       "#7db8ff",
  blueBg:     "#0e1e38",
  blueBorder: "#2a4a8a",
  blueDark:   "#152640",
  teal:       "#2dbe8a",
  tealBg:     "#0a2820",
  tealBorder: "#1a6a50",
  amber:      "#e09040",
  amberBg:    "#221800",
  amberBorder:"#5a3a10",
  purple:     "#a882ff",
  purpleBg:   "#180f30",
  purpleBorder:"#4a3080",
  coral:      "#f07850",
};

// ── Utility ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function totalAUM(accounts) {
  return accounts.reduce((s, a) => s + (a.netValue || 0), 0);
}

// ── Type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const map = {
    Individual: { bg: C.blueBg,    border: C.blueBorder,   color: C.blue   },
    Business:   { bg: C.tealBg,    border: C.tealBorder,   color: C.teal   },
    Estate:     { bg: C.amberBg,   border: C.amberBorder,  color: C.amber  },
  };
  const s = map[type] || map.Individual;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {type}
    </span>
  );
}

// ── CP Badge ──────────────────────────────────────────────────────────────────
function CPBadge({ cp }) {
  const isProspect = cp === "P";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, background: isProspect ? C.purpleBg : C.surface2, color: isProspect ? C.purple : C.textMuted, border: `1px solid ${isProspect ? C.purpleBorder : C.border}` }}>
      {isProspect ? "Prospect" : "Client"}
    </span>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ArrowUpDown size={11} style={{ opacity: 0.3, marginLeft: 4 }} />;
  return sortDir === 1
    ? <ArrowUp   size={11} style={{ color: C.blue, marginLeft: 4 }} />
    : <ArrowDown size={11} style={{ color: C.blue, marginLeft: 4 }} />;
}

// ── Accounts Drawer ───────────────────────────────────────────────────────────
function AccountsDrawer({ client, open, onClose, onAddToProject }) {
  const [selectedAccts, setSelectedAccts] = useState(new Set());

  useEffect(() => { if (open) setSelectedAccts(new Set()); }, [open, client?.clientId]);

  if (!client) return null;

  const accounts = client.accounts || [];

  function toggleAcct(an) {
    setSelectedAccts(prev => {
      const next = new Set(prev);
      next.has(an) ? next.delete(an) : next.add(an);
      return next;
    });
  }

  function toggleAll(e) {
    setSelectedAccts(e.target.checked ? new Set(accounts.map(a => a.accountNumber)) : new Set());
  }

  const allChecked = accounts.length > 0 && selectedAccts.size === accounts.length;
  const someChecked = selectedAccts.size > 0 && !allChecked;

  const selectedAccountObjs = accounts.filter(a => selectedAccts.has(a.accountNumber));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 30, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.25s" }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 520,
        background: C.surface, borderLeft: `1px solid ${C.border2}`,
        zIndex: 31, display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, background: "#0c0d11", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{client.name}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
                <CPBadge cp={client.cp} />
                <TypeBadge type={client.type} />
                <span style={{ fontSize: 11, color: C.textMuted }}>Producer: {client.producerId}</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>Phone: {client.phone}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: C.surface2, border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Subheader */}
        <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: C.surface }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <input
              type="checkbox"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = someChecked; }}
              onChange={toggleAll}
              style={{ accentColor: C.teal, width: 14, height: 14, cursor: "pointer" }}
            />
            <span style={{ fontSize: 12, color: C.textMuted }}>
              {selectedAccts.size === 0 ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""}` : `${selectedAccts.size} of ${accounts.length} selected`}
            </span>
          </div>
          {selectedAccts.size > 0 && (
            <button
              onClick={() => onAddToProject({ type: "accounts", client, accounts: selectedAccountObjs })}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.tealBorder}`, background: C.tealBg, color: C.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              <Plus size={11} /> Add {selectedAccts.size} to Project Center
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ position: "sticky", top: 0, background: C.surface, zIndex: 2 }}>
              <tr>
                <th style={{ width: 36, padding: "9px 8px 9px 20px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}></th>
                <th style={{ padding: "9px 12px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>Account #</th>
                <th style={{ padding: "9px 12px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}` }}>Type</th>
                <th style={{ padding: "9px 12px", textAlign: "center", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}` }}>C/M</th>
                <th style={{ padding: "9px 12px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}` }}>Mngd/Plgd</th>
                <th style={{ padding: "9px 20px 9px 12px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}` }}>Net Value</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acct, i) => {
                const selected = selectedAccts.has(acct.accountNumber);
                return (
                  <tr
                    key={acct.accountNumber}
                    onClick={() => toggleAcct(acct.accountNumber)}
                    style={{ background: selected ? C.tealBg : "transparent", cursor: "pointer", transition: "background 0.12s" }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.background = C.surface2; }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "9px 8px 9px 20px", textAlign: "center", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleAcct(acct.accountNumber)} onClick={e => e.stopPropagation()} style={{ accentColor: C.teal, width: 13, height: 13, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "9px 12px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", fontFamily: "monospace", fontSize: 12, color: selected ? C.teal : C.blue, fontWeight: 500 }}>
                      {acct.accountNumber}
                    </td>
                    <td style={{ padding: "9px 12px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", color: C.textMid, whiteSpace: "nowrap" }}>
                      {acct.acctType}
                    </td>
                    <td style={{ padding: "9px 12px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", textAlign: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: acct.cm === "M" ? C.blueBg : C.surface2, color: acct.cm === "M" ? C.blue : C.textMuted, border: `1px solid ${acct.cm === "M" ? C.blueBorder : C.border}` }}>
                        {acct.cm === "M" ? "Managed" : "Cash"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", color: acct.managedPledged ? C.amber : C.textDim, fontSize: 11 }}>
                      {acct.managedPledged || "—"}
                    </td>
                    <td style={{ padding: "9px 20px 9px 12px", borderBottom: i < accounts.length - 1 ? `1px solid ${C.border}` : "none", textAlign: "right", color: C.textMid, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                      {fmt(acct.netValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, background: "#0c0d11", flexShrink: 0 }}>
          <button
            onClick={() => onAddToProject({ type: "client", client })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            <Plus size={12} /> Add Client to Project Center
          </button>
          <span style={{ fontSize: 11, color: C.textDim, marginLeft: "auto" }}>
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </>
  );
}

// ── Project Center Tray ───────────────────────────────────────────────────────
function ProjectCenterTray({ items, onRemove, onClear, onSendToAgent, onExpand, expanded }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 210, right: 264,
      background: "#0c0d11",
      borderTop: `2px solid ${expanded && items.length > 0 ? C.tealBorder : C.border}`,
      zIndex: 20,
      transition: "border-color 0.2s",
    }}>
      {/* Collapsed bar — always visible */}
      <div
        onClick={onExpand}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", height: 38, cursor: "pointer" }}
      >
        <FolderOpen size={14} color={items.length > 0 ? C.teal : C.textDim} />
        <span style={{ fontSize: 12, fontWeight: 600, color: items.length > 0 ? C.teal : C.textMuted, letterSpacing: "0.03em" }}>
          Project Center
        </span>
        {items.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: C.tealBg, color: C.teal, border: `1px solid ${C.tealBorder}` }}>
            {items.length}
          </span>
        )}
        {items.length === 0 && (
          <span style={{ fontSize: 11, color: C.textDim }}>— select clients or accounts to get started</span>
        )}
        <div style={{ marginLeft: "auto", color: C.textDim }}>
          <ChevronDown size={13} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px", maxHeight: 220, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", padding: "16px 0" }}>
              No items yet. Select clients or accounts from the table above.
            </div>
          ) : (
            <>
              {/* Items list */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: item.type === "client" ? C.blueBg : C.tealBg, border: `1px solid ${item.type === "client" ? C.blueBorder : C.tealBorder}`, fontSize: 12 }}>
                    {item.type === "client"
                      ? <Users size={11} color={C.blue} />
                      : <BarChart2 size={11} color={C.teal} />
                    }
                    <span style={{ color: item.type === "client" ? C.blue : C.teal, fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.type === "client" ? item.client.name : `${item.account.accountNumber} (${item.client.name})`}
                    </span>
                    <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: item.type === "client" ? C.blue : C.teal, cursor: "pointer", display: "flex", alignItems: "center", padding: 0, opacity: 0.7 }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={onSendToAgent} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.tealBorder}`, background: C.tealBg, color: C.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <Send size={12} /> Send to Agent
                </button>
                <button onClick={onClear} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Trash2 size={11} /> Clear All
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main MyClientsView ────────────────────────────────────────────────────────
export default function MyClientsView({ allClients, onSendToAgent }) {
  // ── State ────────────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("");
  const [typeFilter, setTypeFilter]       = useState("all");
  const [filterOpen, setFilterOpen]       = useState(false);
  const [page, setPage]                   = useState(1);
  const [sortField, setSortField]         = useState("name");
  const [sortDir, setSortDir]             = useState(1);
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [drawerClient, setDrawerClient]   = useState(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [projectItems, setProjectItems]   = useState([]);
  //const [projectExpanded, setProjectExpanded] = useState(false);
  const filterRef                         = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handler(e) { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // James is bound to his producer ID
  const myClients = useMemo(() =>
    allClients.filter(c => c.producerId === CURRENT_PRODUCER.id),
    [allClients]
  );

  // ── Search + filter ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = myClients.filter(c => {
      // Type/relationship filter
      if (typeFilter === "clients")   return c.cp === "C";
      if (typeFilter === "prospects") return c.cp === "P";
      // Salesforce / Prof. Relationship / Client Related — placeholder for future data
      // For now they behave like "All"
      return true;
    });

    if (q) {
      result = result.filter(c => {
        if (c.name.toLowerCase().includes(q)) return true;
        if (c.ssn.replace(/-/g, "").includes(q.replace(/-/g, ""))) return true;
        if (c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))) return true;
        if (c.accounts.some(a => a.accountNumber.replace(/-/g, "").includes(q.replace(/-/g, "")))) return true;
        return false;
      });
    }

    return result;
  }, [myClients, search, typeFilter]);

  // ── Sort ─────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av, bv;
      switch (sortField) {
        case "name":       av = a.name;       bv = b.name;       break;
        case "phone":      av = a.phone;      bv = b.phone;      break;
        case "producerId": av = a.producerId; bv = b.producerId; break;
        case "type":       av = a.type;       bv = b.type;       break;
        case "cp":         av = a.cp;         bv = b.cp;         break;
        case "accounts":   av = a.accounts.length; bv = b.accounts.length; break;
        default:           av = a.name;       bv = b.name;
      }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return  1 * sortDir;
      return 0;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when search/filter changes
  useEffect(() => { setPage(1); }, [search, typeFilter, sortField, sortDir]);

  // ── Sort handler ──────────────────────────────────────────────────────────
  function handleSort(field) {
    if (sortField === field) setSortDir(d => d * -1);
    else { setSortField(field); setSortDir(1); }
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const pageIds = new Set(pageSlice.map(c => c.clientId));
    const allSelected = pageSlice.every(c => selectedIds.has(c.clientId));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  }

  const pageAllSelected = pageSlice.length > 0 && pageSlice.every(c => selectedIds.has(c.clientId));
  const pageSomeSelected = pageSlice.some(c => selectedIds.has(c.clientId)) && !pageAllSelected;

  // ── Drawer ────────────────────────────────────────────────────────────────
  function openDrawer(client) {
    setDrawerClient(client);
    setDrawerOpen(true);
  }

  function closeDrawer() { setDrawerOpen(false); }

  // ── Project Center ────────────────────────────────────────────────────────
  function addToProject(payload) {
    if (payload.type === "client") {
      const already = projectItems.some(i => i.type === "client" && i.client.clientId === payload.client.clientId);
      if (!already) setProjectItems(prev => [...prev, { type: "client", client: payload.client }]);
    } else if (payload.type === "accounts") {
      const newItems = payload.accounts
        .filter(a => !projectItems.some(i => i.type === "account" && i.account.accountNumber === a.accountNumber))
        .map(a => ({ type: "account", client: payload.client, account: a }));
      setProjectItems(prev => [...prev, ...newItems]);
    }
    setProjectExpanded(true);
  }

  function addSelectedClientsToProject() {
    const selected = myClients.filter(c => selectedIds.has(c.clientId));
const items = selected.map(c => ({ type: "client", client: c }));
if (onSendToAgent) onSendToAgent(items);
setSelectedIds(new Set());
  }

  function removeFromProject(idx) { setProjectItems(prev => prev.filter((_, i) => i !== idx)); }
 // function clearProject() { setProjectItems([]); }

  function handleSendToAgent() {
    if (onSendToAgent) onSendToAgent(projectItems);
  }

  // ── Th helper ─────────────────────────────────────────────────────────────
  function Th({ field, label, style = {} }) {
    const active = sortField === field;
    return (
      <th onClick={() => handleSort(field)} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: active ? C.blue : C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", background: C.surface, ...style }}>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          {label}
          <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
        </span>
      </th>
    );
  }

  // ── Pagination bar ────────────────────────────────────────────────────────
  function PaginationBar() {
    const start = (safePage - 1) * PAGE_SIZE + 1;
    const end   = Math.min(safePage * PAGE_SIZE, sorted.length);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {sorted.length === 0 ? "No results" : `${start}–${end} of ${sorted.length}`}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setPage(1)} disabled={safePage === 1} style={pageBtnStyle(safePage === 1)}>«</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={pageBtnStyle(safePage === 1)}>
            <ChevronLeft size={12} />
          </button>
          <span style={{ fontSize: 12, color: C.textMid, padding: "0 8px" }}>Page {safePage} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={pageBtnStyle(safePage === totalPages)}>
            <ChevronRight size={12} />
          </button>
          <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} style={pageBtnStyle(safePage === totalPages)}>»</button>
        </div>
      </div>
    );
  }

  function pageBtnStyle(disabled) {
    return { padding: "4px 8px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.surface2, color: disabled ? C.textDim : C.textMid, cursor: disabled ? "not-allowed" : "pointer", fontSize: 12, display: "flex", alignItems: "center", opacity: disabled ? 0.4 : 1 };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>

      {/* ── Toolbar ── */}
      <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${C.border}`, background: "#0c0d11", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>My Clients</div>
          <span style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
            {myClients.length} clients · {CURRENT_PRODUCER.name} ({CURRENT_PRODUCER.id})
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textDim, pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, SSN, or account number…"
              style={{ width: "100%", padding: "7px 12px 7px 32px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none" }}
              onFocus={e => e.target.style.borderColor = C.blueBorder}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Type/Relationship filter dropdown */}
          <div ref={filterRef} style={{ position: "relative" }}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7, border: `1px solid ${typeFilter !== "all" ? C.blueBorder : C.border}`, background: typeFilter !== "all" ? C.blueBg : C.surface2, color: typeFilter !== "all" ? C.blue : C.textMid, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              <Filter size={12} />
              {TYPE_FILTER_OPTIONS.find(o => o.key === typeFilter)?.label || "All"}
              <ChevronDown size={11} style={{ marginLeft: 2 }} />
            </button>
            {filterOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, zIndex: 40, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", overflow: "hidden" }}>
                {TYPE_FILTER_OPTIONS.map(opt => (
                  <div key={opt.key} onClick={() => { setTypeFilter(opt.key); setFilterOpen(false); }}
                    style={{ padding: "9px 14px", fontSize: 13, color: typeFilter === opt.key ? C.blue : C.textMid, background: typeFilter === opt.key ? C.blueBg : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    onMouseEnter={e => { if (typeFilter !== opt.key) e.currentTarget.style.background = C.surface; }}
                    onMouseLeave={e => { if (typeFilter !== opt.key) e.currentTarget.style.background = "transparent"; }}
                  >
                    {opt.label}
                    {typeFilter === opt.key && <span style={{ fontSize: 10, color: C.blue }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected actions */}
          {selectedIds.size > 0 && (
            <button onClick={addSelectedClientsToProject}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: `1px solid ${C.tealBorder}`, background: C.tealBg, color: C.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              <Plus size={12} /> Add {selectedIds.size} to Project Center
            </button>
          )}

          {/* Result count */}
          <span style={{ fontSize: 12, color: C.textDim, marginLeft: "auto", whiteSpace: "nowrap" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 0 /* room for tray */ }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: 42, padding: "10px 8px 10px 20px", borderBottom: `1px solid ${C.border}`, background: C.surface, textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={pageAllSelected}
                  ref={el => { if (el) el.indeterminate = pageSomeSelected; }}
                  onChange={toggleSelectAll}
                  style={{ accentColor: C.teal, width: 14, height: 14, cursor: "pointer" }}
                />
              </th>
              <Th field="name"       label="Full Name"    style={{ paddingLeft: 8 }} />
              <Th field="phone"      label="Phone"        />
              <Th field="producerId" label="Producer ID"  />
              <Th field="type"       label="Type"         />
              <Th field="cp"         label="C / P"        />
              <Th field="accounts"   label="Accounts"     style={{ textAlign: "center" }} />
            </tr>
          </thead>
          <tbody>
            {pageSlice.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "60px 20px", textAlign: "center", color: C.textDim }}>
                  <Search size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
                  <div style={{ fontSize: 14 }}>No clients found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filter</div>
                </td>
              </tr>
            ) : pageSlice.map((client, i) => {
              const selected = selectedIds.has(client.clientId);
              return (
                <tr
                  key={client.clientId}
                  style={{ background: selected ? `${C.tealBg}88` : "transparent", transition: "background 0.1s" }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = C.surface2; }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.background = selected ? `${C.tealBg}88` : "transparent"; }}
                >
                  <td style={{ padding: "9px 8px 9px 20px", borderBottom: `1px solid ${C.border}`, textAlign: "center" }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleSelect(client.clientId)} style={{ accentColor: C.teal, width: 13, height: 13, cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "9px 14px 9px 8px", borderBottom: `1px solid ${C.border}` }}>
                    <span
                      onClick={() => openDrawer(client)}
                      style={{ color: C.blue, fontWeight: 500, cursor: "pointer", fontSize: 13 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                    >
                      {client.name}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                    {client.phone}
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, color: C.textDim, fontSize: 12, fontFamily: "monospace" }}>
                    {client.producerId}
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}` }}>
                    <TypeBadge type={client.type} />
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}` }}>
                    <CPBadge cp={client.cp} />
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, textAlign: "center" }}>
                    <span
                      onClick={() => openDrawer(client)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, background: C.surface2, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, cursor: "pointer", fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.blueBorder; e.currentTarget.style.color = C.blue; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
                    >
                      {client.accounts.length}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <PaginationBar />

      {/* ── Accounts Drawer ── */}
      <AccountsDrawer
        client={drawerClient}
        open={drawerOpen}
        onClose={closeDrawer}
        onAddToProject={addToProject}
      />

     
    </div>
  );
}
