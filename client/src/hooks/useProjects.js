// client/src/hooks/useProjects.js
// Persists projects (Workspaces) to localStorage so they survive page refreshes.

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "wa_projects_v1";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // Backfill new fields for workspaces created before this schema existed
    return parsed.map(p => ({
      context: "",
      pinnedToHome: false,
      schedule: null, // { freq: "daily"|"weekly", time: "08:00" } | null
      ...p,
    }));
  } catch {
    return [];
  }
}

function saveToStorage(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // quota exceeded or private browsing — fail silently
  }
}

export function useProjects() {
  const [projects, setProjects] = useState(() => loadFromStorage());

  // Persist on every change
  useEffect(() => {
    saveToStorage(projects);
  }, [projects]);

  const createProject = useCallback((name) => {
    const project = {
      id: `proj-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      context: "",        // free-text notes/instructions the FA can set — "what this workspace is for"
      pinnedToHome: false,// shows a compact card on Home when true
      schedule: null,     // { freq: "daily"|"weekly", time: "08:00" } | null
      clients: [],     // [{ clientId, name, cp, type, phone, producerId, accounts }]
      documents: [],   // [{ id, name, size, uploadedAt, dataUrl }]
      results: [],     // [{ id, agentName, agentId, ranAt, summary, rows, status }]
    };
    setProjects(prev => [project, ...prev]);
    return project;
  }, []);

  const deleteProject = useCallback((projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  const renameProject = useCallback((projectId, name) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name } : p));
  }, []);

  // Free-text context/instructions — "what this workspace is for"
  const updateProjectContext = useCallback((projectId, context) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, context } : p));
  }, []);

  // Pin/unpin the compact card on Home
  const setProjectHomePinned = useCallback((projectId, pinnedToHome) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, pinnedToHome } : p));
  }, []);

  // schedule: { freq: "daily"|"weekly", time: "08:00" } | null
  const setProjectSchedule = useCallback((projectId, schedule) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, schedule } : p));
  }, []);

  const addClientsToProject = useCallback((projectId, newClients) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const existingIds = new Set(p.clients.map(c => c.clientId));
      const toAdd = newClients.filter(c => !existingIds.has(c.clientId));
      return { ...p, clients: [...p.clients, ...toAdd] };
    }));
  }, []);

  const removeClientFromProject = useCallback((projectId, clientId) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : { ...p, clients: p.clients.filter(c => c.clientId !== clientId) }
    ));
  }, []);

  const addDocumentToProject = useCallback((projectId, doc) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : { ...p, documents: [...p.documents, doc] }
    ));
  }, []);

  const removeDocumentFromProject = useCallback((projectId, docId) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : { ...p, documents: p.documents.filter(d => d.id !== docId) }
    ));
  }, []);

  const addResultToProject = useCallback((projectId, result) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : { ...p, results: [result, ...p.results] }
    ));
  }, []);

  const updateResultStatus = useCallback((projectId, resultId, status) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : {
        ...p,
        results: p.results.map(r => r.id === resultId ? { ...r, status } : r)
      }
    ));
  }, []);

  // Merge an arbitrary patch (e.g. { status:"done", summary, rows }) into a result
  const updateResult = useCallback((projectId, resultId, patch) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : {
        ...p,
        results: p.results.map(r => r.id === resultId ? { ...r, ...patch } : r)
      }
    ));
  }, []);

  return {
    projects,
    createProject,
    deleteProject,
    renameProject,
    updateProjectContext,
    setProjectHomePinned,
    setProjectSchedule,
    addClientsToProject,
    removeClientFromProject,
    addDocumentToProject,
    removeDocumentFromProject,
    addResultToProject,
    updateResultStatus,
    updateResult,
  };
}
