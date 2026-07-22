// client/src/components/ProjectDetailView.jsx
// Quick Chat column removed — use the main WealthChatPanel instead.
// CSS custom properties for full light/dark theme support.

import { useState, useRef, useEffect, useCallback } from "react";
import { FileText, BarChart2, Plus, Play, X, CheckCircle, BookOpen, ArrowLeft, RotateCcw, ExternalLink } from "lucide-react";
import { generateReportContent } from "./ReportViewer.jsx";

// CSS vars with dark fallbacks
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
};

function fmtSize(b) {
  if (!b) return "—";
  return b < 1024 ? b + " B" : b < 1048576 ? (b/1024).toFixed(1) + " KB" : (b/1048576).toFixed(1) + " MB";
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

// ── Status badge ──────────────────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    running: { bg:C.blueBg,   border:C.blueBorder,   color:C.blue,   label:"● Running"  },
    done:    { bg:C.tealBg,   border:C.tealBorder,   color:C.teal,   label:"✓ Complete" },
    queued:  { bg:C.purpleBg, border:C.purpleBorder, color:C.purple, label:"Queued"     },
    failed:  { bg:C.coralBg,  border:C.coralBorder,  color:C.coral,  label:"Failed"     },
  };
  const s = map[status] || map.queued;
  return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:"nowrap" }}>{s.label}</span>;
}

// ── Add Client Modal ────────────────────────────────────────────────────────────────────────────────────────
function AddClientModal({ open, allClients, existingIds, onAdd, onClose }) {
  const [q, setQ] = useState("");
  if (!open) return null;
  const filtered = allClients.filter(c =>
    !existingIds.has(c.clientId) &&
    (!q.trim() || c.name.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 30);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border2}`, borderRadius:12, padding:24, width:460, maxHeight:"75vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Add Client to Workspace</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted }}><X size={16}/></button>
        </div>
        <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder="Search by name…"
          style={{ padding:"8px 11px", background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:7, fontSize:12, color:C.text, fontFamily:"inherit", outline:"none", marginBottom:10 }}/>
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.length===0
            ? <div style={{ padding:"24px 0", textAlign:"center", fontSize:13, color:C.textDim }}>No clients found</div>
            : filtered.map(c=>(
                <div key={c.clientId} onClick={()=>{onAdd(c);onClose();}}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer", borderBottom:`1px solid ${C.border}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:C.blueBg, border:`1px solid ${C.blueBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.blue, flexShrink:0 }}>
                    {c.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:13, color:C.text, fontWeight:500 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:C.textDim }}>{c.cp==="P"?"Prospect":"Client"} · {c.accounts?.length||0} accounts</div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ── Select Agent Modal ──────────────────────────────────────────────────────────────────────────────────────────────────
function SelectAgentModal({ open, onRun, onClose }) {
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || agents.length) return;
    setLoading(true);
    fetch("/api/agents")
      .then(r=>r.json())
      .then(data=>{
        // Flatten all runnable sub-agents
        const all = [];
        Object.entries(data).forEach(([k,items])=>{
          if (!k.startsWith("sub-ag-")||!Array.isArray(items)) return;
          items.filter(i=>i.runnable).forEach(a=>all.push(a));
        });
        setAgents(all);
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border2}`, borderRadius:12, padding:24, width:520, maxHeight:"75vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Select an Assistant to Run</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted }}><X size={16}/></button>
        </div>
        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
          {loading && <div style={{ textAlign:"center", fontSize:13, color:C.textDim, padding:"24px 0" }}>Loading assistants…</div>}
          {!loading && agents.map(a=>(
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:9, cursor:"pointer" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{a.name}</div>
                <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>{a.desc}</div>
              </div>
              <button onClick={()=>{
                const result = {
                  id:`res-${Date.now()}`, agentId:a.id, agentName:a.name,
                  workflowName:a.name, ranAt:new Date().toISOString(),
                  summary:"Running…", rows:[], status:"running",
                };
                onRun(result); onClose();
              }} style={{ padding:"5px 12px", background:C.blue, color:"#fff", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                <Play size={10}/>Run
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Save to Reports Modal ─────────────────────────────────────────────────────────────────────────────────────────────────
function SaveReportModal({ open, result, projectName, onSave, onClose }) {
  const [name, setName] = useState("");
  function handleSave() { if (name.trim()) { onSave(name.trim(), result); setName(""); onClose(); } }
  if (!open || !result) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border2}`, borderRadius:12, padding:28, width:400, boxShadow:"0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Save to Reports</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer" }}><X size={16}/></button>
        </div>
        <div style={{ fontSize:12, color:C.textDim, marginBottom:16, lineHeight:1.6 }}>
          Saved to the global Reports library — viewable and exportable anytime.
        </div>
        <div style={{ fontSize:12, color:C.textMuted, marginBottom:6 }}>Report name</div>
        <input autoFocus value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onClose();}}
          placeholder={`${result.workflowName} — ${projectName}`}
          style={{ width:"100%", padding:"9px 12px", background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:7, fontSize:13, color:C.text, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:20 }}/>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:6, border:`1px solid ${C.border2}`, background:"transparent", color:C.textMuted, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}
            style={{ padding:"8px 18px", borderRadius:6, border:`1px solid ${name.trim()?C.tealBorder:C.border}`, background:name.trim()?C.tealBg:"transparent", color:name.trim()?C.teal:C.textDim, fontSize:13, fontWeight:600, cursor:name.trim()?"pointer":"not-allowed", fontFamily:"inherit" }}>
            Save Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────
export default function ProjectDetailView({
  project, allClients, onBack,
  onAddClients, onRemoveClient,
  onUploadDocument, onRemoveDocument,
  onRunAgent, onSaveReport, onViewReport,
}) {
  const [selectedResultId,  setSelectedResultId]  = useState(project.results?.[0]?.id || null);
  const [agentModalOpen,    setAgentModalOpen]    = useState(false);
  const [addClientModal,    setAddClientModal]    = useState(false);
  const [saveReportModal,   setSaveReportModal]   = useState({ open:false, result:null });
  const [savedResultIds,    setSavedResultIds]    = useState(new Set());
  const fileRef = useRef(null);

  const existingClientIds = new Set((project.clients||[]).map(c=>c.clientId));
  const selectedResult = (project.results||[]).find(r=>r.id===selectedResultId)||null;

  // Auto-select first result when results change
  useEffect(() => {
    if (!selectedResultId && project.results?.length > 0) {
      setSelectedResultId(project.results[0].id);
    }
  }, [project.results]);

  // Simulate job completion for running results
  useEffect(() => {
    const running = (project.results||[]).filter(r=>r.status==="running");
    running.forEach(r=>{
      const timer = setTimeout(()=>{
        onRunAgent({ id:r.id, status:"done" });
      }, 3500);
      return ()=>clearTimeout(timer);
    });
  }, [project.results?.length]);

  function handleRunAgent(result) {
    onRunAgent(result);
    setSelectedResultId(result.id);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const doc = { id:`doc-${Date.now()}`, name:file.name, size:file.size, uploadedAt:new Date().toISOString() };
    onUploadDocument(doc);
    e.target.value = "";
  }

  function handleSaveReport(name, result) {
    onSaveReport(name, result, project.name);
    setSavedResultIds(prev => new Set([...prev, result.id]));
  }

  function handleReRun(result) {
    const rerun = {
      id: `res-${Date.now()}`,
      agentId: result.agentId,
      agentName: result.agentName,
      workflowName: result.workflowName,
      ranAt: new Date().toISOString(),
      summary: "Running…", rows: [], status: "running",
    };
    onRunAgent(rerun);
    setSelectedResultId(rerun.id);
  }

  function handleViewReport(result) {
    const clientName = (project.clients||[])[0]?.name || null;
    const scope = project.clients?.length === 1 ? "individual" : "book";
    const content = generateReportContent(
      result.agentId || "default",
      result.workflowName || result.agentName,
      clientName,
      scope
    );
    if (onViewReport) onViewReport(content);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", background:C.bg }}>
      <style>{`@keyframes pdBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>

      {/* Header */}
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0, background:C.surface }}>
        <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 10px", color:C.textMuted, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
          <ArrowLeft size={13}/>Back
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{project.name}</div>
          <div style={{ fontSize:11, color:C.textDim }}>
            {(project.clients||[]).length} clients · {(project.documents||[]).length} doc{(project.documents||[]).length!==1?"s":""} · {(project.results||[]).length} result{(project.results||[]).length!==1?"s":""}
          </div>
        </div>
        <button onClick={()=>setAgentModalOpen(true)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:7, border:`1px solid ${C.blueBorder}`, background:C.blueBg, color:C.blue, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          <Play size={12}/>Select Assistant
        </button>
      </div>

      {/* 3-column body (Quick Chat removed — use main WealthChatPanel) */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Col 1 — Clients + Docs */}
        <div style={{ width:200, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>

          {/* Clients */}
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:10, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".08em" }}>Clients</span>
              <button onClick={()=>setAddClientModal(true)}
                style={{ display:"flex", alignItems:"center", gap:3, background:"none", border:`1px solid ${C.border2}`, borderRadius:4, color:C.textMuted, cursor:"pointer", padding:"2px 7px", fontSize:10, fontFamily:"inherit" }}>
                <Plus size={9}/>Add
              </button>
            </div>
            {!(project.clients||[]).length
              ? <div style={{ fontSize:11, color:C.textDim, textAlign:"center", padding:"8px 0" }}>No clients yet</div>
              : (project.clients||[]).map(client=>(
                  <div key={client.clientId} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 6px", borderRadius:5, background:C.surface2, marginBottom:4 }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:C.blueBg, border:`1px solid ${C.blueBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:C.blue, flexShrink:0 }}>
                      {(client.name||"?")[0]}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, color:C.textMid, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{client.name}</div>
                      <div style={{ fontSize:9, color:C.textDim }}>{client.cp==="P"?"Prospect":"Client"}</div>
                    </div>
                    <button onClick={()=>onRemoveClient(client.clientId)} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", display:"flex", padding:1, flexShrink:0 }}>
                      <X size={9}/>
                    </button>
                  </div>
                ))
            }
          </div>

          {/* Documents */}
          <div style={{ padding:"10px 12px", flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:10, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".08em" }}>Documents</span>
              <button onClick={()=>fileRef.current?.click()}
                style={{ display:"flex", alignItems:"center", gap:3, background:"none", border:`1px solid ${C.border2}`, borderRadius:4, color:C.textMuted, cursor:"pointer", padding:"2px 7px", fontSize:10, fontFamily:"inherit" }}>
                <Plus size={9}/>Upload
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.xlsx,.csv,.docx,.txt" onChange={handleFileChange} style={{ display:"none" }}/>
            </div>
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
              {!(project.documents||[]).length
                ? <div style={{ fontSize:11, color:C.textDim, textAlign:"center", lineHeight:1.6 }}>No docs yet.<br/>Upload PDFs or spreadsheets.</div>
                : (project.documents||[]).map(doc=>(
                    <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 6px", borderRadius:5, background:C.surface2 }}>
                      <FileText size={11} color={C.amber} style={{ flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:10, color:C.textMid, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.name}</div>
                        <div style={{ fontSize:9, color:C.textDim }}>{fmtSize(doc.size)}</div>
                      </div>
                      <button onClick={()=>onRemoveDocument(doc.id)} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", display:"flex", padding:1, flexShrink:0 }}>
                        <X size={9}/>
                      </button>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

        {/* Col 2 — Results list */}
        <div style={{ width:185, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ padding:"10px 12px 6px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".08em" }}>Results</span>
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {!(project.results||[]).length
              ? <div style={{ padding:"14px 12px", fontSize:11, color:C.textDim, lineHeight:1.6 }}>No results yet.<br/>Click "Select Assistant" to run.</div>
              : (project.results||[]).map(result=>{
                  const active = selectedResultId===result.id;
                  return (
                    <div key={result.id} onClick={()=>setSelectedResultId(result.id)}
                      style={{ padding:"10px 12px", cursor:"pointer", borderBottom:`1px solid ${C.border}`, borderLeft:`3px solid ${active?C.blue:"transparent"}`, background:active?C.surface2:"transparent", transition:"all .12s" }}
                      onMouseEnter={e=>{if(!active)e.currentTarget.style.background=C.surface;}}
                      onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
                      <div style={{ fontSize:12, color:active?C.text:C.textMid, fontWeight:active?600:400, marginBottom:4, lineHeight:1.3 }}>{result.workflowName}</div>
                      <div style={{ fontSize:10, color:C.textDim, marginBottom:5 }}>{result.agentName?.split(" ")[0]}</div>
                      <StatusBadge status={result.status}/>
                      {savedResultIds.has(result.id) && <div style={{ fontSize:9, color:C.teal, marginTop:4 }}>✓ In Reports</div>}
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Col 3 — Result detail */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {!selectedResult ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:C.textDim }}>
              <BarChart2 size={34} style={{ opacity:.15 }}/>
              <div style={{ fontSize:13 }}>Select a result or run an agent</div>
            </div>
          ) : selectedResult.status==="running" ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:C.blueBg, border:`1px solid ${C.blueBorder}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <BarChart2 size={22} color={C.blue}/>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:14, color:C.text, fontWeight:600, marginBottom:6 }}>{selectedResult.workflowName} is running…</div>
                <div style={{ fontSize:12, color:C.textDim }}>
                  Analyzing {(project.clients||[]).length} client{(project.clients||[]).length!==1?"s":""}
                </div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {["Fetching data","Running analysis","Generating insights"].map((s,i)=>(
                  <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:C.blue, animation:`pdBounce 1s ${i*.2}s infinite ease-in-out` }}/>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {/* Result header */}
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8, flexShrink:0, background:C.surface, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{selectedResult.workflowName}</div>
                  <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>
                    {selectedResult.agentName} · {fmtTime(selectedResult.ranAt)}
                  </div>
                </div>
                <StatusBadge status={selectedResult.status}/>

                {/* View Full Report — opens snazzy ReportViewer */}
                {selectedResult.status==="done" && (
                  <button onClick={()=>handleViewReport(selectedResult)}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:6, border:`1px solid ${C.blueBorder}`, background:C.blueBg, color:C.blue, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    <ExternalLink size={11}/>View Full Report
                  </button>
                )}

                {/* Re-run */}
                {(selectedResult.status==="done"||selectedResult.status==="failed") && (
                  <button onClick={()=>handleReRun(selectedResult)}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textDim, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    <RotateCcw size={11}/>Re-run
                  </button>
                )}

                {/* Save to Reports */}
                {selectedResult.status==="done" && !savedResultIds.has(selectedResult.id)
                  ? <button onClick={()=>setSaveReportModal({open:true,result:selectedResult})}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:6, border:`1px solid ${C.tealBorder}`, background:C.tealBg, color:C.teal, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      <BookOpen size={11}/>Save to Reports
                    </button>
                  : selectedResult.status==="done"
                  ? <span style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", fontSize:12, color:C.teal }}>
                      <CheckCircle size={11}/>Saved
                    </span>
                  : null
                }
              </div>

              {/* Summary */}
              {selectedResult.summary && selectedResult.summary !== "Running…" && (
                <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, fontSize:13, color:C.textMid, lineHeight:1.65, flexShrink:0 }}>
                  {selectedResult.summary}
                </div>
              )}

              {/* Rows table */}
              <div style={{ flex:1, overflowY:"auto", padding:16 }}>
                {selectedResult.rows?.length > 0 && (
                  <div style={{ border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                      <thead>
                        <tr style={{ background:C.surface2 }}>
                          {Object.keys(selectedResult.rows[0]).map(k=>(
                            <th key={k} style={{ padding:"8px 12px", textAlign:"left", fontWeight:600, color:C.textDim, fontSize:10, letterSpacing:".05em", textTransform:"uppercase", borderBottom:`1px solid ${C.border}` }}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResult.rows.map((row,i)=>(
                          <tr key={i} style={{ borderBottom:i<selectedResult.rows.length-1?`1px solid ${C.border}`:"none" }}>
                            {Object.values(row).map((v,j)=>(
                              <td key={j} style={{ padding:"8px 12px", color:typeof v==="number"&&v<0?"#e06030":C.textMid, fontFamily:typeof v==="number"?"monospace":"inherit" }}>
                                {typeof v==="number" ? (v<0?`-$${Math.abs(v).toLocaleString()}`:`$${v.toLocaleString()}`) : String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* When done but no inline rows — show a useful preview instead of a dead end */}
                {!selectedResult.rows?.length && selectedResult.status==="done" && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, paddingTop:40 }}>
                    <div style={{ width:56, height:56, borderRadius:16, background:C.tealBg, border:`1px solid ${C.tealBorder}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <CheckCircle size={26} color={C.teal}/>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{selectedResult.workflowName} complete</div>
                      <div style={{ fontSize:12, color:C.textMuted, maxWidth:320, lineHeight:1.7 }}>
                        Analysis finished for {(project.clients||[]).length} client{(project.clients||[]).length!==1?"s":""}. Open the full report to see findings, tables, and recommended actions.
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={()=>handleViewReport(selectedResult)}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:C.blue, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        <ExternalLink size={14}/>View Full Report
                      </button>
                      {!savedResultIds.has(selectedResult.id) && (
                        <button onClick={()=>setSaveReportModal({open:true,result:selectedResult})}
                          style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:"transparent", color:C.teal, border:`1px solid ${C.tealBorder}`, borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                          <BookOpen size={14}/>Save to Reports
                        </button>
                      )}
                    </div>
                    <button onClick={()=>handleReRun(selectedResult)}
                      style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textDim, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                      <RotateCcw size={11}/>Re-run this Assistant
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <SelectAgentModal open={agentModalOpen} onRun={handleRunAgent} onClose={()=>setAgentModalOpen(false)}/>
      <AddClientModal   open={addClientModal} allClients={allClients} existingIds={existingClientIds} onAdd={c=>onAddClients([c])} onClose={()=>setAddClientModal(false)}/>
      <SaveReportModal  open={saveReportModal.open} result={saveReportModal.result} projectName={project.name} onSave={handleSaveReport} onClose={()=>setSaveReportModal({open:false,result:null})}/>
    </div>
  );
}
