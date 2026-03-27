'use client';

import { useState, useCallback } from 'react';

const STAGES = [
  { id: 'trigger', label: 'Trigger', icon: '⚡' },
  { id: 'condition', label: 'Condition', icon: '🔀' },
  { id: 'action', label: 'Action', icon: '⚙️' },
  { id: 'ai_content', label: 'AI Content', icon: '🤖' },
  { id: 'delivery', label: 'Delivery', icon: '📤' },
] as const;

interface WorkflowBuilderProps {
  presets: { sequence: number; prompt_text: string; trigger_key: string }[];
  onInteract: (input: { input_type: string; user_input?: string; trigger_key?: string }) => Promise<Response>;
}

export function WorkflowBuilder({ presets, onInteract }: WorkflowBuilderProps) {
  const [activeStage, setActiveStage] = useState(0);
  const [stageContent, setStageContent] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handlePreset = useCallback(async (triggerKey: string) => {
    if (isRunning) return;
    setIsRunning(true);
    setError(null);
    setUsedKeys((prev) => new Set([...prev, triggerKey]));

    try {
      const res = await onInteract({ input_type: 'preset_command', trigger_key: triggerKey });
      const data = await res.json();
      const responseText = data.response_text || '';
      const stage = STAGES[activeStage];
      setStageContent((prev) => ({ ...prev, [stage.id]: responseText }));
      if (activeStage < STAGES.length - 1) setActiveStage((prev) => prev + 1);
    } catch {
      setError('Unable to load workflow step. Please try again.');
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, onInteract, activeStage]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setError(null);
    setActiveStage(0);
    setStageContent({});

    for (let i = 0; i < STAGES.length; i++) {
      setActiveStage(i);
      await new Promise((r) => setTimeout(r, 800));

      try {
        const prompt = `Generate the ${STAGES[i].label} stage of an email follow-up workflow for a new customer inquiry.`;
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
            setStageContent((prev) => ({ ...prev, [STAGES[i].id]: text }));
          }
        } else {
          const data = await res.json();
          text = data.response_text || data.error?.message || '';
          setStageContent((prev) => ({ ...prev, [STAGES[i].id]: text }));
          if (data.error?.code === 'RATE_LIMITED') break;
        }
      } catch {
        setError(`Workflow failed at the ${STAGES[i].label} stage. Please try again.`);
        break;
      }
    }

    setIsRunning(false);
  }, [isRunning, onInteract]);

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

      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={isRunning}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        {isRunning ? 'Building your workflow...' : 'Run Workflow'}
      </button>

      {/* Pipeline — horizontal on desktop, vertical on mobile */}
      <div className="flex flex-col sm:flex-row gap-3">
        {STAGES.map((stage, index) => {
          const isActive = index === activeStage;
          const isComplete = index < activeStage || stageContent[stage.id];
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

      <p className="text-xs text-muted-foreground text-center">Sample workflow for demonstration purposes</p>
    </div>
  );
}
