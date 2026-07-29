import { NextRequest, NextResponse } from 'next/server';

// CSRF protection middleware (Section 3.1, REV-017)
// Validates Origin header on mutating requests (POST, PATCH, PUT, DELETE).
// Skips webhook endpoints which receive external callbacks.
// Hard no-index header for every /reports/* response. Belt-and-suspenders with
// the per-route robots metadata and robots.txt Disallow — a gated client report
// must never be indexed, cached, archived, or snippeted.
const REPORTS_ROBOTS = 'noindex, nofollow, noarchive, nosnippet';

export function middleware(request: NextRequest) {
  const method = request.method;
  const isReport = request.nextUrl.pathname.startsWith('/reports');

  // Only check mutating methods for CSRF
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    if (isReport) {
      const res = NextResponse.next();
      res.headers.set('X-Robots-Tag', REPORTS_ROBOTS);
      return res;
    }
    return NextResponse.next();
  }

  // Skip webhook endpoints (they receive external callbacks)
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  const origin = request.headers.get('origin');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // In development, allow requests without origin (e.g., curl, Postman)
  if (!origin && process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  if (!origin || !siteUrl) {
    return NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN_CSRF',
          message: 'Request origin validation failed.',
        },
      },
      { status: 403 }
    );
  }

  // Compare origins (strip trailing slashes)
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, '');

  if (normalizedOrigin !== normalizedSiteUrl) {
    return NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN_CSRF',
          message: 'Request origin validation failed.',
        },
      },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/reports/:path*'],
};
