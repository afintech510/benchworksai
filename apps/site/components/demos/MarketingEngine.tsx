'use client';

import { useState, useCallback } from 'react';

const CAMPAIGN_STAGES = [
  { id: 'audience', label: 'Audience Research', icon: '🎯' },
  { id: 'strategy', label: 'Campaign Strategy', icon: '📋' },
  { id: 'content', label: 'Content Creation', icon: '✍️' },
  { id: 'channels', label: 'Channel Plan', icon: '📡' },
  { id: 'optimization', label: 'Optimization', icon: '📈' },
] as const;

interface MarketingEngineProps {
  presets: { sequence: number; prompt_text: string; trigger_key: string }[];
  onInteract: (input: { input_type: string; user_input?: string; trigger_key?: string }) => Promise<Response>;
}

export function MarketingEngine({ presets, onInteract }: MarketingEngineProps) {
  const [businessGoal, setBusinessGoal] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [budget, setBudget] = useState('');
  const [activeStage, setActiveStage] = useState(-1);
  const [stageContent, setStageContent] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());

  const handlePreset = useCallback(
    async (triggerKey: string) => {
      if (isRunning) return;
      setIsRunning(true);
      setUsedKeys((prev) => new Set([...prev, triggerKey]));
      setError(null);

      try {
        const res = await onInteract({ input_type: 'preset_command', trigger_key: triggerKey });
        const data = await res.json();
        const responseText = data.response_text || '';
        // Map to first empty stage
        const emptyStage = CAMPAIGN_STAGES.find((s) => !stageContent[s.id]);
        if (emptyStage) {
          setStageContent((prev) => ({ ...prev, [emptyStage.id]: responseText }));
          setActiveStage(CAMPAIGN_STAGES.findIndex((s) => s.id === emptyStage.id));
        }
      } catch {
        setError('Unable to generate content.');
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, onInteract, stageContent],
  );

  const handleRunCampaign = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isRunning) return;

      setIsRunning(true);
      setError(null);
      setStageContent({});
      setActiveStage(0);

      const context = [
        businessGoal.trim() ? `Business Goal: ${businessGoal.trim()}` : '',
        targetAudience.trim() ? `Target Audience: ${targetAudience.trim()}` : '',
        budget.trim() ? `Budget: ${budget.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      for (let i = 0; i < CAMPAIGN_STAGES.length; i++) {
        setActiveStage(i);
        await new Promise((r) => setTimeout(r, 600));

        const prompt = `Generate the "${CAMPAIGN_STAGES[i].label}" stage of a marketing campaign.${
          context ? `\n\nCampaign context:\n${context}` : ''
        }\n\nProvide specific, actionable content for this stage. Keep it concise (100-150 words).`;

        try {
          const res = await onInteract({ input_type: 'text', user_input: prompt });
          const contentType = res.headers.get('content-type') || '';

          let text = '';
          if (contentType.includes('text/plain') && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              text += decoder.decode(value, { stream: true });
              setStageContent((prev) => ({ ...prev, [CAMPAIGN_STAGES[i].id]: text }));
            }
          } else {
            const data = await res.json();
            text = data.response_text || data.error?.message || '';
            setStageContent((prev) => ({ ...prev, [CAMPAIGN_STAGES[i].id]: text }));
            if (data.error?.code === 'RATE_LIMITED') break;
          }
        } catch {
          break;
        }
      }

      setIsRunning(false);
    },
    [isRunning, businessGoal, targetAudience, budget, onInteract],
  );

  const hasResults = Object.keys(stageContent).length > 0;

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
                disabled={isRunning || used}
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

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Campaign setup form */}
      {!hasResults && !isRunning && (
        <form onSubmit={handleRunCampaign} className="max-w-lg space-y-4">
          <div>
            <label htmlFor="me-goal" className="block text-sm font-medium text-foreground mb-1">
              Business Goal <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="me-goal"
              type="text"
              value={businessGoal}
              onChange={(e) => setBusinessGoal(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Increase foot traffic by 20%"
            />
          </div>
          <div>
            <label htmlFor="me-audience" className="block text-sm font-medium text-foreground mb-1">
              Target Audience <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="me-audience"
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Local homeowners aged 30-55"
            />
          </div>
          <div>
            <label htmlFor="me-budget" className="block text-sm font-medium text-foreground mb-1">
              Monthly Budget <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="me-budget"
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., $2,000/month"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            Run Campaign Builder
          </button>
        </form>
      )}

      {/* Pipeline visualization */}
      {(hasResults || isRunning) && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            {CAMPAIGN_STAGES.map((stage, index) => {
              const isActive = index === activeStage;
              const isComplete = stageContent[stage.id];
              return (
                <div
                  key={stage.id}
                  className={`flex-1 rounded-lg border p-4 transition-all ${
                    isActive && isRunning
                      ? 'border-primary bg-primary/5 shadow-md'
                      : isComplete
                        ? 'border-border bg-muted/30'
                        : 'border-border opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{stage.icon}</span>
                    <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                    {isActive && isRunning && (
                      <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  {stageContent[stage.id] ? (
                    <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-6">
                      {stageContent[stage.id]}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {isActive && isRunning ? 'Generating...' : 'Waiting...'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {!isRunning && hasResults && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setStageContent({});
                  setActiveStage(-1);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Start New Campaign
              </button>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground text-center">Sample campaign for demonstration purposes</p>
    </div>
  );
}
