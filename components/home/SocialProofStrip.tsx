// Non-numeric capabilities band — replaced the placeholder metrics (REV-048).
const CAPABILITIES = [
  'Websites & Platforms',
  'SEO',
  'Google Ads',
  'Email & SMS',
  'Automation',
  'AI Training',
];

export function SocialProofStrip() {
  return (
    <section className="border-y border-border bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center sm:gap-x-10">
        {CAPABILITIES.map((cap) => (
          <span
            key={cap}
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {cap}
          </span>
        ))}
      </div>
    </section>
  );
}
