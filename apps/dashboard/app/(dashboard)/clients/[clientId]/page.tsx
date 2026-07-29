"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";

const FUNNEL_STAGES = ["new", "enriched", "qualified", "contacted", "replied", "interested", "call_booked"];

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { data, isLoading } = useQuery({ queryKey: ["client", clientId], queryFn: () => api.getClient(clientId) });
  const { data: metrics } = useQuery({ queryKey: ["metrics", clientId], queryFn: () => api.getClientMetrics(clientId) });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-800 rounded w-48" /><div className="h-40 bg-gray-800 rounded-lg" /></div>;
  if (!data?.client) return <div className="text-red-400">Client not found</div>;

  const { client, campaigns } = data;
  const leadsByStage = metrics?.leads_by_stage || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <p className="text-gray-400">{client.industry} &middot; {client.status}</p>
      </div>

      {/* Pipeline Funnel (SYN-025: scoped to call_booked) */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Pipeline</h2>
        <div className="flex gap-2">
          {FUNNEL_STAGES.map((stage) => (
            <div key={stage} className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{leadsByStage[stage] || 0}</div>
              <div className="text-xs text-gray-400 capitalize">{stage.replace("_", " ")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-gray-400 text-sm">No campaigns yet.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((camp: any) => (
              <Link key={camp.id} href={`/clients/${clientId}/campaigns/${camp.id}`}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition">
                <div>
                  <h3 className="font-medium">{camp.name}</h3>
                  <p className="text-xs text-gray-400">{camp.vertical} &middot; {camp.geography}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs ${camp.status === "active" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>
                    {camp.status}
                  </span>
                  {camp.provision_stage && <span className="text-xs text-yellow-400">{camp.provision_stage}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Metrics (7 days)</h2>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="Total Leads" value={metrics.total_leads} />
            <MetricCard label="Total Replies" value={metrics.total_replies} />
            <MetricCard label="Interested" value={metrics.positive_replies} />
            <MetricCard label="Meetings Booked" value={metrics.meetings_booked} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
