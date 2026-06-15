import { NextResponse } from "next/server";

// Server-side read of the fleet status snapshot. Runs in the Next.js container and
// authenticates to FastAPI with the service key (kept server-side, never sent to the
// browser). This deliberately bypasses the operator-JWT proxy path, which is currently
// broken (next-auth issues an encrypted JWE that FastAPI's HS256 verifier rejects).
// The page that calls this route is still gated by next-auth middleware.
export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.FASTAPI_URL || "http://fastapi:8000";
  const key = process.env.SERVICE_KEY_N8N || "";
  try {
    const r = await fetch(`${base}/v1/internal/portfolio-status`, {
      headers: { "X-Service-Key": key },
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({ ts: null, results: [] }));
    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch {
    return NextResponse.json(
      { ts: null, results: [], error: "fastapi unreachable" },
      { status: 502 }
    );
  }
}
