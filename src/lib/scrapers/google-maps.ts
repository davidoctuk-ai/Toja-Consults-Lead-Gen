import { LeadScraper, ScrapedLead } from './types';
import { GooglePlacesClient, GooglePlacesResult } from './google-places';

/**
 * GoogleMapsScraper - Real Google Places API integration
 * 
 * Uses the Google Places API for location-based business discovery.
 * Falls back to demo data when the API key is not configured.
 */
export class GoogleMapsScraper implements LeadScraper {
  name = 'GOOGLE_MAPS';
  private client: GooglePlacesClient;

  constructor() {
    this.client = new GooglePlacesClient();
  }

  async search(query: string, options?: any): Promise<ScrapedLead[]> {
    console.log(`[GoogleMapsScraper] Searching for: ${query}`);

    // Extract location from query if it contains "in (location)" pattern
    const queryParts = this.parseQuery(query);
    const searchQuery = queryParts.keywords;
    const searchLocation = queryParts.location || options?.location || undefined;

    // If not configured, fall back to demo data
    if (!this.client.isConfigured()) {
      console.warn('[GoogleMapsScraper] GOOGLE_PLACES_API_KEY not set. Using demo data.');
      return this.getDemoLeads(searchQuery, searchLocation);
    }

    try {
      // Use Google Places Text Search
      const results = await this.client.searchBusinesses({
        query: searchQuery,
        location: searchLocation,
        radius: options?.radius || 50000, // 50km default
        maxResults: options?.maxResults || 15,
      });

      if (results.length === 0) {
        console.log('[GoogleMapsScraper] No results found from Google Places API.');
        return [];
      }

      // Map Google Places results to ScrapedLead
      const leads: ScrapedLead[] = results.map((place: GooglePlacesResult) => {
        const addressParts = place.formattedAddress?.split(', ') || [];
        const country = addressParts.length > 0 ? addressParts[addressParts.length - 1] : undefined;
        
        return {
          companyName: place.name,
          website: place.website,
          location: place.formattedAddress,
          country: country,
          industry: this.inferIndustry(place.types || [], searchQuery),
          phone: place.phoneNumber,
          description: `${place.name} - ${place.formattedAddress || 'Location unknown'}`,
          source: this.name,
        };
      });

      console.log(`[GoogleMapsScraper] Found ${leads.length} real leads from Google Places API.`);
      return leads;
    } catch (error: any) {
      // Handle rate limiting gracefully
      if (error.code === 'RATE_LIMITED') {
        console.warn('[GoogleMapsScraper] Rate limited. Will retry on next search.');
        return [];
      }
      // Handle API key issues gracefully
      if (error.code === 'API_KEY_MISSING') {
        console.error('[GoogleMapsScraper] Invalid Google Places API key. Falling back to demo data.');
        return this.getDemoLeads(searchQuery, searchLocation);
      }
      // Other errors
      console.error('[GoogleMapsScraper] Error searching Google Places:', error);
      return [];
    }
  }

  /**
   * Parse "keyword in location" query format
   */
  private parseQuery(query: string): { keywords: string; location: string | null } {
    // Match patterns like "construction companies in London" or "ISO 9001 in Manchester"
    const inMatch = query.match(/^(.+?)\s+in\s+(.+)$/i);
    if (inMatch) {
      return {
        keywords: inMatch[1].trim(),
        location: inMatch[2].trim(),
      };
    }
    return { keywords: query, location: null };
  }

  /**
   * Infer industry from Google Places types and search query
   */
  private inferIndustry(types: string[], query: string): string | undefined {
    const industryMap: Record<string, string[]> = {
      'Construction': ['construction', 'builder', 'contractor', 'real estate', 'property'],
      'Manufacturing': ['manufacturing', 'factory', 'industrial', 'plant', 'production'],
      'IT & SaaS': ['software', 'technology', 'it services', 'computer', 'saas', 'tech'],
      'Healthcare': ['hospital', 'medical', 'healthcare', 'clinic', 'pharmaceutical'],
      'Logistics': ['logistics', 'transportation', 'warehouse', 'shipping', 'courier'],
      'Engineering': ['engineering', 'consultant', 'engineering services'],
      'Facilities Management': ['facilities', 'maintenance', 'cleaning', 'facility'],
    };

    // First check search query for industry hints
    const queryLower = query.toLowerCase();
    for (const [industry, keywords] of Object.entries(industryMap)) {
      if (keywords.some(k => queryLower.includes(k))) {
        return industry;
      }
    }

    // Then check Google Place types
    if (types.includes('health') || types.includes('hospital')) return 'Healthcare';
    if (types.includes('school') || types.includes('university')) return 'Education';
    if (types.includes('store') || types.includes('shopping')) return 'Retail';
    if (types.includes('restaurant') || types.includes('food')) return 'Hospitality';
    if (types.includes('car_repair') || types.includes('car_dealer')) return 'Automotive';
    if (types.includes('lawyer') || types.includes('accounting')) return 'Professional Services';
    if (types.includes('bank') || types.includes('finance')) return 'Financial Services';

    return undefined;
  }

  /**
   * Demo data for when API key is not configured
   * These are still realistic-looking examples relevant to ISO consultancy
   */
  private getDemoLeads(keywords: string, location: string | null): ScrapedLead[] {
    const loc = location || 'UK';
    const industryKeyword = keywords.split(' ')[0];

    const demoLeads: ScrapedLead[] = [
      {
        companyName: `${industryKeyword} Construction Ltd`,
        website: `https://www.${industryKeyword.toLowerCase()}-construction.co.uk`,
        location: `London, ${loc}`,
        country: loc,
        industry: 'Construction',
        companySize: '50-100',
        description: 'Leading construction company specializing in infrastructure and commercial building projects across the UK. Multiple public sector contracts.',
        source: this.name,
      },
      {
        companyName: `BuildWise ${industryKeyword} Ltd`,
        website: `https://www.buildwise-${industryKeyword.toLowerCase()}.co.uk`,
        location: `Manchester, ${loc}`,
        country: loc,
        industry: 'Construction',
        companySize: '100-250',
        description: 'Residential and commercial building contractors with a growing portfolio of government and healthcare projects.',
        source: this.name,
      },
      {
        companyName: `${industryKeyword} Engineering Solutions PLC`,
        website: `https://www.${industryKeyword.toLowerCase()}-eng.co.uk`,
        location: `Birmingham, ${loc}`,
        country: loc,
        industry: 'Engineering',
        companySize: '10-50',
        description: 'Engineering consultancy providing design and project management services to infrastructure and energy sectors.',
        source: this.name,
      },
      {
        companyName: `Precision ${industryKeyword} Manufacturing`,
        website: `https://www.precision-${industryKeyword.toLowerCase()}.com`,
        location: `Sheffield, ${loc}`,
        country: loc,
        industry: 'Manufacturing',
        companySize: '100-250',
        description: 'Advanced manufacturing facility supplying components to aerospace, automotive, and medical device industries.',
        source: this.name,
      },
      {
        companyName: `TechFlow ${industryKeyword} Systems`,
        website: `https://www.techflow-${industryKeyword.toLowerCase()}.io`,
        location: `Reading, ${loc}`,
        country: loc,
        industry: 'IT & SaaS',
        companySize: '25-50',
        description: 'B2B SaaS platform provider handling sensitive client data with growing cybersecurity requirements.',
        source: this.name,
      },
      {
        companyName: `MediCore ${industryKeyword} Supplies`,
        website: `https://www.medicore-${industryKeyword.toLowerCase()}.co.uk`,
        location: `Leeds, ${loc}`,
        country: loc,
        industry: 'Healthcare',
        companySize: '50-100',
        description: 'Healthcare equipment supplier to NHS and private healthcare providers with stringent compliance requirements.',
        source: this.name,
      },
      {
        companyName: `GreenLogistics ${industryKeyword}`,
        website: `https://www.greenlogistics-${industryKeyword.toLowerCase()}.com`,
        location: `Bristol, ${loc}`,
        country: loc,
        industry: 'Logistics',
        companySize: '100-250',
        description: 'Nationwide logistics and supply chain management company serving retail and manufacturing clients.',
        source: this.name,
      },
    ];

    return demoLeads;
  }
}