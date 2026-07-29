'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminSecret } from '../layout';

interface ConfigEntry {
  key: string;
  value: unknown;
  description: string;
}

const CONFIG_KEYS: ConfigEntry[] = [
  { key: 'availability_status', value: 'available', description: 'Site availability status (available, maintenance, limited)' },
  { key: 'rate_limit_global_daily', value: 50, description: 'Global daily AI interaction limit per user' },
  { key: 'rate_limit_per_demo', value: 10, description: 'Per-demo daily AI interaction limit' },
  { key: 'social_proof_enabled', value: true, description: 'Show social proof notifications' },
  { key: 'social_proof_message', value: '', description: 'Custom social proof message' },
];

export default function ConfigEditor() {
  const secret = useAdminSecret();
  const [configs, setConfigs] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with defaults — in a real app we'd fetch from DB
    const initial: Record<string, unknown> = {};
    for (const c of CONFIG_KEYS) initial[c.key] = c.value;
    setConfigs(initial);
  }, []);

  const updateConfig = useCallback(async (key: string, value: unknown) => {
    setSaving(key);
    setSaved(null);
    await fetch(`/api/admin/config/${key}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    setConfigs((prev) => ({ ...prev, [key]: value }));
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  }, [secret]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Site Configuration</h1>

      <div className="space-y-4">
        {CONFIG_KEYS.map((cfg) => (
          <div key={cfg.key} className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-white font-medium">{cfg.key}</span>
                <p className="text-gray-500 text-sm">{cfg.description}</p>
              </div>
              {saving === cfg.key && <span className="text-yellow-400 text-sm">Saving...</span>}
              {saved === cfg.key && <span className="text-green-400 text-sm">Saved</span>}
            </div>
            <ConfigInput
              type={typeof cfg.value}
              value={configs[cfg.key]}
              onChange={(val) => updateConfig(cfg.key, val)}
            />
          </div>
        ))}
      </div>

      {/* Cache invalidation */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Cache Management</h2>
        <CacheInvalidator secret={secret} />
      </div>
    </div>
  );
}

function ConfigInput({ type, value, onChange }: { type: string; value: unknown; onChange: (val: unknown) => void }) {
  if (type === 'boolean') {
    return (
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full relative transition-colors ${value ? 'bg-green-600' : 'bg-gray-600'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'left-7' : 'left-1'}`} />
      </button>
    );
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        value={Number(value) || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={(e) => onChange(Number(e.target.value))}
        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm w-32"
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value || '')}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onChange(e.target.value)}
      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm w-full"
    />
  );
}

function CacheInvalidator({ secret }: { secret: string }) {
  const [demoType, setDemoType] = useState('');
  const [vertical, setVertical] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const invalidate = async () => {
    if (!demoType && !vertical) return;
    const res = await fetch('/api/admin/cache/invalidate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo_type: demoType || undefined, vertical: vertical || undefined }),
    });
    const data = await res.json();
    setResult(`Deleted ${data.deleted ?? 0} cached entries.`);
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-gray-400 text-sm block mb-1">Demo Type</label>
          <input
            type="text"
            value={demoType}
            onChange={(e) => setDemoType(e.target.value)}
            placeholder="e.g. email_assistant"
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Vertical</label>
          <input
            type="text"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            placeholder="e.g. construction"
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <button onClick={invalidate} className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-300 rounded text-sm transition-colors">
          Invalidate
        </button>
        {result && <span className="text-green-400 text-sm">{result}</span>}
      </div>
    </div>
  );
}
