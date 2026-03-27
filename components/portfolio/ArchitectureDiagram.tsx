'use client';

import { useEffect, useRef, useState } from 'react';

interface ArchitectureDiagramProps {
  chart: string;
}

export function ArchitectureDiagram({ chart }: ArchitectureDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'strict',
          fontFamily: 'var(--lt-font-sans), sans-serif',
        });
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <pre className="overflow-x-auto text-xs text-muted-foreground whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">Loading diagram...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto rounded-lg border border-border bg-background p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
