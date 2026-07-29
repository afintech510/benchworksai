'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const gateSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
});

type GateInput = z.infer<typeof gateSchema>;

interface LeadMagnetGateProps {
  magnetSlug: string;
  vertical?: string;
  title?: string;
  description?: string;
}

export function LeadMagnetGate({
  magnetSlug,
  vertical,
  title = 'Download the AI Enablement Playbook',
  description = 'A practical guide to implementing AI in your business. Free, no strings attached.',
}: LeadMagnetGateProps) {
  const [submitted, setSubmitted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GateInput>({
    resolver: zodResolver(gateSchema),
    mode: 'onBlur',
  });

  async function onSubmit(data: GateInput) {
    setError(null);

    try {
      const res = await fetch('/api/leads/magnet-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          magnet_slug: magnetSlug,
          vertical,
          source_page: window.location.pathname,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message || 'Download failed. Please try again.');
        return;
      }

      const result = await res.json();
      setDownloadUrl(result.download_url);
      setSubmittedEmail(data.email);
      setSubmitted(true);

      // Auto-trigger download
      if (result.download_url) {
        window.open(result.download_url, '_blank');
      }
    } catch {
      setError('Network error. Please check your connection.');
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
        <div className="text-3xl">&#128230;</div>
        <h3 className="mt-3 text-lg font-semibold text-foreground">Your download has started!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve also sent the link to <strong>{submittedEmail}</strong> so you can access it anytime.
        </p>
        {downloadUrl && (
          <a
            href={downloadUrl}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download again
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-6">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
        <div>
          <input
            type="email"
            placeholder="Your email"
            {...register('email')}
            className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <input
            type="text"
            placeholder="Your name (optional)"
            {...register('name')}
            className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isSubmitting ? 'Preparing...' : 'Download Free Playbook'}
        </button>
      </form>
    </div>
  );
}
