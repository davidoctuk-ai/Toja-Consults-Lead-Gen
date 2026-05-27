import { emailService } from '../src/lib/services/email';

async function main() {
  console.log('Email worker started...');
  
  // Run every 10 seconds
  setInterval(async () => {
    try {
      await emailService.processEmailQueue();
    } catch (error) {
      console.error('Error in email worker:', error);
    }
  }, 10000);
}

main().catch(console.error);
