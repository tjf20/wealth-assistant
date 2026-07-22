// client/src/components/WealthAssistant.jsx
// v6 changes:
//   • reportContentMap: stores full generateReportContent() objects so Reports tab can open viewer
//   • pinnedReports: "Pin to Home" actually works — reports appear in MyCanvasView Add Card
//   • Extended CSS vars include hero card (fixes green-on-green in light theme)
//   • All "Project Center" → "Custom Workspace", internal "Project" → "Workspace"
//   • Chat collapse button added to topbar

import { useState, useRef, useEffect } from "react";
import { Home, Bell, Sun, Moon, X, Send, Zap, Layers, Bot, Users, Settings, ChevronDown, PanelRightClose } from "lucide-react";

import { ThemeContext, DARK, LIGHT } from "../theme.js";
import MyCanvasView       from "./MyCanvasView.jsx";
import MyClientsView      from "./MyClientsView.jsx";
import ProjectCenterView  from "./ProjectCenterView.jsx";
import ProjectDetailView  from "./ProjectDetailView.jsx";
import AgentControlCenter from "./AgentControlCenter.jsx";
import WealthChatPanel    from "./WealthChatPanel.jsx";
import ReportViewer, { generateReportContent } from "./ReportViewer.jsx";

import { useProjects }    from "../hooks/useProjects.js";
import { useReports }     from "../hooks/useReports.js";
import clientsData        from "../data/clients.json";

const CLIENTS = Array.isArray(clientsData) ? clientsData : [];
const PINNED_KEY  = "wa_pinned_reports_v1";
const CONTENT_KEY = "wa_report_content_v1";

function findAgentName(agentData, agentId) {
  for (const items of Object.values(agentData || {})) {
    if (!Array.isArray(items)) continue;
    const f = items.find(i => i.id === agentId);
    if (f) return f.name;
  }
  return agentId;
}

const NBA_MAP = [
  { keywords:["wire","transfer","servicing"], agentId:"sub-wire", label:"Servicing — Send Wire" },
  { keywords:["esg","interest","fund"],       agentId:"sub-602",  label:"Product Recommendations" },
  { keywords:["at-risk","withdrawal","gap"],  agentId:"sub-203",  label:"At-Risk Client Alerts" },
  { keywords:["review","annual","fact"],      agentId:"sub-106",  label:"Annual Review Prep" },
  { keywords:["tax","harvest","loss"],        agentId:"sub-101",  label:"Tax Loss Harvesting" },
];
function getNBA(ins) {
  const txt = `${ins.title} ${ins.body}`.toLowerCase();
  return NBA_MAP.find(r => r.keywords.some(k => txt.includes(k)));
}

// ── Insights drawer ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function InsightsDrawer({ open, onClose, onRunAgent, C }) {
  const [insights, setInsights] = useState([]);
  const [nbaDrop, setNbaDrop]   = useState(null);
  useEffect(() => {
    if (!open) return;
    fetch("/api/insights").then(r=>r.json()).then(setInsights).catch(()=>{});
  }, [open]);
  if (!open) return null;
  const sevColor = { high:C.danger, info:C.accent, low:C.textDim };
  return (
    <div style={{ position:"absolute", left:210, top:0, bottom:0, width:360, background:C.surface, borderRight:`1px solid ${C.border}`, zIndex:30, display:"flex", flexDirection:"column", boxShadow:"4px 0 24px rgba(0,0,0,0.25)" }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Insights</span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim }}><X size={16}/></button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:10 }}>
        {insights.map(ins => {
          const nba = getNBA(ins);
          return (
            <div key={ins.id} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderLeft:`3px solid ${sevColor[ins.severity]||C.textDim}`, borderRadius:"0 8px 8px 0", padding:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:4 }}>{ins.title}</div>
              <div style={{ fontSize:11, color:C.textDim, lineHeight:1.6, marginBottom:6 }}>{ins.body}</div>
              <div style={{ fontSize:10, color:C.textHint, marginBottom:nba?8:0 }}>via {ins.agentSource} · {new Date(ins.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
              {nba && (
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:8, marginTop:4 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.textDim, letterSpacing:".07em", textTransform:"uppercase", marginBottom:6 }}>Next Best Action</div>
                  <div style={{ position:"relative" }}>
                    <button onClick={()=>setNbaDrop(nbaDrop===ins.id?null:ins.id)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", background:C.accentBg, color:C.accent, border:`1px solid ${C.accentBorder}`, borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>
                      <Bot size={12}/><span style={{flex:1,textAlign:"left"}}>{nba.label}</span><ChevronDown size={11}/>
                    </button>
                    {nbaDrop===ins.id && (
                      <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", marginTop:4, boxShadow:"0 8px 24px rgba(0,0,0,0.2)" }}>
                        {[
                          {id:nba.agentId, name:nba.label},
                          {id:"sub-701",   name:"CRM Sync & Log"},
                          {id:"sub-105",   name:"Client Outreach Draft"},
                        ].map(a=>(
                          <div key={a.id} onClick={()=>{onRunAgent(a,ins);setNbaDrop(null);onClose();}}
                            style={{ padding:"9px 12px", cursor:"pointer", fontSize:12, color:C.text, display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${C.border}` }}
                            onMouseEnter={e=>e.currentTarget.style.background=C.accentBg}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <Bot size={13} color={C.accent}/><span style={{flex:1}}>{a.name}</span>
                            <span style={{ fontSize:10, color:C.accent, fontWeight:600 }}>Run Now →</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!insights.length && <div style={{ textAlign:"center", fontSize:13, color:C.textDim, padding:"40px 0" }}>No insights yet.</div>}
      </div>
    </div>
  );
}

// ── CSS var builder — includes hero card vars ────────────────────────────────────────────────────
function buildCSSVars(isDark) {
  if (isDark) return `
    --c-bg:#0a0b0d;--c-surface:#0f1014;--c-surface2:#13151e;--c-surface3:#181a22;
    --c-border:#1e2029;--c-border2:#2a2d3a;
    --c-text:#eceef5;--c-textMid:#b0b8d0;--c-textMuted:#8a8fa8;--c-textDim:#7a7e94;
    --c-blue:#7db8ff;--c-blueBg:#0e1e38;--c-blueBorder:#2a4a8a;
    --c-teal:#2dbe8a;--c-tealBg:#0a2820;--c-tealBorder:#1a6a50;
    --c-amber:#e09040;--c-amberBg:#221800;--c-amberBorder:#5a3a10;
    --c-purple:#a882ff;--c-purpleBg:#180f30;--c-purpleBorder:#4a3080;
    --c-coral:#f07850;--c-coralBg:#221008;--c-coralBorder:#6a3020;
    --c-hero-bg:linear-gradient(135deg,#0a3020 0%,#0f1014 100%);
    --c-hero-border:#1a6a50;--c-hero-text:#2dbe8a;--c-hero-sub:rgba(45,190,138,.65);
    --c-hero-badge:rgba(45,190,138,.15);--c-hero-ytd:rgba(45,190,138,.12);
  `;
  return `
    --c-bg:#F0F4FA;--c-surface:#ffffff;--c-surface2:#F8FAFC;--c-surface3:#F1F5F9;
    --c-border:#E2E8F0;--c-border2:#CBD5E1;
    --c-text:#0F172A;--c-textMid:#1E293B;--c-textMuted:#475569;--c-textDim:#64748B;
    --c-blue:#2563EB;--c-blueBg:#EFF6FF;--c-blueBorder:#BFDBFE;
    --c-teal:#0D9488;--c-tealBg:#F0FDFA;--c-tealBorder:#99F6E4;
    --c-amber:#D97706;--c-amberBg:#FFF7ED;--c-amberBorder:#FED7AA;
    --c-purple:#7C3AED;--c-purpleBg:#F5F3FF;--c-purpleBorder:#DDD6FE;
    --c-coral:#DC2626;--c-coralBg:#FEF2F2;--c-coralBorder:#FECACA;
    --c-hero-bg:linear-gradient(135deg,#F0FDFA 0%,#E6FFFA 100%);
    --c-hero-border:#99F6E4;--c-hero-text:#0D9488;--c-hero-sub:#475569;
    --c-hero-badge:rgba(13,148,136,.1);--c-hero-ytd:rgba(13,148,136,.12);
  `;
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────────────────────
export default function WealthAssistant({ agentData }) {
  const advisorName = "James Miller";

  const [navView,          setNavView]       = useState("canvas");
  const [theme,            setTheme]         = useState("dark");
  const [chatCollapsed,    setChatCollapsed] = useState(false);
  const [insightCount,     setInsightCount]  = useState(2);
  const [insightsOpen,     setInsightsOpen]  = useState(false);
  const [activeProject,    setActiveProject] = useState(null);
  const [workstationClient,setWsClient]      = useState(null);
  const [toast,            setToast]         = useState(null);
  const [liveJobs,         setLiveJobs]      = useState([]);
  const [viewingReport,    setViewingReport] = useState(null);
  const [accInitialTab,    setAccInitialTab] = useState("agents"); // forces ACC to a specific tab

  // pinnedReports: reports the FA has pinned to show on Home as cards
  const [pinnedReports, setPinnedReports] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PINNED_KEY) || "[]"); } catch { return []; }
  });

  // reportContentMap: full generateReportContent() objects keyed by report ID
  // useReports.saveReport only stores a subset of fields, so we store the rest here
  const contentMapRef = useRef({});
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CONTENT_KEY) || "{}");
      contentMapRef.current = stored;
    } catch {}
  }, []);

  function storeReportContent(id, content) {
    contentMapRef.current[id] = content;
    try {
      const map = { ...contentMapRef.current };
      // keep max 50 entries to not blow up localStorage
      const keys = Object.keys(map);
      if (keys.length > 50) delete map[keys[0]];
      localStorage.setItem(CONTENT_KEY, JSON.stringify(map));
    } catch {}
  }

  function getReportContent(id) {
    return contentMapRef.current[id] || null;
  }

  const isDark = theme === "dark";
  const C = isDark ? DARK : LIGHT;

  const { projects, createProject, deleteProject, addClientsToProject, removeClientFromProject, addDocumentToProject, removeDocumentFromProject, addResultToProject, updateResultStatus } = useProjects();
  const { reports, saveReport, deleteReport, renameReport } = useReports();

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(null), 4000); }

  useEffect(() => {
    const poll = () => fetch("/api/insights/count").then(r=>r.json()).then(d=>setInsightCount(d.unread||0)).catch(()=>{});
    poll(); const id = setInterval(poll, 30000); return ()=>clearInterval(id);
  }, []);

  // ── Run agent for selected clients ──────────────────────────────────────────────────
  function handleClientsRunAgent(clients, agentId, agentName) {
    const resolved = agentName || findAgentName(agentData, agentId);
    const newJobs  = clients.map(c => ({
      jobId:`job-${Date.now()}-${c.clientId}`,
      agentId, agentName:resolved,
      clientName:c.name, clientId:c.clientId,
      scope:"individual", status:"running",
      startedAt:new Date().toISOString(),
    }));
    setLiveJobs(prev => [...newJobs, ...prev]);
    setNavView("agents");
    setAccInitialTab("activity"); // jump to Activity tab in ACC
    showToast(`${resolved} running for ${clients.length} client${clients.length!==1?"s":""}`);

    setTimeout(() => {
      setLiveJobs(prev => prev.map(j =>
        newJobs.some(nj => nj.jobId===j.jobId)
          ? {...j, status:"done", completedAt:new Date().toISOString()}
          : j
      ));
      newJobs.forEach(job => {
        const content = generateReportContent(agentId, resolved, job.clientName, "individual");
        // saveReport extracts only { agentName, summary, rows… } from content
        const saved = saveReport(`${resolved} — ${job.clientName}`, content, null);
        // So we separately store the FULL content keyed by the returned report ID
        if (saved && saved.id) storeReportContent(saved.id, content);
      });
      showToast(`${resolved} complete — view results in Activity`);
    }, 3500);
  }

  // ── Pin to Home ───────────────────────────────────────────────────────────────
  function handlePinToHome(report) {
    const entry = {
      id: `pin-${Date.now()}`,
      reportId: report.agentId || "custom",
      title: report.title || report.name || "Report",
      summary: report.summary || "",
      agentName: report.agentName || "",
      generatedAt: report.generatedAt || new Date().toLocaleString(),
      // Store the full content inline so MyCanvasView can open it
      content: report,
    };
    const next = [entry, ...pinnedReports].slice(0, 6); // max 6 pinned cards
    setPinnedReports(next);
    localStorage.setItem(PINNED_KEY, JSON.stringify(next));
    showToast("Report pinned — find it in Home → Add Card → Pinned Reports");
  }

  function handleUnpinReport(pinId) {
    const next = pinnedReports.filter(r => r.id !== pinId);
    setPinnedReports(next);
    localStorage.setItem(PINNED_KEY, JSON.stringify(next));
  }

  // ── Insights NBA run ───────────────────────────────────────────────────────────────
  function handleInsightRun(agent, insight) {
    handleClientsRunAgent([CLIENTS[0]], agent.id, agent.name);
    setInsightsOpen(false);
  }

  const breadcrumbs = {
    canvas:"Home", agents:"Command Center",
    projectCenter:"Custom Workspace", projectDetail:activeProject?.name??"Custom Workspace",
    clients:"My Clients",
  };

  const navItems = [
    { icon:Home,     label:"Home",                 view:"canvas"       },
    { icon:Bot,      label:"Command Center", view:"agents",       badge:liveJobs.filter(j=>j.status==="running").length||null },
    { icon:Layers,   label:"Custom Workspace",     view:"projectCenter",badge:projects.length||null },
    { icon:Users,    label:"My Clients",           view:"clients"      },
    { icon:Settings, label:"Settings",             view:null           },
  ];

  return (
    <ThemeContext.Provider value={C}>
      <>
        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
          *{box-sizing:border-box;}
          ::-webkit-scrollbar{width:4px;}
          ::-webkit-scrollbar-thumb{background:${isDark?"#2a2d3a":"#CBD5E1"};border-radius:4px;}
          .wa-shell{${buildCSSVars(isDark)}}
        `}</style>

        <div className="wa-shell" style={{ display:"flex", height:"100vh", background:C.bg, color:C.text, fontFamily:"Roboto, sans-serif", fontSize:13, overflow:"hidden", position:"relative" }}>

          {/* Sidebar */}
          <div style={{ width:210, minWidth:210, background:C.navBg, borderRight:`1px solid rgba(255,255,255,0.07)`, display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, background:"#2563EB", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center" }}><Zap size={14} color="#fff"/></div>
              <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Wealth Assistant</span>
            </div>
            <div style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:2 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:C.navSection, padding:"10px 10px 4px" }}>Workspace</div>
              {navItems.map((nav,i)=>(
                <div key={i} onClick={()=>nav.view&&setNavView(nav.view)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:7, cursor:"pointer", color:navView===nav.view?C.navActiveTxt:C.navTxt, background:navView===nav.view?C.navActive:"transparent", transition:"all 0.15s" }}
                  onMouseEnter={e=>{if(navView!==nav.view)e.currentTarget.style.background=C.navHover;}}
                  onMouseLeave={e=>{if(navView!==nav.view)e.currentTarget.style.background="transparent";}}>
                  <nav.icon size={14}/>
                  <span style={{fontSize:13}}>{nav.label}</span>
                  {nav.badge!=null&&<span style={{ marginLeft:"auto", background:nav.view==="agents"?"#DC2626":C.accentBg, color:nav.view==="agents"?"#fff":C.accentText, fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:8, border:nav.view==="agents"?"none":`1px solid ${C.accentBorder}` }}>{nav.badge}</span>}
                </div>
              ))}
            </div>
            <div style={{ padding:"0 8px 4px" }}>
              <div onClick={()=>setInsightsOpen(true)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:7, cursor:"pointer", color:C.navTxt, transition:"all 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.navHover}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Bell size={14}/><span style={{fontSize:13}}>Insights</span>
                {insightCount>0&&<span style={{ marginLeft:"auto", background:"#DC2626", color:"#fff", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:8 }}>{insightCount}</span>}
              </div>
            </div>
            <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:7, background:"rgba(255,255,255,0.05)" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"#1a3a6a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#7db8ff", flexShrink:0 }}>JM</div>
                <div><div style={{ fontSize:12, fontWeight:600, color:"#dde0f0" }}>{advisorName}</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>Senior Advisor</div></div>
              </div>
            </div>
          </div>

          {/* Main */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

            {/* Topbar */}
            <div style={{ height:52, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", padding:"0 20px", gap:12, background:C.topbar, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, flex:1 }}>
                <Home size={13} style={{ cursor:"pointer", color:C.textDim }} onClick={()=>setNavView("canvas")}/>
                <span style={{color:C.textDim}}>›</span>
                <span style={{ color:C.text, fontWeight:500 }}>{breadcrumbs[navView]||navView}</span>
                {navView==="projectDetail"&&activeProject&&(
                  <><span style={{color:C.textDim}}>›</span>
                  <span style={{ color:C.textDim, cursor:"pointer" }} onClick={()=>setNavView("projectCenter")}>Custom Workspace</span>
                  <span style={{color:C.textDim}}>›</span>
                  <span style={{color:C.textDim}}>{activeProject.name}</span></>
                )}
              </div>

              {/* Theme toggle */}
              <div onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{ display:"flex", alignItems:"center", gap:6, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:20, padding:"4px 10px", cursor:"pointer", fontSize:11, color:C.textDim, userSelect:"none" }}>
                {isDark?<><Moon size={12} style={{color:"#818CF8"}}/><span>Dark</span></>:<><Sun size={12} style={{color:"#F59E0B"}}/><span>Light</span></>}
              </div>

              {/* Chat collapse toggle */}
              <button onClick={()=>setChatCollapsed(c=>!c)} title={chatCollapsed?"Show Chat Panel":"Hide Chat Panel"}
                style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:chatCollapsed?C.accentBg:C.surface, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:chatCollapsed?C.accent:C.textDim, transition:"all .15s" }}>
                <PanelRightClose size={14}/>
              </button>
            </div>

            {/* Body */}
            <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
              <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>

                {navView==="canvas" && (
                  <MyCanvasView
                    onNavigate={()=>setNavView("agents")}
                    pinnedReports={pinnedReports}
                    onViewReport={r=>setViewingReport(r)}
                    onUnpinReport={handleUnpinReport}
                  />
                )}

                {navView==="agents" && (
                  <AgentControlCenter
                    agentData={agentData}
                    liveJobs={liveJobs}
                    reports={reports}
                    onDeleteReport={deleteReport}
                    workstationClient={workstationClient}
                    onViewReport={r=>setViewingReport(r)}
                    getReportContent={getReportContent}
                    initialTab={accInitialTab}
                  />
                )}

                {navView==="projectCenter" && (
                  <ProjectCenterView
                    projects={projects}
                    onCreateProject={n=>createProject(n)}
                    onDeleteProject={deleteProject}
                    onOpenProject={p=>{setActiveProject(p);setNavView("projectDetail");}}
                  />
                )}

                {navView==="projectDetail" && activeProject && projects.find(p=>p.id===activeProject?.id) && (
                  <ProjectDetailView
                    project={projects.find(p=>p.id===activeProject.id)}
                    allClients={CLIENTS}
                    onBack={()=>setNavView("projectCenter")}
                    onAddClients={c=>addClientsToProject(activeProject.id,c)}
                    onRemoveClient={id=>removeClientFromProject(activeProject.id,id)}
                    onUploadDocument={doc=>addDocumentToProject(activeProject.id,doc)}
                    onRemoveDocument={id=>removeDocumentFromProject(activeProject.id,id)}
                    onRunAgent={result=>{if(result.status==="running")addResultToProject(activeProject.id,result);else updateResultStatus(activeProject.id,result.id,result.status);}}
                    onSaveReport={(name,result,pName)=>{saveReport(name,result,pName);showToast(`"${name}" saved to Reports`);}}
                    onViewReport={r=>setViewingReport(r)}
                  />
                )}

                {navView==="clients" && (
                  <MyClientsView
                    allClients={CLIENTS}
                    onSendToAgent={(projectItems)=>{
                      const clients=projectItems.filter(i=>i.type==="client").map(i=>i.client);
                      const name=`New Workspace — ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
                      const project=createProject(name);
                      if(clients.length>0)addClientsToProject(project.id,clients);
                      setActiveProject(project);setNavView("projectDetail");
                    }}
                    onRunAgentForClients={(clients,agentId,agentName)=>handleClientsRunAgent(clients,agentId,agentName)}
                    onSetWorkstationClient={(client)=>{setWsClient(client);showToast(`${client.name} synced to Wealth Chat`);}}
                  />
                )}
              </div>

              <WealthChatPanel
                advisorName={advisorName}
                navView={navView}
                agentData={agentData}
                workstationClient={workstationClient}
                onClearWorkstation={()=>setWsClient(null)}
                collapsed={chatCollapsed}
                onToggleCollapse={()=>setChatCollapsed(c=>!c)}
              />
            </div>
          </div>

          {insightsOpen && <InsightsDrawer open={insightsOpen} onClose={()=>setInsightsOpen(false)} onRunAgent={handleInsightRun} C={C}/>}

          {viewingReport && (
            <ReportViewer
              report={viewingReport}
              onClose={()=>setViewingReport(null)}
              onPin={handlePinToHome}
            />
          )}

          {toast && (
            <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 18px", fontSize:13, color:C.textMid, display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap", boxShadow:"0 8px 24px rgba(0,0,0,0.35)", zIndex:60, animation:"fadeIn 0.2s ease" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, flexShrink:0 }}/>{toast}
            </div>
          )}
        </div>
      </>
    </ThemeContext.Provider>
  );
}
