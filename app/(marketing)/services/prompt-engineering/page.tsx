import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Prompt Engineering Services',
  description: 'Professional prompt engineering for reliable AI behavior. System prompts, chain-of-thought design, output formatting, and LLM optimization for production systems.',
};

export default function PromptEngineeringPage() {
  return (
    <ServicePageLayout
      title="Prompt Engineering That Delivers Reliable Results"
      description="Engineering reliable AI behavior through systematic prompt design"
      keyword="Prompt Engineering"
      relatedDemo={{ href: '/demos', label: 'Every Demo is a Prompt Engineering Showcase' }}
      ctaHref="/demos"
      ctaText="See Prompt Engineering in Action"
    >
      <h2>Beyond Writing Prompts</h2>
      <p>
        Prompt engineering is not about writing clever sentences. It is about engineering reliable, repeatable
        AI behavior — designing system prompts that produce consistent outputs, building evaluation frameworks
        that catch regressions, and structuring interactions so the AI does exactly what your application needs.
      </p>
      <p>
        Every demo on this site is a prompt engineering showcase. The chatbot that stays on-topic for
        construction businesses, the document drafter that produces properly formatted legal text, the
        competitive analysis tool that generates structured reports — each one is the result of systematic
        prompt engineering, not a single clever instruction.
      </p>

      <h2>What Professional Prompt Engineering Looks Like</h2>
      <p>
        I design prompt systems, not individual prompts. A prompt system includes the base system prompt,
        context injection templates, output format specifications, few-shot examples, chain-of-thought
        scaffolding, and safety guardrails. Each component is tested independently and in combination.
      </p>

      <h3>Core Techniques</h3>
      <ul>
        <li><strong>System prompt architecture</strong> — structured prompts with role definition, constraints, output format, and behavioral rules</li>
        <li><strong>Chain-of-thought design</strong> — guiding the model through multi-step reasoning for complex tasks</li>
        <li><strong>Output format engineering</strong> — getting reliable JSON, markdown, structured text, or specific document formats</li>
        <li><strong>Context window optimization</strong> — fitting the right information into limited context without degrading quality</li>
        <li><strong>Safety and injection prevention</strong> — hardened prompts that resist manipulation and stay within bounds</li>
        <li><strong>Evaluation and iteration</strong> — systematic testing across edge cases, with metrics for quality and consistency</li>
      </ul>

      <h2>Prompt Engineering for Production</h2>
      <p>
        Production prompt engineering has constraints that experimentation does not. You need consistent
        behavior across thousands of inputs, not just a few good examples. You need cost efficiency — a prompt
        that uses 2,000 tokens when 500 would suffice costs 4x more at scale. You need safety — prompts that
        resist injection attacks and never produce harmful or off-brand output.
      </p>
      <p>
        I build prompt systems with these constraints from the start. Token budgets, safety patterns, fallback
        behaviors, and evaluation criteria are part of the design, not afterthoughts.
      </p>

      <h2>Results You Can Measure</h2>
      <p>
        Good prompt engineering produces measurable improvements: higher consistency scores, lower token costs,
        fewer safety incidents, and faster response times. I track these metrics and iterate until the system
        meets production standards. The demo showroom on this site is proof — try any demo and see how the AI
        stays on-topic, produces structured output, and handles edge cases.
      </p>
    </ServicePageLayout>
  );
}
