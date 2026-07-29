'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminSecret } from '../layout';

interface Lead {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  vertical_interest: string | null;
  subscribed: boolean;
  contacted: boolean;
  last_seen_at: string;
  created_at: string;
  lead_scores: { score: number; tier: string } | Array<{ score: number; tier: string }> | null;
}

const TIER_COLORS: Record<string, string> = {
  cold: 'bg-blue-900 text-blue-300',
  warm: 'bg-yellow-900 text-yellow-300',
  hot: 'bg-orange-900 text-orange-300',
  on_fire: 'bg-red-900 text-red-300',
};

export default function LeadList() {
  const secret = useAdminSecret();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [contacted, setContacted] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const fetchLeads = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tier) params.set('tier', tier);
    if (contacted) params.set('contacted', contacted);
    params.set('sort', sort);
    params.set('order', order);
    params.set('page', String(page));

    const res = await fetch(`/api/admin/leads?${params}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [secret, search, tier, contacted, sort, order, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const toggleContacted = async (id: string, current: boolean) => {
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacted: !current }),
    });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, contacted: !current } : l));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Leads</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, email, company..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 text-sm w-64"
        />
        <select
          value={tier}
          onChange={(e) => { setTier(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
        >
          <option value="">All tiers</option>
          <option value="cold">Cold</option>
          <option value="warm">Warm</option>
          <option value="hot">Hot</option>
          <option value="on_fire">On Fire</option>
        </select>
        <select
          value={contacted}
          onChange={(e) => { setContacted(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
        >
          <option value="">All</option>
          <option value="false">Not contacted</option>
          <option value="true">Contacted</option>
        </select>
        <select
          value={`${sort}-${order}`}
          onChange={(e) => { const [s, o] = e.target.value.split('-'); setSort(s); setOrder(o); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
        >
          <option value="created_at-desc">Newest first</option>
          <option value="created_at-asc">Oldest first</option>
          <option value="score-desc">Highest score</option>
          <option value="score-asc">Lowest score</option>
          <option value="last_seen_at-desc">Recent activity</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-x-auto">
        {loading ? (
          <p className="text-gray-400 p-4">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Tier</th>
                <th className="text-left px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Last Seen</th>
                <th className="text-left px-4 py-3">Contacted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {leads.map((lead) => {
                const score = Array.isArray(lead.lead_scores) ? lead.lead_scores[0] : lead.lead_scores;
                return (
                  <tr key={lead.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <a href={`/admin/leads/${lead.id}`} className="text-blue-400 hover:underline">
                        {lead.name || '—'}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-400">{lead.company || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIER_COLORS[score?.tier || 'cold'] || 'bg-gray-800 text-gray-400'}`}>
                        {(score?.tier || 'cold').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{score?.score ?? 0}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(lead.last_seen_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleContacted(lead.id, lead.contacted)}
                        className={`w-9 h-5 rounded-full relative transition-colors ${lead.contacted ? 'bg-green-600' : 'bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${lead.contacted ? 'left-4.5' : 'left-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {leads.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No leads found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50">
            Prev
          </button>
          <span className="text-sm text-gray-400">Page {page} of {Math.ceil(total / 50)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 50)} className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
