// client/src/components/MyCanvasView.jsx
// Uses CSS custom properties for full theme support.
// "Pin to Home" reports appear as cards in Add Card modal.
// Hero card uses --c-hero-* vars so it reads cleanly in light mode.

import { useState } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, RefreshCw,
  BarChart2, Users, TrendingUp, Activity, X, Star,
  DollarSign, UserPlus, ArrowRight, AlertCircle, FileText, Trash2,
} from "lucide-react";
import clientsData from "../data/clients.json";

const CLIENTS   = Array.isArray(clientsData) ? clientsData : [];
const PRODUCER  = "702-1782";
const STORE_KEY = "wma_canvas_v2";

// ── CSS vars with dark fallbacks ──────────────────────────────────────────────
const C = {
  bg:          "var(--c-bg,          #0a0b0d)",
  surface:     "var(--c-surface,     #0f1014)",
  surface2:    "var(--c-surface2,    #13151e)",
  surface3:    "var(--c-surface3,    #181a22)",
  border:      "var(--c-border,      #1e2029)",
  border2:     "var(--c-border2,     #2a2d3a)",
  text:        "var(--c-text,        #eceef5)",
  textMid:     "var(--c-textMid,     #b0b8d0)",
  textMuted:   "var(--c-textMuted,   #8a8fa8)",
  textDim:     "var(--c-textDim,     #7a7e94)",
  blue:        "var(--c-blue,        #7db8ff)",
  blueBg:      "var(--c-blueBg,      #0e1e38)",
  blueBorder:  "var(--c-blueBorder,  #2a4a8a)",
  teal:        "var(--c-teal,        #2dbe8a)",
  tealBg:      "var(--c-tealBg,      #0a2820)",
  tealBorder:  "var(--c-tealBorder,  #1a6a50)",
  amber:       "var(--c-amber,       #e09040)",
  amberBg:     "var(--c-amberBg,     #221800)",
  amberBorder: "var(--c-amberBorder, #5a3a10)",
  purple:      "var(--c-purple,      #a882ff)",
  purpleBg:    "var(--c-purpleBg,    #180f30)",
  purpleBorder:"var(--c-purpleBorder,#4a3080)",
  coral:       "var(--c-coral,       #f07850)",
  coralBg:     "var(--c-coralBg,     #221008)",
  coralBorder: "var(--c-coralBorder, #6a3020)",
  // Hero card — separate vars so light theme can override without affecting everything else
  heroBg:      "var(--c-hero-bg,     linear-gradient(135deg,#0a3020 0%,#0f1014 100%))",
  heroBorder:  "var(--c-hero-border, #1a6a50)",
  heroText:    "var(--c-hero-text,   #2dbe8a)",
  heroSub:     "var(--c-hero-sub,    rgba(45,190,138,.65))",
  heroBadge:   "var(--c-hero-badge,  rgba(45,190,138,.15))",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function computeStats() {
  const mine    = CLIENTS.filter(c => c.producerId === PRODUCER);
  const totalAUM = mine.reduce((s,c) => s+(c.accounts||[]).reduce((a,ac)=>a+(ac.netValue||0),0), 0);
  const managed  = mine.reduce((s,c) => s+(c.accounts||[]).filter(a=>a.managedPledged==="Managed").reduce((a,ac)=>a+(ac.netValue||0),0), 0);
  const cash     = totalAUM - managed;
  const clients  = mine.filter(c=>c.cp==="C").length;
  const prospects= mine.filter(c=>c.cp==="P").length;
  const accounts = mine.reduce((s,c)=>s+(c.accounts||[]).length,0);
  const avgAUM   = clients>0 ? totalAUM/clients : 0;
  return { totalAUM, managed, cash, clients, prospects, accounts, avgAUM };
}

function fmt(n, d=2) {
  if (n>=1e9) return `$${(n/1e9).toFixed(d)}B`;
  if (n>=1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (n>=1e3) return `$${(n/1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

// ── SVG Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color, width=180, height=48 }) {
  if (!data||data.length<2) return null;
  const min=Math.min(...data), max=Math.max(...data), r=max-min||1;
  const pts=data.map((v,i)=>[(i/(data.length-1))*width, height-((v-min)/r)*(height-6)-3]);
  const line=pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible"}}>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={color} fillOpacity=".12"/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={color} stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}

// ── CARD CATALOG ──────────────────────────────────────────────────────────────
const CARD_CATALOG = [
  { id:"book-of-business",    title:"Book of Business",   icon:Users,       color:C.teal,   desc:"AUM, clients, prospects & AI recommendations" },
  { id:"client-acquisition",  title:"Client Acquisition", icon:UserPlus,    color:C.blue,   desc:"Prospect pipeline and conversion metrics" },
  { id:"investment-insights", title:"Investment Insights", icon:TrendingUp,  color:C.amber,  desc:"Tax loss, rebalancing, and ESG opportunities" },
  { id:"market-summary",      title:"Market Summary",      icon:Activity,    color:C.purple, desc:"Indices, sector performance, market intel" },
  { id:"practice-kpis",       title:"Practice KPIs",       icon:BarChart2,   color:C.blue,   desc:"Revenue, retention, compliance metrics" },
  { id:"at-risk-alerts",      title:"At-Risk Alerts",      icon:AlertCircle, color:C.coral,  desc:"Clients with withdrawal or contact gaps" },
];

const DEFAULT_SESSION = { id:"session-default", name:"Morning Briefing", cards:["book-of-business","client-acquisition","investment-insights"] };

// ── Book of Business card ─────────────────────────────────────────────────────
function BookOfBusinessCard({ stats }) {
  const mPct  = stats.totalAUM>0 ? (stats.managed/stats.totalAUM*100) : 60.4;
  const cPct  = 100 - mPct;
  const idle  = stats.cash * 0.77;
  const trend = [4.8,4.95,5.1,5.05,5.22,5.38,5.42,5.35,5.41,5.48,5.49,5.53];
  const cf    = [{v:240,l:"Jun"},{v:-80,l:"Jul"},{v:320,l:"Aug"},{v:-120,l:"Sep"},{v:410,l:"Oct"},{v:280,l:"Nov"},{v:520,l:"Dec"}];

  return (
    <div style={{ padding:20, height:"100%", overflowY:"auto", background:C.bg }}>

      {/* ── Hero AUM — uses CSS hero vars, theme-aware */}
      <div style={{ background:C.heroBg, border:`1px solid ${C.heroBorder}`, borderRadius:14, padding:"20px 24px", marginBottom:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, opacity:.3 }}>
          <Sparkline data={trend} color={C.heroText} width={200} height={80}/>
        </div>
        <div style={{ fontSize:11, color:C.heroText, fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", marginBottom:6 }}>TOTAL BOOK AUM</div>
        <div style={{ fontSize:38, fontWeight:700, color:C.heroText, fontFamily:"monospace", letterSpacing:"-.02em", marginBottom:8 }}>{fmt(stats.totalAUM)}</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11, background:C.heroBadge, color:C.heroText, border:`1px solid ${C.heroBorder}`, borderRadius:20, padding:"2px 10px", fontWeight:600 }}>▲ 8.3% YTD</span>
          <span style={{ fontSize:11, color:C.heroSub }}>James Miller · {PRODUCER}</span>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"CLIENTS",   value:stats.clients,  sub:`${Math.round(stats.clients*.8)} active`,         clr:C.blue   },
          { label:"PROSPECTS", value:stats.prospects, sub:"23 high priority",                               clr:C.purple },
          { label:"ACCOUNTS",  value:stats.accounts.toLocaleString(), sub:`${Math.round(stats.accounts*.61)} managed`, clr:C.teal   },
          { label:"AVG AUM",   value:fmt(stats.avgAUM,1), sub:"per client",                                 clr:C.amber  },
        ].map((m,i)=>(
          <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.textDim, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:m.clr, fontFamily:"monospace" }}>{m.value}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* AUM Breakdown + Cash Flow */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.textDim, letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>AUM BREAKDOWN</div>
          {[
            { label:"MANAGED",  value:fmt(stats.managed), pct:mPct.toFixed(1),                          clr:C.teal  },
            { label:"CASH",     value:fmt(stats.cash),    pct:cPct.toFixed(1),                           clr:C.blue  },
            { label:"IDLE CMA", value:fmt(idle),          pct:(idle/stats.totalAUM*100).toFixed(1),      clr:C.amber },
          ].map((r,i)=>(
            <div key={i} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:r.clr, display:"inline-block" }}/>
                  <span style={{ fontSize:11, color:C.textMuted }}>{r.label}</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:r.clr, fontFamily:"monospace" }}>{r.value}</span>
                  <span style={{ fontSize:11, color:C.textDim }}>{r.pct}%</span>
                </div>
              </div>
              <div style={{ height:6, background:C.surface2, borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${r.pct}%`, height:"100%", background:r.clr, borderRadius:3, opacity:.7 }}/>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.textDim, letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>NET CASH FLOW (12MO)</div>
          <svg width="100%" height="80" viewBox="0 0 240 80">
            {cf.map((d,i)=>{
              const h=Math.abs(d.v)/520*60, x=i*34+4, pos=d.v>=0;
              return <g key={i}><rect x={x} y={pos?40-h:40} width={26} height={h} rx="2" fill={pos?"#2dbe8a":"#e06030"} fillOpacity=".8"/><text x={x+13} y={78} textAnchor="middle" fontSize="8" fill={C.textDim}>{d.l}</text></g>;
            })}
            <line x1="0" y1="40" x2="240" y2="40" stroke={C.border} strokeWidth="1" strokeDasharray="2,3"/>
          </svg>
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:C.textDim, letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>AI RECOMMENDATIONS</div>
        {[
          { icon:"⚠", badge:"Urgent",      clr:C.coral,  bg:C.coralBg,  text:"14 at-risk clients flagged",       sub:"Large withdrawals or contact gaps detected" },
          { icon:"$", badge:"Opportunity", clr:C.amber,  bg:C.amberBg,  text:`${fmt(idle)} idle cash opportunity`,sub:`${Math.round(stats.accounts*.3)} CMA accounts eligible for managed transition` },
          { icon:"📅",badge:"Action",      clr:C.blue,   bg:C.blueBg,   text:"8 upcoming annual reviews",        sub:"2 clients have incomplete fact sheets" },
        ].map((r,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:r.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{r.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{r.text}</span>
                <span style={{ fontSize:9, padding:"1px 7px", borderRadius:20, background:r.bg, color:r.clr, fontWeight:700 }}>{r.badge}</span>
              </div>
              <div style={{ fontSize:11, color:C.textMuted }}>{r.sub}</div>
            </div>
            <ArrowRight size={14} color={C.textDim}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Client Acquisition card ────────────────────────────────────────────────────
function ClientAcquisitionCard({ stats }) {
  return (
    <div style={{ padding:20, height:"100%", overflowY:"auto", background:C.bg }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total Prospects",   value:stats.prospects, sub:"In pipeline",    clr:C.blue  },
          { label:"High Priority",     value:23,              sub:"Need follow-up", clr:C.coral },
          { label:"Avg Time to Close", value:"47 days",       sub:"This quarter",   clr:C.amber },
        ].map((m,i)=>(
          <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.textDim, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:m.clr, fontFamily:"monospace" }}>{m.value}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:C.textDim, letterSpacing:".06em", textTransform:"uppercase", marginBottom:12 }}>PIPELINE FUNNEL</div>
      {[
        { label:"New Leads",     value:24, clr:C.blue   },
        { label:"Contacted",     value:18, clr:C.purple },
        { label:"Proposal Sent", value:9,  clr:C.amber  },
        { label:"In Review",     value:4,  clr:C.teal   },
        { label:"Closed / Won",  value:2,  clr:C.teal   },
      ].map((s,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ fontSize:12, color:C.textMuted, width:110, flexShrink:0 }}>{s.label}</div>
          <div style={{ flex:1, height:22, background:C.surface2, borderRadius:5, overflow:"hidden" }}>
            <div style={{ width:`${(s.value/24)*100}%`, height:"100%", background:s.clr, borderRadius:5, opacity:.7 }}/>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:s.clr, width:24, textAlign:"right" }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Investment Insights card ──────────────────────────────────────────────────
function InvestmentInsightsCard() {
  return (
    <div style={{ padding:20, height:"100%", overflowY:"auto", background:C.bg }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.textDim, letterSpacing:".06em", textTransform:"uppercase", marginBottom:14 }}>ACTIVE OPPORTUNITIES</div>
      {[
        { label:"Tax-Loss Opportunities",   value:"$87.4K",   badge:"14 accounts",  clr:C.teal   },
        { label:"Rebalancing Required",     value:"38 accts", badge:">5% drift",    clr:C.amber  },
        { label:"ESG Screening Flags",      value:"6 clients",badge:"Mismatch",     clr:C.purple },
        { label:"Concentration Risk",       value:"$12.1M",   badge:"Single stock", clr:C.coral  },
      ].map((o,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:8, cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=o.clr}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:3 }}>{o.label}</div>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:`${o.clr}22`, color:o.clr, border:`1px solid ${o.clr}44`, fontWeight:600 }}>{o.badge}</span>
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:o.clr, fontFamily:"monospace" }}>{o.value}</div>
          <ArrowRight size={14} color={C.textDim}/>
        </div>
      ))}
    </div>
  );
}

// ── Pinned Report card ────────────────────────────────────────────────────────
function PinnedReportCard({ pin, onView, onUnpin }) {
  return (
    <div style={{ padding:20, height:"100%", overflowY:"auto", background:C.bg, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:C.blueBg, border:`1px solid ${C.blueBorder}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <FileText size={20} color={C.blue}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:3 }}>{pin.title}</div>
          <div style={{ fontSize:11, color:C.textDim }}>Generated {pin.generatedAt}</div>
        </div>
        <button onClick={onUnpin} title="Unpin from Home"
          style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px", cursor:"pointer", color:C.textDim, display:"flex", alignItems:"center", gap:4, fontSize:11, fontFamily:"inherit" }}>
          <Trash2 size={11}/>Unpin
        </button>
      </div>

      {pin.summary && (
        <div style={{ background:C.tealBg, border:`1px solid ${C.tealBorder}`, borderRadius:10, padding:14, fontSize:13, color:C.teal, lineHeight:1.6 }}>
          {pin.summary}
        </div>
      )}

      {pin.content?.stats?.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {pin.content.stats.slice(0,4).map((s,i)=>(
            <div key={i} style={{ background:s.bg||C.surface2, border:`1px solid ${s.border||C.border}`, borderRadius:9, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:s.color||C.teal, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:s.color||C.teal, fontFamily:"monospace" }}>{s.value}</div>
              {s.sub&&<div style={{ fontSize:10, color:C.textDim, marginTop:2 }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <button onClick={onView}
        style={{ padding:"10px 20px", background:C.blue, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:"auto" }}>
        <FileText size={15}/>View Full Report
      </button>
    </div>
  );
}

// ── Generic placeholder card ──────────────────────────────────────────────────
function GenericCard({ entry }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:14, background:C.bg }}>
      <div style={{ width:56, height:56, borderRadius:16, background:C.surface2, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {entry?.icon ? <entry.icon size={26} color={entry.color||C.blue}/> : <BarChart2 size={26} color={C.blue}/>}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:6 }}>{entry?.title||"Card"}</div>
        <div style={{ fontSize:12, color:C.textMuted, maxWidth:260 }}>{entry?.desc||""}</div>
      </div>
    </div>
  );
}

// ── Add Card Modal ────────────────────────────────────────────────────────────
function AddCardModal({ existingIds, onAdd, onClose, pinnedReports }) {
  const available = CARD_CATALOG.filter(c => !existingIds.includes(c.id));
  const availPinned = (pinnedReports||[]).filter(p => !existingIds.includes(p.id));
  const nothing = !available.length && !availPinned.length;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24, width:460, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 24px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Add Card</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim }}><X size={16}/></button>
        </div>

        {nothing && <div style={{ fontSize:13, color:C.textDim, textAlign:"center", padding:"20px 0" }}>All cards are on your canvas.</div>}

        {available.length > 0 && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:C.textDim, letterSpacing:".07em", textTransform:"uppercase", marginBottom:8 }}>Dashboard Cards</div>
            {available.map(c=>(
              <div key={c.id} onClick={()=>{onAdd(c.id);onClose();}}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:9, marginBottom:7, cursor:"pointer" }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.surface2;e.currentTarget.style.borderColor=C.blue;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;}}>
                <div style={{ width:32, height:32, borderRadius:8, background:C.surface2, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <c.icon size={16} color={c.color||C.blue}/>
                </div>
                <div><div style={{ fontSize:13, fontWeight:600, color:C.text }}>{c.title}</div><div style={{ fontSize:11, color:C.textMuted }}>{c.desc}</div></div>
              </div>
            ))}
          </>
        )}

        {availPinned.length > 0 && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:C.textDim, letterSpacing:".07em", textTransform:"uppercase", margin:"14px 0 8px" }}>
              ★ Pinned Reports
            </div>
            {availPinned.map(p=>(
              <div key={p.id} onClick={()=>{onAdd(p.id);onClose();}}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", border:`1px solid ${C.blueBorder}`, borderRadius:9, marginBottom:7, cursor:"pointer", background:C.blueBg }}
                onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                <div style={{ width:32, height:32, borderRadius:8, background:C.surface2, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <FileText size={16} color={C.blue}/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{p.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>Pinned report · {p.generatedAt}</div>
                </div>
                <Star size={12} color={C.blue} style={{marginLeft:"auto",flexShrink:0}} fill={C.blue}/>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Session picker ────────────────────────────────────────────────────────────
function SessionPicker({ sessions, current, onCreate, onSwitch, onDelete, onClose }) {
  const [name, setName] = useState("");
  return (
    <div style={{ position:"absolute", top:52, left:16, zIndex:50, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:14, width:260, boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
      {sessions.map(s=>(
        <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 8px", borderRadius:7, cursor:"pointer", background:current.id===s.id?C.surface2:"transparent" }}>
          <div onClick={()=>{onSwitch(s);onClose();}} style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:current.id===s.id?600:400, color:C.text }}>{s.name}</div>
            <div style={{ fontSize:11, color:C.textDim }}>{s.cards.length} card{s.cards.length!==1?"s":""}</div>
          </div>
          {s.id!=="session-default"&&<button onClick={()=>onDelete(s.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim, fontSize:16 }}>×</button>}
        </div>
      ))}
      <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:8, display:"flex", gap:6 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="New session name…"
          onKeyDown={e=>{if(e.key==="Enter"&&name.trim()){onCreate(name.trim());setName("");onClose();}}}
          style={{ flex:1, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 8px", fontSize:12, color:C.text, outline:"none" }}/>
        <button onClick={()=>{if(name.trim()){onCreate(name.trim());setName("");onClose();}}}
          style={{ padding:"5px 10px", background:C.teal, color:"#fff", border:"none", borderRadius:6, fontSize:12, cursor:"pointer" }}>+</button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MyCanvasView({ onNavigate, pinnedReports=[], onViewReport, onUnpinReport }) {
  const stats = computeStats();

  function loadState() {
    try { const s = localStorage.getItem(STORE_KEY); if (s) return JSON.parse(s); } catch {}
    return { sessions:[{...DEFAULT_SESSION}], currentId:"session-default" };
  }

  const [state,      setState]     = useState(loadState);
  const [cardIdx,    setCardIdx]   = useState(0);
  const [showModal,  setShowModal] = useState(false);
  const [showPicker, setShowPicker]= useState(false);

  function save(next) { setState(next); try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch {} }

  const session   = state.sessions.find(s=>s.id===state.currentId) || state.sessions[0] || {...DEFAULT_SESSION};
  const cardIds   = session.cards || [];
  const total     = cardIds.length;
  const idx       = Math.min(cardIdx, Math.max(0, total-1));
  const currentId = cardIds[idx];

  // Find card definition — check catalog first, then pinned reports
  const catalogEntry  = CARD_CATALOG.find(c=>c.id===currentId);
  const pinnedEntry   = pinnedReports.find(p=>p.id===currentId);

  function nav(dir) {
    if (dir===1&&idx<total-1) setCardIdx(i=>i+1);
    if (dir===-1&&idx>0)      setCardIdx(i=>i-1);
  }
  function addCard(id) {
    const next = {...state, sessions:state.sessions.map(s=>s.id===session.id?{...s,cards:[...s.cards,id]}:s)};
    save(next); setCardIdx(session.cards.length);
  }
  function removeCard() {
    if (total<=1||!confirm(`Remove this card?`)) return;
    const next = {...state, sessions:state.sessions.map(s=>s.id===session.id?{...s,cards:s.cards.filter((_,i)=>i!==idx)}:s)};
    save(next); setCardIdx(Math.max(0,idx-1));
  }
  function createSession(name) {
    const id=`session-${Date.now()}`;
    save({sessions:[...state.sessions,{id,name,cards:["book-of-business"]}],currentId:id});
    setCardIdx(0);
  }
  function switchSession(s) { save({...state,currentId:s.id}); setCardIdx(0); }
  function deleteSession(id) {
    if (!confirm("Delete this session?")) return;
    const next={sessions:state.sessions.filter(s=>s.id!==id),currentId:state.sessions.find(s=>s.id!==id)?.id||"session-default"};
    save(next); setCardIdx(0);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", background:C.bg, position:"relative" }}>

      {/* Topbar */}
      <div style={{ height:52, background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", padding:"0 16px", gap:10, flexShrink:0 }}>
        <button onClick={()=>setShowPicker(o=>!o)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600, color:C.text, fontFamily:"inherit" }}>
          <Activity size={13} color={C.teal}/>{session.name}<ChevronDown size={12} color={C.textDim}/>
        </button>
        <div style={{ fontSize:11, color:C.textDim }}>
          Last updated: {new Date().toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>nav(-1)} disabled={idx===0}
          style={{ width:28,height:28,borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:idx===0?C.textDim:C.textMid,cursor:idx===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <ChevronLeft size={14}/>
        </button>
        <span style={{ fontSize:12, color:C.textDim, minWidth:40, textAlign:"center" }}>
          {total>0?`${idx+1} / ${total}`:"0 / 0"}
        </span>
        <button onClick={()=>nav(1)} disabled={idx>=total-1}
          style={{ width:28,height:28,borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:idx>=total-1?C.textDim:C.textMid,cursor:idx>=total-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <ChevronRight size={14}/>
        </button>
        {total>0&&<>
          <button onClick={()=>{}} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:7,cursor:"pointer",fontSize:12,color:C.textDim,fontFamily:"inherit" }}>
            <RefreshCw size={12}/>Refresh All
          </button>
          <button onClick={removeCard} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:7,cursor:"pointer",fontSize:12,color:C.textDim,fontFamily:"inherit" }}>
            <X size={12}/>Remove
          </button>
        </>}
        <button onClick={()=>setShowModal(true)}
          style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:C.teal,border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,color:"#fff",fontFamily:"inherit" }}>
          <Plus size={12}/>Add Card
        </button>
      </div>

      {/* Dots */}
      {total>1&&(
        <div style={{ display:"flex",justifyContent:"center",gap:6,padding:"8px 0 0",flexShrink:0,background:C.bg }}>
          {cardIds.map((_,i)=>(
            <button key={i} onClick={()=>setCardIdx(i)}
              style={{ width:8,height:8,borderRadius:"50%",background:i===idx?C.teal:C.border,border:"none",cursor:"pointer",padding:0,transition:"background .15s" }}/>
          ))}
        </div>
      )}

      {/* Card */}
      <div style={{ flex:1, overflow:"hidden" }}>
        {total===0 ? (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16 }}>
            <div style={{ width:64,height:64,borderRadius:16,background:C.surface2,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Star size={28} color={C.textDim}/>
            </div>
            <div style={{ fontSize:16, color:C.textMuted }}>No cards on this canvas yet.</div>
            <button onClick={()=>setShowModal(true)}
              style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 20px",background:C.teal,border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:600,color:"#fff",fontFamily:"inherit" }}>
              <Plus size={14}/>Add your first card
            </button>
          </div>
        ) : (
          <div style={{ height:"100%", overflow:"hidden" }}>
            {/* Pinned report card */}
            {pinnedEntry && (
              <PinnedReportCard
                pin={pinnedEntry}
                onView={()=>onViewReport&&onViewReport(pinnedEntry.content)}
                onUnpin={()=>{onUnpinReport&&onUnpinReport(pinnedEntry.id);removeCard();}}
              />
            )}
            {/* Standard cards */}
            {!pinnedEntry && currentId==="book-of-business"    && <BookOfBusinessCard   stats={stats}/>}
            {!pinnedEntry && currentId==="client-acquisition"  && <ClientAcquisitionCard stats={stats}/>}
            {!pinnedEntry && currentId==="investment-insights" && <InvestmentInsightsCard/>}
            {!pinnedEntry && !["book-of-business","client-acquisition","investment-insights"].includes(currentId) && (
              <GenericCard entry={catalogEntry}/>
            )}
          </div>
        )}
      </div>

      {showPicker&&<SessionPicker sessions={state.sessions} current={session} onCreate={createSession} onSwitch={switchSession} onDelete={deleteSession} onClose={()=>setShowPicker(false)}/>}
      {showModal&&<AddCardModal existingIds={cardIds} onAdd={addCard} onClose={()=>setShowModal(false)} pinnedReports={pinnedReports}/>}
    </div>
  );
}
