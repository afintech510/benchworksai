// PLACEHOLDER — finalize real metrics before launch (REV-048)
const METRICS = [
  { value: '7', label: 'AI Demo Types' },
  { value: '4', label: 'Industry Verticals' },
  { value: '100%', label: 'Hands-On Delivery' },
  { value: '0', label: 'PowerPoint Decks' },
];

export function SocialProofStrip() {
  return (
    <section className="border-y border-border bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
        {METRICS.map((metric) => (
          <div key={metric.label}>
            <div className="text-3xl font-bold text-primary">{metric.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{metric.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
