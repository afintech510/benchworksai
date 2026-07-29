import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiError, ERRORS } from '@/lib/utils/errors';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabase = createServerClient();
  const { data: download, error } = await supabase
    .from('lead_magnet_downloads')
    .select('magnet_slug')
    .eq('download_token', token)
    .single();

  if (error || !download) {
    return apiError(ERRORS.NOT_FOUND, 404);
  }

  // Generate fresh signed URL
  const storagePath = `downloads/${download.magnet_slug}.pdf`;
  const { data: signedUrlData } = await supabase.storage
    .from('lead-magnets')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

  if (signedUrlData?.signedUrl) {
    return Response.redirect(signedUrlData.signedUrl, 302);
  }

  // Fallback if storage isn't configured
  return apiError({ code: 'STORAGE_ERROR', message: 'Download temporarily unavailable. Please try again later.' }, 503);
}
