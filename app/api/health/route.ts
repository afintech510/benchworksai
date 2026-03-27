import { NextRequest } from 'next/server';

interface DependencyStatus {
  database: 'ok' | 'error';
  storage: 'ok' | 'error';
  email: 'ok' | 'error';
  ai_api: 'ok' | 'error';
}

// GET /api/health — Standard + ?deep=true for dependency checks (Section 3.2)
export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get('deep') === 'true';

  if (!deep) {
    return Response.json({
      status: 'healthy',
      version: '0.0.1',
      timestamp: new Date().toISOString(),
    });
  }

  // Deep health check: test all dependencies concurrently
  const dependencies: DependencyStatus = {
    database: 'error',
    storage: 'error',
    email: 'error',
    ai_api: 'error',
  };

  const checks = await Promise.allSettled([
    checkDatabase(),
    checkStorage(),
    checkEmail(),
    checkAiApi(),
  ]);

  dependencies.database = checks[0].status === 'fulfilled' && checks[0].value ? 'ok' : 'error';
  dependencies.storage = checks[1].status === 'fulfilled' && checks[1].value ? 'ok' : 'error';
  dependencies.email = checks[2].status === 'fulfilled' && checks[2].value ? 'ok' : 'error';
  dependencies.ai_api = checks[3].status === 'fulfilled' && checks[3].value ? 'ok' : 'error';

  // unhealthy if database fails, degraded if any non-critical dep fails
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (dependencies.database === 'error') {
    status = 'unhealthy';
  } else if (
    dependencies.storage === 'error' ||
    dependencies.email === 'error' ||
    dependencies.ai_api === 'error'
  ) {
    status = 'degraded';
  }

  const statusCode = status === 'unhealthy' ? 503 : 200;

  return Response.json(
    {
      status,
      version: '0.0.1',
      timestamp: new Date().toISOString(),
      dependencies,
    },
    { status: statusCode }
  );
}

async function checkDatabase(): Promise<boolean> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server');
    const supabase = createServerClient();
    const { error } = await supabase.from('site_config').select('key').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function checkStorage(): Promise<boolean> {
  try {
    const url = process.env.SUPABASE_URL;
    if (!url) return false;
    // Simple connectivity check — list buckets
    const res = await fetch(`${url}/storage/v1/bucket`, {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok || res.status === 200;
  } catch {
    return false;
  }
}

async function checkEmail(): Promise<boolean> {
  // Verify SendGrid API key is configured (no actual send)
  return !!process.env.SENDGRID_API_KEY;
}

async function checkAiApi(): Promise<boolean> {
  // Verify Anthropic API key is configured (no actual call)
  return !!process.env.ANTHROPIC_API_KEY;
}
