// Ink panel — dark statement section with the concentric-circle blueprint
// motif (via the .ink-panel CSS). Renders on the ink surface in both themes.
export function InkPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`ink-panel ${className}`}>
      <div className="relative z-[1] mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {children}
      </div>
    </section>
  );
}
