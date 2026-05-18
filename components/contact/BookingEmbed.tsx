'use client';

import { useState } from 'react';

interface BookingConfig {
  platform: 'calcom';
  url: string;
}

interface BookingEmbedProps {
  prefillName?: string;
  prefillEmail?: string;
}

const BOOKING_CONFIG: BookingConfig = {
  platform: 'calcom',
  url: 'https://cal.com/adam-benchworksai-com/30min',
};

export function BookingEmbed({ prefillName, prefillEmail }: BookingEmbedProps = {}) {
  const [loadError, setLoadError] = useState(false);

  // Build iframe URL with optional pre-fill query params
  const iframeUrl = new URL(BOOKING_CONFIG.url);
  if (prefillName) iframeUrl.searchParams.set('name', prefillName);
  if (prefillEmail) iframeUrl.searchParams.set('email', prefillEmail);

  if (loadError) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">
          Booking calendar is temporarily unavailable.
        </p>
        <a
          href="mailto:adam@benchworksai.com"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Email me to schedule a call
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <iframe
        src={iframeUrl.toString()}
        title="Book a Discovery Call"
        className="h-[600px] w-full border-0"
        onError={() => setLoadError(true)}
        loading="lazy"
      />
    </div>
  );
}
