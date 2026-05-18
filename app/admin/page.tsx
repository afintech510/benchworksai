'use client';

import { useState, useEffect } from 'react';
import { useAdminSecret } from './layout';

interface DashboardData {
  total_leads: number;
  tier_counts: { cold: number; warm: number; hot: number; on_fire: number };
  pending_messages: number;
  active_enrollments: number;
  campaign_stats: Record<string, number>;
  recent_leads: Array<{
    id: string;
    email: string;
    name: string | null;
    company: string | null;
    created_at: string;
    last_seen_at: string;
    lead_scores: { score: number; tier: string } | Array<{ score: number; tier: string }> | null;
  }>;
}

const TIER_COLORS: Record<string, string> = {
  cold: 'bg-blue-900 text-blue-300',
  warm: 'bg-yellow-900 text-yellow-300',
  hot: 'bg-orange-900 text-orange-300',
  on_fire: 'bg-red-900 text-red-300',
};

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIER_COLORS[tier] || 'bg-gray-800 text-gray-400'}`}>
      {tier.replace('_', ' ')}
    </span>
  );
}

export default function NurtureDashboard() {
  const secret = useAdminSecret();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!secret) return;
    fetch('/api/admin/nurture-dashboard', {
      headers: { Authorization: `Bearer ${secret}` },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [secret]);

  if (loading) return <p className="text-gray-400">Loading dashboard...</p>;
  if (!data) return <p className="text-red-400">Failed to load dashboard.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nurture Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Leads" value={data.total_leads} />
        <MetricCard label="Pending Messages" value={data.pending_messages} href="/admin/messages" />
        <MetricCard label="Active Enrollments" value={data.active_enrollments} />
        <MetricCard label="Campaigns" value={Object.keys(data.campaign_stats).length} />
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {(['cold', 'warm', 'hot', 'on_fire'] as const).map((tier) => (
          <div key={tier} className={`rounded-lg p-4 ${TIER_COLORS[tier]}`}>
            <div className="text-2xl font-bold">{data.tier_counts[tier]}</div>
            <div className="text-sm opacity-80">{tier.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Campaign stats */}
      {Object.keys(data.campaign_stats).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Campaign Enrollments</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 divide-y divide-gray-800">
            {Object.entries(data.campaign_stats).map(([name, count]) => (
              <div key={name} className="flex justify-between px-4 py-3">
                <span className="text-gray-300">{name}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent leads */}
      <h2 className="text-lg font-semibold mb-3">Recent Leads</h2>
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Company</th>
              <th className="text-left px-4 py-3">Tier</th>
              <th className="text-left px-4 py-3">Score</th>
              <th className="text-left px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.recent_leads.map((lead) => {
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
                  <td className="px-4 py-3"><TierBadge tier={score?.tier || 'cold'} /></td>
                  <td className="px-4 py-3 text-gray-300">{score?.score ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
  if (href) return <a href={href} className="hover:ring-1 hover:ring-blue-500 rounded-lg transition-shadow">{inner}</a>;
  return inner;
}
