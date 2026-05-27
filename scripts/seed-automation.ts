import { AutomationService } from '../src/lib/services/automation';
import { ScraperScheduler } from '../src/lib/services/scraper-scheduler';
import { seedDefaultScoringRules } from '../src/lib/services/leadScoring';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- Seeding Backend Automation ---');
  
  try {
    console.log('Seeding Scoring Rules...');
    await seedDefaultScoringRules();
    
    console.log('Seeding Automation Rules...');
    await AutomationService.seedDefaultRules();
    
    console.log('Seeding Scraper Configs...');
    await ScraperScheduler.seedDefaultConfigs();
    
    console.log('--- Seeding Completed Successfully ---');
  } catch (error) {
    console.error('Error seeding backend automation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
