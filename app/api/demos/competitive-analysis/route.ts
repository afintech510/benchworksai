import { NextRequest, NextResponse } from 'next/server';
import { competitiveAnalysisSchema } from '@/lib/validation/schemas';
import { getSessionFromCookies } from '@/lib/demo-engine/session';
import { checkAndIncrementRateLimit } from '@/lib/demo-engine/rate-limiter';
import { detectInjection } from '@/lib/ai/prompt-guard';
import { generateResponseSync } from '@/lib/ai/generate';
import { createServerClient } from '@/lib/supabase/server';
import { processCompetitiveAnalysis } from '@/lib/nurture/auto-analyst';
import logger from '@/lib/utils/logger';
import { renderToBuffer } from '@react-pdf/renderer';
import { CompetitiveReportPDF } from '@/lib/ai/competitive-report-pdf';

export async function POST(request: NextRequest) {
  try {
    // Verify JWT
    const session = await getSessionFromCookies();
    if (!session.valid) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = competitiveAnalysisSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { session_id, business_name, competitors } = parsed.data;
    const supabase = createServerClient();

    // Verify session belongs to lead
    const { data: demoSession } = await supabase
      .from('demo_sessions')
      .select('id, demo_type, vertical, demo_lead_id')
      .eq('id', session_id)
      .eq('demo_lead_id', session.leadId)
      .single();

    if (!demoSession) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found.' } },
        { status: 404 }
      );
    }

    // Rate limit: 1 per email per 24 hours for competitive analysis
    const { data: lead } = await supabase
      .from('demo_leads')
      .select('email')
      .eq('id', session.leadId)
      .single();

    const identifier = lead?.email || session.leadId;
    const rateCheck = await checkAndIncrementRateLimit(identifier, 'competitive_analysis', 'email_daily');

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Competitive analysis is limited to 1 per day. Book a discovery call for full access.',
            reset_at: rateCheck.resetAt,
          },
        },
        { status: 429 }
      );
    }

    // Prompt guard on business names
    const allNames = [business_name, ...(competitors || [])].join(' ');
    const injectionCheck = detectInjection(allNames);
    if (injectionCheck.blocked) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Please use valid business names.' } },
        { status: 400 }
      );
    }

    // Build prompt
    const competitorList = competitors?.length
      ? `\nCompetitors to analyze: ${competitors.join(', ')}`
      : '\nNo specific competitors provided — identify likely competitors in the market.';

    const systemPrompt =
      `You are a competitive analysis AI for Larkin Tech demos. Generate a comprehensive competitive analysis report.
Format the report with clear sections using markdown headers (##): Executive Summary, Business Overview, Competitor Analysis, Strengths, Weaknesses, Opportunities, Recommendations.
Be specific and actionable. Use the ${demoSession.vertical} industry context.`;

    const userPrompt = `Analyze the competitive landscape for: ${business_name}${competitorList}
Industry: ${demoSession.vertical}
Generate a detailed competitive analysis report.`;

    // Call Claude through shared wrapper (circuit breaker, spend limit, retry)
    const { text: reportText, inputTokens, outputTokens } = await generateResponseSync({
      systemPrompt,
      userMessage: userPrompt,
      demoType: 'competitive_analysis',
      maxTokens: 2048,
    });

    // Generate PDF
    let pdfStoragePath: string | null = null;
    let downloadUrl: string | null = null;

    try {
      const pdfBuffer = await renderToBuffer(
        CompetitiveReportPDF({
          businessName: business_name,
          competitors: competitors || [],
          vertical: demoSession.vertical,
          reportText,
          generatedAt: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        })
      );

      const fileName = `competitive-analysis/${session_id}/${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('demo-assets')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (!uploadError) {
        pdfStoragePath = fileName;

        const { data: signedData } = await supabase.storage
          .from('demo-assets')
          .createSignedUrl(fileName, 3600); // 1 hour expiry

        downloadUrl = signedData?.signedUrl || null;
      } else {
        logger.warn(
          { event: 'pdf_upload_failed', error: uploadError.message },
          'PDF upload failed — report still returned as text'
        );
      }
    } catch (pdfErr) {
      logger.warn(
        { event: 'pdf_generation_failed', error: (pdfErr as Error).message },
        'PDF generation failed — report still returned as text'
      );
    }

    // Store in competitive_analyses
    const { data: analysis } = await supabase
      .from('competitive_analyses')
      .insert({
        session_id,
        business_name,
        competitors: competitors || [],
        report_data: { report: reportText, vertical: demoSession.vertical },
        pdf_storage_path: pdfStoragePath,
      })
      .select('id')
      .single();

    // Log interaction
    await supabase.from('demo_interactions').insert({
      session_id,
      input_type: 'text',
      user_input: `Competitive analysis: ${business_name}`,
      response: reportText,
      from_cache: false,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    });

    // Auto-analyst: background completion, PDF generation, admin notification (fire-and-forget)
    // Score recalculation + drip triggers are handled inside processCompetitiveAnalysis
    if (analysis?.id) {
      processCompetitiveAnalysis(analysis.id).catch(() => {});
    }

    logger.info(
      { event: 'competitive_analysis_complete', analysisId: analysis?.id, tokens: inputTokens + outputTokens, hasPdf: !!pdfStoragePath },
      'Competitive analysis generated'
    );

    return NextResponse.json({
      analysis_id: analysis?.id,
      report: reportText,
      download_url: downloadUrl,
    });
  } catch (err) {
    const message = (err as Error).message;

    // Map wrapper errors to user-facing responses
    if (message === 'DAILY_SPEND_LIMIT') {
      return NextResponse.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again later.' } },
        { status: 503 }
      );
    }
    if (message === 'CIRCUIT_BREAKER_OPEN') {
      return NextResponse.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again shortly.' } },
        { status: 503 }
      );
    }

    logger.error({ event: 'competitive_analysis_error', error: message }, 'Competitive analysis failed');
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Analysis failed. Please try again.' } },
      { status: 500 }
    );
  }
}
