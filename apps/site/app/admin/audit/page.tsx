'use client';

import { useState, useCallback } from 'react';
import { useAdminSecret } from '../layout';

interface DemoResult {
  demo: string;
  session_ok: boolean;
  cached_ok: boolean;
  live_ok: boolean;
  cached_preview?: string;
  live_preview?: string;
  errors: string[];
  latency_ms: number;
}

interface AuditResponse {
  ok: boolean;
  audit_email?: string;
  vertical?: string;
  summary?: {
    total: number;
    passing: number;
    cached_failing: number;
    live_failing: number;
    total_latency_ms: number;
  };
  results?: DemoResult[];
  stage?: string;
  status?: number;
  body?: string;
}

const VERTICALS = ['general_smb', 'construction', 'property_mgmt', 'legal'];

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${ok ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>
      {ok ? '✓' : '✕'} {label}
    </span>
  );
}

export default function AuditPage() {
  const secret = useAdminSecret();
  const [vertical, setVertical] = useState('general_smb');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/demo-audit?vertical=${vertical}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}` },
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ ok: false, body: (err as Error).message });
    } finally {
      setRunning(false);
    }
  }, [secret, vertical]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Demo audit</h1>
        <p className="mt-1 text-sm text-gray-400">
          Runs gate → session → cached preset → live Claude for each demo type in the chosen vertical.
          Hits live public endpoints — real Anthropic spend (~7 × ~3¢).
        </p>
      </header>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-300">Vertical:</label>
        <select
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
          disabled={running}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
        >
          {VERTICALS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <button
          onClick={run}
          disabled={running}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-sm font-medium transition-colors"
        >
          {running ? 'Running… (~30–60s)' : 'Run audit'}
        </button>
      </div>

      {running && <p className="text-sm text-gray-400">Live Claude calls are slow — hang tight.</p>}

      {result && !result.ok && (
        <div className="rounded border border-red-900 bg-red-950/30 p-4">
          <p className="text-red-300 font-medium">Audit failed at stage: {result.stage || 'unknown'}</p>
          {result.status && <p className="text-xs text-red-400 mt-1">HTTP {result.status}</p>}
          {result.body && <pre className="mt-2 text-xs text-red-400 whitespace-pre-wrap">{result.body}</pre>}
        </div>
      )}

      {result?.ok && result.summary && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs text-gray-400">Passing</div>
              <div className="text-2xl font-bold text-emerald-400">{result.summary.passing} / {result.summary.total}</div>
            </div>
            <div className="rounded border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs text-gray-400">Cached failing</div>
              <div className="text-2xl font-bold text-red-400">{result.summary.cached_failing}</div>
            </div>
            <div className="rounded border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs text-gray-400">Live failing</div>
              <div className="text-2xl font-bold text-red-400">{result.summary.live_failing}</div>
            </div>
            <div className="rounded border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs text-gray-400">Total time</div>
              <div className="text-2xl font-bold">{(result.summary.total_latency_ms / 1000).toFixed(1)}s</div>
            </div>
          </div>

          <p className="text-xs text-gray-500">Audit email: <code>{result.audit_email}</code> · Vertical: <code>{result.vertical}</code></p>

          <div className="space-y-3">
            {result.results?.map((r) => (
              <div key={r.demo} className="rounded border border-gray-800 bg-gray-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono font-bold">{r.demo}</h3>
                  <div className="flex gap-2 items-center">
                    <Pill ok={r.session_ok} label="session" />
                    <Pill ok={r.cached_ok} label="cached" />
                    <Pill ok={r.live_ok} label="live" />
                    <span className="text-xs text-gray-500 ml-2">{r.latency_ms}ms</span>
                  </div>
                </div>
                {r.cached_preview && (
                  <p className="text-xs text-gray-400 mb-1"><span className="text-emerald-500">cached →</span> {r.cached_preview}...</p>
                )}
                {r.live_preview && (
                  <p className="text-xs text-gray-400 mb-1"><span className="text-emerald-500">live →</span> {r.live_preview}...</p>
                )}
                {r.errors.length > 0 && (
                  <ul className="mt-2 text-xs text-red-400 list-disc list-inside">
                    {r.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
