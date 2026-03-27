import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { magnetDownloadSchema } from '@/lib/validation/schemas';
import { apiError, ERRORS, validationError } from '@/lib/utils/errors';
import { processOutbox } from '@/lib/email/outbox';
import logger from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = magnetDownloadSchema.safeParse(body);

    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        if (!issues[path]) issues[path] = [];
        issues[path].push(issue.message);
      }
      return validationError(issues);
    }

    const data = parsed.data;
    const supabase = createServerClient();

    // Link to demo_leads if email matches
    let demoLeadId: string | null = null;
    const { data: lead } = await supabase
      .from('demo_leads')
      .select('id')
      .eq('email', data.email)
      .single();

    if (lead) {
      demoLeadId = lead.id;
    }

    // Upsert into lead_magnet_downloads (idempotent on email + magnet_slug)
    const { data: download, error: upsertError } = await supabase
      .from('lead_magnet_downloads')
      .upsert(
        {
          email: data.email,
          name: data.name || null,
          magnet_slug: data.magnet_slug,
          vertical: data.vertical || null,
          source_page: data.source_page || null,
          demo_lead_id: demoLeadId,
        },
        { onConflict: 'email,magnet_slug' }
      )
      .select('download_token')
      .single();

    if (upsertError) {
      logger.error({ event: 'magnet_download_error', error: upsertError.message }, 'Lead magnet upsert failed');
      return apiError(ERRORS.SERVER_ERROR, 500);
    }

    // Generate signed download URL from Supabase Storage (7-day expiry)
    const storagePath = `downloads/${data.magnet_slug}.pdf`;
    const { data: signedUrlData } = await supabase.storage
      .from('lead-magnets')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

    const downloadUrl = signedUrlData?.signedUrl ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/leads/magnet-download/${download.download_token}`;

    // Notification to Adam
    await supabase.from('notification_outbox').insert({
      type: 'magnet_download',
      payload: { email: data.email, name: data.name, magnet_slug: data.magnet_slug },
    });

    // Delivery email to user
    await supabase.from('notification_outbox').insert({
      type: 'magnet_delivery',
      payload: { email: data.email, download_url: downloadUrl, magnet_slug: data.magnet_slug },
    });

    logger.info({ event: 'lead_capture', source: 'magnet_download', email: data.email }, 'Magnet download captured');

    // Lazy outbox processing
    processOutbox().catch(() => {});

    return Response.json({
      success: true,
      download_url: downloadUrl,
      token: download.download_token,
    });
  } catch (err) {
    logger.error({ event: 'magnet_download_error', error: (err as Error).message }, 'Magnet download failed');
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
