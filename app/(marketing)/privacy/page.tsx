import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Larkin Tech privacy policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="prose-custom mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 27, 2026</p>

        <h2>What Data We Collect</h2>
        <p>
          When you interact with Larkin Tech (LarkinTECH.ai), we may collect the following information:
        </p>
        <ul>
          <li><strong>Contact information:</strong> Name, email address, company name, and phone number when you submit forms or sign up for demos.</li>
          <li><strong>Demo interactions:</strong> Your inputs and interactions within the AI demo showroom, including which demos you try and how you use them.</li>
          <li><strong>Marketing context:</strong> UTM parameters and referring page information to understand how you found us.</li>
          <li><strong>Lead magnet downloads:</strong> Email address and download activity when you request resources like the AI Enablement Playbook.</li>
        </ul>

        <h2>How We Use Your Data</h2>
        <ul>
          <li><strong>Lead capture and follow-up:</strong> We use your contact information to respond to inquiries and follow up on expressed interest.</li>
          <li><strong>Email notifications:</strong> If you opt in, we may send relevant updates about AI implementation topics. You can unsubscribe at any time.</li>
          <li><strong>Service improvement:</strong> Demo interaction data helps us understand which demos are most useful and how to improve them.</li>
          <li><strong>Analytics:</strong> Aggregated usage data helps us understand traffic patterns and optimize the site experience.</li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>We use the following third-party services to operate LarkinTECH.ai:</p>
        <ul>
          <li><strong>Supabase:</strong> Database and file storage for application data.</li>
          <li><strong>SendGrid:</strong> Email delivery for notifications and lead magnet distribution.</li>
          <li><strong>Anthropic (Claude):</strong> AI language model powering the interactive demo features. User inputs to live AI demos are processed by Anthropic&apos;s API. We do not share personal information beyond what you type into demo interactions.</li>
          <li><strong>Cal.com:</strong> Scheduling service for booking discovery calls.</li>
        </ul>

        <h2>Data Retention</h2>
        <p>
          We retain contact information and inquiry data for as long as it is relevant to our business
          relationship. Demo interaction data is retained for analytics purposes. You may request deletion
          of your data at any time.
        </p>

        <h2>Your Rights</h2>
        <ul>
          <li><strong>Unsubscribe:</strong> You can opt out of marketing emails at any time via the unsubscribe link in any email.</li>
          <li><strong>Data deletion:</strong> Request deletion of your personal data by emailing <a href="mailto:adam@larkintech.ai" className="text-primary hover:underline">adam@larkintech.ai</a>.</li>
          <li><strong>Data access:</strong> Request a copy of the data we hold about you by emailing the same address.</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use a session cookie (<code>lt_session</code>) to maintain your demo session state. We also store
          your theme preference in localStorage. We do not use third-party tracking cookies.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy-related questions or requests, contact:
        </p>
        <p>
          Adam Larkin<br />
          <a href="mailto:adam@larkintech.ai" className="text-primary hover:underline">adam@larkintech.ai</a><br />
          Larkin Tech — LarkinTECH.ai
        </p>
      </div>
    </div>
  );
}
