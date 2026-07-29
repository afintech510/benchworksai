'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { inquirySchema, type InquiryInput } from '@/lib/validation/schemas';
import { FormSuccessState } from './FormSuccessState';

const AUDIENCE_OPTIONS = [
  { value: 'hiring', label: "I'm hiring" },
  { value: 'smb_client', label: 'I need AI help' },
  { value: 'agency', label: "I'm an agency" },
  { value: 'other', label: 'Other' },
] as const;

type AudienceType = InquiryInput['audience_type'];
const VALID_AUDIENCE_TYPES: AudienceType[] = ['hiring', 'smb_client', 'agency', 'other'];

function isValidAudience(val: string | null): val is AudienceType {
  return val !== null && (VALID_AUDIENCE_TYPES as string[]).includes(val);
}

export function SegmentedForm() {
  const searchParams = useSearchParams();
  const prefillType = searchParams.get('type');
  const prefillProject = searchParams.get('project');

  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    mode: 'onBlur',
    defaultValues: {
      audience_type: isValidAudience(prefillType) ? prefillType : 'smb_client',
      message: prefillProject ? `I'm interested in: ${prefillProject.replace(/_/g, ' ')}` : '',
    },
  });

  const audienceType = useWatch({ control, name: 'audience_type' });

  async function onSubmit(data: InquiryInput) {
    setServerError(null);

    // Capture UTM params from URL
    const params = new URLSearchParams(window.location.search);
    const marketing_context: Record<string, string> = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
      const val = params.get(key);
      if (val) marketing_context[key] = val;
    }

    try {
      const res = await fetch('/api/leads/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          marketing_context: Object.keys(marketing_context).length > 0 ? marketing_context : undefined,
          source_page: window.location.pathname,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setServerError(body?.error?.message || 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    }
  }

  if (submitted) {
    return <FormSuccessState />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {serverError}
        </div>
      )}

      {/* Audience selector */}
      <fieldset>
        <legend className="text-sm font-medium text-foreground">I am...</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AUDIENCE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors ${
                audienceType === opt.value
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                {...register('audience_type')}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Your name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="you@company.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
      </div>

      {/* Company — show for hiring and agency */}
      {(audienceType === 'hiring' || audienceType === 'agency' || audienceType === 'smb_client') && (
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-foreground">Company</label>
          <input
            id="company"
            type="text"
            {...register('company')}
            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Company name"
          />
        </div>
      )}

      {/* Phone — show for smb_client */}
      {audienceType === 'smb_client' && (
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">Phone</label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="(555) 555-5555"
          />
        </div>
      )}

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-foreground">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          rows={5}
          {...register('message')}
          className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={
            audienceType === 'hiring'
              ? 'Tell me about the role and what you are looking for...'
              : audienceType === 'agency'
                ? 'Tell me about your client and the AI capabilities you need...'
                : 'Tell me about your business and what challenges you are facing...'
          }
        />
        {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
