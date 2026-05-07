// client/src/hooks/useReports.js
// Global report library — persists across sessions via localStorage.
// A Report is a named, saved agent result that an FA has chosen to memorialize.

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "wa_reports_v1";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(reports) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); } catch {}
}

export function useReports() {
  const [reports, setReports] = useState(() => load());

  useEffect(() => { save(reports); }, [reports]);

  // Save a completed agent result to the global report library.
  // reportName is chosen by the FA (e.g. "Smith Q3 Tax Loss Review").
  const saveReport = useCallback((reportName, result, projectName) => {
    const report = {
      id: `rpt-${Date.now()}`,
      name: reportName,
      projectName,
      agentName: result.agentName,
      skillName: result.workflowName,
      ranAt: result.ranAt,
      savedAt: new Date().toISOString(),
      summary: result.summary,
      rows: result.rows || [],
      totalSavings: result.totalSavings || null,
      status: "saved",
    };
    setReports(prev => [report, ...prev]);
    return report;
  }, []);

  const deleteReport = useCallback((reportId) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  }, []);

  const renameReport = useCallback((reportId, name) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, name } : r));
  }, []);

  return { reports, saveReport, deleteReport, renameReport };
}
