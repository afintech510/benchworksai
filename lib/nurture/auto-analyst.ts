// Auto-Analyst — background competitive analysis completion (Addendum Part 1, Section 4)
import { createServerClient } from '@/lib/supabase/server';
import { generateResponseSync } from '@/lib/ai/generate';
import { calculateLeadScore } from '@/lib/nurture/lead-scorer';
import { evaluateDripTriggers } from '@/lib/nurture/drip-engine';
import { renderToBuffer } from '@react-pdf/renderer';
import { CompetitiveReportPDF } from '@/lib/ai/competitive-report-pdf';
import logger from '@/lib/utils/logger';

/**
 * Process a competitive analysis — ensure report is complete, generate PDF, notify Adam.
 * Called after competitive_analyses INSERT.
 */
export async function processCompetitiveAnalysis(analysisId: string): Promise<void> {
  const supabase = createServerClient();

  // Fetch the analysis record
  const { data: analysis } = await supabase
    .from('competitive_analyses')
    .select('*, demo_sessions(demo_lead_id, vertical)')
    .eq('id', analysisId)
    .single();

  if (!analysis) {
    logger.warn({ event: 'auto_analyst_not_found', analysisId }, 'Competitive analysis not found');
    return;
  }

  const reportData = analysis.report_data as { report?: string; vertical?: string } | null;
  let reportText = reportData?.report || '';
  const vertical = reportData?.vertical || analysis.demo_sessions?.vertical || 'general_smb';
  const leadId = analysis.demo_sessions?.demo_lead_id;

  // Check if report is complete (at least 500 chars suggests a full report)
  if (reportText.length < 500) {
    logger.info({ event: 'auto_analyst_regenerating', analysisId, currentLength: reportText.length }, 'Report incomplete — regenerating');

    const competitorList = analysis.competitors?.length
      ? `\nCompetitors to analyze: ${analysis.competitors.join(', ')}`
      : '\nNo specific competitors provided — identify likely competitors in the market.';

    const { text, inputTokens, outputTokens } = await generateResponseSync({
      systemPrompt: `You are a competitive analysis AI for Larkin Tech. Generate a comprehensive competitive analysis report.
Format the report with clear sections using markdown headers (##): Executive Summary, Business Overview, Competitor Analysis, Strengths, Weaknesses, Opportunities, Recommendations.
Be specific and actionable. Use the ${vertical} industry context.`,
      userMessage: `Analyze the competitive landscape for: ${analysis.business_name}${competitorList}\nIndustry: ${vertical}\nGenerate a detailed competitive analysis report.`,
      demoType: 'auto_analyst',
      maxTokens: 2048,
    });

    reportText = text;

    // Update the analysis with complete report
    await supabase
      .from('competitive_analyses')
      .update({
        report_data: { report: reportText, vertical },
      })
      .eq('id', analysisId);

    logger.info(
      { event: 'auto_analyst_regenerated', analysisId, tokens: inputTokens + outputTokens },
      'Report regenerated'
    );
  }

  // Generate PDF if not already present
  if (!analysis.pdf_storage_path && reportText.length > 0) {
    try {
      const pdfBuffer = await renderToBuffer(
        CompetitiveReportPDF({
          businessName: analysis.business_name,
          competitors: analysis.competitors || [],
          vertical,
          reportText,
          generatedAt: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        })
      );

      const fileName = `competitive-analysis/${analysis.session_id}/${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('demo-assets')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (!uploadError) {
        await supabase
          .from('competitive_analyses')
          .update({ pdf_storage_path: fileName })
          .eq('id', analysisId);

        logger.info({ event: 'auto_analyst_pdf_stored', analysisId, path: fileName }, 'PDF stored');
      } else {
        logger.warn(
          { event: 'auto_analyst_pdf_upload_failed', analysisId, error: uploadError.message },
          'PDF upload failed'
        );
      }
    } catch (pdfErr) {
      logger.warn(
        { event: 'auto_analyst_pdf_generation_failed', analysisId, error: (pdfErr as Error).message },
        'PDF generation failed'
      );
    }
  }

  // Notify Adam via notification outbox
  if (leadId) {
    const { data: lead } = await supabase
      .from('demo_leads')
      .select('name, email, company')
      .eq('id', leadId)
      .single();

    const pdfPath = analysis.pdf_storage_path;
    let downloadUrl: string | null = null;
    if (pdfPath) {
      const { data: signedData } = await supabase.storage
        .from('demo-assets')
        .createSignedUrl(pdfPath, 604800); // 7 days
      downloadUrl = signedData?.signedUrl || null;
    }

    await supabase.from('notification_outbox').insert({
      channel: 'email',
      recipient: process.env.ADMIN_EMAIL || 'adam@larkintech.ai',
      subject: `Competitive Analysis Complete: ${analysis.business_name}`,
      body: [
        `A competitive analysis has been completed for ${analysis.business_name}.`,
        lead ? `Lead: ${lead.name || 'Unknown'} (${lead.email}) — ${lead.company || 'No company'}` : '',
        `Competitors: ${analysis.competitors?.join(', ') || 'Auto-identified'}`,
        `Vertical: ${vertical}`,
        downloadUrl ? `PDF Report: ${downloadUrl}` : 'PDF not available',
      ].filter(Boolean).join('\n'),
      metadata: {
        type: 'competitive_analysis_complete',
        analysis_id: analysisId,
        lead_id: leadId,
        pdf_url: downloadUrl,
      },
    });

    // Recalculate lead score (+15 from competitive analysis)
    await calculateLeadScore(leadId);

    // Evaluate drip triggers
    await evaluateDripTriggers(leadId, 'competitive_analysis');

    logger.info(
      { event: 'auto_analyst_complete', analysisId, leadId },
      'Auto-analyst processing complete'
    );
  }
}
