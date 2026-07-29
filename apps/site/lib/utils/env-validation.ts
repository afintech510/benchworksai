const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'ANTHROPIC_API_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET',
  'ADMIN_SECRET',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'See .env.example for required variables.'
    );
  }
}
