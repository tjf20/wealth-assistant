// client/src/components/ReportsView.jsx
// Global report library — shows all saved agent results across all projects.
// FAs can view, rename, export, or delete saved reports.

import { useState } from "react";
import {
  FileText, Download, Trash2, Edit2, Check, X,
  BarChart2, Search, ChevronRight,
} from "lucide-react";

const C = {
  bg: "#0d0f16", surface: "#13161f", surface2: "#191c28", surface3: "#1e2233",
  border: "#22253a", border2: "#2e3250",
  text: "#eceef5", textMid: "#b0b8d0", textMuted: "#8a8fa8", textDim: "#6a6e88",
  blue: "#7db8ff", blueBg: "#0e1e38", blueBorder: "#2a4a8a",
  teal: "#2dbe8a", tealBg: "#0a2820", tealBorder: "#1a6a50",
  amber: "#e09040", amberBg: "#221800", amberBorder: "#5a3a10",
  coral: "#f07850", coralBg: "#221008", coralBorder: "#6a3020",
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ReportRow({ report, onDelete, onRename, onView, selected, onSelect }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(report.name);

  function commitRename() {
    if (name.trim()) onRename(report.id, name.trim());
    setEditing(false);
  }

  return (
    <div
      onClick={() => onSelect(report.id)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 20px",
        background: selected ? C.surface2 : "transparent",
        borderBottom: `1px solid ${C.border}`,
        cursor: "pointer", transition: "background 0.12s",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = C.surface; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Icon */}
      <div style={{ width: 36, height: 36, borderRadius: 8, background: C.tealBg, border: `1px solid ${C.tealBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileText size={16} color={C.teal} />
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
            <input
              autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(false); }}
              style={{ flex: 1, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 5, padding: "4px 8px", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none" }}
            />
            <button onClick={commitRename} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", display: "flex" }}><Check size={14} /></button>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex" }}><X size={14} /></button>
          </div>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.name}</div>
        )}
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>
          {report.agentName} · {report.skillName} · {report.projectName}
        </div>
      </div>

      {/* Date */}
      <div style={{ fontSize: 11, color: C.textDim, flexShrink: 0, textAlign: "right" }}>
        {fmtDate(report.savedAt)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(report)}
          style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: C.blue, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
          View
        </button>
        <button onClick={() => setEditing(true)}
          style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Edit2 size={11} />
        </button>
        <button onClick={() => onDelete(report.id)}
          style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Report Detail Panel ───────────────────────────────────────────────────────
function ReportDetail({ report, onClose }) {
  if (!report) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: C.textDim }}>
      <FileText size={40} style={{ opacity: 0.15 }} />
      <div style={{ fontSize: 13 }}>Select a report to view details</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{report.name}</div>
          <div style={{ fontSize: 11, color: C.textDim }}>
            {report.agentName} · {report.skillName} · {report.projectName}
          </div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Saved {fmtDate(report.savedAt)}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Download size={12} /> Export PDF
          </button>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textDim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

        {/* Summary */}
        <div style={{ background: C.surface, border: `1px solid ${C.tealBorder}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Summary</div>
          <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{report.summary || "No summary available."}</div>
          {report.totalSavings && (
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 11, color: C.teal }}>Est. Tax Savings</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: C.teal }}>+${report.totalSavings.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Rows table */}
        {report.rows && report.rows.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Client", "Security", "Unrealized Loss", "Action"].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < report.rows.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ padding: "9px 14px", color: C.textMid }}>{row.client}</td>
                    <td style={{ padding: "9px 14px", color: C.textMid }}>{row.security}</td>
                    <td style={{ padding: "9px 14px", color: row.unrealizedLoss < 0 ? C.coral : C.textDim }}>
                      {row.unrealizedLoss < 0 ? `-$${Math.abs(row.unrealizedLoss).toLocaleString()}` : "—"}
                    </td>
                    <td style={{ padding: "9px 14px" }}>
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
      </div>
    </div>
  );
}

// ── Main ReportsView ──────────────────────────────────────────────────────────
export default function ReportsView({ reports, onDelete, onRename }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = reports.filter(r =>
    !search.trim() ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    r.skillName?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedReport = reports.find(r => r.id === selectedId) || null;

  return (
    <div style={{ display: "flex", height: "100%", background: C.bg }}>

      {/* Left — list */}
      <div style={{ width: 520, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, background: "#0c0d11", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Reports</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>
                {reports.length} saved report{reports.length !== 1 ? "s" : ""} · global library
              </div>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.textDim }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search reports, projects, skills…"
              style={{ width: "100%", padding: "7px 10px 7px 28px", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 6, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: C.textDim }}>
              <FileText size={32} style={{ opacity: 0.15, marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 6 }}>
                {reports.length === 0 ? "No reports saved yet" : "No results found"}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                {reports.length === 0
                  ? "Run an agent skill from a Project and use\n\"Save to Reports\" to memorialize the results."
                  : "Try a different search term."}
              </div>
            </div>
          ) : filtered.map(report => (
            <ReportRow
              key={report.id}
              report={report}
              selected={selectedId === report.id}
              onSelect={setSelectedId}
              onDelete={onDelete}
              onRename={onRename}
              onView={r => setSelectedId(r.id)}
            />
          ))}
        </div>
      </div>

      {/* Right — detail */}
      <ReportDetail
        report={selectedReport}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
