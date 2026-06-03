// AI Email Writer — personalized email generation with lead context (Addendum Part 1, Section 3)
import { createServerClient } from '@/lib/supabase/server';
import { generateResponseSync } from '@/lib/ai/generate';
import logger from '@/lib/utils/logger';

interface LeadContext {
  lead_name: string;
  company: string;
  vertical: string;
  demo_list: string;
  top_interactions: string;
  competitive_summary: string;
  score: number;
  tier: string;
}

/**
 * Assemble full lead context from database.
 */
async function assembleLeadContext(leadId: string): Promise<LeadContext> {
  const supabase = createServerClient();

  const [leadResult, scoreResult, sessionsResult, interactionsResult, competitiveResult] = await Promise.all([
    supabase.from('demo_leads').select('name, company, vertical_interest').eq('id', leadId).single(),
    supabase.from('lead_scores').select('score, tier').eq('demo_lead_id', leadId).single(),
    supabase.from('demo_sessions').select('demo_type, vertical').eq('demo_lead_id', leadId),
    supabase
      .from('demo_sessions')
      .select('id')
      .eq('demo_lead_id', leadId)
      .then(async (sessResult) => {
        const ids = (sessResult.data || []).map((s) => s.id);
        if (ids.length === 0) return { data: [] };
        return supabase
          .from('demo_interactions')
          .select('user_input, input_type')
          .in('session_id', ids)
          .eq('from_cache', false)
          .order('created_at', { ascending: false })
          .limit(5);
      }),
    supabase
      .from('demo_sessions')
      .select('id')
      .eq('demo_lead_id', leadId)
      .then(async (sessResult) => {
        const ids = (sessResult.data || []).map((s) => s.id);
        if (ids.length === 0) return { data: [] };
        return supabase
          .from('competitive_analyses')
          .select('business_name, competitors, report_data')
          .in('session_id', ids)
          .limit(1);
      }),
  ]);

  const lead = leadResult.data;
  const score = scoreResult.data;
  const sessions = sessionsResult.data || [];

  // Most-used vertical
  const verticalCounts: Record<string, number> = {};
  for (const s of sessions) {
    verticalCounts[s.vertical] = (verticalCounts[s.vertical] || 0) + 1;
  }
  const topVertical = Object.entries(verticalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || lead?.vertical_interest || 'general_smb';

  // Demo list
  const demoTypes = [...new Set(sessions.map((s) => s.demo_type))];
  const demoList = demoTypes.length > 0 ? demoTypes.join(', ') : 'none yet';

  // Top interactions
  const interactions = interactionsResult.data || [];
  const topInteractions = interactions
    .map((i) => i.user_input || i.input_type)
    .filter(Boolean)
    .slice(0, 3)
    .join('; ') || 'browsed demo presets';

  // Competitive summary
  const competitive = competitiveResult.data?.[0];
  const competitiveSummary = competitive
    ? `Analyzed ${competitive.business_name}${competitive.competitors?.length ? ` vs ${competitive.competitors.join(', ')}` : ''}`
    : 'No competitive analysis submitted';

  return {
    lead_name: lead?.name || 'there',
    company: lead?.company || 'your company',
    vertical: topVertical.replace('_', ' '),
    demo_list: demoList.replace(/_/g, ' '),
    top_interactions: topInteractions,
    competitive_summary: competitiveSummary,
    score: score?.score ?? 0,
    tier: score?.tier ?? 'cold',
  };
}

/**
 * Render a Mustache-style template with lead context variables.
 */
function renderTemplate(template: string, context: LeadContext): string {
  return template
    .replace(/\{\{lead_name\}\}/g, context.lead_name)
    .replace(/\{\{company\}\}/g, context.company)
    .replace(/\{\{vertical\}\}/g, context.vertical)
    .replace(/\{\{demo_list\}\}/g, context.demo_list)
    .replace(/\{\{top_interactions\}\}/g, context.top_interactions)
    .replace(/\{\{competitive_summary_if_available\}\}/g, context.competitive_summary)
    .replace(/\{\{competitive_data\}\}/g, context.competitive_summary)
    .replace(/\{\{score\}\}/g, String(context.score))
    .replace(/\{\{tier\}\}/g, context.tier);
}

/**
 * Generate an AI-personalized email for a lead and insert into drip_messages.
 */
export async function generateEmail(
  leadId: string,
  enrollmentId: string,
  stepNumber: number,
  subjectPrompt: string,
  bodyPrompt: string,
  requiresApproval: boolean
): Promise<void> {
  const supabase = createServerClient();
  const context = await assembleLeadContext(leadId);

  const renderedSubjectPrompt = renderTemplate(subjectPrompt, context);
  const renderedBodyPrompt = renderTemplate(bodyPrompt, context);

  const systemPrompt = `You are writing a follow-up email on behalf of Adam Larkin, AI Solutions Architect at BenchworksAI.

The recipient just explored AI demos on benchworksai.com. Here is their engagement data:
- Name: ${context.lead_name}
- Company: ${context.company}
- Vertical interest: ${context.vertical}
- Demos explored: ${context.demo_list}
- Key interactions: ${context.top_interactions}
- Competitive analysis: ${context.competitive_summary}
- Lead score: ${context.score} (${context.tier})

Write a personalized, professional email that:
1. References their specific demo experience naturally
2. Connects their vertical to relevant AI capabilities
3. Positions Adam as a hands-on AI implementation expert (not a salesperson)
4. Includes a specific, relevant CTA

Tone: warm, knowledgeable, concise. No AI hype. No "unlock the power of AI" language.
Max length: 200 words. Use short paragraphs.

Format your response as:
SUBJECT: <subject line>
---
<email body in HTML>`;

  const userMessage = `Subject prompt: ${renderedSubjectPrompt}\n\nBody prompt: ${renderedBodyPrompt}`;

  const { text, inputTokens, outputTokens } = await generateResponseSync({
    systemPrompt,
    userMessage,
    demoType: 'nurture_email',
    maxTokens: 500,
  });

  // Parse subject and body from response
  const subjectMatch = text.match(/^SUBJECT:\s*(.+)/m);
  const subject = subjectMatch?.[1]?.trim() || `Follow-up from BenchworksAI`;

  const separatorIndex = text.indexOf('---');
  const bodyHtml = separatorIndex !== -1
    ? text.slice(separatorIndex + 3).trim()
    : text.replace(/^SUBJECT:.*\n?/m, '').trim();

  const status = requiresApproval ? 'pending_review' : 'approved';

  const { error } = await supabase.from('drip_messages').insert({
    enrollment_id: enrollmentId,
    step_number: stepNumber,
    subject,
    body_html: bodyHtml,
    status,
    ai_model: 'claude-sonnet-4-20250514',
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    reviewed_by: requiresApproval ? null : 'auto',
    reviewed_at: requiresApproval ? null : new Date().toISOString(),
  });

  if (error) {
    logger.error(
      { event: 'drip_message_insert_failed', enrollmentId, stepNumber, error: error.message },
      'Failed to insert drip message'
    );
    throw error;
  }

  // If auto-approved, add to notification outbox for sending
  if (!requiresApproval) {
    const { data: lead } = await supabase
      .from('demo_leads')
      .select('email, name')
      .eq('id', leadId)
      .single();

    if (lead) {
      await supabase.from('notification_outbox').insert({
        channel: 'email',
        recipient: lead.email,
        subject,
        body: bodyHtml,
        metadata: { type: 'drip_email', lead_name: lead.name, enrollment_id: enrollmentId, step_number: stepNumber },
      });
    }
  }

  logger.info(
    { event: 'drip_email_generated', enrollmentId, stepNumber, status, tokens: inputTokens + outputTokens },
    'Drip email generated'
  );
}
