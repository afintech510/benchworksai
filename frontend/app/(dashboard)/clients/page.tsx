"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function ClientsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["clients"], queryFn: api.getClients });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/clients/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 text-sm">
          <Plus size={16} /> Add Client
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {(data?.clients || []).map((client: any) => (
            <Link key={client.client_id} href={`/clients/${client.client_id}`}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition">
              <div>
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-sm text-gray-400">{client.industry}</p>
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                <span>{client.active_campaigns || 0} campaigns</span>
                <span>{client.total_leads || 0} leads</span>
                <span className="text-green-400">+{client.positive_replies_this_week || 0}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${client.status === "active" ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"}`}>
                  {client.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
