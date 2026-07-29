"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ReviewQueuePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => api.getReplyEvents({ needs_review: "true" }),
  });

  const resolve = useMutation({
    mutationFn: ({ id, classification }: { id: string; classification: string }) =>
      api.resolveReview(id, { needs_review: false, classification }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["review-queue"] }),
  });

  const reviews = data?.reply_events || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Review Queue</h1>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">All caught up. No replies need review.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-medium">{r.leads?.first_name} {r.leads?.last_name}</span>
                  <span className="text-gray-400 ml-2">{r.leads?.company}</span>
                </div>
                <div className="flex gap-2">
                  {r.classification && <span className="text-xs bg-gray-800 px-2 py-0.5 rounded capitalize">{r.classification}</span>}
                  {r.confidence != null && <span className="text-xs text-gray-500">{(r.confidence * 100).toFixed(0)}%</span>}
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap">{r.reply_body}</p>
              {r.suggested_action && <p className="text-xs text-gray-500 mb-3">Suggested: {r.suggested_action}</p>}
              <div className="flex gap-2">
                <button onClick={() => resolve.mutate({ id: r.id, classification: "interested" })}
                  className="text-xs bg-green-900 text-green-300 px-3 py-1 rounded hover:bg-green-800">Confirm Interested</button>
                <button onClick={() => resolve.mutate({ id: r.id, classification: "not_interested" })}
                  className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded hover:bg-gray-700">Not Interested</button>
                <button onClick={() => resolve.mutate({ id: r.id, classification: r.classification || "question" })}
                  className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded hover:bg-gray-700">Mark Reviewed</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
