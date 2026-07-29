import { NextResponse } from 'next/server';
import { loadReportMeta, isExpired } from '@/lib/reports/content';
import {
  checkPasscode,
  checkRateLimit,
  recordFailure,
  signAccessToken,
  reportCookieName,
  clientIp,
  COOKIE_TTL_SECONDS,
} from '@/lib/reports/access';

export const runtime = 'nodejs';

// Generic 404 used for both "unknown slug" and "wrong passcode" so the caller
// can never tell a real slug from a bad one.
function notFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = clientIp(request.headers);

  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds ?? 900) } }
    );
  }

  let passcode = '';
  try {
    const body = await request.json();
    passcode = typeof body?.passcode === 'string' ? body.passcode : '';
  } catch {
    passcode = '';
  }

  const meta = await loadReportMeta(slug);
  if (!meta || !meta.gated || isExpired(meta)) {
    recordFailure(ip);
    return notFound();
  }

  if (!checkPasscode(meta, passcode)) {
    recordFailure(ip);
    return notFound();
  }

  const token = await signAccessToken(slug);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(reportCookieName(slug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/reports/${slug}`,
    maxAge: COOKIE_TTL_SECONDS,
  });
  return res;
}
