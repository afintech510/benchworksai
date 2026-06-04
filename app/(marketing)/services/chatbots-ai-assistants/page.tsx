import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Chatbots & AI Assistants',
  description: 'Website chatbots, customer-support assistants, and custom AI phone agents that answer, quote, and book around the clock so you never miss a lead.',
};

export default function ChatbotsAiAssistantsPage() {
  return (
    <ServicePageLayout
      title="Chatbots & AI Assistants"
      description="Never miss a lead, day or night"
      keyword="Chatbots & AI Assistants"
      relatedDemo={{ href: '/demos', label: 'Interactive Chatbot Demo' }}
      relatedCaseStudy={{ href: '/demo/easternTruck', label: 'Eastern Truck Demo Site' }}
    >
      <h2>Answer every customer, even when you can&apos;t</h2>
      <p>
        A missed call or an unanswered message is a missed job. We build chatbots and AI assistants —
        on your website, in your inbox, and even on the phone — that answer questions, capture leads,
        and book work 24/7, then hand off cleanly to you when a human is needed.
      </p>

      <h2>What we build</h2>
      <ul>
        <li><strong>Website chatbots</strong> — answer common questions, qualify leads, and book appointments right on your site</li>
        <li><strong>AI phone agents</strong> — a programmable, custom agent that answers calls, quotes, and books jobs around the clock</li>
        <li><strong>Customer-support assistants</strong> — trained on your business to handle FAQs and routine requests</li>
        <li><strong>Missed-call text-back</strong> — every missed call gets an instant text so the lead never goes cold</li>
        <li><strong>CRM logging</strong> — every conversation captured against the customer record, nothing lost</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We build each assistant around your business — your services, your pricing, your tone — and set
        clear rules for when it answers and when it hands off to a person. You stay in control: the
        assistant catches what you&apos;d otherwise miss and routes the real opportunities straight to you.
      </p>

      <h2>Why it matters</h2>
      <p>
        Customers expect an instant response, and the first business to answer usually wins the job. An
        assistant that works nights, weekends, and during your busiest hours turns missed messages into
        booked work — and pays for itself with the leads it saves.
      </p>
    </ServicePageLayout>
  );
}
