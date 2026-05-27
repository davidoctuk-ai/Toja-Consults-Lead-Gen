import { NextResponse } from 'next/server';
import { LeadDiscoveryService } from '@/lib/services/lead-discovery';

export async function POST(req: Request) {
  try {
    const { query, scrapers, scraperTypes } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const discoveryService = new LeadDiscoveryService();
    const finalScraperTypes = scraperTypes || scrapers || ['GOOGLE_MAPS', 'LINKEDIN'];
    
    const leads = await discoveryService.discoverLeads(query, finalScraperTypes);

    return NextResponse.json({
      message: `Successfully discovered ${leads.length} leads`,
      count: leads.length,
      leads: leads
    });
  } catch (error: any) {
    console.error('Error searching leads:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
