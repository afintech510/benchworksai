"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Users, Mail, MessageSquare, Activity } from "lucide-react";

export default function OverviewPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["clients"], queryFn: api.getClients });
  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getActionLog({ action_type: "system_alert", limit: "5" }),
  });
  const { data: reviews } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => api.getReplyEvents({ needs_review: "true", limit: "5" }),
  });

  if (isLoading) return <OverviewSkeleton />;
  if (error) return <div className="text-red-400">Unable to load overview. <button onClick={() => location.reload()} className="underline">Retry</button></div>;

  const clients = data?.clients || [];

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Users size={48} className="text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Welcome to BenchworksAI</h2>
        <p className="text-gray-400 mb-6">Add your first client to get started.</p>
        <Link href="/clients/new" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition">
          Add Client
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Active Clients" value={clients.length} />
        <StatCard icon={<Activity size={20} />} label="Active Campaigns" value={clients.reduce((sum: number, c: any) => sum + (c.active_campaigns || 0), 0)} />
        <StatCard icon={<Mail size={20} />} label="Total Leads" value={clients.reduce((sum: number, c: any) => sum + (c.total_leads || 0), 0)} />
        <StatCard icon={<MessageSquare size={20} />} label="Positive Replies (7d)" value={clients.reduce((sum: number, c: any) => sum + (c.positive_replies_this_week || 0), 0)} />
      </div>

      {/* Client Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Clients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client: any) => (
            <Link key={client.client_id} href={`/clients/${client.client_id}`}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{client.name}</h3>
                <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">{client.status}</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{client.industry}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{client.active_campaigns || 0} campaigns</span>
                <span>{client.total_leads || 0} leads</span>
                <span className="text-green-400">+{client.positive_replies_this_week || 0} replies</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alert Feed */}
      {(alerts?.entries?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Alerts</h2>
          <div className="space-y-2">
            {alerts!.entries.map((alert: any) => (
              <div key={alert.id} className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-sm">
                <span className="text-red-400">{alert.action_detail?.severity || "ALERT"}</span>
                <span className="text-gray-300 ml-2">{alert.action_detail?.message || JSON.stringify(alert.action_detail)}</span>
                <span className="text-gray-500 ml-2 text-xs">{new Date(alert.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Queue Mini */}
      {(reviews?.reply_events?.length ?? 0) > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Needs Review</h2>
            <Link href="/review" className="text-sm text-blue-400 hover:underline">View all</Link>
          </div>
          <div className="text-sm text-gray-400">{reviews!.reply_events.length} replies need review</div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">{icon}<span className="text-xs">{label}</span></div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-32" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-lg" />)}</div>
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-800 rounded-lg" />)}</div>
    </div>
  );
}
