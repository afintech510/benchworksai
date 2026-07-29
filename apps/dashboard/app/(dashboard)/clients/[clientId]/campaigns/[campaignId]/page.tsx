"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CampaignDetailPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const { data, isLoading } = useQuery({ queryKey: ["campaign", campaignId], queryFn: () => api.getCampaign(campaignId) });
  const { data: leadsData } = useQuery({
    queryKey: ["campaign-leads", campaignId],
    queryFn: () => api.getLeads({ campaign_id: campaignId, limit: "50" }),
  });

  if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-800 rounded w-48 mb-4" /><div className="h-60 bg-gray-800 rounded-lg" /></div>;
  if (!data?.campaign) return <div className="text-red-400">Campaign not found</div>;

  const { campaign, sequence_templates, lead_count } = data;
  const leads = leadsData?.leads || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-gray-400">{campaign.vertical} &middot; {campaign.geography} &middot; {lead_count} leads</p>
        <div className="flex gap-2 mt-2">
          <span className={`px-2 py-0.5 rounded text-xs ${campaign.status === "active" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>
            {campaign.status}
          </span>
          {campaign.provision_stage && <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">{campaign.provision_stage}</span>}
        </div>
      </div>

      {/* Sequence Templates */}
      {sequence_templates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Sequence</h2>
          <div className="space-y-3">
            {sequence_templates.map((t: any) => (
              <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Step {t.step_number}</span>
                  {t.compliance_validated && <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Compliant</span>}
                </div>
                <p className="text-sm text-gray-300 font-medium mb-1">{t.subject}</p>
                <p className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-3">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead List — stage pill + ICP score only (SYN-012) */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Leads</h2>
        {leads.length === 0 ? (
          <p className="text-gray-400 text-sm">Import leads to get started.</p>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800"><tr className="text-gray-400 text-xs">
                <th className="text-left p-3">Name</th><th className="text-left p-3">Company</th>
                <th className="text-left p-3">Stage</th><th className="text-left p-3">ICP Score</th>
              </tr></thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-3">
                      <Link href={`/leads/${lead.id}`} className="text-blue-400 hover:underline">
                        {lead.first_name} {lead.last_name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-400">{lead.company}</td>
                    <td className="p-3"><span className="text-xs bg-gray-800 px-2 py-0.5 rounded capitalize">{lead.stage?.replace("_", " ")}</span></td>
                    <td className="p-3">{lead.icp_score != null ? <span className={lead.icp_score >= 70 ? "text-green-400" : "text-gray-400"}>{lead.icp_score}</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
