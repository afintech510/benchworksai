import pino from 'pino';

// Pino structured JSON logger (Section 8.2)
// PII-free: use sanitizeForLogging from prompt-guard before logging user input
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

export default logger;

// Convenience methods for common events
export function logApiCall(demoType: string, model: string, tokens: { input: number; output: number }) {
  logger.info({ event: 'api_call', demoType, model, ...tokens }, 'Claude API call');
}

export function logRateLimit(identifier: string, demoType: string, limitType: string) {
  logger.warn({ event: 'rate_limited', identifier, demoType, limitType }, 'Rate limit hit');
}

export function logAuthFailure(ip: string, reason: string) {
  logger.warn({ event: 'auth_failure', ip, reason }, 'Authentication failed');
}

export function logLeadCapture(leadId: string, source: string) {
  logger.info({ event: 'lead_capture', leadId, source }, 'New lead captured');
}

export function logHealthCheck(status: string, dependencies: Record<string, string>) {
  logger.info({ event: 'health_check', status, dependencies }, 'Health check');
}
