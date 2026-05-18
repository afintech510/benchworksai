'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminSecret } from '../layout';

interface PendingMessage {
  id: string;
  enrollment_id: string;
  step_number: number;
  subject: string;
  body_html: string;
  status: string;
  created_at: string;
  lead_name?: string;
  lead_email?: string;
  lead_score?: number;
}

export default function MessageReviewQueue() {
  const secret = useAdminSecret();
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const fetchMessages = useCallback(async () => {
    if (!secret) return;
    setLoading(true);

    const res = await fetch('/api/admin/messages/pending', {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();

    setMessages(
      (data.messages || []).map((m: PendingMessage & { lead_company?: string; campaign_name?: string }) => ({
        ...m,
        lead_name: m.lead_name || m.lead_email || 'Unknown',
      }))
    );
    setLoading(false);
  }, [secret]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    await fetch(`/api/admin/drip-messages/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleEdit = async (id: string) => {
    await fetch(`/api/admin/drip-messages/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', edited_subject: editSubject, edited_body: editBody }),
    });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setEditingId(null);
  };

  const startEdit = (msg: PendingMessage) => {
    setEditingId(msg.id);
    setEditSubject(msg.subject);
    setEditBody(msg.body_html);
  };

  if (loading) return <p className="text-gray-400">Loading pending messages...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Message Review Queue</h1>

      {messages.length === 0 ? (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center text-gray-500">
          No messages pending review.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-gray-300 font-medium">{msg.lead_name}</span>
                <span className="text-gray-500 text-sm">{msg.lead_email}</span>
                <span className="text-gray-600 text-sm">Score: {msg.lead_score}</span>
                <span className="text-gray-600 text-sm ml-auto">Step {msg.step_number}</span>
              </div>

              {editingId === msg.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  />
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm font-mono"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(msg.id)} className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-sm">
                      Save & Approve
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-white font-medium mb-2">{msg.subject}</div>
                  <div
                    className="text-gray-400 text-sm mb-3 max-h-32 overflow-y-auto prose prose-invert prose-sm"
                    dangerouslySetInnerHTML={{ __html: msg.body_html }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(msg.id, 'approve')} className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-sm">
                      Approve
                    </button>
                    <button onClick={() => startEdit(msg)} className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm">
                      Edit
                    </button>
                    <button onClick={() => handleAction(msg.id, 'reject')} className="px-3 py-1 bg-red-900 hover:bg-red-800 text-red-300 rounded text-sm">
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
