import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/demo-engine/session';
import { createServerClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

/**
 * POST /api/demos/disclaimer-acknowledge
 * Records legal disclaimer acknowledgment in vertical_disclaimer_acknowledgments table.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session.valid) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vertical, disclaimer_version } = body as { vertical?: string; disclaimer_version?: number };

    if (!vertical || !disclaimer_version) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'vertical and disclaimer_version are required.' } },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Upsert acknowledgment (one per lead+vertical)
    const { error } = await supabase
      .from('vertical_disclaimer_acknowledgments')
      .upsert(
        {
          demo_lead_id: session.leadId,
          vertical,
          disclaimer_version,
          acknowledged_at: new Date().toISOString(),
        },
        { onConflict: 'demo_lead_id,vertical' }
      );

    if (error) {
      logger.error({ event: 'disclaimer_ack_error', error: error.message }, 'Failed to record disclaimer acknowledgment');
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'Failed to record acknowledgment.' } },
        { status: 500 }
      );
    }

    logger.info(
      { event: 'disclaimer_acknowledged', leadId: session.leadId, vertical, version: disclaimer_version },
      'Legal disclaimer acknowledged'
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ event: 'disclaimer_ack_error', error: (err as Error).message }, 'Disclaimer acknowledgment failed');
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
