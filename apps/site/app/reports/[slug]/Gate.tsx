'use client';

import { useState } from 'react';

// Neutral gate. Reveals nothing but the document number — no client name, no
// title, no content. A wrong passcode and an unknown slug are indistinguishable
// (both 404 from the unlock endpoint), so the copy stays generic.
export function Gate({ slug, docNumber }: { slug: string; docNumber: string }) {
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'locked'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('checking');
    try {
      const res = await fetch(`/api/reports/${slug}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setStatus(res.status === 429 ? 'locked' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="gate">
      <form className="gate-card" onSubmit={submit}>
        <p className="gate-doc">{docNumber}</p>
        <h1 className="gate-title">Protected report</h1>
        <p className="gate-msg">
          This document is confidential and access-controlled. Enter the passcode
          you were provided to continue.
        </p>
        <label className="gate-label" htmlFor="passcode">
          Passcode
        </label>
        <input
          id="passcode"
          type="password"
          autoComplete="off"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="gate-input"
          aria-describedby={status === 'error' || status === 'locked' ? 'gate-err' : undefined}
        />
        {status === 'error' && (
          <p id="gate-err" className="gate-err" role="alert">
            That code didn&apos;t work. Check it and try again.
          </p>
        )}
        {status === 'locked' && (
          <p id="gate-err" className="gate-err" role="alert">
            Too many attempts. Wait a few minutes and try again.
          </p>
        )}
        <button type="submit" className="gate-btn" disabled={status === 'checking' || !passcode}>
          {status === 'checking' ? 'Checking…' : 'Unlock'}
        </button>
      </form>

      <style>{`
        .gate { min-height: 100vh; display: grid; place-items: center; background: #16202b; padding: 24px; }
        .gate-card { width: 100%; max-width: 380px; background: #fff; border: 1px solid #c6ced4; padding: 32px; font-family: var(--font-source-serif), Georgia, serif; }
        .gate-doc { font-family: var(--font-plex-mono), monospace; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #6b7c88; margin: 0 0 16px; }
        .gate-title { font-family: var(--font-barlow-condensed), sans-serif; font-weight: 700; text-transform: uppercase; font-size: 28px; margin: 0 0 10px; color: #16202b; }
        .gate-msg { font-size: 15px; color: #3e515f; margin: 0 0 20px; }
        .gate-label { font-family: var(--font-plex-mono), monospace; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #6b7c88; display: block; margin-bottom: 6px; }
        .gate-input { width: 100%; padding: 10px 12px; border: 1px solid #c6ced4; font-size: 16px; font-family: var(--font-plex-mono), monospace; }
        .gate-input:focus-visible { outline: 2px solid #b8890a; outline-offset: -1px; }
        .gate-err { color: #a8322a; font-size: 13px; margin: 10px 0 0; }
        .gate-btn { margin-top: 18px; width: 100%; padding: 11px; background: #16202b; color: #fff; border: 0; font-family: var(--font-plex-mono), monospace; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
        .gate-btn:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
    </main>
  );
}
