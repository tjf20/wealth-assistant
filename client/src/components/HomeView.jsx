// client/src/components/HomeView.jsx
// Home — the new landing tab. Reintroduces the "morning brief + carousel" idea
// from the old MyCanvasView, but the carousel is no longer a catalog of
// pre-built dashboard tiles: besides two always-on static tiles (Book of
// Business, Market Summary), every other card is the live output of a
// Workspace the FA explicitly configured (via Command Center's "Configure"
// action) to show on Home — optionally on a recurring schedule, so it's
// ready every morning without anyone having hand-built a dashboard for it.
// "Pin to Home" reports (formerly surfaced inside Insights) live here too.

import { useState, useEffect, useMemo } from "react";
import {
  Sun, TrendingUp, TrendingDown, Mail, AlertCircle, Bot,
  Activity, Pin, X, ExternalLink, Clock, ChevronRight, Plus,
} from "lucide-react";
import { useTheme } from "../theme.js";

const PRODUCER = "702-1782";

function computeStats(clients) {
  const mine = (clients||[]).filter(c => c.producerId === PRODUCER);
  const totalAUM = mine.reduce((s,c)=>s+(c.accounts||[]).reduce((a,ac)=>a+(ac.netValue||0),0),0);
  return { totalAUM, clients: mine.filter(c=>c.cp==="C").length };
}

function fmt(n) {
  if (n>=1e9) return `$${(n/1e9).toFixed(2)}B`;
  if (n>=1e6) return `$${(n/1e6).toFixed(1)}M`;
  return `$${Math.round(n/1e3)}K`;
}

function fmtSchedule(sch) {
  if (!sch) return null;
  return `${sch.freq==="daily"?"Daily":"Weekly"} · ${sch.time||"07:00"}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Static market snapshot — demo data, matches the rest of the app's demo posture
const MARKET_INDICES = [
  { label:"S&P 500",  value:"5,712.34",  chg:"+0.62%", up:true  },
  { label:"Nasdaq",   value:"18,203.11", chg:"+0.81%", up:true  },
  { label:"10Y Yield",value:"4.21%",     chg:"-0.03",  up:false },
];

// ── Morning Brief strip — always-on, not configurable ─────────────────────────
function MorningBrief({ C, insights }) {
  const alerts = insights.filter(i=>i.severity==="high").slice(0,3);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14, marginBottom:22 }}>
      {/* Market snapshot */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
          <Activity size={14} color={C.amber}/>
          <span style={{ fontSize:12, fontWeight:700, color:C.text }}>Market Snapshot</span>
        </div>
        {MARKET_INDICES.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:i<MARKET_INDICES.length-1?`1px solid ${C.border}`:"none" }}>
            <span style={{ fontSize:12, color:C.textMid }}>{m.label}</span>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:12, fontFamily:"monospace", color:C.text }}>{m.value}</span>
              <span style={{ fontSize:11, color:m.up?C.teal:C.coral, display:"flex", alignItems:"center", gap:2 }}>
                {m.up?<TrendingUp size={10}/>:<TrendingDown size={10}/>}{m.chg}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Today's alerts — pulled from the same feed as Insights */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
          <AlertCircle size={14} color={C.coral}/>
          <span style={{ fontSize:12, fontWeight:700, color:C.text }}>Today's Alerts</span>
        </div>
        {!alerts.length ? (
          <div style={{ fontSize:12, color:C.textDim }}>Nothing urgent — nice.</div>
        ) : alerts.map(a=>(
          <div key={a.id} style={{ fontSize:12, color:C.textMid, padding:"5px 0", borderBottom:`1px solid ${C.border}`, lineHeight:1.4 }}>{a.title}</div>
        ))}
      </div>

      {/* Client email summary — demo digest, same posture as the rest of the app */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
          <Mail size={14} color={C.blue}/>
          <span style={{ fontSize:12, fontWeight:700, color:C.text }}>Client Email Summary</span>
        </div>
        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>
          6 client emails overnight — 2 need a reply today (Addison, Tianna asked about year-end tax loss timing; Barber, Titus confirmed his RMD amount).
        </div>
      </div>
    </div>
  );
}

// ── Static tiles ────────────────────────────────────────────────────────────
function BookOfBusinessTile({ C, stats }) {
  return (
    <div style={{ minWidth:220, background:C.tealBg, border:`1px solid ${C.tealBorder}`, borderRadius:12, padding:16, flexShrink:0 }}>
      <div style={{ fontSize:10, color:C.teal, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:6 }}>Book of Business</div>
      <div style={{ fontSize:24, fontWeight:700, color:C.teal, fontFamily:"monospace" }}>{fmt(stats.totalAUM)}</div>
      <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{stats.clients} active clients</div>
    </div>
  );
}

function MarketSummaryTile({ C }) {
  return (
    <div style={{ minWidth:220, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16, flexShrink:0 }}>
      <div style={{ fontSize:10, color:C.textDim, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:6 }}>Market Summary</div>
      {MARKET_INDICES.slice(0,2).map((m,i)=>(
        <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"3px 0" }}>
          <span style={{ color:C.textMid }}>{m.label}</span>
          <span style={{ color:m.up?C.teal:C.coral, fontFamily:"monospace" }}>{m.chg}</span>
        </div>
      ))}
    </div>
  );
}

// ── FA-configured workspace card ───────────────────────────────────────────
function WorkspaceCard({ C, project, onOpen }) {
  const latest = (project.results||[])[0];
  const schedLabel = fmtSchedule(project.schedule);
  return (
    <div onClick={()=>onOpen(project)}
      style={{ minWidth:220, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16, flexShrink:0, cursor:"pointer", transition:"border-color .15s" }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <Bot size={13} color={C.accent}/>
        <span style={{ fontSize:12, fontWeight:700, color:C.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{project.name}</span>
      </div>
      {schedLabel && (
        <div style={{ fontSize:10, color:C.accent, marginBottom:8, display:"flex", alignItems:"center", gap:4 }}>
          <Clock size={9}/>Refreshes {schedLabel}
        </div>
      )}
      {latest ? (
        <div style={{ fontSize:11, color:C.textMid, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {latest.status==="running" || latest.summary==="Running…"
            ? (latest.status==="running" ? "Running…" : "Complete — open to view.")
            : (latest.summary || "Complete — open to view.")}
        </div>
      ) : (
        <div style={{ fontSize:11, color:C.textDim }}>Not run yet.</div>
      )}
      <div style={{ marginTop:10, fontSize:11, color:C.accent, display:"flex", alignItems:"center", gap:4 }}>
        Open Workspace<ChevronRight size={11}/>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HomeView({
  advisorName, allClients, projects=[], onOpenWorkspace, onGoToCommandCenter,
  pinnedReports=[], onViewReport, onUnpinReport,
}) {
  const C = useTheme();
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    fetch("/api/insights").then(r=>r.json()).then(d=>setInsights(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  const stats = useMemo(()=>computeStats(allClients), [allClients]);
  const pinnedWorkspaces = (projects||[]).filter(p=>p.pinnedToHome);
  const firstName = (advisorName||"").split(" ")[0] || "there";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", background:C.bg }}>
      <div style={{ padding:"16px 24px 12px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Sun size={18} color={C.amber}/>
          <div style={{ fontSize:18, fontWeight:700, color:C.text }}>{greeting()}, {firstName}</div>
        </div>
        <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>
          {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"18px 24px" }}>
        <MorningBrief C={C} insights={insights}/>

        {/* Pinned reports — "Pin to Home" */}
        {pinnedReports.length>0 && (
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
        )}

        {/* Carousel */}
        <div style={{ fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>
          Your Day
        </div>
        <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:8 }}>
          <BookOfBusinessTile C={C} stats={stats}/>
          <MarketSummaryTile C={C}/>
          {pinnedWorkspaces.map(p=>(
            <WorkspaceCard key={p.id} C={C} project={p} onOpen={onOpenWorkspace}/>
          ))}
          <div onClick={onGoToCommandCenter}
            style={{ minWidth:170, border:`1px dashed ${C.border2}`, borderRadius:12, padding:16, flexShrink:0, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:C.textDim }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.textDim;}}>
            <Plus size={18}/>
            <span style={{ fontSize:11, fontWeight:600, textAlign:"center" }}>Configure an Assistant<br/>for Home</span>
          </div>
        </div>
        {!pinnedWorkspaces.length && (
          <div style={{ fontSize:11, color:C.textDim, marginTop:10 }}>
            Nothing configured yet — head to Command Center and hit the Home icon on any Assistant to add it here.
          </div>
        )}
      </div>
    </div>
  );
}
