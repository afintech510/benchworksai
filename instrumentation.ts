export async function register() {
  // Only validate in actual runtime, not during build
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'test') {
    const { validateEnv } = await import('@/lib/utils/env-validation');
    try {
      validateEnv();
    } catch (error) {
      console.warn('[env-validation]', (error as Error).message);
      // In development, warn but don't crash
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}
