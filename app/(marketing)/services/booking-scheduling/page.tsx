import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Booking & Scheduling',
  description: 'Online scheduling and booking platforms with calendars, deposits, and automatic reminders — fewer phone tags, fewer no-shows, more booked work.',
};

export default function BookingSchedulingPage() {
  return (
    <ServicePageLayout
      title="Booking & Scheduling"
      description="Let customers book you in a few taps"
      keyword="Online Booking & Scheduling"
    >
      <h2>Turn &ldquo;call for an appointment&rdquo; into instant bookings</h2>
      <p>
        Every round of phone tag is a chance to lose a customer. We build online booking and scheduling
        that lets people reserve your time in a few taps — day or night — and handles the reminders,
        deposits, and follow-ups automatically.
      </p>

      <h2>What we build</h2>
      <ul>
        <li><strong>Online booking</strong> — real-time availability so customers self-schedule without the back-and-forth</li>
        <li><strong>Bookable packages</strong> — fixed-price services customers can choose and book online</li>
        <li><strong>Deposits & payments</strong> — collect a deposit or full payment at booking to lock it in</li>
        <li><strong>Automatic reminders</strong> — text and email reminders that cut no-shows</li>
        <li><strong>Calendar sync</strong> — connected to your team&apos;s calendars so you&apos;re never double-booked</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We map how you actually take work today, then build booking around it — the right services,
        buffers, deposits, and notifications for your business. It plugs into your website and your
        calendar, and we make sure it&apos;s simple enough that customers actually use it.
      </p>

      <h2>Why it matters</h2>
      <p>
        Bookings that happen on their own, around the clock, mean less time on the phone and more jobs
        on the calendar. Deposits and reminders protect that time — fewer no-shows, fewer gaps, and a
        smoother day for you and your team.
      </p>
    </ServicePageLayout>
  );
}
