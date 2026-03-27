'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const VERTICALS = [
  { id: 'general_smb', label: 'General SMB' },
  { id: 'construction', label: 'Construction' },
  { id: 'property_mgmt', label: 'Property Mgmt' },
  { id: 'legal', label: 'Legal' },
] as const;

export function DemoNav() {
  const pathname = usePathname();

  // Extract current vertical from path like /demos/chatbot/construction
  const segments = pathname.split('/');
  const currentVertical = segments.length >= 4 ? segments[3] : null;

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo / Home link */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Larkin Tech
            </Link>
            <Link
              href="/demos"
              className="text-sm font-semibold text-foreground"
            >
              Demo Showroom
            </Link>
          </div>

          {/* Vertical tabs */}
          <div className="hidden sm:flex items-center gap-1">
            {VERTICALS.map((v) => (
              <Link
                key={v.id}
                href={`/demos`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentVertical === v.id
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {v.label}
              </Link>
            ))}
          </div>

          {/* Contact link */}
          <Link
            href="/contact"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
