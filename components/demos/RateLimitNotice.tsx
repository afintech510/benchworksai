'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NextPreset {
  prompt_text: string;
  trigger_key: string;
}

interface RateLimitNoticeProps {
  limitType: string;
  resetAt?: string;
  nextPresets: NextPreset[];
  onPresetSelect: (triggerKey: string) => void;
}

function useCountdown(resetAt?: string): string {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!resetAt) return;

    function update() {
      const diff = new Date(resetAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('now');
        return;
      }
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      setTimeLeft(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    }

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [resetAt]);

  return timeLeft;
}

export function RateLimitNotice({ limitType, resetAt, nextPresets, onPresetSelect }: RateLimitNoticeProps) {
  const countdown = useCountdown(resetAt);

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
      <h3 className="font-semibold text-yellow-800 mb-2">
        {limitType === 'global_daily'
          ? 'Daily demo limit reached'
          : 'Demo type limit reached'}
      </h3>
      <p className="text-sm text-yellow-700 mb-4">
        You&apos;ve used all your live AI interactions for today.
        {countdown && countdown !== 'now' && (
          <> Resets in <strong>{countdown}</strong>.</>
        )}
      </p>

      {/* Primary CTA */}
      <Link
        href="/contact"
        className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors mb-3"
      >
        Book a discovery call for full access
      </Link>

      {/* Secondary: continue with presets */}
      {nextPresets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <p className="text-xs text-yellow-700 mb-2">
            Or continue exploring with preset examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {nextPresets.map((p) => (
              <button
                key={p.trigger_key}
                onClick={() => onPresetSelect(p.trigger_key)}
                className="rounded-full border border-yellow-300 bg-white px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-100 transition-colors"
              >
                {p.prompt_text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
