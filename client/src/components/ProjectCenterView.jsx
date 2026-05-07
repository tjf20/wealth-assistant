// client/src/components/ProjectCenterView.jsx
// Level 1 — shows all projects as cards. Click a card to drill into ProjectDetailView.
// New file — does not modify WealthAssistant.jsx or MyClientsView.jsx.

import { useState } from "react";
import { FolderOpen, Plus, Trash2, Users, FileText, BarChart2, Clock, ChevronRight, X } from "lucide-react";

// ── Color palette — slightly lighter surface than main shell ──────────────────
const C = {
  bg: "#0d0f16",
  surface: "#13161f",
  surface2: "#191c28",
  border: "#22253a",
  border2: "#2e3250",
  text: "#eceef5",
  textMid: "#b0b8d0",
  textMuted: "#8a8fa8",
  textDim: "#6a6e88",
  blue: "#7db8ff",
  blueBg: "#0e1e38",
  blueBorder: "#2a4a8a",
  teal: "#2dbe8a",
  tealBg: "#0a2820",
  tealBorder: "#1a6a50",
  amber: "#e09040",
  amberBg: "#221800",
  amberBorder: "#5a3a10",
  purple: "#a882ff",
  purpleBg: "#180f30",
  purpleBorder: "#4a3080",
  coral: "#f07850",
  coralBg: "#221008",
  coralBorder: "#6a3020",
};

// ── New Project Modal ─────────────────────────────────────────────────────────
function NewProjectModal({ open, onCreate, onClose }) {
  const [name, setName] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
    onClose();
  }

  if (!open) return null;

  return (
    // Faux modal overlay — in normal flow so iframe heights correctly
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 28, width: 380, boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>New Project</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Project name</div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") onClose(); }}
          placeholder="e.g. Smith Family — Q3 Review"
          style={{ width: "100%", padding: "9px 12px", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 7, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 8, marginBottom: 20 }}>
          You can add clients, documents, and run agents after creating the project.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim()} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${name.trim() ? C.blueBorder : C.border}`, background: name.trim() ? C.blueBg : "transparent", color: name.trim() ? C.blue : C.textDim, fontSize: 13, fontWeight: 600, cursor: name.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ project }) {
  const running = project.results.filter(r => r.status === "running").length;
  const done = project.results.filter(r => r.status === "done").length;
  const notRun = project.results.length === 0;

  if (running > 0) return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}` }}>
      {running} running
    </span>
  );
  if (done > 0) return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: C.tealBg, color: C.teal, border: `1px solid ${C.tealBorder}` }}>
      {done} result{done !== 1 ? "s" : ""}
    </span>
  );
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: C.surface2, color: C.textDim, border: `1px solid ${C.border}` }}>
      not run
    </span>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);

  const clientCount = project.clients.length;
  const docCount = project.documents.length;
  const agentCount = project.results.length;

  const createdDate = new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDeleteHovered(false); }}
      onClick={onClick}
      style={{
        background: hovered ? C.surface2 : C.surface,
        border: `1px solid ${hovered ? C.border2 : C.border}`,
        borderRadius: 12,
        padding: "18px 20px",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.18s",
        transform: hovered ? "translateY(-2px)" : "none",
        // Subtle left accent
        borderLeft: `3px solid ${hovered ? C.blue : C.border2}`,
      }}
    >
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(project.id); }}
        onMouseEnter={() => setDeleteHovered(true)}
        onMouseLeave={() => setDeleteHovered(false)}
        style={{
          position: "absolute", top: 14, right: 14,
          width: 24, height: 24, borderRadius: 5,
          background: deleteHovered ? C.coralBg : "transparent",
          border: `1px solid ${deleteHovered ? C.coralBorder : "transparent"}`,
          color: deleteHovered ? C.coral : C.textDim,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: hovered ? 1 : 0,
          transition: "all 0.15s",
        }}
      >
        <Trash2 size={11} />
      </button>

      {/* Icon + name */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FolderOpen size={18} color={C.blue} />
        </div>
        <div style={{ flex: 1, paddingRight: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 4 }}>
            {project.name}
          </div>
          <div style={{ fontSize: 11, color: C.textDim }}>
            Created {createdDate}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Users size={11} color={C.textDim} />
          <span style={{ fontSize: 12, color: clientCount > 0 ? C.textMid : C.textDim }}>
            {clientCount} client{clientCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <FileText size={11} color={C.textDim} />
          <span style={{ fontSize: 12, color: docCount > 0 ? C.textMid : C.textDim }}>
            {docCount} doc{docCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <BarChart2 size={11} color={C.textDim} />
          <span style={{ fontSize: 12, color: agentCount > 0 ? C.textMid : C.textDim }}>
            {agentCount} agent run{agentCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Status + drill arrow */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <StatusPill project={project} />
        <ChevronRight size={14} color={hovered ? C.blue : C.textDim} style={{ transition: "color 0.15s" }} />
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onCreate }) {
  const steps = [
    { n: "1", color: C.blue,   bg: C.blueBg,   border: C.blueBorder,   title: "Create a Project",     body: "Name it anything — a client family, a batch workflow, a seasonal review cycle." },
    { n: "2", color: C.teal,   bg: C.tealBg,   border: C.tealBorder,   title: "Add Clients & Docs",   body: "Pull clients from My Clients, or upload fact sheets, proposals, and PDFs." },
    { n: "3", color: C.amber,  bg: C.amberBg,  border: C.amberBorder,  title: "Select an Agent",      body: "Choose an Agent and Skill — Tax Loss Harvesting, Holdings Audit, Outreach Drafts, and more." },
    { n: "4", color: C.purple, bg: C.purpleBg, border: C.purpleBorder, title: "Review & Save Results", body: "Results appear instantly. Chat with them, export to PDF, or save to your Reports library." },
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "48px 64px", display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      {/* Hero */}
      <div style={{ textAlign: "center", maxWidth: 560 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <FolderOpen size={32} color={C.blue} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 12 }}>Welcome to Project Center</div>
        <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, marginBottom: 28 }}>
          Projects let you group clients, documents, and agent results into named workspaces — so you can run batch workflows, track outcomes, and build a paper trail for compliance.
        </div>
        <button onClick={onCreate}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 9, border: `1px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={16} /> Create your first project
        </button>
      </div>

      {/* How it works */}
      <div style={{ width: "100%", maxWidth: 800 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.09em", textAlign: "center", marginBottom: 20 }}>How it works</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {steps.map(s => (
            <div key={s.n} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "20px 18px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}22`, border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: s.color, marginBottom: 14 }}>
                {s.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.65 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Example projects */}
      <div style={{ width: "100%", maxWidth: 800 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 16 }}>Example projects to get you started</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { name: "Smith Family — Q3 Review",  clients: "3 clients",  skill: "Tax Loss Harvesting",     color: C.teal,   bg: C.tealBg,   border: C.tealBorder },
            { name: "Oct Tax Loss Batch",         clients: "28 clients", skill: "Holdings Audit",           color: C.blue,   bg: C.blueBg,   border: C.blueBorder },
            { name: "High-Value Prospect Push",   clients: "7 prospects",skill: "Prospect Outreach Draft",  color: C.purple, bg: C.purpleBg, border: C.purpleBorder },
          ].map(ex => (
            <div key={ex.name} onClick={onCreate}
              style={{ background: ex.bg, border: `1px solid ${ex.border}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <div style={{ fontSize: 13, fontWeight: 600, color: ex.color, marginBottom: 8, lineHeight: 1.3 }}>{ex.name}</div>
              <div style={{ fontSize: 11, color: C.textMid, marginBottom: 4 }}>{ex.clients}</div>
              <div style={{ fontSize: 10, color: ex.color, opacity: 0.7 }}>Skill: {ex.skill}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ProjectCenterView ────────────────────────────────────────────────────
export default function ProjectCenterView({ projects, onCreateProject, onDeleteProject, onOpenProject }) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleCreate(name) {
    const project = onCreateProject(name);
    // Auto-open the new project
    if (project) onOpenProject(project);
  }

  const totalClients = projects.reduce((s, p) => s + p.clients.length, 0);
  const running = projects.reduce((s, p) => s + p.results.filter(r => r.status === "running").length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg }}>

      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${C.border}`, background: "#0c0d11", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Project Center</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
              {totalClients > 0 && ` · ${totalClients} clients`}
              {running > 0 && <span style={{ color: C.blue, marginLeft: 8 }}>● {running} running</span>}
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 7, border: `1px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            <Plus size={14} /> New Project
          </button>
        </div>
      </div>

      {/* Content */}
      {projects.length === 0 ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onOpenProject(project)}
                onDelete={onDeleteProject}
              />
            ))}
          </div>
        </div>
      )}

      {/* New project modal */}
      <NewProjectModal
        open={modalOpen}
        onCreate={handleCreate}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
