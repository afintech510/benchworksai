"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle, XCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: health } = useQuery({ queryKey: ["health"], queryFn: api.getHealth, refetchInterval: 30000 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Service Status */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Service Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ServiceStatus name="FastAPI" status={health?.status === "healthy"} />
          <ServiceStatus name="Supabase" status={!!health} />
          <ServiceStatus name="Redis" status={!!health} />
          <ServiceStatus name="Smartlead" status={false} />
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">System Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">API Version</span><span>{health?.service || "—"}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Last Health Check</span><span>{health?.timestamp ? new Date(health.timestamp).toLocaleString() : "—"}</span></div>
        </div>
      </div>
    </div>
  );
}

function ServiceStatus({ name, status }: { name: string; status: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center gap-2">
      {status ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
      <span className="text-sm">{name}</span>
    </div>
  );
}
