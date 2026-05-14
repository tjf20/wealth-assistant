// client/src/components/ProjectCenterView.jsx
// "Custom Workspace" — all internal labels use "Workspace" not "Project".
// Uses CSS custom properties for full light/dark theme support.

import { useState } from "react";
import {
  FolderOpen, Plus, Trash2, Users, FileText, BarChart2,
  ChevronRight, Clock, CheckCircle, AlertCircle, X,
} from "lucide-react";

// CSS vars with dark fallbacks — parent (.wa-shell) overrides for light theme
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

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ project }) {
  const hasResults  = (project.results||[]).length > 0;
  const hasClients  = (project.clients||[]).length > 0;
  const running     = (project.results||[]).some(r=>r.status==="running");
  if (running) return (
    <span style={{ fontSize:9,padding:"2px 8px",borderRadius:20,background:C.tealBg,color:C.teal,border:`1px solid ${C.tealBorder}`,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4 }}>
      <span style={{ width:5,height:5,borderRadius:"50%",background:C.teal,display:"inline-block",animation:"pcDot 1.2s infinite" }}/>Running
    </span>
  );
  if (hasResults) return (
    <span style={{ fontSize:9,padding:"2px 8px",borderRadius:20,background:C.blueBg,color:C.blue,border:`1px solid ${C.blueBorder}`,fontWeight:700 }}>Results ready</span>
  );
  if (hasClients) return (
    <span style={{ fontSize:9,padding:"2px 8px",borderRadius:20,background:C.amberBg,color:C.amber,border:`1px solid ${C.amberBorder}`,fontWeight:700 }}>In progress</span>
  );
  return (
    <span style={{ fontSize:9,padding:"2px 8px",borderRadius:20,background:C.surface2,color:C.textDim,border:`1px solid ${C.border}`,fontWeight:700 }}>Empty</span>
  );
}

// ── Workspace card ────────────────────────────────────────────────────────────
function WorkspaceCard({ project, onOpen, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const clientCount  = (project.clients||[]).length;
  const docCount     = (project.documents||[]).length;
  const agentCount   = (project.results||[]).length;

  return (
    <div
      onClick={()=>onOpen(project)}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{ background:C.surface,border:`1px solid ${hovered?C.blue:C.border}`,borderRadius:12,padding:16,cursor:"pointer",transition:"border-color .15s,box-shadow .15s",boxShadow:hovered?"0 4px 16px rgba(0,0,0,.2)":"none",position:"relative" }}>

      {/* Delete button (top-right, visible on hover) */}
      {hovered&&(
        <button
          onClick={e=>{e.stopPropagation();if(confirm(`Delete "${project.name}"?`))onDelete(project.id);}}
          style={{ position:"absolute",top:10,right:10,background:"none",border:"none",cursor:"pointer",color:C.textDim,display:"flex",padding:4,borderRadius:6 }}
          onMouseEnter={e=>e.currentTarget.style.color=C.coral}
          onMouseLeave={e=>e.currentTarget.style.color=C.textDim}>
          <Trash2 size={13}/>
        </button>
      )}

      {/* Icon + Name */}
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
        <div style={{ width:36,height:36,borderRadius:9,background:C.blueBg,border:`1px solid ${C.blueBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <FolderOpen size={17} color={C.blue}/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{ fontSize:14,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{project.name}</div>
          <div style={{ fontSize:10,color:C.textDim,marginTop:1,display:"flex",alignItems:"center",gap:4 }}>
            <Clock size={9}/>{fmtDate(project.createdAt)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex",gap:12,marginBottom:12 }}>
        {[
          { icon:Users,     value:clientCount,  label:`client${clientCount!==1?"s":""}`,    clr:C.blue  },
          { icon:FileText,  value:docCount,     label:`doc${docCount!==1?"s":""}`,          clr:C.teal  },
          { icon:BarChart2, value:agentCount,   label:`agent run${agentCount!==1?"s":""}`,  clr:C.amber },
        ].map((m,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:4 }}>
            <m.icon size={11} color={m.value>0?m.clr:C.textDim}/>
            <span style={{ fontSize:11,color:m.value>0?C.textMid:C.textDim }}>{m.value} {m.label}</span>
          </div>
        ))}
      </div>

      {/* Status + arrow */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <StatusPill project={project}/>
        <ChevronRight size={14} color={hovered?C.blue:C.textDim} style={{transition:"color .15s"}}/>
      </div>
    </div>
  );
}

// ── New Workspace modal ───────────────────────────────────────────────────────
function NewWorkspaceModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  function submit() { if (name.trim()) { onSave(name.trim()); onClose(); } }
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:28,width:420,boxShadow:"0 24px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
          <div style={{ fontSize:16,fontWeight:700,color:C.text }}>New Workspace</div>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:C.textDim }}><X size={16}/></button>
        </div>
        <div style={{ fontSize:12,color:C.textDim,marginBottom:14 }}>Give your workspace a name. You can add clients, documents, and run agents after creating it.</div>
        <input
          value={name} onChange={e=>setName(e.target.value)} autoFocus placeholder="e.g. Smith Family Tax Review, Q4 Rebalancing…"
          onKeyDown={e=>e.key==="Enter"&&submit()}
          style={{ width:"100%",padding:"10px 12px",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:16,boxSizing:"border-box" }}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={submit} disabled={!name.trim()}
            style={{ flex:1,padding:"9px",background:name.trim()?C.blue:C.surface2,color:name.trim()?"#fff":C.textDim,border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:name.trim()?"pointer":"not-allowed",fontFamily:"inherit" }}>
            Create Workspace
          </button>
          <button onClick={onClose}
            style={{ padding:"9px 18px",background:"transparent",color:C.textDim,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onCreate }) {
  const steps = [
    { n:"1", clr:C.blue,   bg:C.blueBg,   border:C.blueBorder,   title:"Create a Workspace",    body:"Name it anything — a client family, a batch workflow, or a seasonal review cycle." },
    { n:"2", clr:C.teal,   bg:C.tealBg,   border:C.tealBorder,   title:"Add Clients & Docs",    body:"Pull clients from My Clients, or upload fact sheets, proposals, and PDFs." },
    { n:"3", clr:C.amber,  bg:C.amberBg,  border:C.amberBorder,  title:"Select an Agent",       body:"Choose from Tax Loss Harvesting, Holdings Audit, Outreach Drafts, and more." },
    { n:"4", clr:C.purple, bg:C.purpleBg, border:C.purpleBorder, title:"Review & Save Results", body:"Results appear instantly. Chat with them, export to PDF, or save to Reports." },
  ];
  return (
    <div style={{ flex:1,overflowY:"auto",padding:"48px 64px",display:"flex",flexDirection:"column",alignItems:"center",gap:40 }}>
      <div style={{ textAlign:"center",maxWidth:560 }}>
        <div style={{ width:72,height:72,borderRadius:20,background:C.surface2,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
          <FolderOpen size={32} color={C.blue}/>
        </div>
        <div style={{ fontSize:26,fontWeight:700,color:C.text,marginBottom:12 }}>Welcome to Custom Workspace</div>
        <div style={{ fontSize:14,color:C.textMuted,lineHeight:1.7,marginBottom:28 }}>
          Workspaces let you group clients, documents, and agent results into named sessions — so you can run batch workflows, track outcomes, and build a paper trail for compliance.
        </div>
        <button onClick={onCreate}
          style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"11px 24px",background:C.blue,border:"none",borderRadius:9,cursor:"pointer",fontSize:14,fontWeight:600,color:"#fff",fontFamily:"inherit" }}>
          <Plus size={16}/>Create Your First Workspace
        </button>
      </div>

      {/* Steps */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,maxWidth:700,width:"100%" }}>
        {steps.map((s,i)=>(
          <div key={i} style={{ background:C.surface,border:`1px solid ${s.border}`,borderRadius:12,padding:20 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
              <div style={{ width:28,height:28,borderRadius:8,background:s.bg,border:`1px solid ${s.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:s.clr,flexShrink:0 }}>{s.n}</div>
              <div style={{ fontSize:13,fontWeight:600,color:C.text }}>{s.title}</div>
            </div>
            <div style={{ fontSize:12,color:C.textMuted,lineHeight:1.65 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ProjectCenterView({ projects, onCreateProject, onDeleteProject, onOpenProject }) {
  const [showModal, setShowModal] = useState(false);
  const [search,    setSearch]    = useState("");

  const filtered = projects.filter(p =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",background:C.bg }}>
      <style>{`@keyframes pcDot{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      {/* Header */}
      <div style={{ padding:"16px 24px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexShrink:0,background:C.surface }}>
        <div style={{flex:1}}>
          <div style={{ fontSize:18,fontWeight:700,color:C.text }}>Custom Workspace</div>
          <div style={{ fontSize:12,color:C.textDim,marginTop:2 }}>{projects.length} workspace{projects.length!==1?"s":""} · Group clients, docs, and agent runs</div>
        </div>
        {projects.length>0&&(
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search workspaces…"
            style={{ padding:"7px 12px",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,fontFamily:"inherit",outline:"none",width:220 }}/>
        )}
        <button onClick={()=>setShowModal(true)}
          style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:C.blue,border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,color:"#fff",fontFamily:"inherit" }}>
          <Plus size={14}/>New Workspace
        </button>
      </div>

      {/* Body */}
      {!projects.length ? (
        <EmptyState onCreate={()=>setShowModal(true)}/>
      ) : (
        <div style={{ flex:1,overflowY:"auto",padding:24 }}>
          {!filtered.length ? (
            <div style={{ textAlign:"center",color:C.textDim,fontSize:13,padding:"40px 0" }}>No workspaces match "{search}"</div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14 }}>
              {filtered.map(p=>(
                <WorkspaceCard key={p.id} project={p} onOpen={onOpenProject} onDelete={onDeleteProject}/>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal&&<NewWorkspaceModal onSave={onCreateProject} onClose={()=>setShowModal(false)}/>}
    </div>
  );
}
