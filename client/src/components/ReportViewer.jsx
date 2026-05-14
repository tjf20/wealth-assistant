// client/src/components/ReportViewer.jsx
// Full-screen overlay report viewer.
// Generates rich demo content based on agentId + client data.
// Real implementation: replace generateReportContent() with actual agent output.

import { useState } from "react";
import { X, Download, FileText, TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight, Star } from "lucide-react";
import { useTheme } from "../theme.js";

// ── Generate demo report content based on agent ───────────────────────────────
export function generateReportContent(agentId, agentName, clientName, scope) {
  const ts = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const isBook = scope === "book";
  const subject = isBook ? "Book of Business (352 clients)" : clientName;

  const templates = {
    "sub-101": {
      title: "Tax Loss Harvesting Opportunities",
      summary: `Identified 14 accounts with harvestable losses across ${subject}.`,
      sections: [
        {
          heading: "Executive Summary",
          content: `Analysis of unrealized losses across ${isBook ? "352 client accounts" : `${clientName}'s portfolio`} identified $87,400 in potential tax savings. 14 positions qualify for immediate harvesting before the year-end deadline.`,
        },
        {
          heading: "Top Opportunities",
          type: "table",
          headers: ["Client", "Security", "Unrealized Loss", "Action", "Deadline"],
          rows: [
            ["Anderson, Robert", "NVDA", "-$12,400", "Harvest → BRK-B", "Dec 29"],
            ["Chen, David",       "META", "-$8,900",  "Harvest → GOOGL", "Dec 29"],
            ["Torres, Maria",     "XPEV", "-$6,200",  "Harvest → NIO",   "Dec 28"],
            ["Williams, James",   "INTC", "-$5,800",  "Harvest → AMD",   "Dec 29"],
            ["Kim, Sophie",       "PYPL", "-$4,100",  "Harvest → SQ",    "Dec 28"],
          ],
        },
        {
          heading: "Compliance Notes",
          content: "All recommended substitutions maintain economic exposure while respecting the 30-day wash-sale rule. Trades should be executed through custodian before market close on the deadline date.",
        },
        {
          heading: "Estimated Impact",
          type: "stats",
          stats: [
            { label: "Est. Tax Savings", value: "$87,400", color: "teal" },
            { label: "Accounts Affected", value: "14", color: "blue" },
            { label: "Deadline", value: "Dec 29", color: "amber" },
          ],
        },
      ],
    },
    "sub-105": {
      title: "Client Outreach Draft",
      summary: `Personalized outreach email prepared for ${clientName || "selected client"}.`,
      sections: [
        {
          heading: "Outreach Summary",
          content: `Based on recent portfolio activity and a 47-day contact gap, the following outreach is recommended to maintain relationship momentum.`,
        },
        {
          heading: "Drafted Email",
          type: "email",
          to: clientName ? `${clientName.split(",")[1]?.trim() || clientName} ${clientName.split(",")[0] || ""}`.trim() : "Client",
          subject: "Quick Check-In — Portfolio Update",
          body: `Hi ${clientName ? clientName.split(",")[1]?.trim() || clientName.split(",")[0] : "there"},\n\nI wanted to reach out and share a few things that may be relevant to your portfolio given recent market movements.\n\nYour diversified allocation continues to perform well relative to benchmarks, and I've identified a potential tax-loss harvesting opportunity before year-end that could benefit your position.\n\nWould you have 15 minutes for a call this week to discuss? I'd love to catch up and ensure your financial plan remains on track with your goals.\n\nBest regards,\nJames Miller\nSenior Financial Advisor\n(702) 555-1782`,
        },
        {
          heading: "Talking Points",
          type: "bullets",
          items: [
            "Portfolio is up 8.3% YTD vs. 6.1% benchmark",
            "Tax-loss opportunity before Dec 29 deadline",
            "RMD deadline reminder if applicable",
            "Annual review scheduling for Q1",
          ],
        },
      ],
    },
    "sub-202": {
      title: "At-Risk Client Alerts",
      summary: `Identified 14 at-risk clients across your book requiring immediate attention.`,
      sections: [
        {
          heading: "Risk Overview",
          content: "Our AI scanned your entire book for withdrawal patterns, contact gaps, and life event signals. 14 clients have been flagged as at-risk for attrition or requiring urgent follow-up.",
        },
        {
          heading: "High Priority — Action Required",
          type: "table",
          headers: ["Client", "Risk Signal", "Last Contact", "AUM at Risk"],
          rows: [
            ["Smith, Patricia",  "Large withdrawal ($120K CMA)",  "61 days",  "$1.2M"],
            ["Johnson, Marcus",  "No contact in 90+ days",        "94 days",  "$890K"],
            ["Rodriguez, Ana",   "Estate change signal detected",  "28 days",  "$2.1M"],
            ["Lee, Jennifer",    "RMD not taken — deadline near",  "45 days",  "$670K"],
            ["Brown, Thomas",    "New employer detected (Finra)",  "12 days",  "$440K"],
          ],
        },
        {
          heading: "Recommended Actions",
          type: "bullets",
          items: [
            "Call Smith immediately — withdrawal may signal dissatisfaction",
            "Schedule Johnson annual review — 94-day gap is high churn risk",
            "Confirm Rodriguez beneficiary changes with estate attorney",
            "Process Lee RMD before December 31 deadline",
            "Connect with Brown re: rollover opportunity from new employer",
          ],
        },
      ],
    },
  };

  const fallback = {
    title: agentName,
    summary: `Agent completed successfully for ${subject}.`,
    sections: [
      {
        heading: "Results",
        content: `${agentName} completed analysis of ${subject} on ${ts}. Results are available for review.`,
      },
      {
        heading: "Key Findings",
        type: "stats",
        stats: [
          { label: "Records Analyzed", value: isBook ? "352" : "1", color: "blue" },
          { label: "Findings", value: "3", color: "teal" },
          { label: "Actions Needed", value: "2", color: "amber" },
        ],
      },
    ],
  };

  const content = templates[agentId] || fallback;
  return { ...content, agentId, agentName, clientName, scope, generatedAt: ts, subject };
}

// ── Section renderers ─────────────────────────────────────────────────────────
function StatsSection({ stats }) {
  const C = useTheme();
  const clr = { teal: C.teal, blue: C.accent, amber: C.amberText };
  const bg  = { teal: C.tealBg, blue: C.accentBg, amber: C.amberBg };
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ flex: 1, background: bg[s.color] || C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: clr[s.color] || C.text }}>{s.value}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function TableSection({ headers, rows }) {
  const C = useTheme();
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: C.surface2 }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, color: C.textDim, fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? C.surface2 : "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentBg}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? C.surface2 : "transparent"}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "9px 14px", color: j === 0 ? C.text : j === 2 ? "#E06030" : C.textMid, fontWeight: j === 0 ? 600 : 400, borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmailSection({ to, subject, body }) {
  const C = useTheme();
  return (
    <div style={{ border: `1px solid ${C.accentBorder}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ background: C.accentBg, padding: "10px 14px", borderBottom: `1px solid ${C.accentBorder}` }}>
        <div style={{ fontSize: 11, color: C.textDim }}>To: <span style={{ color: C.text, fontWeight: 500 }}>{to}</span></div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Subject: <span style={{ color: C.text, fontWeight: 600 }}>{subject}</span></div>
      </div>
      <div style={{ padding: 14, background: C.surface2, fontSize: 12, color: C.textMid, lineHeight: 1.8, whiteSpace: "pre-line" }}>{body}</div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <button style={{ padding: "6px 14px", background: C.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Send via Outlook</button>
        <button style={{ padding: "6px 12px", background: "transparent", color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Edit Draft</button>
        <button style={{ padding: "6px 12px", background: "transparent", color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Log to Salesforce</button>
      </div>
    </div>
  );
}

// ── Main ReportViewer ─────────────────────────────────────────────────────────
export default function ReportViewer({ report, onClose, onPin }) {
  const C = useTheme();
  const [pinned, setPinned] = useState(false);

  if (!report) return null;

  function handlePin() {
    setPinned(true);
    if (onPin) onPin(report);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "min(900px, 92vw)", height: "85vh", background: C.surface, borderRadius: 14, display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", overflow: "hidden", animation: "rvIn 0.25s ease" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: C.surface2 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: C.accentBg, border: `1px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={17} color={C.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.title}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
              {report.subject} · Generated {report.generatedAt}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={handlePin} disabled={pinned}
              style={{ padding: "6px 12px", background: pinned ? C.surface2 : C.accentBg, color: pinned ? C.textDim : C.accent, border: `1px solid ${pinned ? C.border : C.accentBorder}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: pinned ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              <Star size={12} fill={pinned ? C.textDim : "none"} />{pinned ? "Pinned to Home" : "Pin to Home"}
            </button>
            <button style={{ padding: "6px 12px", background: "transparent", color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={12} />Export PDF
            </button>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textDim }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Summary banner */}
        <div style={{ padding: "12px 20px", background: C.tealBg, borderBottom: `1px solid ${C.tealBorder}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <CheckCircle size={16} color={C.teal} />
          <span style={{ fontSize: 13, color: C.teal, fontWeight: 500 }}>{report.summary}</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {(report.sections || []).map((section, i) => (
            <div key={i}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 4, height: 16, background: C.accent, borderRadius: 2, display: "inline-block" }} />
                {section.heading}
              </div>
              {!section.type && <p style={{ margin: 0, fontSize: 13, color: C.textMid, lineHeight: 1.75 }}>{section.content}</p>}
              {section.type === "table"   && <TableSection headers={section.headers} rows={section.rows} />}
              {section.type === "stats"   && <StatsSection stats={section.stats} />}
              {section.type === "email"   && <EmailSection to={section.to} subject={section.subject} body={section.body} />}
              {section.type === "bullets" && (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {section.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 13, color: C.textMid, lineHeight: 1.75, padding: "2px 0" }}>
                      <span style={{ color: C.accent, fontWeight: 600 }}>→ </span>{item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "center", background: C.surface2, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
          <span style={{ fontSize: 11, color: C.textHint }}>Auto-saved to Reports tab</span>
        </div>
      </div>
      <style>{`@keyframes rvIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
