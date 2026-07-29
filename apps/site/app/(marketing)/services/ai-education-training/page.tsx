import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'AI Education & Training',
  description: 'Coaching and hands-on training on the AI techniques and tools that fit your business — so you and your team get more done, with or without us building it.',
};

export default function AiEducationTrainingPage() {
  return (
    <ServicePageLayout
      title="AI Education & Training"
      description="Teach your team to leverage their time"
      keyword="AI Education, Training & Coaching"
      ctaText="Book a Training Session"
    >
      <h2>Sometimes the fastest win isn&apos;t software — it&apos;s knowing how</h2>
      <p>
        You don&apos;t always need us to build something. In many cases the biggest gains come from
        teaching you and your team the right techniques and tools. We coach and train your people to use
        AI in their everyday work — so you leverage your time and your employees&apos; time, and keep the
        skills in-house.
      </p>

      <h2>What we cover</h2>
      <ul>
        <li><strong>The right tools for your work</strong> — which AI tools actually help your business, and which to skip</li>
        <li><strong>Practical techniques</strong> — writing, research, drafting quotes and emails, summarizing, and planning faster</li>
        <li><strong>Role-based training</strong> — sessions tailored to owners, office staff, sales, and field teams</li>
        <li><strong>Safe & smart use</strong> — what to share, what not to, and how to check AI&apos;s work</li>
        <li><strong>Repeatable playbooks</strong> — simple, written workflows your team can follow after we leave</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We start with how your team actually spends its day, then teach the handful of techniques that
        save the most time. Training is hands-on and in plain language — no jargon, no computer-science
        degree required. We can run a one-time workshop or coach your team over time as the tools evolve.
      </p>

      <h2>Why it matters</h2>
      <p>
        Tools change fast, and the businesses that pull ahead are the ones whose people know how to use
        them. Investing an hour in the right training can give every employee back hours every week —
        a return that compounds long after the session ends.
      </p>
    </ServicePageLayout>
  );
}
