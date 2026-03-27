'use client';

import Link from 'next/link';

interface MobileMenuProps {
  links: { href: string; label: string }[];
  pathname: string;
  onClose: () => void;
}

export function MobileMenu({ links, pathname, onClose }: MobileMenuProps) {
  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="border-t border-border bg-background md:hidden">
      <div className="space-y-1 px-4 pb-4 pt-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
              isActive(link.href)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
