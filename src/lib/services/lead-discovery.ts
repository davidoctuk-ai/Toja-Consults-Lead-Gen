import { prisma } from '../prisma';
import { ScraperFactory } from '../scrapers/factory';
import { ScrapedLead } from '../scrapers/types';
import { LinkedInScraper } from '../scrapers/linkedin';
import { calculateLeadScore } from './leadScoring';

export class LeadDiscoveryService {
  private linkedInScraper: LinkedInScraper;

  constructor() {
    this.linkedInScraper = new LinkedInScraper();
  }

  /**
   * Discover leads by running one or more scrapers in parallel
   */
  async discoverLeads(query: string, scraperTypes: string[]) {
    const allScrapedLeads: ScrapedLead[] = [];

    // 1. Run all requested scrapers sequentially (to respect rate limits)
    for (const type of scraperTypes) {
      try {
        const scraper = ScraperFactory.getScraper(type);
        console.log(`[LeadDiscoveryService] Running scraper: ${type}`);
        const leads = await scraper.search(query);
        allScrapedLeads.push(...leads);
        console.log(`[LeadDiscoveryService] Scraper ${type} returned ${leads.length} leads`);
      } catch (error) {
        console.error(`[LeadDiscoveryService] Error running scraper ${type}:`, error);
      }
    }

    if (allScrapedLeads.length === 0) {
      console.log('[LeadDiscoveryService] No leads found from any scraper.');
      return [];
    }

    // 2. Deduplicate leads by website or company name
    const deduplicatedLeads = this.deduplicateLeads(allScrapedLeads);

    // 3. Try to enrich leads with LinkedIn data (skip if already from LINKEDIN source)
    const enrichedLeads = await this.enrichWithLinkedInData(deduplicatedLeads);

    // 4. Save leads to database
    const savedLeads = [];
    for (const scrapedLead of enrichedLeads) {
      try {
        const lead = await this.upsertLead(scrapedLead);
        if (lead) {
          // Calculate score (this will also trigger automation)
          await calculateLeadScore(lead.id);
          
          // Re-fetch to get updated score in the return list
          const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
          if (updatedLead) {
            savedLeads.push(updatedLead);
          }
        }
      } catch (error) {
        console.error(`[LeadDiscoveryService] Error saving/scoring lead ${scrapedLead.companyName}:`, error);
      }
    }

    console.log(`[LeadDiscoveryService] Successfully saved ${savedLeads.length}/${enrichedLeads.length} leads.`);
    return savedLeads;
  }

  /**
   * Deduplicate leads by website (preferred), then by company name
   */
  private deduplicateLeads(leads: ScrapedLead[]): ScrapedLead[] {
    const seen = new Map<string, ScrapedLead>();

    for (const lead of leads) {
      // Prefer leads with companySize (from LinkedIn enrichment)
      const key = lead.website 
        ? lead.website.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
        : lead.companyName.toLowerCase().trim();

      if (seen.has(key)) {
        const existing = seen.get(key)!;
        // If new lead has more data (e.g., companySize from LinkedIn), prefer it
        if (lead.companySize && !existing.companySize) {
          seen.set(key, lead);
        } else if (lead.linkedinUrl && !existing.linkedinUrl) {
          seen.set(key, lead);
        }
      } else {
        seen.set(key, lead);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Enrich non-LinkedIn-source leads with LinkedIn data
   */
  private async enrichWithLinkedInData(leads: ScrapedLead[]): Promise<ScrapedLead[]> {
    // Only enrich if LinkedIn scraper is configured and we have leads from other sources
    if (!this.linkedInScraper.isConfigured()) {
      return leads;
    }

    const enrichedLeads: ScrapedLead[] = [];
    
    for (const lead of leads) {
      // Skip leads already from LinkedIn source
      if (lead.source === 'LINKEDIN') {
        enrichedLeads.push(lead);
        continue;
      }

      // Try to enrich with LinkedIn data
      if (lead.website) {
        try {
          const linkedInData = await this.linkedInScraper.enrichLead(lead.website);
          if (linkedInData) {
            enrichedLeads.push({
              ...lead,
              ...linkedInData,
              source: `${lead.source}+LINKEDIN`,
            });
            continue;
          }
        } catch (error) {
          console.error(`[LeadDiscoveryService] LinkedIn enrichment failed for ${lead.companyName}:`, error);
        }
      }
      
      // Fall back to original data
      enrichedLeads.push(lead);
    }

    return enrichedLeads;
  }

  /**
   * Upsert a lead into the database with proper deduplication
   */
  private async upsertLead(scrapedLead: ScrapedLead) {
    // Build a deduplication key from website or company name
    const dedupKey = scrapedLead.website
      ? scrapedLead.website.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
      : null;

    // If we have a website, use it as the unique identifier
    if (dedupKey) {
      try {
        return await prisma.lead.upsert({
          where: { website: dedupKey },
          update: {
            companyName: scrapedLead.companyName,
            location: scrapedLead.location || undefined,
            country: scrapedLead.country || undefined,
            industry: scrapedLead.industry || undefined,
            companySize: scrapedLead.companySize || undefined,
            description: scrapedLead.description || undefined,
            linkedinUrl: scrapedLead.linkedinUrl || undefined,
          },
          create: {
            companyName: scrapedLead.companyName,
            website: dedupKey,
            location: scrapedLead.location,
            country: scrapedLead.country,
            industry: scrapedLead.industry,
            companySize: scrapedLead.companySize,
            description: scrapedLead.description,
            linkedinUrl: scrapedLead.linkedinUrl,
            status: 'NEW',
          },
        });
      } catch (error: any) {
        // If website unique constraint fails (race condition), try by company name
        if (error.code === 'P2002') {
          return await this.upsertLeadByCompanyName(scrapedLead);
        }
        throw error;
      }
    }

    // If no website, try by company name
    return await this.upsertLeadByCompanyName(scrapedLead);
  }

  /**
   * Fallback upsert using company name when website is unavailable
   */
  private async upsertLeadByCompanyName(scrapedLead: ScrapedLead) {
    const existing = await prisma.lead.findFirst({
      where: { companyName: scrapedLead.companyName },
    });

    if (existing) {
      return prisma.lead.update({
        where: { id: existing.id },
        data: {
          location: scrapedLead.location || existing.location,
          country: scrapedLead.country || existing.country,
          industry: scrapedLead.industry || existing.industry,
          companySize: scrapedLead.companySize || existing.companySize,
          description: scrapedLead.description || existing.description,
          linkedinUrl: scrapedLead.linkedinUrl || existing.linkedinUrl,
        },
      });
    }

    return prisma.lead.create({
      data: {
        companyName: scrapedLead.companyName,
        website: scrapedLead.website,
        location: scrapedLead.location,
        country: scrapedLead.country,
        industry: scrapedLead.industry,
        companySize: scrapedLead.companySize,
        description: scrapedLead.description,
        linkedinUrl: scrapedLead.linkedinUrl,
        status: 'NEW',
      },
    });
  }
}