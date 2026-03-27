'use client';

import { useState, useCallback, useEffect } from 'react';

interface CompetitorInput {
  name: string;
  url: string;
}

interface CompetitiveAnalysisProps {
  sessionId: string;
  presets: { sequence: number; prompt_text: string; trigger_key: string }[];
  onInteract: (input: { input_type: string; user_input?: string; trigger_key?: string }) => Promise<Response>;
}

export function CompetitiveAnalysis({ sessionId, presets, onInteract }: CompetitiveAnalysisProps) {
  const [businessName, setBusinessName] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorInput[]>([{ name: '', url: '' }]);
  const [report, setReport] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const [hasFormData, setHasFormData] = useState(false);

  // Track form data for beforeunload
  useEffect(() => {
    const dirty = businessName.trim().length > 0 || competitors.some((c) => c.name.trim().length > 0);
    setHasFormData(dirty);
  }, [businessName, competitors]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasFormData && !report) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasFormData, report]);

  const handlePreset = useCallback(async (triggerKey: string) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setUsedKeys((prev) => new Set([...prev, triggerKey]));
    setError(null);

    try {
      const res = await onInteract({ input_type: 'preset_command', trigger_key: triggerKey });
      const data = await res.json();
      setReport(data.response_text || null);
    } catch {
      setError('Unable to load analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, onInteract]);

  const addCompetitor = useCallback(() => {
    if (competitors.length >= 3) return;
    setCompetitors((prev) => [...prev, { name: '', url: '' }]);
  }, [competitors.length]);

  const updateCompetitor = useCallback((index: number, field: 'name' | 'url', value: string) => {
    setCompetitors((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnalyzing || !businessName.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setReport(null);
    setDownloadUrl(null);

    try {
      const res = await fetch('/api/demos/competitive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          business_name: businessName.trim(),
          competitors: competitors
            .filter((c) => c.name.trim())
            .map((c) => c.name.trim()),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError('You\'ve reached the daily limit for competitive analysis. Try again tomorrow or book a discovery call.');
        } else {
          setError(data.error?.message || 'Analysis failed. Please try again.');
        }
        setIsAnalyzing(false);
        return;
      }

      setReport(data.report || null);
      setDownloadUrl(data.download_url || null);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, businessName, competitors, sessionId]);

  return (
    <div className="space-y-6">
      {/* Presets */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const used = usedKeys.has(p.trigger_key);
            return (
              <button
                key={p.trigger_key}
                onClick={() => handlePreset(p.trigger_key)}
                disabled={isAnalyzing || used}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  used ? 'border-border bg-muted text-muted-foreground' : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                } disabled:opacity-50`}
              >
                {used && <span className="mr-1">&#10003;</span>}
                {p.prompt_text}
              </button>
            );
          })}
        </div>
      )}

      {!report ? (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="ca-business" className="block text-sm font-medium text-foreground mb-1">
              Your Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="ca-business"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={isAnalyzing}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="e.g., Main Street Retail"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-foreground">
                Competitors <span className="text-muted-foreground">(optional, up to 3)</span>
              </label>
              {competitors.length < 3 && (
                <button type="button" onClick={addCompetitor} className="text-xs text-primary hover:text-primary-hover font-medium">
                  + Add competitor
                </button>
              )}
            </div>
            {competitors.map((comp, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={comp.name}
                  onChange={(e) => updateCompetitor(i, 'name', e.target.value)}
                  disabled={isAnalyzing}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  placeholder="Competitor name"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isAnalyzing || !businessName.trim()}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing your competitive landscape...
              </>
            ) : (
              'Run Analysis'
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Competitive Analysis Report</h3>
            <div className="flex gap-2">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-primary text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/5 transition-colors"
                >
                  Download PDF
                </a>
              )}
              <button
                onClick={() => { setReport(null); setDownloadUrl(null); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                New Analysis
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-border p-6 prose-custom">
            <p className="text-sm text-foreground whitespace-pre-wrap">{report}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">Sample analysis for demonstration purposes</p>
    </div>
  );
}
