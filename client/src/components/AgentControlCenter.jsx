// client/src/components/AgentControlCenter.jsx
import { useState } from "react";
import { Play, Calendar, Pause, Clock, CheckCircle, Download, FileText, RotateCcw, Briefcase, Users, ArrowLeft, Search, Monitor, Edit, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { useTheme } from "../theme.js";
import { generateReportContent } from "./ReportViewer.jsx";
import clientsData from "../data/clients.json";

const CLIENTS = Array.isArray(clientsData) ? clientsData : [];

function ScopeBadges({ scope }) {
  const C = useTheme();
  const book = <span key="b" style={{ fontSize:9, padding:"2px 6px", borderRadius:8, fontWeight:600, background:C.bookBg, color:C.bookText, border:`1px solid ${C.bookBorder}`, display:"inline-flex", alignItems:"center", gap:3 }}><Briefcase size={8}/>Book</span>;
  const ind  = <span key="i" style={{ fontSize:9, padding:"2px 6px", borderRadius:8, fontWeight:600, background:C.indBg,  color:C.indText,  border:`1px solid ${C.indBorder}`,  display:"inline-flex", alignItems:"center", gap:3 }}><Users size={8}/>Individual</span>;
  if (scope==="both") return <span style={{display:"flex",gap:4}}>{book}{ind}</span>;
  if (scope==="book") return book;
  if (scope==="individual") return ind;
  return null;
}

// ── Agent Detail (drill-down) ─────────────────────────────────────────────────
function AgentDetail({ agent, workstationClient, onBack, onRun, onSchedule }) {
  const C = useTheme();
  const [scope, setScope] = useState(agent.scope==="individual"?"individual":"book");
  const [clientQ, setClientQ] = useState("");
  const [chosen, setChosen]   = useState(workstationClient||null);

  function fmtAUM(accounts) {
    const t=(Array.isArray(accounts)?accounts:[]).reduce((s,a)=>s+(a.netValue||0),0);
    return t>=1e6?`$${(t/1e6).toFixed(1)}M`:`$${(t/1e3).toFixed(0)}K`;
  }
  const filtered = clientQ ? CLIENTS.filter(c=>c.name.toLowerCase().includes(clientQ.toLowerCase())).slice(0,6) : [];
  const inp = { width:"100%", padding:"7px 10px", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontFamily:"inherit", background:C.surface2, color:C.text, outline:"none" };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0, background:C.topbar }}>
        <button onClick={onBack} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 10px", color:C.textDim, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:12, fontFamily:"inherit" }}>
          <ArrowLeft size={13}/>Back
        </button>
        <div style={{flex:1}}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{agent.name}</div>
          <div style={{ fontSize:11, color:C.textDim, marginTop:1 }}>{agent.desc}</div>
        </div>
        <ScopeBadges scope={agent.scope}/>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:24 }}>
        {agent.scope==="both" && (
          <div style={{marginBottom:20}}>
            <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:8 }}>Run scope</div>
            <div style={{display:"flex",gap:10}}>
              {["book","individual"].map(s=>(
                <label key={s} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", border:`1px solid ${scope===s?C.accentBorder:C.border}`, borderRadius:8, cursor:"pointer", background:scope===s?C.accentBg:C.surface2, flex:1 }}>
                  <input type="radio" name="scope" value={s} checked={scope===s} onChange={()=>setScope(s)} style={{accentColor:C.accent}}/>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{s==="book"?"Book of Business":"Individual Client"}</div>
                    <div style={{ fontSize:10, color:C.textDim }}>{s==="book"?"Runs across all 352 clients":"Runs for one selected client"}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {(scope==="individual"||agent.scope==="individual") && (
          <div style={{marginBottom:20}}>
            <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:8 }}>Select client</div>
            {workstationClient && (
              <button onClick={()=>setChosen(workstationClient)}
                style={{ width:"100%", padding:"10px 14px", marginBottom:8, background:chosen?.clientId===workstationClient.clientId?C.accentBg:C.surface2, border:`1px solid ${chosen?.clientId===workstationClient.clientId?C.accentBorder:C.border}`, borderRadius:8, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                <Monitor size={14} color={C.accent}/>
                <div style={{flex:1}}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{workstationClient.name}</div>
                  <div style={{ fontSize:10, color:C.textDim }}>Workstation client · {fmtAUM(workstationClient.accounts)}</div>
                </div>
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:8, background:"#F0FDF4", color:"#15803D", border:"1px solid #BBF7D0", fontWeight:600 }}>✓ Synced</span>
              </button>
            )}
            <div style={{position:"relative",marginBottom:4}}>
              <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.textDim }}/>
              <input value={clientQ} onChange={e=>setClientQ(e.target.value)} placeholder="Search clients…" style={{...inp, paddingLeft:30}}/>
            </div>
            {filtered.length>0 && (
              <div style={{ border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", marginTop:4 }}>
                {filtered.map((c,i)=>{
                  const aum=(c.accounts||[]).reduce((s,a)=>s+(a.netValue||0),0);
                  const aumStr=aum>=1e6?`$${(aum/1e6).toFixed(1)}M`:`$${(aum/1e3).toFixed(0)}K`;
                  return (
                    <div key={c.clientId} onClick={()=>{setChosen(c);setClientQ("");}}
                      style={{ padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none", background:chosen?.clientId===c.clientId?C.accentBg:"transparent" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.surface2}
                      onMouseLeave={e=>e.currentTarget.style.background=chosen?.clientId===c.clientId?C.accentBg:"transparent"}>
                      <div style={{flex:1}}>
                        <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{c.name}</div>
                        <div style={{ fontSize:10, color:C.textDim }}>{c.type} · {(c.accounts||[]).length} accounts · {aumStr}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {chosen && (
              <div style={{ marginTop:8, padding:"10px 12px", background:C.accentBg, border:`1px solid ${C.accentBorder}`, borderRadius:8, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>
                  {String(chosen.name||"").split(",")[0].trim().slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{chosen.name}</div>
                  <div style={{ fontSize:10, color:C.textDim }}>{chosen.type} · {fmtAUM(chosen.accounts)}</div>
                </div>
                <button onClick={()=>setChosen(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim }}><ArrowLeft size={12}/></button>
              </div>
            )}
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onRun(agent,{scope,client:chosen})}
            disabled={scope==="individual"&&!chosen}
            style={{ flex:1, padding:10, background:C.accent, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:scope==="individual"&&!chosen?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:scope==="individual"&&!chosen?0.5:1 }}>
            <Play size={14}/>Run Now
          </button>
          <button onClick={()=>onSchedule(agent,{scope,client:chosen})}
            style={{ flex:1, padding:10, background:"transparent", color:C.accent, border:`1px solid ${C.accentBorder}`, borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <Calendar size={14}/>Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline schedule form ──────────────────────────────────────────────────────
function ScheduleForm({ agent, onConfirm, onCancel }) {
  const C = useTheme();
  const [scope,setScope]=useState(agent.scope==="individual"?"individual":"book");
  const [freq,setFreq]=useState("one-time");
  const [date,setDate]=useState("");
  const [time,setTime]=useState("08:00");
  const [notes,setNotes]=useState("");
  const inp={width:"100%",padding:"5px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:11,fontFamily:"inherit",background:C.surface,color:C.text};
  return (
    <div style={{ background:C.scheduleBg, border:`1px solid ${C.scheduleBorder}`, borderRadius:10, padding:14, marginBottom:12 }}>
      <div style={{ fontSize:12, fontWeight:600, color:C.scheduleTitle, marginBottom:12, display:"flex", alignItems:"center", gap:5 }}><Calendar size={14}/>Schedule: {agent.name}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <div><label style={{ fontSize:11, color:C.textDim, marginBottom:3, display:"block" }}>Scope</label>
          <select value={scope} onChange={e=>setScope(e.target.value)} style={inp}>
            {(agent.scope==="both"||agent.scope==="book")&&<option value="book">Book of Business</option>}
            {(agent.scope==="both"||agent.scope==="individual")&&<option value="individual">Individual Client</option>}
          </select></div>
        <div><label style={{ fontSize:11, color:C.textDim, marginBottom:3, display:"block" }}>Frequency</label>
          <select value={freq} onChange={e=>setFreq(e.target.value)} style={inp}>
            <option value="one-time">One-time</option><option value="daily">Daily</option>
            <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
          </select></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <div><label style={{ fontSize:11, color:C.textDim, marginBottom:3, display:"block" }}>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp}/></div>
        <div><label style={{ fontSize:11, color:C.textDim, marginBottom:3, display:"block" }}>Time</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} style={inp}/></div>
      </div>
      <div style={{marginBottom:10}}><label style={{ fontSize:11, color:C.textDim, marginBottom:3, display:"block" }}>Notes</label><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Q2 tax cycle" style={inp}/></div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>date&&onConfirm({scope,freq,date,time,notes})} disabled={!date}
          style={{ padding:"6px 14px", background:C.accent, color:"#fff", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:date?"pointer":"not-allowed", fontFamily:"inherit", opacity:date?1:0.6 }}>Confirm Schedule</button>
        <button onClick={onCancel} style={{ padding:"6px 14px", background:"transparent", color:C.textDim, border:`1px solid ${C.border}`, borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentCard({ agent, runningIds, scheduledIds, onRun, onSchedule, onDrillDown }) {
  const C = useTheme();
  const isRunning   = !!runningIds[agent.id];
  const isScheduled = !!scheduledIds[agent.id];
  return (
    <div style={{ background:C.surface, border:`1px solid ${isRunning?C.teal:C.border}`, borderRadius:10, padding:13, transition:"border-color 0.2s", animation:isRunning?"accPulse 2s ease-in-out infinite":"none" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
        <div onClick={()=>onDrillDown(agent)} style={{ fontSize:12, fontWeight:600, color:C.accent, lineHeight:1.35, flex:1, marginRight:8, cursor:"pointer", textDecoration:"underline" }} title="Click to configure and run">{agent.name}</div>
        <ScopeBadges scope={agent.scope}/>
      </div>
      <div style={{ fontSize:11, color:C.textDim, lineHeight:1.55, marginBottom:8 }}>{agent.desc}</div>
      <div style={{ fontSize:10, color:agent.lastRunState==="running"?C.teal:C.textDim, marginBottom:10, display:"flex", alignItems:"center", gap:4 }}>
        {agent.lastRunState==="running"?<><span style={{ width:6, height:6, borderRadius:"50%", background:C.teal, display:"inline-block", animation:"accDot 1.2s infinite" }}/>Running now</>:
         agent.scheduledFrequency?<><RotateCcw size={10}/>{`Runs ${agent.scheduledFrequency} · ${agent.lastRun}`}</>:
         agent.lastRun?<><Clock size={10}/>Last run: {agent.lastRun}</>:<><Clock size={10}/>Never run</>}
        {isScheduled&&<span style={{ marginLeft:6, background:C.amberBg, color:C.amberText, border:`1px solid ${C.amberBorder}`, borderRadius:8, padding:"1px 6px", fontSize:9, fontWeight:600 }}>Scheduled</span>}
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>onRun(agent)} disabled={isRunning||!agent.runnable}
          style={{ padding:"5px 10px", background:isRunning?C.tealBg:C.accent, color:isRunning?C.teal:"#fff", border:isRunning?`1px solid ${C.tealBorder}`:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:isRunning||!agent.runnable?"default":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4, opacity:!agent.runnable?0.5:1 }}>
          {isRunning?<><Pause size={10}/>Running…</>:<><Play size={10}/>Run Now</>}
        </button>
        <button onClick={()=>onSchedule(agent.id)} style={{ padding:"5px 10px", background:"transparent", color:C.accent, border:`1px solid ${C.accentBorder}`, borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4 }}>
          <Calendar size={10}/>{agent.scheduledFrequency?"Edit Schedule":"Schedule"}
        </button>
      </div>
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ job, onViewReport, onDelete, onRestart, onPause }) {
  const C = useTheme();
  const isScheduled = job.status==="scheduled";
  const style = {
    running:   {bg:C.tealBg,   border:C.tealBorder,   text:C.teal,      label:"Running"   },
    done:      {bg:C.accentBg, border:C.accentBorder,  text:C.accent,    label:"Complete"  },
    queued:    {bg:C.surface2, border:C.border,         text:C.textDim,   label:"Queued"    },
    failed:    {bg:C.dangerBg, border:C.dangerBorder,   text:C.danger,    label:"Failed"    },
    scheduled: {bg:C.amberBg,  border:C.amberBorder,    text:C.amberText, label:"Scheduled" },
    paused:    {bg:C.surface2, border:C.border2,        text:C.textDim,   label:"Paused"    },
  };
  const s = style[job.status]||style.queued;
  return (
    <div style={{ background:isScheduled?C.amberBg:C.surface, border:`1px solid ${isScheduled?C.amberBorder:C.border}`, borderRadius:10, padding:"11px 12px", display:"flex", gap:10 }}>
      <div style={{ width:9, height:9, borderRadius:"50%", background:s.text, flexShrink:0, marginTop:4, animation:job.status==="running"?"accDot 1.2s infinite":"none" }}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{job.agentName||job.name}</span>
          <span style={{ fontSize:9, padding:"2px 7px", borderRadius:8, fontWeight:700, background:s.bg, color:s.text, border:`1px solid ${s.border}`, textTransform:"uppercase", letterSpacing:".04em" }}>{s.label}</span>
        </div>
        {/* Client name — the key requirement */}
        <div style={{ fontSize:11, color:C.textMid, marginTop:2 }}>
          {job.clientName
            ? <><span style={{ fontWeight:600, color:C.text }}>{job.clientName}</span> <span style={{color:C.textDim}}>· Individual</span></>
            : job.scope==="book" ? "Book of Business (352 clients)"
            : job.scope||"Book of Business"}
        </div>
        <div style={{ fontSize:10, color:C.textHint, marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
          <Clock size={10}/>
          {isScheduled
            ? <><strong style={{color:C.amberText}}>{new Date(job.scheduledAt||Date.now()).toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {job.time||"08:00"}</strong></>
            : job.startedAt?new Date(job.startedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"Pending"
          }
        </div>
        {job.status==="done" && (
          <button onClick={()=>onViewReport&&onViewReport(job)}
            style={{ marginTop:6, padding:"4px 10px", background:C.accentBg, color:C.accent, border:`1px solid ${C.accentBorder}`, borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
            <ExternalLink size={10}/>View Full Report
          </button>
        )}
      </div>
      <div style={{ display:"flex", gap:5, flexShrink:0, alignItems:"flex-start" }}>
        {job.status==="running"&&<button onClick={()=>onPause&&onPause(job)} title="Pause" style={{ padding:"3px 7px", background:C.surface, color:C.textDim, border:`1px solid ${C.border}`, borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}><Pause size={11}/></button>}
        {(job.status==="done"||job.status==="failed")&&<button onClick={()=>onRestart&&onRestart(job)} title="Re-run" style={{ padding:"3px 7px", background:C.surface, color:C.textDim, border:`1px solid ${C.border}`, borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}><RefreshCw size={11}/></button>}
        <button onClick={()=>onDelete&&onDelete(job)} title="Remove" style={{ padding:"3px 7px", background:C.surface, color:C.danger, border:`1px solid ${C.dangerBorder}`, borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}><Trash2 size={11}/></button>
      </div>
    </div>
  );
}

// ── Reports panel ─────────────────────────────────────────────────────────────
function ReportsPanel({ reports, onView }) {
  const C = useTheme();
  if (!reports?.length) return <div style={{ padding:"40px 0", textAlign:"center", fontSize:13, color:C.textDim }}>No saved reports yet. Run an agent to get started.</div>;
  const colors=[C.accent,C.teal,"#F97316","#A855F7"];
  const bgs=[C.accentBg,C.tealBg,"#FFF7ED","#F5F3FF"];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {reports.map((r,i)=>(
        <div key={r.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12, display:"flex", gap:10, alignItems:"flex-start" }}>
          <div style={{ width:32, height:32, borderRadius:8, background:bgs[i%4], display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><FileText size={15} color={colors[i%4]}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{r.name}</div>
            {r.projectName&&<div style={{ fontSize:11, color:C.textDim, marginTop:1 }}>{r.projectName}</div>}
            <div style={{ fontSize:10, color:C.textHint, marginTop:3, display:"flex", alignItems:"center", gap:4 }}><Clock size={10}/>{new Date(r.savedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
          </div>
          <div style={{display:"flex",gap:5,flexShrink:0}}>
            <button onClick={()=>onView&&onView(r.result||r)}
              style={{ padding:"4px 9px", background:C.accentBg, color:C.accent, border:`1px solid ${C.accentBorder}`, borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4 }}>
              <ExternalLink size={10}/>View
            </button>
            <button style={{ padding:"4px 8px", background:"transparent", color:C.textDim, border:`1px solid ${C.border}`, borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}><Download size={11}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AgentControlCenter({ agentData, liveJobs=[], reports, onDeleteReport, workstationClient, onViewReport }) {
  const C = useTheme();
  const [tab,         setTab]        = useState("agents");
  const [scopeFilter, setScope]      = useState("all");
  const [schedulingId,setSchedulingId]=useState(null);
  const [drillAgent,  setDrillAgent] = useState(null);
  const [runningIds,  setRunning]    = useState({});
  const [scheduledJobs,setScheduled] = useState([]);
  const [scheduledIds, setSchedIds]  = useState({});
  const [toast,        setToast]     = useState(null);

  const allAgents = Object.entries(agentData||{}).filter(([k])=>k.startsWith("sub-ag-")).flatMap(([,items])=>items.filter(i=>i.runnable));
  const filtered  = scopeFilter==="all"?allAgents:scopeFilter==="book"?allAgents.filter(a=>a.scope==="book"||a.scope==="both"):allAgents.filter(a=>a.scope==="individual"||a.scope==="both");

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(null),4000);}

  async function handleRun(agent, opts={}) {
    setRunning(p=>({...p,[agent.id]:true}));
    setDrillAgent(null); setTab("activity");
    showToast(`${agent.name} is running — see Activity`);
    setTimeout(()=>{
      setRunning(p=>{const n={...p};delete n[agent.id];return n;});
      showToast(`${agent.name} complete`);
    }, 3500);
  }

  function handleScheduleConfirm(agent, details) {
    const job={scheduleId:`sched-${Date.now()}`,name:agent.name,agentId:agent.id,scope:details.scope,frequency:details.freq,scheduledAt:new Date(details.date).toISOString(),time:details.time,notes:details.notes,status:"scheduled",createdAt:new Date().toISOString()};
    setScheduled(p=>[job,...p]); setSchedIds(p=>({...p,[agent.id]:true}));
    setSchedulingId(null); setTab("activity");
    showToast(`${agent.name} scheduled for ${details.date} · ${details.time}`);
  }

  // Merge live jobs (from WealthAssistant) + local scheduled jobs
  const allJobs = [...liveJobs, ...scheduledJobs];

  function handleViewReport(job) {
    // Generate report content from job info and open viewer
    const content = generateReportContent(job.agentId, job.agentName, job.clientName, job.scope||"individual");
    if (onViewReport) onViewReport(content);
  }

  const TAB=(key,label,badge)=>(
    <div onClick={()=>setTab(key)} style={{ padding:"9px 16px", fontSize:12, cursor:"pointer", color:tab===key?C.accent:C.textDim, borderBottom:`2px solid ${tab===key?C.accent:"transparent"}`, fontWeight:tab===key?600:400, display:"flex", alignItems:"center", gap:5 }}>
      {label}{badge>0&&<span style={{ background:"#DC2626", color:"#fff", fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:8 }}>{badge}</span>}
    </div>
  );

  if (drillAgent) return (
    <AgentDetail agent={drillAgent} workstationClient={workstationClient}
      onBack={()=>setDrillAgent(null)} onRun={handleRun}
      onSchedule={(agent)=>{setDrillAgent(null);setSchedulingId(agent.id);}}/>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <style>{`@keyframes accPulse{0%,100%{box-shadow:0 0 0 0 rgba(45,190,138,0)}50%{box-shadow:0 0 0 4px rgba(45,190,138,.12)}}@keyframes accDot{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      <div style={{ padding:"14px 20px 0", flexShrink:0 }}>
        <div style={{ fontSize:18, fontWeight:700, color:C.text }}>Agent Control Center</div>
        <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>Run, schedule, and monitor your intelligent agents</div>
      </div>

      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, margin:"10px 20px 0", flexShrink:0 }}>
        {TAB("agents","Agents",0)}
        {TAB("activity","Activity",liveJobs.filter(j=>j.status==="running").length)}
        {TAB("reports","Reports",0)}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"14px 20px" }}>
        {toast&&<div style={{ background:C.tealBg, border:`1px solid ${C.tealBorder}`, borderRadius:8, padding:"9px 12px", marginBottom:12, fontSize:11, color:C.teal, display:"flex", alignItems:"center", gap:7 }}><CheckCircle size={14}/>{toast}</div>}

        {/* AGENTS */}
        {tab==="agents"&&(
          <>
            {schedulingId&&allAgents.find(a=>a.id===schedulingId)&&(
              <ScheduleForm agent={allAgents.find(a=>a.id===schedulingId)}
                onConfirm={d=>handleScheduleConfirm(allAgents.find(a=>a.id===schedulingId),d)}
                onCancel={()=>setSchedulingId(null)}/>
            )}
            <div style={{ display:"flex", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:2, marginBottom:14, width:"fit-content" }}>
              {["all","book","individual"].map(k=>(
                <button key={k} onClick={()=>setScope(k)}
                  style={{ padding:"4px 12px", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:scopeFilter===k?600:400, background:scopeFilter===k?C.surface:"transparent", color:scopeFilter===k?C.text:C.textDim, border:"none" }}>
                  {k==="all"?"All agents":k==="book"?"Book":"Individual"}
                </button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:10 }}>
              {filtered.map(a=>(
                <AgentCard key={a.id} agent={a} runningIds={runningIds} scheduledIds={scheduledIds}
                  onRun={handleRun} onSchedule={id=>setSchedulingId(schedulingId===id?null:id)}
                  onDrillDown={setDrillAgent}/>
              ))}
            </div>
          </>
        )}

        {/* ACTIVITY */}
        {tab==="activity"&&(
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:11, color:C.textDim }}>Recent & upcoming agent jobs</div>
            </div>
            {!allJobs.length
              ? <div style={{ padding:"40px 0", textAlign:"center", fontSize:13, color:C.textDim }}>No recent activity. Run an agent to get started.</div>
              : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {allJobs.map((job,i)=>(
                    <ActivityRow key={job.jobId||job.scheduleId||i} job={job}
                      onViewReport={handleViewReport}
                      onDelete={()=>setScheduled(p=>p.filter(j=>j.scheduleId!==job.scheduleId))}
                      onRestart={()=>handleRun({id:job.agentId,name:job.agentName,runnable:true,scope:job.scope},{clientName:job.clientName})}
                      onPause={()=>{}}/>
                  ))}
                </div>
            }
          </>
        )}

        {/* REPORTS */}
        {tab==="reports"&&(
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:11, color:C.textDim }}>Completed agent output — click View to open full report</div>
              <button style={{ padding:"4px 10px", background:C.accent, color:"#fff", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Export All</button>
            </div>
            <ReportsPanel reports={reports} onView={r=>onViewReport&&onViewReport(r)}/>
          </>
        )}
      </div>
    </div>
  );
}
