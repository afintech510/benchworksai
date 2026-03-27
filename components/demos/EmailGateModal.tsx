'use client';

import { useState, useCallback, useRef } from 'react';
import { isDisposableEmail } from '@/lib/validation/disposable-domains';

interface EmailGateModalProps {
  redirectTo: string;
}

export function EmailGateModal({ redirectTo }: EmailGateModalProps) {
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('lt_email_hint') || '';
    } catch {
      return '';
    }
  });
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const isReturning = typeof window !== 'undefined' && (() => {
    try { return !!localStorage.getItem('lt_email_hint'); } catch { return false; }
  })();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isDisposableEmail(email)) {
      setError('Please use a non-disposable email address.');
      return;
    }

    // Generate idempotency key once per submit attempt
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/leads/demo-gate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          company: company || undefined,
          subscribed,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error?.message || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
        idempotencyKeyRef.current = null; // Reset key on error for retry
        return;
      }

      // Store email hint for 90 days
      try {
        localStorage.setItem('lt_email_hint', email);
      } catch {
        // localStorage unavailable
      }

      // Redirect to the demo
      window.location.href = redirectTo;
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
      idempotencyKeyRef.current = null;
    }
  }, [email, name, company, subscribed, redirectTo]);

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="rounded-xl border border-border bg-background p-8 shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-2">
          {isReturning ? 'Welcome back!' : 'Try Our AI Demos'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isReturning
            ? 'Confirm your email to continue exploring demos.'
            : 'Enter your email to access the full demo experience.'}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gate-email" className="block text-sm font-medium text-foreground mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="gate-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@company.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="gate-name" className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="gate-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="gate-company" className="block text-sm font-medium text-foreground mb-1">
              Company <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="gate-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your company"
              disabled={isSubmitting}
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribed}
              onChange={(e) => setSubscribed(e.target.checked)}
              className="mt-0.5 rounded border-border"
              disabled={isSubmitting}
            />
            <span className="text-sm text-muted-foreground">
              Send me AI insights and updates (optional)
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Accessing demos...
              </>
            ) : (
              'Access Demos'
            )}
          </button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          We respect your privacy. No spam, ever.{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
