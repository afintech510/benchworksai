"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Row = {
  group: string;
  host: string;
  origin_code: number;
  origin_ms: number | null;
  edge_code: number | null;
  edge_ms: number | null;
  status: string;
  uptime_24h?: number | null;
  uptime_7d?: number | null;
  uptime_samples?: number;
  last_down?: string | null;
};

const AMBER_MS = 2000;

function dotColor(row: Row): string {
  if (row.status !== "up") return "#e74c3c";
  if (row.origin_ms != null && row.origin_ms > AMBER_MS) return "#f1c40f";
  return "#2ecc71";
}

function codeClass(code: number | null): string {
  if (code == null) return "text-gray-500";
  if (code >= 200 && code < 400) return "text-green-400";
  return "text-red-400";
}

function uptimeClass(pct: number | null | undefined): string {
  if (pct == null) return "text-gray-500";
  if (pct >= 99.5) return "text-green-400";
  if (pct >= 98) return "text-yellow-400";
  return "text-red-400";
}

function lastDown(iso: string | null | undefined): { text: string; cls: string; title: string } {
  if (!iso) return { text: "Never", cls: "text-green-400", title: "no downtime recorded" };
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  let rel: string;
  if (mins < 1) rel = "just now";
  else if (mins < 60) rel = `${mins}m ago`;
  else if (mins < 1440) rel = `${Math.floor(mins / 60)}h ago`;
  else rel = `${Math.floor(mins / 1440)}d ago`;
  return { text: rel, cls: "text-gray-300", title: d.toLocaleString() };
}

export default function FleetStatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["fleet-status"],
    queryFn: () => api.getPortfolioStatus(),
    refetchInterval: 60_000,
  });

  const rows: Row[] = data?.results || [];
  const up = rows.filter((r) => r.status === "up").length;
  const down = rows.length - up;

  // Preserve first-seen group order.
  const groups: { name: string; rows: Row[] }[] = [];
  for (const r of rows) {
    let g = groups.find((x) => x.name === r.group);
    if (!g) {
      g = { name: r.group, rows: [] };
      groups.push(g);
    }
    g.rows.push(r);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Fleet Status</h1>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full bg-green-900/40 text-green-300 px-3 py-1 font-semibold">
            {up} up
          </span>
          <span className="rounded-full bg-red-900/40 text-red-300 px-3 py-1 font-semibold">
            {down} down
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Origin = VPS loopback via shared nginx · Edge = public Cloudflare (filled
        only when an external collector pushes it) · auto-refresh 60s
        {data?.ts ? ` · last updated ${new Date(data.ts).toLocaleString()}` : ""}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-gray-400">
          No status snapshot yet — the monitor runs every 5 minutes. Check back
          shortly.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2 font-semibold">Host</th>
                <th className="px-4 py-2 font-semibold">Origin</th>
                <th className="px-4 py-2 font-semibold">Origin ms</th>
                <th className="px-4 py-2 font-semibold">Edge</th>
                <th className="px-4 py-2 font-semibold">Edge ms</th>
                <th className="px-4 py-2 font-semibold">Uptime 24h</th>
                <th className="px-4 py-2 font-semibold">Last Down</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <FragmentGroup key={g.name} group={g} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FragmentGroup({ group }: { group: { name: string; rows: Row[] } }) {
  return (
    <>
      <tr className="bg-gray-900/60">
        <td
          colSpan={8}
          className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-gray-400"
        >
          {group.name}
        </td>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.host} className="border-t border-gray-800">
          <td className="px-4 py-2">
            <span
              className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
              style={{ background: dotColor(r) }}
            />
            {r.host}
          </td>
          <td className={`px-4 py-2 font-medium ${codeClass(r.origin_code)}`}>
            {r.origin_code || "—"}
          </td>
          <td className="px-4 py-2 text-gray-400">
            {r.origin_ms != null ? `${r.origin_ms} ms` : "—"}
          </td>
          <td className={`px-4 py-2 font-medium ${codeClass(r.edge_code)}`}>
            {r.edge_code ?? "—"}
          </td>
          <td className="px-4 py-2 text-gray-400">
            {r.edge_ms != null ? `${r.edge_ms} ms` : "—"}
          </td>
          <td
            className={`px-4 py-2 font-medium ${uptimeClass(r.uptime_24h)}`}
            title={
              r.uptime_samples
                ? `${r.uptime_7d ?? "—"}% over ${r.uptime_samples} checks (7d window)`
                : "no history yet"
            }
          >
            {r.uptime_24h != null ? `${r.uptime_24h.toFixed(2)}%` : "—"}
          </td>
          {(() => {
            const ld = lastDown(r.last_down);
            return (
              <td className={`px-4 py-2 ${ld.cls}`} title={ld.title}>
                {ld.text}
              </td>
            );
          })()}
          <td
            className={`px-4 py-2 font-semibold ${
              r.status === "up" ? "text-green-400" : "text-red-400"
            }`}
          >
            {r.status.toUpperCase()}
          </td>
        </tr>
      ))}
    </>
  );
}
