"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { Clock, Zap, Target, MessageSquare, Calendar, Mail } from "lucide-react";

const EVENT_ICONS: Record<string, any> = {
  leads_imported: Mail, lead_enriched: Zap, lead_scored: Target,
  lead_imported: Mail, reply_received: MessageSquare, reply_classified: MessageSquare,
  booking_created: Calendar, lead_stage_changed: Clock, default: Clock,
};

const EVENT_LABELS: Record<string, string> = {
  leads_imported: "Lead imported to campaign",
  lead_enriched: "Contact data enriched via Apollo",
  lead_scored: "AI validated ICP fit",
  lead_imported: "Pushed to Smartlead campaign",
  reply_received: "Prospect replied",
  reply_classified: "AI classified reply",
  reply_routed: "Reply routed to client",
  booking_created: "Discovery call booked",
  booking_cancelled: "Booking cancelled",
  lead_stage_changed: "Pipeline stage updated",
  campaign_launched: "Campaign launched",
  suppression_added: "Added to suppression list",
  mcp_tool_call: "Agent action",
};

export default function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data, isLoading } = useQuery({ queryKey: ["lead", leadId], queryFn: () => api.getLead(leadId) });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-800 rounded w-48" /><div className="h-60 bg-gray-800 rounded-lg" /></div>;
  if (!data?.lead) return <div className="text-red-400">Lead not found</div>;

  const { lead, journey, replies } = data;
  const breakdown = lead.icp_breakdown || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{lead.first_name} {lead.last_name}</h1>
          <p className="text-gray-400">{lead.title} at {lead.company}</p>
          <p className="text-sm text-gray-500">{lead.email} &middot; {lead.domain}</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-lg text-sm bg-gray-800 capitalize">{lead.stage?.replace("_", " ")}</span>
          {lead.booking_status && (
            <span className={`px-3 py-1 rounded-lg text-sm ${lead.booking_status === "booked" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>
              {lead.booking_status}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* ICP Score Breakdown (F-027) */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">ICP Score</h2>
            <span className={`text-3xl font-bold ${(lead.icp_score || 0) >= 70 ? "text-green-400" : "text-yellow-400"}`}>
              {lead.icp_score || "—"}
            </span>
          </div>
          {Object.keys(breakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(breakdown).map(([key, val]: [string, any]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">{key.replace("_", " ")}</span>
                    <span className="text-gray-400">{val.score}/{val.max}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(val.score / val.max) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{val.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No scoring breakdown available.</p>
          )}
          {lead.icp_reasoning && <p className="text-sm text-gray-400 mt-4 border-t border-gray-800 pt-3">{lead.icp_reasoning}</p>}
        </div>

        {/* Enrichment Data */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Enrichment Data</h2>
          {lead.enrichment_data ? (
            <pre className="text-xs text-gray-400 overflow-auto max-h-64">{JSON.stringify(lead.enrichment_data, null, 2)}</pre>
          ) : (
            <p className="text-gray-500 text-sm">Not yet enriched.</p>
          )}
        </div>
      </div>

      {/* Lead Journey Timeline (F-026 — demo hero) */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Journey Timeline</h2>
        {journey.length === 0 ? (
          <p className="text-gray-500 text-sm">No events yet.</p>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-700" />
            {journey.map((event: any, i: number) => {
              const Icon = EVENT_ICONS[event.action_type] || EVENT_ICONS.default;
              const label = EVENT_LABELS[event.action_type] || event.action_type;
              const scoreInfo = event.action_detail?.new_stage === "qualified" || event.action_type === "lead_scored"
                ? ` (Score: ${event.action_detail?.icp_score || lead.icp_score || ""})`
                : "";
              return (
                <div key={event.id || i} className="relative group">
                  <div className="absolute -left-4 top-1 w-4 h-4 rounded-full bg-gray-800 border-2 border-blue-500 flex items-center justify-center">
                    <Icon size={10} className="text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{label}{scoreInfo}</span>
                      <span className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                    {event.action_detail && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">Details</summary>
                        <pre className="text-xs text-gray-600 mt-1 bg-gray-800 rounded p-2 overflow-auto">{JSON.stringify(event.action_detail, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
            {journey.length < 3 && (
              <p className="text-xs text-gray-500 ml-4 italic">More events will appear as the campaign runs.</p>
            )}
          </div>
        )}
      </div>

      {/* Reply History */}
      {replies.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Reply History</h2>
          <div className="space-y-3">
            {replies.map((r: any) => (
              <div key={r.id} className="border-b border-gray-800 pb-3 last:border-0">
                <div className="flex gap-2 mb-1">
                  {r.classification && <span className="text-xs bg-gray-800 px-2 py-0.5 rounded capitalize">{r.classification}</span>}
                  {r.confidence != null && <span className="text-xs text-gray-500">{(r.confidence * 100).toFixed(0)}% confidence</span>}
                  {r.sentiment && <span className="text-xs text-gray-500">{r.sentiment}</span>}
                </div>
                <p className="text-sm text-gray-300">{r.reply_body}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(r.processed_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
