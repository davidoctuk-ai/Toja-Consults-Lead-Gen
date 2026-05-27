import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadDiscoveryService } from '@/lib/services/lead-discovery';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const config = await prisma.scraperConfig.findUnique({
      where: { id: params.id },
    });

    if (!config) {
      return NextResponse.json({ error: 'Scraper config not found' }, { status: 404 });
    }

    // Update status to RUNNING
    await prisma.scraperConfig.update({
      where: { id: params.id },
      data: { status: 'RUNNING' },
    });

    const discoveryService = new LeadDiscoveryService();
    const scraperConfig = config.config as any;
    const query = scraperConfig.query || '';
    const scraperTypes = [config.type];

    // Run discovery in the background (don't await fully to avoid timeout if it takes too long)
    // Actually, for a manual trigger, the user might want to wait if it's small, 
    // but better to return success and let it run.
    // However, the task says "Immediately runs", so I will await but maybe it's better to background it.
    // Let's await for now as it's easier for the user to see the result.
    
    try {
      const results = await discoveryService.discoverLeads(query, scraperTypes);

      // Update status back to IDLE
      await prisma.scraperConfig.update({
        where: { id: params.id },
        data: { 
          status: 'IDLE',
          lastRunAt: new Date(),
        },
      });

      return NextResponse.json({ 
        success: true, 
        leadsFound: results.length 
      });
    } catch (runError: any) {
      console.error('Error running scraper config:', runError);
      
      await prisma.scraperConfig.update({
        where: { id: params.id },
        data: { status: 'FAILED' },
      });
      
      return NextResponse.json({ error: 'Scraper run failed', details: runError.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
