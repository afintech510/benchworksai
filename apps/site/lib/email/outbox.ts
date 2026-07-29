// Notification outbox processor (Section 2.2, REV-015)
// Processes pending notifications with exponential backoff retry
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from './notify';
import { renderNotification } from './templates/render';
import logger from '@/lib/utils/logger';

const MAX_RETRIES = 4;
const BACKOFF_SECONDS = [30, 120, 600, 3600]; // 30s, 2min, 10min, 1hr

export async function processOutbox(): Promise<{ processed: number; sent: number; failed: number }> {
  const supabase = createServerClient();
  const now = new Date().toISOString();

  const { data: pending, error } = await supabase
    .from('notification_outbox')
    .select('*')
    .eq('status', 'pending')
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error || !pending || pending.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    const email = renderNotification(notification.type, notification.payload as Record<string, unknown>);

    if (!email) {
      logger.warn({ event: 'outbox_skip', id: notification.id, type: notification.type }, 'No email template for notification type');
      continue;
    }

    const success = await sendEmail(email);

    if (success) {
      await supabase
        .from('notification_outbox')
        .update({ status: 'sent', completed_at: new Date().toISOString() })
        .eq('id', notification.id);
      sent++;
    } else {
      const newRetryCount = (notification.retry_count || 0) + 1;

      if (newRetryCount >= MAX_RETRIES) {
        await supabase
          .from('notification_outbox')
          .update({ status: 'exhausted', retry_count: newRetryCount })
          .eq('id', notification.id);
      } else {
        const backoffMs = BACKOFF_SECONDS[newRetryCount - 1] * 1000;
        const nextRetry = new Date(Date.now() + backoffMs).toISOString();

        await supabase
          .from('notification_outbox')
          .update({
            status: 'pending',
            retry_count: newRetryCount,
            next_retry_at: nextRetry,
          })
          .eq('id', notification.id);
      }
      failed++;
    }
  }

  logger.info({ event: 'outbox_processed', processed: pending.length, sent, failed }, 'Outbox batch processed');
  return { processed: pending.length, sent, failed };
}
