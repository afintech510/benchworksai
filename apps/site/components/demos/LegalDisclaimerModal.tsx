'use client';

import { useState, useCallback } from 'react';

interface LegalDisclaimerModalProps {
  vertical: string;
  disclaimerVersion: number;
  onAccept: () => void;
}

const STORAGE_KEY = 'lt_legal_disclaimer_accepted';

/**
 * Modal requiring explicit user acknowledgment before accessing legal vertical demos.
 * Acceptance is stored both in localStorage (for quick client-side checks) and
 * in the vertical_disclaimer_acknowledgments table (server-side audit trail).
 */
export function LegalDisclaimerModal({ vertical, disclaimerVersion, onAccept }: LegalDisclaimerModalProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = useCallback(async () => {
    setSubmitting(true);

    // Record acknowledgment server-side
    try {
      await fetch('/api/demos/disclaimer-acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vertical, disclaimer_version: disclaimerVersion }),
      });
    } catch {
      // Server-side storage failed — still allow access (localStorage is fallback)
    }

    // Store in localStorage for quick client-side checks
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // localStorage unavailable — proceed anyway
    }

    setSubmitting(false);
    onAccept();
  }, [vertical, disclaimerVersion, onAccept]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-lg w-full mx-4 rounded-xl border border-border bg-background p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Legal Demo Disclaimer</h2>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground mb-6">
          <p>
            You are about to explore an AI demonstration designed for the <strong className="text-foreground">legal industry</strong>.
            Before proceeding, please read and acknowledge the following:
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li>
              All content generated in this demo is <strong className="text-foreground">entirely fictional</strong> and
              created for demonstration purposes only.
            </li>
            <li>
              Nothing in this demo constitutes <strong className="text-foreground">legal advice</strong>, legal opinion,
              or a legal recommendation of any kind.
            </li>
            <li>
              The AI responses may contain inaccuracies, hallucinations, or outdated information and
              should <strong className="text-foreground">never be relied upon</strong> for any legal decision-making.
            </li>
            <li>
              Any resemblance to real persons, law firms, cases, or legal proceedings is purely coincidental.
            </li>
            <li>
              For actual legal matters, consult a <strong className="text-foreground">qualified, licensed attorney</strong> in
              your jurisdiction.
            </li>
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 rounded border-border"
            disabled={submitting}
          />
          <span className="text-sm text-foreground">
            I understand that this is a fictional demonstration and that no content generated constitutes legal advice.
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!checked || submitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Recording...' : 'I Understand \u2014 Proceed to Demo'}
        </button>
      </div>
    </div>
  );
}

/**
 * Check if the user has already accepted the legal disclaimer (client-side check).
 */
export function hasAcceptedLegalDisclaimer(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}
