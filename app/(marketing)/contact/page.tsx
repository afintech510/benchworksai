import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SegmentedForm } from '@/components/contact/SegmentedForm';
import { BookingEmbed } from '@/components/contact/BookingEmbed';
import { LeadMagnetGate } from '@/components/contact/LeadMagnetGate';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch about AI implementation, consulting, or hiring. Book a discovery call or send a message.',
};

export default function ContactPage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Let&apos;s Talk</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Whether you&apos;re hiring, need AI help for your business, or want to explore a partnership.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-semibold text-foreground">Send a Message</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              I typically respond within 24 hours.
            </p>
            <div className="mt-6">
              <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
                <SegmentedForm />
              </Suspense>
            </div>
          </div>

          {/* Booking */}
          <div>
            <h2 className="text-xl font-semibold text-foreground">Book a Discovery Call</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              30 minutes to discuss your project, no strings attached.
            </p>
            <div className="mt-6">
              <BookingEmbed />
            </div>
          </div>
        </div>

        {/* Lead Magnet */}
        <div className="mt-16 mx-auto max-w-lg">
          <LeadMagnetGate
            magnetSlug="ai-playbook-construction"
            vertical="construction"
          />
        </div>
      </div>
    </div>
  );
}
