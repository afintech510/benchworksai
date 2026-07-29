'use client';

import { useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// PLACEHOLDER — replace with vertical_content data in Phase 06
const REVENUE_DATA = [
  { month: 'Jan', revenue: 42000 },
  { month: 'Feb', revenue: 45000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 51000 },
  { month: 'May', revenue: 47000 },
  { month: 'Jun', revenue: 55000 },
];

const CATEGORY_DATA = [
  { category: 'Services', value: 35000 },
  { category: 'Products', value: 22000 },
  { category: 'Consulting', value: 18000 },
  { category: 'Support', value: 12000 },
];

const SEGMENT_DATA = [
  { name: 'Repeat Customers', value: 45 },
  { name: 'New Customers', value: 30 },
  { name: 'Referrals', value: 15 },
  { name: 'Walk-ins', value: 10 },
];

const COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b'];

interface AnalyticsDashboardProps {
  presets: { sequence: number; prompt_text: string; trigger_key: string }[];
  onInteract: (input: { input_type: string; user_input?: string; trigger_key?: string }) => Promise<Response>;
}

export function AnalyticsDashboard({ presets, onInteract }: AnalyticsDashboardProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());

  const handlePreset = useCallback(async (triggerKey: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setUsedKeys((prev) => new Set([...prev, triggerKey]));

    try {
      const res = await onInteract({ input_type: 'preset_command', trigger_key: triggerKey });
      const data = await res.json();
      setInsight(data.response_text || null);
    } catch {
      setInsight('Unable to generate insight. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onInteract]);

  const handleFreeText = useCallback(async (question: string) => {
    if (isLoading || !question.trim()) return;
    setIsLoading(true);

    try {
      const res = await onInteract({ input_type: 'text', user_input: question });
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/plain') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setInsight(accumulated);
        }
      } else {
        const data = await res.json();
        setInsight(data.response_text || data.error?.message || 'No insight available.');
      }
    } catch {
      setInsight('Unable to generate insight.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onInteract]);

  return (
    <div className="space-y-6">
      {/* Preset insights */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const used = usedKeys.has(p.trigger_key);
            return (
              <button
                key={p.trigger_key}
                onClick={() => handlePreset(p.trigger_key)}
                disabled={isLoading || used}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  used
                    ? 'border-border bg-muted text-muted-foreground'
                    : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                } disabled:opacity-50`}
              >
                {used && <span className="mr-1">&#10003;</span>}
                {p.prompt_text}
              </button>
            );
          })}
        </div>
      )}

      {/* Charts grid — single column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lt-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--lt-muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--lt-muted-foreground)" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="var(--lt-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CATEGORY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lt-border)" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="var(--lt-muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--lt-muted-foreground)" />
              <Tooltip />
              <Bar dataKey="value" fill="var(--lt-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer segments */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Customer Segments</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={SEGMENT_DATA} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {SEGMENT_DATA.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insight panel */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">AI Insights</h3>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-5/6" />
              <p className="text-xs text-muted-foreground mt-2">Crunching your numbers...</p>
            </div>
          ) : insight ? (
            <p className="text-sm text-foreground whitespace-pre-wrap">{insight}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click a preset above or ask a question to get AI-powered insights about your data.
            </p>
          )}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Ask about your data..."
              disabled={isLoading}
              maxLength={2000}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFreeText((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              aria-label="Ask about analytics data"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">Sample data for demonstration purposes</p>
    </div>
  );
}
