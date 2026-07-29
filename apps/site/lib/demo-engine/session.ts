import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

const COOKIE_NAME = 'lt_session';
const JWT_EXPIRY = '24h';

interface DemoSessionPayload extends JWTPayload {
  lead_id: string;
  jwt_version: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
}

// Create a JWT for a demo lead. Payload: lead_id + jwt_version only (REV-004).
export async function createDemoSession(
  leadId: string,
  jwtVersion: number
): Promise<string> {
  const token = await new SignJWT({ lead_id: leadId, jwt_version: jwtVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());

  return token;
}

// Verify JWT and check against DB for revocation (REV-012).
export async function verifyDemoSession(
  token: string
): Promise<{ valid: true; leadId: string } | { valid: false; reason: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { lead_id, jwt_version } = payload as unknown as DemoSessionPayload;

    if (!lead_id || jwt_version === undefined) {
      return { valid: false, reason: 'INVALID_TOKEN' };
    }

    // Check jwt_version and revoked_at against DB
    const supabase = createServerClient();
    const { data: lead, error } = await supabase
      .from('demo_leads')
      .select('jwt_version, revoked_at')
      .eq('id', lead_id)
      .single();

    if (error || !lead) {
      return { valid: false, reason: 'INVALID_TOKEN' };
    }

    if (lead.revoked_at) {
      return { valid: false, reason: 'REVOKED_SESSION' };
    }

    if (lead.jwt_version !== jwt_version) {
      return { valid: false, reason: 'REVOKED_SESSION' };
    }

    return { valid: true, leadId: lead_id };
  } catch {
    return { valid: false, reason: 'INVALID_TOKEN' };
  }
}

// Set JWT as httpOnly cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

// Read session from cookies and verify
export async function getSessionFromCookies(): Promise<
  { valid: true; leadId: string } | { valid: false; reason: string }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return { valid: false, reason: 'INVALID_TOKEN' };
  }

  return verifyDemoSession(token);
}
