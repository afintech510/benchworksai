import 'server-only';
import { createHash, timingSafeEqual } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { ReportMeta } from './types';

// Access control for gated reports. Passcodes live in env only (never in the
// bundle or content). Unlock grants a signed, httpOnly cookie scoped to one
// slug for 30 days. Wrong passcode and unknown slug are made indistinguishable
// to the caller (both 404) so slug existence is never confirmed.

const COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function reportCookieName(slug: string): string {
  return `bw_report_${slug}`;
}

function secretKey(): Uint8Array {
  const secret = process.env.REPORT_COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('REPORT_COOKIE_SECRET is missing or too short (>=16 chars)');
  }
  return new TextEncoder().encode(secret);
}

/** Sign an access token bound to a slug. */
export async function signAccessToken(slug: string): Promise<string> {
  return new SignJWT({ slug })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(slug)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_TTL_SECONDS}s`)
    .sign(secretKey());
}

/** Verify a cookie value grants access to this slug. */
export async function hasValidAccess(
  slug: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.sub === slug;
  } catch {
    return false;
  }
}

/** Constant-time passcode comparison against the report's env passcode. */
export function checkPasscode(meta: ReportMeta, input: string): boolean {
  if (!meta.passcodeEnv) return false;
  const expected = process.env[meta.passcodeEnv];
  if (!expected) return false;
  // Hash both to a fixed 32-byte digest so timingSafeEqual never sees a length
  // mismatch (which would throw and leak length via the exception path).
  const a = createHash('sha256').update(expected).digest();
  const b = createHash('sha256').update(input).digest();
  return timingSafeEqual(a, b);
}

// ---- Rate limiting (per-process sliding window). ----
// 10 attempts / IP / hour, then a 15-minute lockout. Adequate for the current
// single-instance deploy; move to Supabase/Redis if the site is ever scaled out.

interface Attempts {
  hits: number[]; // timestamps (ms)
  lockedUntil?: number;
}
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 15 * 60 * 1000;
const buckets = new Map<string, Attempts>();

export interface RateResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(ip: string): RateResult {
  const now = Date.now();
  const b = buckets.get(ip) ?? { hits: [] };
  if (b.lockedUntil && now < b.lockedUntil) {
    return { allowed: false, retryAfterSeconds: Math.ceil((b.lockedUntil - now) / 1000) };
  }
  b.hits = b.hits.filter((t) => now - t < WINDOW_MS);
  if (b.hits.length >= MAX_ATTEMPTS) {
    b.lockedUntil = now + LOCKOUT_MS;
    buckets.set(ip, b);
    return { allowed: false, retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }
  return { allowed: true };
}

/** Record a failed attempt (call only on failure — successes don't count). */
export function recordFailure(ip: string): void {
  const now = Date.now();
  const b = buckets.get(ip) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < WINDOW_MS);
  b.hits.push(now);
  buckets.set(ip, b);
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}

export { COOKIE_TTL_SECONDS };
