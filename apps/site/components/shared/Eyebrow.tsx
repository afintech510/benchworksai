// Mono eyebrow / kicker (// bracket notation) in --signal-text on light,
// bright signal on ink — both AA. Use above section headings.
export function Eyebrow({
  children,
  className = '',
  as: Tag = 'p',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}) {
  return <Tag className={`eyebrow ${className}`}>{children}</Tag>;
}
