import { prisma } from '../prisma';
import { LeadDiscoveryService } from './lead-discovery';

export class ScraperScheduler {
  private discoveryService: LeadDiscoveryService;
  private isProcessing: boolean = false;

  constructor() {
    this.discoveryService = new LeadDiscoveryService();
  }

  /**
   * Run the scheduler to check for due scraper jobs
   * This should be called by an interval or cron job
   */
  async run() {
    if (this.isProcessing) {
      console.log('[ScraperScheduler] already processing. Skipping.');
      return;
    }

    this.isProcessing = true;
    console.log('[ScraperScheduler] Checking for due jobs...');

    try {
      const now = new Date();
      const dueConfigs = await prisma.scraperConfig.findMany({
        where: {
          isActive: true,
          nextRunAt: {
            lte: now,
          },
          status: {
            not: 'RUNNING',
          },
        },
      });

      console.log(`[ScraperScheduler] Found ${dueConfigs.length} due jobs.`);

      for (const config of dueConfigs) {
        await this.executeJob(config);
      }
    } catch (error) {
      console.error('[ScraperScheduler] Error running scheduler:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single scraper job
   */
  private async executeJob(config: any) {
    console.log(`[ScraperScheduler] Executing job: ${config.name} (${config.type})`);

    // Update status to RUNNING
    await prisma.scraperConfig.update({
      where: { id: config.id },
      data: { status: 'RUNNING' },
    });

    try {
      const scraperConfig = config.config as any;
      const query = scraperConfig.query || '';
      
      // We assume the type matches the scraper factory types
      // or we map them if they are different.
      const scraperTypes = [config.type];

      // Run discovery
      const results = await this.discoveryService.discoverLeads(query, scraperTypes);
      console.log(`[ScraperScheduler] Job ${config.name} completed. Found/Updated ${results.length} leads.`);

      // Update next run time
      const nextRunAt = config.interval 
        ? new Date(Date.now() + config.interval * 60000)
        : null;

      await prisma.scraperConfig.update({
        where: { id: config.id },
        data: {
          status: 'IDLE',
          lastRunAt: new Date(),
          nextRunAt: nextRunAt,
        },
      });
    } catch (error) {
      console.error(`[ScraperScheduler] Job ${config.name} failed:`, error);
      
      await prisma.scraperConfig.update({
        where: { id: config.id },
        data: {
          status: 'FAILED',
          // Optionally retry later
          nextRunAt: new Date(Date.now() + 5 * 60000), // Retry in 5 mins
        },
      });
    }
  }

  /**
   * Start the scheduler interval (for local development/demo)
   */
  start(intervalMs: number = 60000) {
    console.log(`[ScraperScheduler] Starting interval: ${intervalMs}ms`);
    setInterval(() => this.run(), intervalMs);
  }

  /**
   * Seed some default scraper configs
   */
  static async seedDefaultConfigs() {
    const count = await prisma.scraperConfig.count();
    if (count > 0) return;

    await prisma.scraperConfig.createMany({
      data: [
        {
          name: 'London Construction Discovery',
          type: 'GOOGLE_MAPS',
          config: { query: 'construction companies in London' },
          nextRunAt: new Date(),
          interval: 1440, // Daily
        },
        {
          name: 'UK Tech & SaaS Discovery',
          type: 'LINKEDIN',
          config: { query: 'SaaS companies in UK' },
          nextRunAt: new Date(Date.now() + 60000), // In 1 min
          interval: 2880, // Every 2 days
        },
        {
          name: 'Manchester Engineering Firms',
          type: 'GOOGLE_MAPS',
          config: { query: 'engineering firms in Manchester' },
          nextRunAt: new Date(Date.now() + 120000), // In 2 mins
          interval: 1440,
        }
      ]
    });
    
    console.log('[ScraperScheduler] Default scraper configs seeded.');
  }
}
