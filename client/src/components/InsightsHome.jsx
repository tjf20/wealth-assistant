// client/src/components/InsightsHome.jsx
// Insights — the sole landing workspace (replaces the old cartoonish "Home" canvas
// and the small bell-icon Insights drawer). Domain groupings are intentionally
// open-ended: add an object to INSIGHT_DOMAINS to introduce a new domain, no other
// changes required. Every card either drills into a real client (Sync to Chat) or
// runs a real Assistant through the same Progress -> Results pipeline as Command
// Center, so nothing here is a dead end.

import { useState, useEffect, useMemo } from "react";
import {
  Lightbulb, TrendingUp, UserPlus, Gift, Map, BarChart2, ShieldCheck, Briefcase,
  X, ChevronRight, Bot, Pin, ExternalLink, RefreshCw, CheckCircle2,
} from "lucide-react";
import { useTheme } from "../theme.js";

const INSIGHT_DOMAINS = [
  { key:"Client Financials", label:"Client Financials", icon:BarChart2,  color:"blue",   desc:"Realized gains, cash balances, tax lots" },
  { key:"Prospecting",       label:"Prospecting",        icon:UserPlus,   color:"purple", desc:"Pipeline, scoring, outreach opportunities" },
  { key:"Client Deepening",  label:"Client Deepening",   icon:Gift,       color:"coral",  desc:"Relationship signals, life events, product fit" },
  { key:"Planning",          label:"Planning",           icon:Map,        color:"teal",   desc:"Retirement, estate, education, tax planning" },
  { key:"Investments",       label:"Investments",        icon:TrendingUp, color:"blue",   desc:"Allocation drift, concentration, rebalancing" },
  { key:"Supervisory",       label:"Supervisory",        icon:ShieldCheck,color:"coral",  desc:"Items needing review or sign-off" },
  { key:"My Practice",       label:"My Practice",        icon:Briefcase,  color:"purple", desc:"Revenue, retention, and book health" },
  // More domains land here as new agentic workflows come online — nothing
  // else in this file needs to change to support them.
];

function findAgentById(agentData, id) {
  for (const items of Object.values(agentData || {})) {
    if (!Array.isArray(items)) continue;
    const f = items.find(i => i.id === id);
    if (f) return f;
  }
  return null;
}

function fmtAUM(accounts) {
  const t = (Array.isArray(accounts) ? accounts : []).reduce((s, a) => s + (a.netValue || 0), 0);
  return t >= 1e9 ? `$${(t/1e9).toFixed(2)}B` : t >= 1e6 ? `$${(t/1e6).toFixed(1)}M` : `$${(t/1e3).toFixed(0)}K`;
}

function timeAgo(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

// ── Practice snapshot strip ─────────────────────────────────────────────────
function PracticeSnapshot({ C }) {
  const stats = [
    { label:"Assets Under Management", value:"$482M", sub:"+3.1% QTD",         color:"blue"   },
    { label:"Active Clients",          value:"352",   sub:"+4 this month",     color:"teal"   },
    { label:"12-mo Retention",         value:"94.2%", sub:"-0.6pt vs. last qtr", color:"amber" },
    { label:"Prospect Pipeline",       value:"18",    sub:"3 high-priority",   color:"purple" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:20 }}>
      {stats.map((s,i)=>(
        <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
          <div style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:".06em", fontWeight:700, marginBottom:6 }}>{s.label}</div>
          <div style={{ fontSize:20, fontWeight:700, color:C.text }}>{s.value}</div>
          <div style={{ fontSize:11, color:C[s.color]||C.textDim, marginTop:2 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ insight, domain, client, onOpen }) {
  const C = useTheme();
  const sevColor = { high:C.coral, info:C.blue, low:C.textDim };
  const domainClr = C[domain.color] || C.accent;
  return (
    <div onClick={()=>onOpen(insight)}
      style={{ background:C.surface, border:`1px solid ${C.border}`, borderLeft:`3px solid ${sevColor[insight.severity]||C.textDim}`, borderRadius:"0 8px 8px 0", padding:"10px 12px", cursor:"pointer", transition:"border-color .15s" }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=domainClr}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:3, lineHeight:1.35 }}>{insight.title}</div>
      <div style={{ fontSize:11, color:C.textDim, lineHeight:1.5, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{insight.body}</div>
      <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:C.textHint, flexWrap:"wrap" }}>
        {client && <span style={{ fontWeight:600, color:C.textMuted }}>{client.name}</span>}
        {client && <span>·</span>}
        <span>{insight.agentSource}</span><span>·</span><span>{timeAgo(insight.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Domain section ────────────────────────────────────────────────────────────
function DomainSection({ domain, insights, clientsById, onOpen }) {
  const C = useTheme();
  const Icon = domain.icon;
  const clr = C[domain.color] || C.accent;
  const bg = C[`${domain.color}Bg`] || C.accentBg;
  const border = C[`${domain.color}Border`] || C.accentBorder;
  if (!insights.length) return null;
  return (
    <div style={{ marginBottom:18, breakInside:"avoid" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:26, height:26, borderRadius:7, background:bg, border:`1px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon size={13} color={clr}/>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{domain.label}</div>
        <span style={{ fontSize:10, color:C.textDim, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:"1px 7px", fontWeight:600 }}>{insights.length}</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {insights.map(ins=>(
          <InsightCard key={ins.id} insight={ins} domain={domain} client={clientsById[ins.clientId]} onOpen={onOpen}/>
        ))}
      </div>
    </div>
  );
}

// ── Detail drawer — logical drilldown into a single insight ──────────────────
function DetailDrawer({ insight, domain, client, agentData, onClose, onRun, onSetWorkstationClient, onDismiss }) {
  const C = useTheme();
  if (!insight) return null;
  const Icon = domain.icon;
  const suggested = insight.suggestedAgentId ? findAgentById(agentData, insight.suggestedAgentId) : null;

  function handleRun() {
    if (!suggested) return;
    if (suggested.scope === "book") {
      onRun(suggested, { scope:"book" });
    } else if (client) {
      onRun(suggested, { scope:"individual", client });
    } else {
      onRun(suggested, { scope:"book" });
    }
    onClose();
  }

  return (
    <div style={{ position:"absolute", top:0, right:0, bottom:0, width:400, maxWidth:"92%", background:C.surface, borderLeft:`1px solid ${C.border}`, zIndex:40, display:"flex", flexDirection:"column", boxShadow:"-8px 0 32px rgba(0,0,0,0.3)" }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <Icon size={15} color={C[domain.color]||C.accent}/>
        <span style={{ fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".06em", flex:1 }}>{domain.label}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim }}><X size={16}/></button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:8 }}>{insight.title}</div>
        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.7, marginBottom:16 }}>{insight.body}</div>
        <div style={{ fontSize:10, color:C.textHint, marginBottom:16 }}>via {insight.agentSource} · {timeAgo(insight.createdAt)}</div>

        {client && (
          <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:12, marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentBg, border:`1px solid ${C.accentBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.accent, flexShrink:0 }}>
              {String(client.name||"").split(",")[0].trim().slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{client.name}</div>
              <div style={{ fontSize:10, color:C.textDim }}>{client.type} · {fmtAUM(client.accounts)}</div>
            </div>
            <button onClick={()=>onSetWorkstationClient(client)}
              style={{ padding:"4px 9px", background:"transparent", color:C.accent, border:`1px solid ${C.accentBorder}`, borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
              Sync to Chat
            </button>
          </div>
        )}

        <div style={{ fontSize:10, fontWeight:700, color:C.textDim, letterSpacing:".07em", textTransform:"uppercase", marginBottom:8 }}>Next Best Action</div>
        {suggested ? (
          <button onClick={handleRun}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:C.accentBg, color:C.accent, border:`1px solid ${C.accentBorder}`, borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginBottom:8 }}>
            <Bot size={13}/><span style={{flex:1, textAlign:"left"}}>{suggested.name}</span><ChevronRight size={13}/>
          </button>
        ) : (
          <div style={{ fontSize:11, color:C.textDim, marginBottom:8 }}>No automated action suggested — handle manually.</div>
        )}
      </div>
      <div style={{ padding:12, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        <button onClick={()=>{onDismiss(insight.id);onClose();}}
          style={{ width:"100%", padding:"8px 12px", background:"transparent", color:C.textDim, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <CheckCircle2 size={13}/>Mark as reviewed
        </button>
      </div>
    </div>
  );
}

// ── Pinned results strip (carried over from the old "Pin to Home" feature) ───
function PinnedStrip({ pinnedReports, onViewReport, onUnpinReport, C }) {
  if (!pinnedReports?.length) return null;
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
        <Pin size={11}/>Pinned Results
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
        {pinnedReports.map(p=>(
          <div key={p.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12, position:"relative" }}>
            <button onClick={()=>onUnpinReport(p.id)} style={{ position:"absolute", top:8, right:8, background:"none", border:"none", color:C.textDim, cursor:"pointer" }}><X size={12}/></button>
            <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:4, paddingRight:16 }}>{p.title}</div>
            {p.summary && <div style={{ fontSize:11, color:C.textDim, marginBottom:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.summary}</div>}
            <button onClick={()=>onViewReport(p.content)}
              style={{ padding:"4px 9px", background:C.accentBg, color:C.accent, border:`1px solid ${C.accentBorder}`, borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4 }}>
              <ExternalLink size={10}/>View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function InsightsHome({
  agentData, allClients, onRunAgent, onSetWorkstationClient,
  pinnedReports, onViewReport, onUnpinReport,
}) {
  const C = useTheme();
  const [insights, setInsights]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [domainFilter, setFilter]     = useState("all");
  const [openInsight, setOpenInsight] = useState(null);

  function load() {
    setLoading(true);
    fetch("/api/insights").then(r=>r.json()).then(d=>{setInsights(Array.isArray(d)?d:[]);setLoading(false);}).catch(()=>setLoading(false));
  }
  useEffect(()=>{ load(); }, []);

  const clientsById = useMemo(()=>{
    const map = {};
    (allClients||[]).forEach(c=>{ map[c.clientId] = c; });
    return map;
  }, [allClients]);

  function dismiss(id) {
    setInsights(prev => prev.filter(i=>i.id!==id));
    fetch(`/api/insights/${id}`, { method:"DELETE" }).catch(()=>{});
  }

  const domains = domainFilter==="all" ? INSIGHT_DOMAINS : INSIGHT_DOMAINS.filter(d=>d.key===domainFilter);
  const openDomain = openInsight ? (INSIGHT_DOMAINS.find(d=>d.key===openInsight.domain) || INSIGHT_DOMAINS[0]) : null;
  const openClient = openInsight ? clientsById[openInsight.clientId] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", position:"relative", background:C.bg }}>

      {/* Header */}
      <div style={{ padding:"16px 24px 12px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:2 }}>
          <Lightbulb size={18} color={C.accent}/>
          <div style={{ fontSize:18, fontWeight:700, color:C.text }}>Insights</div>
          <span style={{ fontSize:11, color:C.textDim, marginLeft:4 }}>{insights.length} items across your book</span>
          <button onClick={load} title="Refresh" style={{ marginLeft:"auto", background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:5, color:C.textDim, cursor:"pointer", display:"flex" }}>
            <RefreshCw size={12}/>
          </button>
        </div>
        <div style={{ fontSize:12, color:C.textDim }}>Everything your Assistants have proactively surfaced — no need to go looking for it.</div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"18px 24px" }}>
        <PracticeSnapshot C={C}/>
        <PinnedStrip pinnedReports={pinnedReports} onViewReport={onViewReport} onUnpinReport={onUnpinReport} C={C}/>

        {/* Domain filter chips */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
          <button onClick={()=>setFilter("all")}
            style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", border:`1px solid ${domainFilter==="all"?C.accentBorder:C.border}`, background:domainFilter==="all"?C.accentBg:C.surface, color:domainFilter==="all"?C.accent:C.textDim }}>
            All Domains
          </button>
          {INSIGHT_DOMAINS.map(d=>(
            <button key={d.key} onClick={()=>setFilter(d.key)}
              style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", border:`1px solid ${domainFilter===d.key?C.accentBorder:C.border}`, background:domainFilter===d.key?C.accentBg:C.surface, color:domainFilter===d.key?C.accent:C.textDim }}>
              {d.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:"center", color:C.textDim, fontSize:13, padding:"40px 0" }}>Loading insights…</div>
        ) : !insights.length ? (
          <div style={{ textAlign:"center", color:C.textDim, fontSize:13, padding:"40px 0" }}>Nothing new right now — check back soon.</div>
        ) : (
          <div style={{ columnCount: domains.length>=3?3:domains.length>=2?2:1, columnGap:20 }}>
            {domains.map(d=>(
              <DomainSection key={d.key} domain={d} insights={insights.filter(i=>(i.domain||"Client Financials")===d.key)} clientsById={clientsById} onOpen={setOpenInsight}/>
            ))}
          </div>
        )}
      </div>

      {openInsight && (
        <DetailDrawer insight={openInsight} domain={openDomain} client={openClient} agentData={agentData}
          onClose={()=>setOpenInsight(null)} onRun={onRunAgent} onSetWorkstationClient={onSetWorkstationClient} onDismiss={dismiss}/>
      )}
    </div>
  );
}
