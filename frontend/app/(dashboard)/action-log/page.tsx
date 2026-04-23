"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ActionLogPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, isLoading } = useQuery({ queryKey: ["action-log", filters], queryFn: () => api.getActionLog(filters) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Action Log</h1>

      <div className="flex gap-3">
        <input placeholder="Filter by action type..." onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800"><tr className="text-gray-400 text-xs">
              <th className="text-left p-3">Time</th><th className="text-left p-3">Type</th><th className="text-left p-3">By</th><th className="text-left p-3">Details</th>
            </tr></thead>
            <tbody>
              {(data?.entries || []).map((e: any) => (
                <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="p-3"><span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{e.action_type}</span></td>
                  <td className="p-3 text-gray-400 text-xs">{e.initiated_by || "system"}</td>
                  <td className="p-3">
                    <details>
                      <summary className="text-xs text-gray-500 cursor-pointer">View</summary>
                      <pre className="text-xs text-gray-600 mt-1 bg-gray-800 rounded p-2 overflow-auto max-w-lg">{JSON.stringify(e.action_detail, null, 2)}</pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
