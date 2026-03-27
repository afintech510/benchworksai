'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DemoShell } from '@/components/demos/DemoShell';
import { RateLimitNotice } from '@/components/demos/RateLimitNotice';

// Dynamic imports for demo components — code-split per demo type
const ChatInterface = dynamic(() => import('@/components/demos/ChatInterface').then((m) => ({ default: m.ChatInterface })));
const AnalyticsDashboard = dynamic(() => import('@/components/demos/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })));
const WorkflowBuilder = dynamic(() => import('@/components/demos/WorkflowBuilder').then((m) => ({ default: m.WorkflowBuilder })));
const DocumentProcessor = dynamic(() => import('@/components/demos/DocumentProcessor').then((m) => ({ default: m.DocumentProcessor })));
const CompetitiveAnalysis = dynamic(() => import('@/components/demos/CompetitiveAnalysis').then((m) => ({ default: m.CompetitiveAnalysis })));
const DocumentDrafter = dynamic(() => import('@/components/demos/DocumentDrafter').then((m) => ({ default: m.DocumentDrafter })));
const MarketingEngine = dynamic(() => import('@/components/demos/MarketingEngine').then((m) => ({ default: m.MarketingEngine })));

const VALID_DEMO_TYPES = ['chatbot', 'analytics', 'email_sms', 'doc_processing', 'competitive_analysis', 'doc_drafting', 'marketing_engine'];
const VALID_VERTICALS = ['general_smb', 'construction', 'property_mgmt', 'legal'];

const DEMO_DISPLAY_NAMES: Record<string, string> = {
  chatbot: 'AI Chatbot',
  analytics: 'Predictive Analytics',
  email_sms: 'Email & SMS Workflows',
  doc_processing: 'Document Processing',
  competitive_analysis: 'Competitive Analysis',
  doc_drafting: 'Document Drafting',
  marketing_engine: 'Marketing Engine',
};

const VERTICAL_DISPLAY_NAMES: Record<string, string> = {
  general_smb: 'General SMB',
  construction: 'Construction',
  property_mgmt: 'Property Management',
  legal: 'Legal',
};

interface PresetCommand {
  sequence: number;
  prompt_text: string;
  trigger_key: string;
}

interface RateLimitInfo {
  limitType: string;
  resetAt?: string;
  nextPresets: { prompt_text: string; trigger_key: string }[];
}

export default function DemoPage() {
  const params = useParams();
  const router = useRouter();
  const demoType = params.demoType as string;
  const vertical = params.vertical as string;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const rateLimitRef = useRef<RateLimitInfo | null>(null);

  // Validate params
  const isValidDemoType = VALID_DEMO_TYPES.includes(demoType);
  const isValidVertical = VALID_VERTICALS.includes(vertical);

  // Initialize session
  useEffect(() => {
    if (!isValidDemoType || !isValidVertical) return;

    async function initSession() {
      try {
        const res = await fetch('/api/demos/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demo_type: demoType, vertical }),
        });

        if (res.status === 401) {
          router.push(`/demos/gate?redirect=/demos/${demoType}/${vertical}`);
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error?.message || 'Failed to start demo session.');
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setSessionId(data.session_id);
        setPresets(data.preset_commands || []);
        setIsLoading(false);
      } catch {
        setError('Failed to connect. Please try again.');
        setIsLoading(false);
      }
    }

    initSession();
  }, [demoType, vertical, isValidDemoType, isValidVertical, router]);

  // Unified onInteract handler that all demo components use
  const handleInteract = useCallback(
    async (input: { input_type: string; user_input?: string; trigger_key?: string }): Promise<Response> => {
      const res = await fetch('/api/demos/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, ...input }),
      });

      // Handle rate limiting at the page level
      if (res.status === 429) {
        const data = await res.clone().json().catch(() => ({}));
        if (data.error?.code === 'RATE_LIMITED') {
          const info: RateLimitInfo = {
            limitType: data.error.limit_type,
            resetAt: data.error.reset_at,
            nextPresets: data.error.next_presets || [],
          };
          setRateLimitInfo(info);
          rateLimitRef.current = info;
        }
      }

      return res;
    },
    [sessionId],
  );

  if (!isValidDemoType || !isValidVertical) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-4">Demo Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The requested demo configuration is not available.
        </p>
        <Link href="/demos" className="text-primary hover:text-primary-hover font-medium">
          &larr; Back to Demo Showroom
        </Link>
      </div>
    );
  }

  return (
    <DemoShell
      demoType={demoType}
      demoDisplayName={DEMO_DISPLAY_NAMES[demoType] || demoType}
      vertical={vertical}
      verticalDisplayName={VERTICAL_DISPLAY_NAMES[vertical] || vertical}
      sessionId={sessionId || ''}
      isLoading={isLoading}
      loadingMessage="Setting up your demo..."
      error={error}
      onRetry={() => window.location.reload()}
    >
      {/* Rate limit notice */}
      {rateLimitInfo && (
        <RateLimitNotice
          limitType={rateLimitInfo.limitType}
          resetAt={rateLimitInfo.resetAt}
          nextPresets={rateLimitInfo.nextPresets}
          onPresetSelect={(triggerKey) => handleInteract({ input_type: 'preset_command', trigger_key: triggerKey })}
        />
      )}

      {/* Demo component — each type gets its specialized UI */}
      {sessionId && !isLoading && (
        <>
          {demoType === 'chatbot' && (
            <ChatInterface presets={presets} onInteract={handleInteract} />
          )}
          {demoType === 'analytics' && (
            <AnalyticsDashboard presets={presets} onInteract={handleInteract} />
          )}
          {demoType === 'email_sms' && (
            <WorkflowBuilder presets={presets} onInteract={handleInteract} />
          )}
          {demoType === 'doc_processing' && (
            <DocumentProcessor vertical={vertical} presets={presets} onInteract={handleInteract} />
          )}
          {demoType === 'competitive_analysis' && (
            <CompetitiveAnalysis sessionId={sessionId} presets={presets} onInteract={handleInteract} />
          )}
          {demoType === 'doc_drafting' && (
            <DocumentDrafter vertical={vertical} presets={presets} onInteract={handleInteract} />
          )}
          {demoType === 'marketing_engine' && (
            <MarketingEngine presets={presets} onInteract={handleInteract} />
          )}
        </>
      )}
    </DemoShell>
  );
}
