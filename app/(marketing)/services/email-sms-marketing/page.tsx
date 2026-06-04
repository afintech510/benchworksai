import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Email & SMS Marketing',
  description: 'Email and text marketing engines plus strategy — campaigns, automated sequences, promos, and reminders that turn one-time customers into repeat revenue.',
};

export default function EmailSmsMarketingPage() {
  return (
    <ServicePageLayout
      title="Email & SMS Marketing"
      description="Bring customers back and fill the slow weeks"
      keyword="Email & SMS Marketing"
    >
      <h2>Your customer list is your most valuable asset</h2>
      <p>
        It costs far less to bring a past customer back than to win a new one. We build the email and
        text marketing engines — and the strategy behind them — that keep you top of mind, fill slow
        weeks, and turn one-time jobs into repeat revenue and referrals.
      </p>

      <h2>What we build</h2>
      <ul>
        <li><strong>Campaign engines</strong> — newsletters, promotions, and seasonal offers designed to get opened and clicked</li>
        <li><strong>Automated sequences</strong> — welcome series, follow-ups, win-backs, and review requests triggered by what customers do</li>
        <li><strong>SMS marketing</strong> — timely text offers and reminders for the messages that need to be read now</li>
        <li><strong>List building & segmentation</strong> — capture contacts and message the right people with the right offer</li>
        <li><strong>Strategy & calendar</strong> — a steady cadence so you stay in front of customers without spamming them</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We connect your customer data, design the templates and sequences, and set the schedule — then
        keep an eye on what&apos;s working. You get reporting on opens, clicks, and the revenue each
        campaign drives, so marketing becomes a measurable line item, not a hopeful guess.
      </p>

      <h2>Why it matters</h2>
      <p>
        Ads and SEO bring people in the door. Email and SMS are how you keep them — turning a single
        transaction into a relationship that pays off again and again. It is the highest-ROI marketing
        most local businesses are leaving on the table.
      </p>
    </ServicePageLayout>
  );
}
