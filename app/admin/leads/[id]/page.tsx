'use client';

import { useState, useEffect, use } from 'react';
import { useAdminSecret } from '../../layout';

interface FullContext {
  lead: {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
    vertical_interest: string | null;
    subscribed: boolean;
    contacted: boolean;
    notes: string | null;
    created_at: string;
    last_seen_at: string;
  };
  score: { score: number; tier: string; breakdown: Record<string, number>; updated_at?: string };
  sessions: Array<{ id: string; demo_type: string; vertical: string; created_at: string }>;
  interactions: Array<{ id: string; input_type: string; user_input: string; from_cache: boolean; created_at: string }>;
  competitive_analyses: Array<{ id: string; business_name: string; competitors: string[]; pdf_storage_path: string | null; created_at: string }>;
  enrollments: Array<{ id: string; campaign_id: string; current_step: number; status: string; next_step_at: string | null; drip_campaigns: { name: string } | null }>;
  messages: Array<{ id: string; step_number: number; subject: string; status: string; created_at: string }>;
  pending_messages: Array<{ id: string; subject: string; body_html: string; status: string }>;
}

const TIER_COLORS: Record<string, string> = {
  cold: 'bg-blue-900 text-blue-300',
  warm: 'bg-yellow-900 text-yellow-300',
  hot: 'bg-orange-900 text-orange-300',
  on_fire: 'bg-red-900 text-red-300',
};

export default function LeadDetailView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const secret = useAdminSecret();
  const [data, setData] = useState<FullContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!secret) return;
    fetch(`/api/admin/leads/${id}/full-context`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [secret, id]);

  const handleRevoke = async () => {
    if (!confirm('Revoke all sessions for this lead? They will need to re-authenticate.')) return;
    await fetch(`/api/admin/leads/${id}/revoke`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${secret}` },
    });
    alert('Sessions revoked.');
  };

  if (loading) return <p className="text-gray-400">Loading lead details...</p>;
  if (!data) return <p className="text-red-400">Lead not found.</p>;

  const { lead, score, sessions, interactions, competitive_analyses, enrollments, messages, pending_messages } = data;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin/leads" className="text-gray-500 hover:text-white text-sm">&larr; Back to leads</a>
        <h1 className="text-2xl font-bold">{lead.name || lead.email}</h1>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIER_COLORS[score.tier] || 'bg-gray-800 text-gray-400'}`}>
          {score.tier.replace('_', ' ')} ({score.score})
        </span>
      </div>

      {/* Lead info + actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Section title="Lead Info">
          <InfoRow label="Email" value={lead.email} />
          <InfoRow label="Company" value={lead.company || '—'} />
          <InfoRow label="Vertical" value={lead.vertical_interest || '—'} />
          <InfoRow label="Subscribed" value={lead.subscribed ? 'Yes' : 'No'} />
          <InfoRow label="Contacted" value={lead.contacted ? 'Yes' : 'No'} />
          <InfoRow label="Joined" value={new Date(lead.created_at).toLocaleString()} />
          <InfoRow label="Last Seen" value={new Date(lead.last_seen_at).toLocaleString()} />
          {lead.notes && <InfoRow label="Notes" value={lead.notes} />}
          <div className="mt-3">
            <button onClick={handleRevoke} className="px-3 py-1 bg-red-900 hover:bg-red-800 text-red-300 rounded text-sm transition-colors">
              Revoke Sessions
            </button>
          </div>
        </Section>

        <Section title="Score Breakdown">
          {Object.entries(score.breakdown || {}).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(score.breakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
                  <span className="text-white font-medium">+{value as number}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-300 font-medium">Total</span>
                <span className="text-white font-bold">{score.score}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No score breakdown available.</p>
          )}
        </Section>
      </div>

      {/* Demo sessions */}
      <Section title={`Demo Sessions (${sessions.length})`}>
        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex gap-4 text-sm">
                <span className="text-gray-300">{s.demo_type.replace(/_/g, ' ')}</span>
                <span className="text-gray-500">{s.vertical}</span>
                <span className="text-gray-600 ml-auto">{new Date(s.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No sessions.</p>
        )}
      </Section>

      {/* Interactions */}
      <Section title={`Recent Interactions (${interactions.length})`}>
        {interactions.length > 0 ? (
          <div className="space-y-2">
            {interactions.slice(0, 20).map((i) => (
              <div key={i.id} className="text-sm">
                <span className={`mr-2 px-1.5 py-0.5 rounded text-xs ${i.from_cache ? 'bg-gray-800 text-gray-500' : 'bg-purple-900 text-purple-300'}`}>
                  {i.from_cache ? 'cached' : 'live'}
                </span>
                <span className="text-gray-300">{i.user_input?.slice(0, 100)}</span>
                <span className="text-gray-600 ml-2">{new Date(i.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No interactions.</p>
        )}
      </Section>

      {/* Competitive analyses */}
      {competitive_analyses.length > 0 && (
        <Section title="Competitive Analyses">
          {competitive_analyses.map((ca) => (
            <div key={ca.id} className="flex gap-4 text-sm">
              <span className="text-gray-300">{ca.business_name}</span>
              <span className="text-gray-500">{ca.competitors?.join(', ') || 'Auto-identified'}</span>
              <span className="text-gray-500">{ca.pdf_storage_path ? 'PDF available' : 'No PDF'}</span>
              <span className="text-gray-600 ml-auto">{new Date(ca.created_at).toLocaleString()}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Drip enrollments */}
      <Section title={`Drip Enrollments (${enrollments.length})`}>
        {enrollments.length > 0 ? (
          <div className="space-y-2">
            {enrollments.map((e) => (
              <div key={e.id} className="flex gap-4 text-sm items-center">
                <span className="text-gray-300">{e.drip_campaigns?.name || e.campaign_id}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${e.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
                  {e.status}
                </span>
                <span className="text-gray-500">Step {e.current_step}</span>
                {e.next_step_at && <span className="text-gray-600">Next: {new Date(e.next_step_at).toLocaleString()}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Not enrolled in any campaigns.</p>
        )}
      </Section>

      {/* Messages */}
      <Section title={`Messages (${messages.length})`}>
        {messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-4 text-sm items-center">
                <span className="text-gray-400">Step {m.step_number}</span>
                <span className="text-gray-300 flex-1">{m.subject}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  m.status === 'approved' ? 'bg-green-900 text-green-300' :
                  m.status === 'pending_review' ? 'bg-yellow-900 text-yellow-300' :
                  m.status === 'rejected' ? 'bg-red-900 text-red-300' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {m.status.replace('_', ' ')}
                </span>
                <span className="text-gray-600">{new Date(m.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No messages.</p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
