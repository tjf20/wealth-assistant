// client/src/api.js
// Centralised API helper. All calls go through here.
// In production on Azure, /api/* is proxied to your Express server.

const BASE = "/api";

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Agents
  getAgents: ()              => call("/agents"),
  getAgentLevel: (key)       => call(`/agents/${key}`),
  runAgent: (id, body = {})  => call(`/agents/${id}/run`, { method: "POST", body: JSON.stringify(body) }),

  // Activity / Jobs
  getActivity: ()            => call("/activity"),
  getJob: (jobId)            => call(`/activity/${jobId}`),
  getJobResults: (jobId)     => call(`/activity/${jobId}/results`),

  // Clients
  getClients: (params = {})  => call(`/clients?${new URLSearchParams(params)}`),
  getClient: (id)            => call(`/clients/${id}`),

  // Chat
  chat: (messages, opts = {}) => call("/chat", {
    method: "POST",
    body: JSON.stringify({ messages, ...opts }),
  }),
};
