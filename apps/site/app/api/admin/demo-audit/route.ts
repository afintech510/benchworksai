// Browser-clickable end-to-end demo audit.
// Hits the live public endpoints (gate -> session -> interact) for each demo
// type in one vertical so we exercise CSRF / cookie / Supabase / Claude paths.
// Auth: admin secret.
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import logger from '@/lib/utils/logger';

const DEMOS = ['chatbot', 'analytics', 'email_sms', 'doc_processing', 'competitive_analysis', 'doc_drafting', 'marketing_engine'] as const;
const DEFAULT_VERTICAL = 'general_smb';

interface DemoResult {
  demo: string;
  session_ok: boolean;
  cached_ok: boolean;
  live_ok: boolean;
  cached_preview?: string;
  live_preview?: string;
  errors: string[];
  latency_ms: number;
}

export async function POST(request: NextRequest) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const vertical = url.searchParams.get('vertical') || DEFAULT_VERTICAL;

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://benchworksai.com';
  const origin = base;
  const email = `audit-${Date.now()}@benchworksai.test`;
  const t0 = Date.now();

  const gateRes = await fetch(`${base}/api/leads/demo-gate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, Referer: `${origin}/demos` },
    body: JSON.stringify({
      email,
      name: 'Audit Bot',
      company: 'Audit',
      vertical_interest: vertical,
      subscribed: false,
    }),
  });

  const setCookie = gateRes.headers.get('set-cookie') || '';
  const sessionCookie = setCookie.split(';')[0]; // demo-session=...; ...

  if (!gateRes.ok || !sessionCookie) {
    const body = await gateRes.text().catch(() => '');
    return NextResponse.json({
      ok: false,
      stage: 'gate',
      status: gateRes.status,
      body: body.slice(0, 500),
    }, { status: 500 });
  }

  const results: DemoResult[] = [];

  for (const demo of DEMOS) {
    const dt = Date.now();
    const result: DemoResult = {
      demo,
      session_ok: false,
      cached_ok: false,
      live_ok: false,
      errors: [],
      latency_ms: 0,
    };

    try {
      const sessionRes = await fetch(`${base}/api/demos/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: sessionCookie, Referer: `${origin}/demos` },
        body: JSON.stringify({ demo_type: demo, vertical }),
      });
      if (!sessionRes.ok) {
        const body = await sessionRes.text().catch(() => '');
        result.errors.push(`session:${sessionRes.status} ${body.slice(0, 120)}`);
        results.push({ ...result, latency_ms: Date.now() - dt });
        continue;
      }
      const sessionJson = await sessionRes.json();
      const sessionId = sessionJson.session_id;
      const firstPreset = sessionJson.preset_commands?.[0]?.trigger_key;
      result.session_ok = true;

      if (firstPreset) {
        const cachedRes = await fetch(`${base}/api/demos/interact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: sessionCookie },
          body: JSON.stringify({ session_id: sessionId, input_type: 'preset_command', trigger_key: firstPreset }),
        });
        const cachedJson = await cachedRes.json().catch(() => ({}));
        if (cachedRes.ok && cachedJson.from_cache) {
          result.cached_ok = true;
          result.cached_preview = (cachedJson.response_text || '').slice(0, 100);
        } else {
          result.errors.push(`cached:${cachedRes.status}`);
        }
      } else {
        result.errors.push('no_presets_returned');
      }

      const liveRes = await fetch(`${base}/api/demos/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: sessionCookie },
        body: JSON.stringify({
          session_id: sessionId,
          input_type: 'text',
          user_input: 'What is one quick AI win for my business?',
        }),
      });
      if (liveRes.ok) {
        const text = await liveRes.text();
        if (text.startsWith('{') && text.includes('error')) {
          result.errors.push(`live:json-error ${text.slice(0, 120)}`);
        } else {
          result.live_ok = true;
          result.live_preview = text.slice(0, 150);
        }
      } else {
        const body = await liveRes.text().catch(() => '');
        result.errors.push(`live:${liveRes.status} ${body.slice(0, 120)}`);
      }
    } catch (err) {
      result.errors.push(`exception:${(err as Error).message}`);
    }

    result.latency_ms = Date.now() - dt;
    results.push(result);
  }

  const summary = {
    total: results.length,
    passing: results.filter((r) => r.session_ok && r.cached_ok && r.live_ok).length,
    cached_failing: results.filter((r) => !r.cached_ok).length,
    live_failing: results.filter((r) => !r.live_ok).length,
    total_latency_ms: Date.now() - t0,
  };

  logger.info({ event: 'demo_audit_complete', summary }, 'Demo audit complete');

  return NextResponse.json({
    ok: true,
    audit_email: email,
    vertical,
    summary,
    results,
  });
}
