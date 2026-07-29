"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500", ready: "bg-blue-500", warming: "bg-yellow-500", degraded: "bg-red-500",
};

export default function MailboxesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["mailboxes"], queryFn: api.getMailboxes });

  const mailboxes = data?.mailboxes || [];
  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mailbox Pool</h1>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-4">
        {["total", "active", "warming", "ready", "degraded"].map((k) => (
          <div key={k} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{summary[k] || 0}</div>
            <div className="text-xs text-gray-400 capitalize">{k}</div>
          </div>
        ))}
      </div>

      {/* Health Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : mailboxes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No mailboxes configured. Add sending accounts in Smartlead.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mailboxes.map((m: any) => (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 relative">
              <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${STATUS_COLORS[m.status] || "bg-gray-500"}`} />
              <p className="text-sm font-mono truncate mb-1">{m.email}</p>
              <p className="text-xs text-gray-500 capitalize">{m.status} &middot; {m.provider || "unknown"}</p>
              {m.health_score != null && <p className="text-xs text-gray-500">Health: {m.health_score}</p>}
              {m.bounce_rate != null && (
                <div className="flex gap-3 text-xs text-gray-600 mt-1">
                  <span>Bounce: {(m.bounce_rate * 100).toFixed(1)}%</span>
                  <span>Spam: {((m.spam_rate || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
