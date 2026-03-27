'use client';

import Link from 'next/link';

// Demo types from seed data (icons are Lucide names — render as text for now)
const DEMO_TYPES: readonly { id: string; name: string; description: string; icon: string; recommended?: boolean }[] = [
  { id: 'chatbot', name: 'AI Chatbot', description: 'Intelligent conversational assistant tailored to your business', icon: '💬', recommended: true },
  { id: 'analytics', name: 'Predictive Analytics', description: 'AI-powered business intelligence and forecasting', icon: '📊' },
  { id: 'email_sms', name: 'Email & SMS Workflows', description: 'Automated communication sequences with AI personalization', icon: '📧' },
  { id: 'doc_processing', name: 'Document Processing', description: 'Intelligent document analysis and data extraction', icon: '🔍' },
  { id: 'competitive_analysis', name: 'Competitive Analysis', description: 'AI-driven competitor research and market positioning', icon: '🎯' },
  { id: 'doc_drafting', name: 'Document Drafting', description: 'AI-assisted document and contract generation', icon: '📝' },
  { id: 'marketing_engine', name: 'Marketing Engine', description: 'AI-powered content creation and campaign optimization', icon: '📣' },
];

interface DemoShowroomGridProps {
  vertical: string;
  verticalLabel: string;
}

export function DemoShowroomGrid({ vertical, verticalLabel }: DemoShowroomGridProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          AI Demos for {verticalLabel}
        </h2>
        <span className="text-sm text-muted-foreground">
          {DEMO_TYPES.length} demos available
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_TYPES.map((demo) => (
          <Link
            key={demo.id}
            href={`/demos/${demo.id}/${vertical}`}
            className="group relative flex flex-col gap-3 p-5 rounded-xl border border-border bg-background hover:border-primary hover:shadow-md transition-all"
          >
            {demo.recommended && (
              <span className="absolute -top-2.5 left-4 bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Recommended: Start Here
              </span>
            )}
            <span className="text-2xl">{demo.icon}</span>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {demo.name}
            </h3>
            <p className="text-sm text-muted-foreground">{demo.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
