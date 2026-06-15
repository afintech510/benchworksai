const API_BASE = "/api/proxy/v1";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Clients
  getClients: () => fetchAPI<{ clients: any[] }>("/clients"),
  getClient: (id: string) => fetchAPI<{ client: any; campaigns: any[] }>(`/clients/${id}`),

  // Campaigns
  getCampaigns: (clientId?: string) =>
    fetchAPI<{ campaigns: any[] }>(`/campaigns${clientId ? `?client_id=${clientId}` : ""}`),
  getCampaign: (id: string) =>
    fetchAPI<{ campaign: any; lead_count: number; sequence_templates: any[] }>(`/campaigns/${id}`),
  launchCampaign: (data: any) =>
    fetchAPI("/campaigns/launch", { method: "POST", body: JSON.stringify(data) }),
  updateCampaignStatus: (id: string, status: string) =>
    fetchAPI(`/campaigns/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Leads
  getLeads: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ leads: any[] }>(`/leads${qs}`);
  },
  getLead: (id: string) => fetchAPI<{ lead: any; journey: any[]; replies: any[] }>(`/leads/${id}`),
  updateLeadStage: (id: string, stage: string) =>
    fetchAPI(`/leads/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) }),
  importLeads: (data: any) =>
    fetchAPI("/leads/import", { method: "POST", body: JSON.stringify(data) }),

  // Reply Events
  getReplyEvents: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ reply_events: any[] }>(`/reply-events${qs}`);
  },
  resolveReview: (id: string, data: any) =>
    fetchAPI(`/reply-events/${id}/review`, { method: "PATCH", body: JSON.stringify(data) }),

  // Mailboxes
  getMailboxes: () => fetchAPI<{ mailboxes: any[]; summary: any }>("/mailboxes"),
  rotateMailbox: (data: any) =>
    fetchAPI("/mailboxes/rotate", { method: "POST", body: JSON.stringify(data) }),

  // Reports
  getReports: (clientId?: string) =>
    fetchAPI<{ reports: any[] }>(`/reports${clientId ? `?client_id=${clientId}` : ""}`),
  getClientMetrics: (clientId: string, days?: number) =>
    fetchAPI<any>(`/reports/${clientId}/metrics${days ? `?days=${days}` : ""}`),
  generateReport: (clientId: string) =>
    fetchAPI(`/reports/${clientId}/generate`, { method: "POST" }),

  // Suppression
  getSuppression: (search?: string) =>
    fetchAPI<{ suppression: any[] }>(`/suppression${search ? `?search=${search}` : ""}`),
  addSuppression: (data: any) =>
    fetchAPI("/suppression", { method: "POST", body: JSON.stringify(data) }),
  removeSuppression: (email: string) =>
    fetchAPI(`/suppression/${encodeURIComponent(email)}`, { method: "DELETE" }),

  // Action Log
  getActionLog: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ entries: any[] }>(`/action-log${qs}`);
  },

  // Agent
  sendCommand: (message: string) =>
    fetchAPI<{ response: string; tools_called: string[] }>("/agent/command", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  // Health
  getHealth: () => fetchAPI<any>("/health"),

  // Fleet status
  getPortfolioStatus: () =>
    fetchAPI<{ ts: string | null; nginx_resolved?: boolean; results: any[] }>(
      "/internal/portfolio-status"
    ),
};
