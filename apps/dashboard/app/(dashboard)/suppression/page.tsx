"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, X } from "lucide-react";

export default function SuppressionPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("manual");

  const { data, isLoading } = useQuery({ queryKey: ["suppression", search], queryFn: () => api.getSuppression(search || undefined) });

  const addMutation = useMutation({
    mutationFn: () => api.addSuppression({ email: newEmail, reason: newReason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppression"] }); setShowAdd(false); setNewEmail(""); },
  });

  const removeMutation = useMutation({
    mutationFn: (email: string) => api.removeSuppression(email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppression"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Suppression List</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-500">
          <Plus size={16} /> Add Email
        </button>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emails..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white outline-none" />

      {showAdd && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Reason</label>
            <input value={newReason} onChange={(e) => setNewReason(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          </div>
          <button onClick={() => addMutation.mutate()} className="bg-green-600 text-white px-4 py-2 rounded text-sm">Add</button>
          <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800"><tr className="text-gray-400 text-xs">
              <th className="text-left p-3">Email</th><th className="text-left p-3">Reason</th><th className="text-left p-3">Date</th><th className="p-3" />
            </tr></thead>
            <tbody>
              {(data?.suppression || []).map((s: any) => (
                <tr key={s.id} className="border-b border-gray-800/50">
                  <td className="p-3 font-mono text-xs">{s.email}</td>
                  <td className="p-3 text-gray-400">{s.reason}</td>
                  <td className="p-3 text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <button onClick={() => { if (confirm(`Remove ${s.email}?`)) removeMutation.mutate(s.email); }}
                      className="text-red-400 hover:text-red-300 text-xs">Remove</button>
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
