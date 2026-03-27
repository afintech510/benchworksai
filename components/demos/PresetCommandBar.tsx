'use client';

interface PresetCommand {
  sequence: number;
  prompt_text: string;
  trigger_key: string;
}

interface PresetCommandBarProps {
  presets: PresetCommand[];
  usedKeys: Set<string>;
  onSelect: (triggerKey: string) => void;
  disabled?: boolean;
}

export function PresetCommandBar({ presets, usedKeys, onSelect, disabled }: PresetCommandBarProps) {
  if (presets.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-xs text-muted-foreground mb-2">Try a preset example:</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const isUsed = usedKeys.has(p.trigger_key);
          return (
            <button
              key={p.trigger_key}
              onClick={() => onSelect(p.trigger_key)}
              disabled={disabled || isUsed}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isUsed
                  ? 'border-border bg-muted text-muted-foreground cursor-default'
                  : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50'
              } disabled:opacity-50`}
            >
              {isUsed && <span>&#10003;</span>}
              {p.prompt_text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
