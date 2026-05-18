// Drip campaign processor — runs every 15 minutes via Docker cron
// Processes scheduled drip steps and outbox notifications
import { processScheduledSteps } from '@/lib/nurture/drip-engine';
import { processOutbox } from '@/lib/email/outbox';

async function main() {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Drip processor starting...`);

  try {
    // Process scheduled drip campaign steps
    const stepsProcessed = await processScheduledSteps();
    console.log(`  Drip steps processed: ${stepsProcessed}`);

    // Process notification outbox (send pending emails)
    const outboxResult = await processOutbox();
    console.log(`  Outbox: ${outboxResult.sent} sent, ${outboxResult.failed} failed of ${outboxResult.processed} processed`);

    const elapsed = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Drip processor complete in ${elapsed}ms`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Drip processor failed:`, (err as Error).message);
    process.exit(1);
  }
}

main();
