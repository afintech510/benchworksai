import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { apiError, ERRORS } from '@/lib/utils/errors';

// In-memory rate limit store for admin auth failures: IP → {count, firstFailure}
const failedAttempts = new Map<string, { count: number; firstFailure: number }>();
const MAX_FAILURES = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = failedAttempts.get(ip);

  if (!record) return true;

  // Reset window if expired
  if (now - record.firstFailure > WINDOW_MS) {
    failedAttempts.delete(ip);
    return true;
  }

  return record.count < MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const record = failedAttempts.get(ip);

  if (!record || now - record.firstFailure > WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstFailure: now });
  } else {
    record.count++;
  }
}

function checkIpAllowlist(ip: string): boolean {
  const allowlist = process.env.ADMIN_ALLOWED_IPS;
  if (!allowlist) return true; // No allowlist = allow all
  const allowed = allowlist.split(',').map((s) => s.trim());
  return allowed.includes(ip);
}

// Constant-time secret comparison (REV-009)
function verifySecret(provided: string): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) throw new Error('ADMIN_SECRET not configured');

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Authenticate an admin request. Returns null if authorized, or an error response.
export function authenticateAdmin(request: NextRequest): NextResponse | null {
  const ip = getClientIp(request);

  // IP allowlist check
  if (!checkIpAllowlist(ip)) {
    return apiError(ERRORS.UNAUTHORIZED, 403);
  }

  // Rate limit check
  if (!checkIpRateLimit(ip)) {
    return apiError(ERRORS.RATE_LIMITED, 429);
  }

  // Extract secret from Authorization header
  const authHeader = request.headers.get('authorization');
  const secret = authHeader?.replace('Bearer ', '');

  if (!secret) {
    recordFailure(ip);
    return apiError(ERRORS.UNAUTHORIZED, 403);
  }

  if (!verifySecret(secret)) {
    recordFailure(ip);
    return apiError(ERRORS.UNAUTHORIZED, 403);
  }

  return null; // Authorized
}

// Higher-order function wrapping a route handler with admin auth
export function requireAdmin(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const authError = authenticateAdmin(request);
    if (authError) return authError;
    return handler(request, ...args);
  };
}
