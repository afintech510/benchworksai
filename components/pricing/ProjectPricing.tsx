import Link from 'next/link';

interface ProjectType {
  name: string;
  description: string;
  startingAt: string;
  timeline: string;
  ctaParams: string;
}

// PLACEHOLDER — Adam to finalize pricing
const PROJECT_TYPES: ProjectType[] = [
  {
    name: 'AI Chatbot Build',
    description: 'Customer-facing AI chatbot with domain-specific training, conversation design, and production deployment.',
    startingAt: '$8,000',
    timeline: '4-6 weeks',
    ctaParams: '?type=smb_client&project=chatbot_build',
  },
  {
    name: 'Workflow Automation',
    description: 'AI-powered automation of manual business processes — communication, document processing, or data enrichment.',
    startingAt: '$12,000',
    timeline: '4-8 weeks',
    ctaParams: '?type=smb_client&project=workflow_automation',
  },
  {
    name: 'Document AI System',
    description: 'Intelligent document processing — extraction, classification, generation, and workflow integration.',
    startingAt: '$15,000',
    timeline: '6-10 weeks',
    ctaParams: '?type=smb_client&project=document_ai',
  },
  {
    name: 'Full AI Implementation',
    description: 'End-to-end platform build with multiple AI capabilities, custom infrastructure, and production deployment.',
    startingAt: '$25,000',
    timeline: '8-12 weeks',
    ctaParams: '?type=smb_client&project=full_implementation',
  },
  {
    name: 'AI Strategy & Assessment',
    description: 'Comprehensive AI readiness assessment, opportunity mapping, and implementation roadmap for your business.',
    startingAt: '$5,000',
    timeline: '2-3 weeks',
    ctaParams: '?type=smb_client&project=ai_strategy',
  },
];

export function ProjectPricing() {
  return (
    <div className="space-y-4">
      {PROJECT_TYPES.map((project) => (
        <div
          key={project.name}
          className="flex flex-col gap-4 rounded-xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Typical timeline: {project.timeline}</p>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-end">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Starting at</span>
              <p className="text-xl font-bold text-foreground">{project.startingAt}</p>
            </div>
            <Link
              href={`/contact${project.ctaParams}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted whitespace-nowrap"
            >
              Discuss Project
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
