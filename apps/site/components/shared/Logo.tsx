import Link from 'next/link';
import Image from 'next/image';

// BenchworksAI mark — circuit "B" tile. Two variants swap by theme via CSS
// ([data-theme]): the bronze mark on light, the dark-metal mark on dark.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="BenchworksAI home"
      className={`inline-flex items-center gap-[0.55em] font-display font-bold tracking-tight ${className}`}
    >
      <span className="inline-flex h-[1.6em] w-[1.6em] shrink-0 items-center justify-center">
        <Image
          src="/brand/logo-light.png"
          alt=""
          width={64}
          height={64}
          priority
          unoptimized
          className="logo-light h-full w-full object-contain"
        />
        <Image
          src="/brand/logo-dark.png"
          alt=""
          width={64}
          height={64}
          priority
          unoptimized
          className="logo-dark h-full w-full object-contain"
        />
      </span>
      <span>BenchworksAI</span>
    </Link>
  );
}
