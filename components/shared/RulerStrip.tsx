// Ruler / tick strip — the signature blueprint element. Rendered server-side
// (no imperative JS): every 5th tick is taller, per the mockup.
export function RulerStrip({ count = 80, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`ruler ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="tick" />
      ))}
    </div>
  );
}
