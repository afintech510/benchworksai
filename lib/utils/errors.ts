import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Standard error response builder (Section 3.1, 8.1)
export function apiError(
  error: { code: string; message: string; details?: Record<string, unknown> },
  status: number = 400
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    },
    { status }
  );
}

// Pre-defined error constants matching spec error codes
export const ERRORS = {
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: "You've reached your daily limit. Try again tomorrow or continue with cached presets.",
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Your session has expired or is invalid. Please re-enter your email to continue.',
  },
  REVOKED_SESSION: {
    code: 'REVOKED_SESSION',
    message: 'Your session has been revoked. Please re-enter your email to continue.',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required.',
  },
  FORBIDDEN_CSRF: {
    code: 'FORBIDDEN_CSRF',
    message: 'Request origin validation failed.',
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input. Please check your submission.',
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'The requested resource was not found.',
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
  },
} as const;

// Build a validation error with field details
export function validationError(issues: Record<string, string[]>): NextResponse<ApiErrorBody> {
  return apiError(
    {
      code: ERRORS.VALIDATION_ERROR.code,
      message: ERRORS.VALIDATION_ERROR.message,
      details: { fields: issues },
    },
    400
  );
}

// Build a rate limit error with reset info
export function rateLimitError(details: {
  limit: number;
  limit_type: string;
  demo_type: string;
  reset_at?: string;
  next_presets?: Array<{ prompt_text: string; trigger_key: string }>;
}): NextResponse<ApiErrorBody> {
  return apiError(
    {
      code: ERRORS.RATE_LIMITED.code,
      message: ERRORS.RATE_LIMITED.message,
      details,
    },
    429
  );
}
