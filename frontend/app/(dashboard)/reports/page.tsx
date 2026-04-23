"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["reports"], queryFn: () => api.getReports() });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (data?.reports || []).length === 0 ? (
        <p className="text-gray-400">No reports generated yet.</p>
      ) : (
        <div className="space-y-2">
          {(data?.reports || []).map((r: any) => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{r.client_id}</p>
                <p className="text-xs text-gray-400">
                  {new Date(r.report_period_start).toLocaleDateString()} — {new Date(r.report_period_end).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${r.delivered_at ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>
                {r.delivered_at ? "Delivered" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
