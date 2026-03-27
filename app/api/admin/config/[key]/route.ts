import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { adminConfigSchema } from '@/lib/validation/schemas';
import { apiError, ERRORS, validationError } from '@/lib/utils/errors';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  // Admin auth check
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  const { key } = await params;

  try {
    const body = await request.json();
    const parsed = adminConfigSchema.safeParse({ key, value: body.value });

    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        if (!issues[path]) issues[path] = [];
        issues[path].push(issue.message);
      }
      return validationError(issues);
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('site_config')
      .update({ value: parsed.data.value })
      .eq('key', key);

    if (error) {
      return apiError(ERRORS.SERVER_ERROR, 500);
    }

    return Response.json({ success: true, key, updated: true });
  } catch {
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
