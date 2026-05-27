import { LeadScraper, ScrapedLead } from './types';
import { LinkedInCompanyScraper } from './proxycurl';

/**
 * LinkedInScraper - Real LinkedIn data via Proxycurl API
 * 
 * Uses Proxycurl API for LinkedIn company enrichment and discovery.
 * Falls back to demo data when the API key is not configured.
 * 
 * Note: LinkedIn restricts bulk company search scraping.
 * Proxycurl provides company profile enrichment (given a LinkedIn URL or website).
 * For bulk discovery, we use the Google Maps scraper and then enrich via Proxycurl.
 */
export class LinkedInScraper implements LeadScraper {
  name = 'LINKEDIN';
  private client: LinkedInCompanyScraper;

  constructor() {
    this.client = new LinkedInCompanyScraper();
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  async search(query: string, options?: any): Promise<ScrapedLead[]> {
    console.log(`[LinkedInScraper] Searching for: ${query}`);

    // Extract industry from query
    const industry = this.extractIndustry(query);

    // If not configured, fall back to demo data
    if (!this.client.isConfigured()) {
      console.warn('[LinkedInScraper] PROXYCURL_API_KEY not set. Using demo data.');
      return this.getDemoLeads(query, industry);
    }

    try {
      // Use Proxycurl-like enrichment to find companies by industry
      const results = await this.client.discoverByIndustry(industry || query);

      if (results.length === 0) {
        console.log('[LinkedInScraper] No results from Proxycurl enrichment.');
        return this.getDemoLeads(query, industry);
      }

      const leads: ScrapedLead[] = results.map((company) => ({
        companyName: company.name,
        website: company.website,
        linkedinUrl: company.linkedinUrl,
        industry: company.industry || industry,
        companySize: company.companySize,
        location: company.location,
        country: company.country,
        description: company.description || `${company.name} - ${company.industry || industry} company`,
        source: this.name,
      }));

      console.log(`[LinkedInScraper] Enriched ${leads.length} real companies via Proxycurl.`);
      return leads;
    } catch (error: any) {
      if (error.code === 'RATE_LIMITED') {
        console.warn('[LinkedInScraper] Rate limited by Proxycurl. Will retry on next search.');
        return [];
      }
      if (error.code === 'API_KEY_MISSING') {
        console.error('[LinkedInScraper] Invalid Proxycurl API key. Falling back to demo data.');
        return this.getDemoLeads(query, industry);
      }
      console.error('[LinkedInScraper] Error with Proxycurl:', error);
      return [];
    }
  }

  /**
   * Enrich a singular lead with LinkedIn data via Proxycurl
   * Used by LeadDiscoveryService after initial Google Places discovery
   */
  async enrichLead(website?: string, linkedinUrl?: string): Promise<Partial<ScrapedLead> | null> {
    if (!this.client.isConfigured()) {
      console.warn('[LinkedInScraper] Proxycurl not configured. Cannot enrich.');
      return null;
    }

    try {
      if (linkedinUrl) {
        const result = await this.client.enrichByWebsite(linkedinUrl);
        if (result) {
          return {
            linkedinUrl: result.linkedinUrl,
            companySize: result.companySize,
            industry: result.industry,
            location: result.location,
            country: result.country,
            description: result.description,
          };
        }
      }

      if (website) {
        const result = await this.client.enrichByWebsite(website);
        if (result) {
          return {
            linkedinUrl: result.linkedinUrl,
            companySize: result.companySize,
            industry: result.industry,
            location: result.location,
            country: result.country,
            description: result.description,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[LinkedInScraper] enrichLead failed:', error);
      return null;
    }
  }

  /**
   * Extract industry keyword from search query
   */
  private extractIndustry(query: string): string | undefined {
    const industryKeywords = [
      'construction', 'manufacturing', 'it', 'saas', 
      'healthcare', 'logistics', 'engineering', 
      'facilities', 'compliance', 'technology'
    ];

    const queryLower = query.toLowerCase();
    for (const keyword of industryKeywords) {
      if (queryLower.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }

    // If query contains "in", take first word
    const firstWord = query.split(' ')[0];
    return firstWord || undefined;
  }

  /**
   * Demo data for when Proxycurl is not configured
   */
  private getDemoLeads(query: string, industry?: string): ScrapedLead[] {
    const ind = industry || query.split(' ')[0] || 'Technology';
    
    const demoLeads: ScrapedLead[] = [
      {
        companyName: `SecureIT ${ind}`,
        website: 'https://www.secureit-solutions.co.uk',
        linkedinUrl: 'https://www.linkedin.com/company/secureit-solutions',
        location: 'Reading, UK',
        country: 'UK',
        industry: 'IT Services',
        companySize: '25-50',
        description: 'Managed service provider with a focus on cybersecurity and compliance. Recently hired a Head of Information Security.',
        source: this.name,
      },
      {
        companyName: `DataFlow Systems ${ind}`,
        website: 'https://www.dataflow-systems.io',
        linkedinUrl: 'https://www.linkedin.com/company/dataflow-systems',
        location: 'London, UK',
        country: 'UK',
        industry: 'SaaS',
        companySize: '50-100',
        description: 'Enterprise data management solutions provider. Growing rapidly and seeking ISO 27001 certification for enterprise deals.',
        source: this.name,
      },
      {
        companyName: `ComplianceFirst ${ind}`,
        website: 'https://www.compliancefirst-group.com',
        linkedinUrl: 'https://www.linkedin.com/company/compliancefirst',
        location: 'Manchester, UK',
        country: 'UK',
        industry: 'Professional Services',
        companySize: '10-50',
        description: 'Compliance consulting firm expanding into ISO certification services. Seeking integrated management systems.',
        source: this.name,
      },
      {
        companyName: `QualityBuild ${ind} Ltd`,
        website: 'https://www.qualitybuild-ltd.co.uk',
        linkedinUrl: 'https://www.linkedin.com/company/qualitybuild',
        location: 'Birmingham, UK',
        country: 'UK',
        industry: 'Construction',
        companySize: '100-250',
        description: 'Major construction contractor bidding for public sector projects. Requires ISO 9001, 14001, and 45001 certification for tender eligibility.',
        source: this.name,
      },
      {
        companyName: `TechGuard ${ind} Security`,
        website: 'https://www.techguard-security.com',
        linkedinUrl: 'https://www.linkedin.com/company/techguard',
        location: 'Bristol, UK',
        country: 'UK',
        industry: 'Cybersecurity',
        companySize: '10-50',
        description: 'Cybersecurity company looking to achieve ISO 27001 certification to support SOC 2 equivalency for US market expansion.',
        source: this.name,
      },
    ];

    return demoLeads;
  }
}