// client/src/components/AgentControlCenter.jsx
// Fixes:
//   • Run Now on individual/both-scope agents → opens AgentDetail (client picker) first
//   • Reports tab View button uses getReportContent(r.id) to load full report content
//   • All "Project" language removed

import { useState, useEffect } from "react";
import {
  Play, Calendar, Pause, Clock, CheckCircle, Download, FileText,
  RotateCcw, Briefcase, Users, ArrowLeft, Search, ExternalLink,
  Trash2, RefreshCw, X, ChevronRight,
} from "lucide-react";
import { useTheme } from "../theme.js";
import { generateReportContent } from "./ReportViewer.jsx";
import clientsData from "../data/clients.json";

const CLIENTS = Array.isArray(clientsData) ? clientsData : [];

function fmtAUM(accounts) {
  const t=(Array.isArray(accounts)?accounts:[]).reduce((s,a)=>s+(a.netValue||0),0);
  return t>=1e9?`$${(t/1e9).toFixed(2)}B`:t>=1e6?`$${(t/1e6).toFixed(1)}M`:`$${(t/1e3).toFixed(0)}K`;
}

// ── Scope badge ───────────────────────────────────────────────────────────────────
function ScopeBadge({ scope }) {
  const C = useTheme();
  const book = <span key="b" style={{ fontSize:9,padding:"2px 6px",borderRadius:8,fontWeight:600,background:C.accentBg,color:C.accent,border:`1px solid ${C.accentBorder}`,display:"inline-flex",alignItems:"center",gap:3 }}><Briefcase size={8}/>Book</span>;
  const ind  = <span key="i" style={{ fontSize:9,padding:"2px 6px",borderRadius:8,fontWeight:600,background:C.tealBg,color:C.teal,border:`1px solid ${C.tealBorder}`,display:"inline-flex",alignItems:"center",gap:3 }}><Users size={8}/>Individual</span>;
  if (scope==="both")       return <span style={{display:"flex",gap:4}}>{book}{ind}</span>;
  if (scope==="book")       return book;
  if (scope==="individual") return ind;
  return null;
}

// ── Agent Detail drill-down (scope + client picker) ────────────────────────────────
function AgentDetail({ agent, workstationClient, onBack, onRun, onSchedule }) {
  const C = useTheme();
  const [scope,   setScope]   = useState(agent.scope==="individual"?"individual":"book");
  const [clientQ, setClientQ] = useState("");
  const [chosen,  setChosen]  = useState(workstationClient||null);
  const filtered = clientQ ? CLIENTS.filter(c=>c.name.toLowerCase().includes(clientQ.toLowerCase())).slice(0,6) : [];
  const needsClient = scope==="individual";
  const canRun = scope==="book" || (needsClient && !!chosen);
  const inp = { width:"100%",padding:"7px 10px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,fontFamily:"inherit",background:C.surface2,color:C.text,outline:"none" };

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",overflow:"hidden" }}>
      <div style={{ padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0,background:C.topbar }}>
        <button onClick={onBack} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",color:C.textDim,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"inherit" }}>
          <ArrowLeft size={13}/>Back
        </button>
        <div style={{flex:1}}>
          <div style={{ fontSize:15,fontWeight:700,color:C.text }}>{agent.name}</div>
          <div style={{ fontSize:11,color:C.textDim,marginTop:1 }}>{agent.desc}</div>
        </div>
        <ScopeBadge scope={agent.scope}/>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:24 }}>

        {/* Scope selector for "both" agents */}
        {agent.scope==="both"&&(
          <div style={{marginBottom:20}}>
            <div style={{ fontSize:12,fontWeight:600,color:C.text,marginBottom:8 }}>Run scope</div>
            <div style={{display:"flex",gap:10}}>
              {["book","individual"].map(s=>(
                <label key={s} style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",border:`1px solid ${scope===s?C.accentBorder:C.border}`,borderRadius:8,cursor:"pointer",background:scope===s?C.accentBg:C.surface2,flex:1 }}>
                  <input type="radio" name="scope" value={s} checked={scope===s} onChange={()=>setScope(s)} style={{accentColor:C.accent}}/>
                  <div>
                    <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{s==="book"?"Book of Business":"Individual Client"}</div>
                    <div style={{ fontSize:10,color:C.textDim }}>{s==="book"?"All 352 clients":"One selected client"}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Client picker for individual scope */}
        {needsClient&&(
          <div style={{marginBottom:20}}>
            <div style={{ fontSize:12,fontWeight:600,color:C.text,marginBottom:8 }}>Select client</div>
            {workstationClient&&(
              <button onClick={()=>setChosen(workstationClient)}
                style={{ width:"100%",padding:"10px 14px",marginBottom:8,background:chosen?.clientId===workstationClient.clientId?C.accentBg:C.surface2,border:`1px solid ${chosen?.clientId===workstationClient.clientId?C.accentBorder:C.border}`,borderRadius:8,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,textAlign:"left" }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0 }}>
                  {String(workstationClient.name||"").split(",")[0].trim().slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{workstationClient.name}</div>
                  <div style={{ fontSize:10,color:C.textDim }}>Chat workstation · {fmtAUM(workstationClient.accounts)}</div>
                </div>
                <span style={{ fontSize:9,padding:"2px 7px",borderRadius:8,background:"#F0FDF4",color:"#15803D",border:"1px solid #BBF7D0",fontWeight:600 }}>✓ Synced</span>
              </button>
            )}
            <div style={{position:"relative",marginBottom:4}}>
              <Search size={13} style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.textDim }}/>
              <input value={clientQ} onChange={e=>setClientQ(e.target.value)} placeholder="Search by name…" style={{...inp,paddingLeft:30}}/>
            </div>
            {filtered.length>0&&(
              <div style={{ border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",marginTop:4 }}>
                {filtered.map((c,i)=>(
                  <div key={c.clientId} onClick={()=>{setChosen(c);setClientQ("");}}
                    style={{ padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",background:chosen?.clientId===c.clientId?C.accentBg:"transparent" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.surface2}
                    onMouseLeave={e=>e.currentTarget.style.background=chosen?.clientId===c.clientId?C.accentBg:"transparent"}>
                    <div style={{ width:28,height:28,borderRadius:"50%",background:C.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.accent,flexShrink:0 }}>
                      {String(c.name||"").split(",")[0].trim().slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{c.name}</div>
                      <div style={{ fontSize:10,color:C.textDim }}>{c.type} · {(c.accounts||[]).length} accounts · {fmtAUM(c.accounts)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {chosen&&(
              <div style={{ marginTop:8,padding:"10px 12px",background:C.accentBg,border:`1px solid ${C.accentBorder}`,borderRadius:8,display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0 }}>
                  {String(chosen.name||"").split(",")[0].trim().slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{chosen.name}</div>
                  <div style={{ fontSize:10,color:C.textDim }}>{chosen.type} · {fmtAUM(chosen.accounts)}</div>
                </div>
                <button onClick={()=>setChosen(null)} style={{ background:"none",border:"none",cursor:"pointer",color:C.textDim }}><X size={12}/></button>
              </div>
            )}
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onRun(agent,{scope,client:chosen})} disabled={!canRun}
            style={{ flex:1,padding:10,background:canRun?C.accent:C.surface2,color:canRun?"#fff":C.textDim,border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:canRun?"pointer":"not-allowed",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            <Play size={14}/>Run Now
          </button>
          <button onClick={()=>onSchedule(agent,{scope,client:chosen})}
            style={{ flex:1,padding:10,background:"transparent",color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            <Calendar size={14}/>Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule form ───────────────────────────────────────────────────────────────────
function ScheduleForm({ agent, onConfirm, onCancel }) {
  const C = useTheme();
  const [scope,setScope]=useState(agent.scope==="individual"?"individual":"book");
  const [freq,setFreq]=useState("one-time");
  const [date,setDate]=useState("");
  const [time,setTime]=useState("08:00");
  const [notes,setNotes]=useState("");
  const inp={width:"100%",padding:"5px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:11,fontFamily:"inherit",background:C.surface,color:C.text};
  return (
    <div style={{ background:C.accentBg,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:14,marginBottom:12 }}>
      <div style={{ fontSize:12,fontWeight:600,color:C.accent,marginBottom:12,display:"flex",alignItems:"center",gap:5 }}><Calendar size={14}/>Schedule: {agent.name}</div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
        <div><label style={{ fontSize:11,color:C.textDim,marginBottom:3,display:"block" }}>Scope</label>
          <select value={scope} onChange={e=>setScope(e.target.value)} style={inp}>
            {(agent.scope==="both"||agent.scope==="book")&&<option value="book">Book of Business</option>}
            {(agent.scope==="both"||agent.scope==="individual")&&<option value="individual">Individual Client</option>}
          </select></div>
        <div><label style={{ fontSize:11,color:C.textDim,marginBottom:3,display:"block" }}>Frequency</label>
          <select value={freq} onChange={e=>setFreq(e.target.value)} style={inp}>
            <option value="one-time">One-time</option><option value="daily">Daily</option>
            <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select></div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
        <div><label style={{ fontSize:11,color:C.textDim,marginBottom:3,display:"block" }}>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp}/></div>
        <div><label style={{ fontSize:11,color:C.textDim,marginBottom:3,display:"block" }}>Time</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} style={inp}/></div>
      </div>
      <div style={{marginBottom:10}}><label style={{ fontSize:11,color:C.textDim,marginBottom:3,display:"block" }}>Notes</label><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Q2 tax cycle" style={inp}/></div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>date&&onConfirm({scope,freq,date,time,notes})} disabled={!date}
          style={{ padding:"6px 14px",background:date?C.accent:C.surface2,color:date?"#fff":C.textDim,border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:date?"pointer":"not-allowed",fontFamily:"inherit" }}>Confirm</button>
        <button onClick={onCancel} style={{ padding:"6px 14px",background:"transparent",color:C.textDim,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Agent card ───────────────────────────────────────────────────────────────────
function AgentCard({ agent, isRunning, isScheduled, onRunOrDrillDown, onSchedule }) {
  const C = useTheme();
  const needsDrillDown = agent.scope==="individual" || agent.scope==="both";
  const btnLabel = isRunning ? "Running…" : needsDrillDown ? "Configure & Run" : "Run Now";

  return (
    <div style={{ background:C.surface,border:`1px solid ${isRunning?C.teal:C.border}`,borderRadius:10,padding:13,transition:"border-color .2s" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
        <div style={{ fontSize:12,fontWeight:600,color:C.accent,lineHeight:1.35,flex:1,marginRight:8 }}>{agent.name}</div>
        <ScopeBadge scope={agent.scope}/>
      </div>
      <div style={{ fontSize:11,color:C.textDim,lineHeight:1.55,marginBottom:8 }}>{agent.desc}</div>
      <div style={{ fontSize:10,color:isRunning?C.teal:C.textDim,marginBottom:10,display:"flex",alignItems:"center",gap:4 }}>
        {isRunning
          ? <><span style={{ width:6,height:6,borderRadius:"50%",background:C.teal,display:"inline-block",animation:"accDot 1.2s infinite" }}/>Running now</>
          : isScheduled
          ? <><RotateCcw size={10}/>Scheduled</>
          : <><Clock size={10}/>Never run</>}
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>onRunOrDrillDown(agent)} disabled={isRunning||!agent.runnable}
          style={{ padding:"5px 10px",background:isRunning?C.tealBg:C.accent,color:isRunning?C.teal:"#fff",border:isRunning?`1px solid ${C.tealBorder}`:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:isRunning||!agent.runnable?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,opacity:!agent.runnable?.5:1 }}>
          {isRunning?<><Pause size={10}/>Running…</>:<><Play size={10}/>{btnLabel}</>}
        </button>
        <button onClick={()=>onSchedule(agent.id)}
          style={{ padding:"5px 10px",background:"transparent",color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4 }}>
          <Calendar size={10}/>Schedule
        </button>
      </div>
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────────
function ActivityRow({ job, onViewReport, onDelete }) {
  const C = useTheme();
  const S = {
    running:   {bg:C.tealBg,  border:C.tealBorder,  text:C.teal,    label:"Running"  },
    done:      {bg:C.accentBg,border:C.accentBorder, text:C.accent,  label:"Complete" },
    queued:    {bg:C.surface2,border:C.border,        text:C.textDim, label:"Queued"   },
    failed:    {bg:C.dangerBg,border:C.dangerBorder,  text:C.danger,  label:"Failed"   },
    scheduled: {bg:C.amberBg, border:C.amberBorder,   text:C.amberText,label:"Scheduled"},
  };
  const s = S[job.status]||S.queued;
  return (
    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 12px",display:"flex",gap:10 }}>
      <div style={{ width:9,height:9,borderRadius:"50%",background:s.text,flexShrink:0,marginTop:4,animation:job.status==="running"?"accDot 1.2s infinite":"none" }}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{ display:"flex",alignItems:"center",gap:7,flexWrap:"wrap" }}>
          <span style={{ fontSize:12,fontWeight:600,color:C.text }}>{job.agentName||job.name}</span>
          <span style={{ fontSize:9,padding:"2px 7px",borderRadius:8,fontWeight:700,background:s.bg,color:s.text,border:`1px solid ${s.border}`,textTransform:"uppercase",letterSpacing:".04em" }}>{s.label}</span>
        </div>
        <div style={{ fontSize:11,color:C.textMid,marginTop:2 }}>
          {job.clientName
            ? <><span style={{ fontWeight:600,color:C.text }}>{job.clientName}</span> <span style={{color:C.textDim}}>· Individual</span></>
            : "Book of Business"}
        </div>
        <div style={{ fontSize:10,color:C.textHint,marginTop:3,display:"flex",alignItems:"center",gap:4 }}>
          <Clock size={10}/>
          {job.startedAt?new Date(job.startedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"Pending"}
        </div>
        {job.status==="done"&&(
          <button onClick={()=>onViewReport&&onViewReport(job)}
            style={{ marginTop:6,padding:"4px 10px",background:C.accentBg,color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5 }}>
            <ExternalLink size={10}/>View Full Report
          </button>
        )}
      </div>
      <button onClick={()=>onDelete&&onDelete(job)} style={{ padding:"3px 7px",background:C.surface,color:C.danger,border:`1px solid ${C.dangerBorder}`,borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit",alignSelf:"flex-start" }}><Trash2 size={11}/></button>
    </div>
  );
}

// ── Reports panel ──────────────────────────────────────────────────────────────────
function ReportsPanel({ reports, onView }) {
  const C = useTheme();
  if (!reports?.length) return <div style={{ padding:"40px 0",textAlign:"center",fontSize:13,color:C.textDim }}>No results yet. Run an Assistant to generate one.</div>;
  const colors=[C.accent,C.teal,"#F97316","#A855F7"];
  const bgs=[C.accentBg,C.tealBg,"#FFF7ED","#F5F3FF"];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
      {reports.map((r,i)=>(
        <div key={r.id} style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:12,display:"flex",gap:10,alignItems:"flex-start" }}>
          <div style={{ width:32,height:32,borderRadius:8,background:bgs[i%4],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <FileText size={15} color={colors[i%4]}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{r.name}</div>
            {r.agentName&&<div style={{ fontSize:11,color:C.textDim,marginTop:1 }}>{r.agentName}</div>}
            {r.summary&&<div style={{ fontSize:11,color:C.textMuted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.summary}</div>}
            <div style={{ fontSize:10,color:C.textHint,marginTop:3,display:"flex",alignItems:"center",gap:4 }}>
              <Clock size={10}/>{new Date(r.savedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
            </div>
          </div>
          <div style={{display:"flex",gap:5,flexShrink:0}}>
            {/* View — uses getReportContent to retrieve full content, falls back to regenerating */}
            <button onClick={()=>onView&&onView(r)}
              style={{ padding:"4px 9px",background:C.accentBg,color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4 }}>
              <ExternalLink size={10}/>View
            </button>
            <button style={{ padding:"4px 8px",background:"transparent",color:C.textDim,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}><Download size={11}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────
export default function AgentControlCenter({ agentData, liveJobs=[], reports, onDeleteReport, workstationClient, onViewReport, getReportContent, initialTab }) {
  const C = useTheme();
  const [tab,          setTab]         = useState(initialTab || "agents");
  const [scopeFilter,  setScope]       = useState("all");
  const [schedulingId, setSchedulingId]= useState(null);
  const [drillAgent,   setDrillAgent]  = useState(null);

  // When a new job is triggered externally (e.g. from Insights NBA), jump to Activity tab
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);
  const [runningIds,   setRunning]     = useState({});
  const [scheduledJobs,setScheduled]   = useState([]);
  const [scheduledIds, setSchedIds]    = useState({});
  const [toast,        setToast]       = useState(null);

  const allAgents = Object.entries(agentData||{}).filter(([k])=>k.startsWith("sub-ag-")).flatMap(([,items])=>items.filter(i=>i.runnable));
  const filtered  = scopeFilter==="all"?allAgents:scopeFilter==="book"?allAgents.filter(a=>a.scope==="book"||a.scope==="both"):allAgents.filter(a=>a.scope==="individual"||a.scope==="both");

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(null),4000);}

  // Run Now: book-scope runs immediately; individual/both opens drill-down
  function handleRunOrDrillDown(agent) {
    if (agent.scope==="book") {
      handleRun(agent, { scope:"book" });
    } else {
      // Open drill-down so user can select a client first
      setDrillAgent(agent);
      setSchedulingId(null);
    }
  }

  async function handleRun(agent, opts={}) {
    setRunning(p=>({...p,[agent.id]:true}));
    setDrillAgent(null);
    setTab("activity");
    showToast(`${agent.name} is running — see Activity tab`);
    setTimeout(()=>{
      setRunning(p=>{const n={...p};delete n[agent.id];return n;});
      showToast(`${agent.name} complete`);
    },3500);
  }

  function handleScheduleConfirm(agent, details) {
    const job={scheduleId:`sched-${Date.now()}`,name:agent.name,agentId:agent.id,scope:details.scope,frequency:details.freq,scheduledAt:new Date(details.date).toISOString(),time:details.time,notes:details.notes,status:"scheduled",createdAt:new Date().toISOString()};
    setScheduled(p=>[job,...p]);setSchedIds(p=>({...p,[agent.id]:true}));
    setSchedulingId(null);setTab("activity");
    showToast(`${agent.name} scheduled for ${details.date} · ${details.time}`);
  }

  // View from Activity: regenerate from job metadata
  function handleViewFromActivity(job) {
    const content = generateReportContent(job.agentId, job.agentName, job.clientName, job.scope||"individual");
    if (onViewReport) onViewReport(content);
  }

  // View from Reports tab: use stored full content, fall back to regenerating
  function handleViewFromReports(report) {
    // Try to get the full content we stored at save time
    const full = getReportContent ? getReportContent(report.id) : null;
    if (full) {
      onViewReport && onViewReport(full);
      return;
    }
    // Fallback: reconstruct from the saved metadata
    // Map agentName → agentId by searching agentData
    let agentId = "default";
    for (const items of Object.values(agentData||{})) {
      if (!Array.isArray(items)) continue;
      const found = items.find(i => i.name === report.agentName);
      if (found) { agentId = found.id; break; }
    }
    const content = generateReportContent(
      agentId,
      report.agentName || report.name,
      report.projectName || null,
      "individual"
    );
    // Patch in whatever summary/name we saved
    content.title   = report.name || content.title;
    content.summary = report.summary || content.summary;
    onViewReport && onViewReport(content);
  }

  const allJobs = [...liveJobs, ...scheduledJobs];

  const TAB=(key,label,badge)=>(
    <div onClick={()=>setTab(key)} style={{ padding:"9px 16px",fontSize:12,cursor:"pointer",color:tab===key?C.accent:C.textDim,borderBottom:`2px solid ${tab===key?C.accent:"transparent"}`,fontWeight:tab===key?600:400,display:"flex",alignItems:"center",gap:5 }}>
      {label}{badge>0&&<span style={{ background:"#DC2626",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:8 }}>{badge}</span>}
    </div>
  );

  if (drillAgent) return (
    <AgentDetail agent={drillAgent} workstationClient={workstationClient}
      onBack={()=>setDrillAgent(null)} onRun={handleRun}
      onSchedule={(agent)=>{setDrillAgent(null);setSchedulingId(agent.id);}}/>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",overflow:"hidden" }}>
      <style>{`@keyframes accDot{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      <div style={{ padding:"14px 20px 0",flexShrink:0 }}>
        <div style={{ fontSize:18,fontWeight:700,color:C.text }}>Command Center</div>
        <div style={{ fontSize:12,color:C.textDim,marginTop:2 }}>Run, schedule, and monitor your Assistants</div>
      </div>

      <div style={{ display:"flex",alignItems:"center",borderBottom:`1px solid ${C.border}`,margin:"10px 20px 0",flexShrink:0 }}>
        {TAB("agents","Assistants",0)}
        <ChevronRight size={13} color={C.textDim} style={{flexShrink:0}}/>
        {TAB("activity","Progress",liveJobs.filter(j=>j.status==="running").length)}
        <ChevronRight size={13} color={C.textDim} style={{flexShrink:0}}/>
        {TAB("reports","Results",0)}
      </div>

      <div style={{ flex:1,overflowY:"auto",padding:"14px 20px" }}>
        {toast&&<div style={{ background:C.tealBg,border:`1px solid ${C.tealBorder}`,borderRadius:8,padding:"9px 12px",marginBottom:12,fontSize:11,color:C.teal,display:"flex",alignItems:"center",gap:7 }}><CheckCircle size={14}/>{toast}</div>}

        {/* ── AGENTS */}
        {tab==="agents"&&(
          <>
            {schedulingId&&allAgents.find(a=>a.id===schedulingId)&&(
              <ScheduleForm agent={allAgents.find(a=>a.id===schedulingId)}
                onConfirm={d=>handleScheduleConfirm(allAgents.find(a=>a.id===schedulingId),d)}
                onCancel={()=>setSchedulingId(null)}/>
            )}
            <div style={{ display:"flex",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:2,marginBottom:14,width:"fit-content" }}>
              {["all","book","individual"].map(k=>(
                <button key={k} onClick={()=>setScope(k)}
                  style={{ padding:"4px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:scopeFilter===k?600:400,background:scopeFilter===k?C.surface:"transparent",color:scopeFilter===k?C.text:C.textDim,border:"none" }}>
                  {k==="all"?"All":k==="book"?"Book":"Individual"}
                </button>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10 }}>
              {filtered.map(a=>(
                <AgentCard key={a.id} agent={a} isRunning={!!runningIds[a.id]} isScheduled={!!scheduledIds[a.id]}
                  onRunOrDrillDown={handleRunOrDrillDown}
                  onSchedule={id=>setSchedulingId(schedulingId===id?null:id)}/>
              ))}
            </div>
          </>
        )}

        {/* ── ACTIVITY */}
        {tab==="activity"&&(
          <>
            <div style={{ fontSize:11,color:C.textDim,marginBottom:14 }}>Recent and upcoming Assistant activity</div>
            {!allJobs.length
              ? <div style={{ padding:"40px 0",textAlign:"center",fontSize:13,color:C.textDim }}>No recent activity. Run an Assistant to get started.</div>
              : <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {allJobs.map((job,i)=>(
                    <ActivityRow key={job.jobId||job.scheduleId||i} job={job}
                      onViewReport={handleViewFromActivity}
                      onDelete={()=>setScheduled(p=>p.filter(j=>j.scheduleId!==job.scheduleId))}/>
                  ))}
                </div>
            }
          </>
        )}

        {/* ── REPORTS */}
        {tab==="reports"&&(
          <>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ fontSize:11,color:C.textDim }}>Completed Assistant output — click View to open full report</div>
            </div>
            <ReportsPanel reports={reports} onView={handleViewFromReports}/>
          </>
        )}
      </div>
    </div>
  );
}
