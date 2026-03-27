import Link from 'next/link';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-baseline gap-0 font-bold tracking-tight ${className}`}>
      <span className="text-foreground">L</span>
      <span className="text-primary font-black">a</span>
      <span className="text-foreground">RK</span>
      <span className="text-primary font-black">i</span>
      <span className="text-foreground">N</span>
      <span className="ml-1.5 text-muted-foreground font-medium">TECH</span>
    </Link>
  );
}
