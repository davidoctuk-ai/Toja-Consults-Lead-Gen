import { emailService } from '../src/lib/services/email';
import { ScraperScheduler } from '../src/lib/services/scraper-scheduler';

async function main() {
  console.log('--- Automation Worker Started ---');
  
  const scheduler = new ScraperScheduler();

  // Run email queue processing every 10 seconds
  setInterval(async () => {
    try {
      console.log('[AutomationWorker] Processing email queue...');
      await emailService.processEmailQueue();
    } catch (error) {
      console.error('[AutomationWorker] Error in email processing:', error);
    }
  }, 10000);

  // Run scraper scheduler every 1 minute
  setInterval(async () => {
    try {
      console.log('[AutomationWorker] Running scraper scheduler...');
      await scheduler.run();
    } catch (error) {
      console.error('[AutomationWorker] Error in scraper scheduler:', error);
    }
  }, 60000);

  console.log('--- Workers are running in background intervals ---');
}

main().catch((error) => {
  console.error('Fatal error in Automation Worker:', error);
  process.exit(1);
});
