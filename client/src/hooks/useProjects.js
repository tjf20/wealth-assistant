// client/src/hooks/useProjects.js
// Persists projects to localStorage so they survive page refreshes.

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "wa_projects_v1";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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

  return {
    projects,
    createProject,
    deleteProject,
    renameProject,
    addClientsToProject,
    removeClientFromProject,
    addDocumentToProject,
    removeDocumentFromProject,
    addResultToProject,
    updateResultStatus,
  };
}
