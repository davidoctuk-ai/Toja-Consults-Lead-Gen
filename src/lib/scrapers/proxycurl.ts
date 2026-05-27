/**
 * Proxycurl API Client
 * 
 * Production-grade client for Proxycurl's LinkedIn Company API.
 * Used to discover and enrich company data from LinkedIn for lead generation.
 * 
 * Docs: https://docs.proxycurl.com/
 */

export interface ProxycurlSearchParams {
  query: string;
  location?: string;
  industry?: string;
  employeeCount?: string;
  pageSize?: number;
}

export interface ProxycurlCompanyResult {
  name: string;
  linkedinUrl?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  country?: string;
  description?: string;
  phone?: string;
}

export class ProxycurlClient {
  private apiKey: string | null;
  private baseUrl = 'https://nubela.co/proxycurl/api';
  private requestCount: number = 0;
  private minuteStart: number = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 20; // Proxycurl free tier ~20/min
  
  // API endpoints
  private readonly COMPANY_ENDPOINT = '/company';
  private readonly SEARCH_ENDPOINT = '/search/company';
  private readonly LINKEDIN_PROFILE = '/linkedin/profile';

  constructor() {
    this.apiKey = process.env.PROXYCURL_API_KEY || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey !== '';
  }

  private async rateLimitCheck() {
    const now = Date.now();
    if (now - this.minuteStart > 60000) {
      this.requestCount = 0;
      this.minuteStart = now;
    }
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitMs = 60000 - (now - this.minuteStart);
      console.warn(`[ProxycurlClient] Rate limit reached. Waiting ${waitMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitMs + 1000));
      this.requestCount = 0;
      this.minuteStart = Date.now();
    }
    this.requestCount++;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
    };
  }

  private buildError(error: any, context: string): Error {
    if (error?.response?.status === 401 || error?.status === 401) {
      const err = new Error('Proxycurl API key is invalid') as any;
      err.code = 'API_KEY_MISSING';
      return err;
    }
    if (error?.response?.status === 429 || error?.status === 429) {
      const err = new Error('Proxycurl API rate limit exceeded') as any;
      err.code = 'RATE_LIMITED';
      err.retryAfterMs = 60000;
      return err;
    }
    const err = new Error(`${context}: ${error?.message || error}`) as any;
    err.code = 'API_ERROR';
    return err;
  }

  /**
   * Search for companies by keyword/industry
   * Note: Proxycurl's company search is currently limited. We use their Company Profile
   * endpoint via enrichment rather than bulk search. 
   * For bulk discovery, we search via LinkedIn URL patterns or known company domains.
   */
  async searchCompanies(params: ProxycurlSearchParams): Promise<ProxycurlCompanyResult[]> {
    console.warn('[ProxycurlClient] Proxycurl does not offer bulk company search. Use Google Places for discovery, then enrich with Proxycurl.');
    return [];
  }

  /**
   * Enrich a company's LinkedIn profile data
   * Fetches detailed company information from a LinkedIn company URL
   */
  async enrichCompanyByLinkedInUrl(linkedinUrl: string): Promise<ProxycurlCompanyResult | null> {
    if (!this.isConfigured()) {
      console.warn('[ProxycurlClient] API key not configured. Skipping enrichment.');
      return null;
    }

    await this.rateLimitCheck();

    try {
      const url = new URL(`${this.baseUrl}${this.COMPANY_ENDPOINT}`);
      url.searchParams.set('url', linkedinUrl);
      url.searchParams.set('categories', 'include');
      url.searchParams.set('use_cache', 'if-present');
      url.searchParams.set('funding_data', 'exclude');
      url.searchParams.set('extra', 'include');
      url.searchParams.set('exit_data', 'exclude');
      url.searchParams.set('acquisitions', 'exclude');

      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw this.buildError(
          { message: `HTTP ${response.status}: ${errorText}`, status: response.status },
          'Proxycurl company enrich'
        );
      }

      const data = await response.json();

      if (!data || data.name === 'None' || !data.name) {
        return null;
      }

      const result: ProxycurlCompanyResult = {
        name: data.name,
        linkedinUrl: linkedinUrl,
        website: data.website || undefined,
        industry: data.industry || undefined,
        companySize: data.employee_count 
          ? this.formatEmployeeCount(data.employee_count)
          : undefined,
        location: this.extractLocation(data),
        country: this.extractCountry(data),
        description: data.description || data.tagline || undefined,
      };

      return result;
    } catch (error: any) {
      if (error.code === 'RATE_LIMITED' || error.code === 'API_KEY_MISSING') {
        throw error;
      }
      console.error(`[ProxycurlClient] enrichCompanyByLinkedInUrl failed for ${linkedinUrl}:`, error);
      return null;
    }
  }

  /**
   * Search for companies via domain/website and get their LinkedIn info
   */
  async enrichCompanyByWebsite(website: string): Promise<ProxycurlCompanyResult | null> {
    if (!this.isConfigured()) return null;

    await this.rateLimitCheck();

    try {
      const url = new URL(`${this.baseUrl}${this.COMPANY_ENDPOINT}`);
      url.searchParams.set('url', website);
      url.searchParams.set('categories', 'include');
      url.searchParams.set('use_cache', 'if-present');

      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw this.buildError({ status: 429 }, 'Proxycurl enrich by website');
        }
        return null;
      }

      const data = await response.json();
      if (!data || data.name === 'None' || !data.name) return null;

      return {
        name: data.name,
        linkedinUrl: data.linkedin_url || undefined,
        website: data.website || undefined,
        industry: data.industry || undefined,
        companySize: data.employee_count
          ? this.formatEmployeeCount(data.employee_count)
          : undefined,
        location: this.extractLocation(data),
        country: this.extractCountry(data),
        description: data.description || data.tagline || undefined,
      };
    } catch (error: any) {
      if (error.code === 'RATE_LIMITED') throw error;
      console.error(`[ProxycurlClient] enrichCompanyByWebsite failed for ${website}:`, error);
      return null;
    }
  }

  private formatEmployeeCount(count: any): string | undefined {
    if (count === null || count === undefined || count === 'None') return undefined;
    const num = parseInt(count);
    if (isNaN(num)) return undefined;
    if (num <= 10) return '1-10';
    if (num <= 50) return '10-50';
    if (num <= 100) return '50-100';
    if (num <= 250) return '100-250';
    if (num <= 500) return '250-500';
    if (num <= 1000) return '500-1000';
    return '1000+';
  }

  private extractLocation(data: any): string | undefined {
    // Try different location fields Proxycurl may return
    const loc = data.hq_location || data.location || data.city;
    if (!loc || loc === 'None') return undefined;
    
    if (typeof loc === 'object' && loc !== null) {
      const parts = [];
      if (loc.city) parts.push(loc.city);
      if (loc.state) parts.push(loc.state);
      if (loc.country) parts.push(loc.country);
      return parts.length > 0 ? parts.join(', ') : undefined;
    }
    
    return String(loc);
  }

  private extractCountry(data: any): string | undefined {
    const loc = data.hq_location || data.location || data.city;
    if (!loc || loc === 'None') return undefined;

    if (typeof loc === 'object' && loc !== null) {
      return loc.country || undefined;
    }

    // If it's a string, try to get the last part if comma-separated
    if (typeof loc === 'string') {
      const parts = loc.split(',');
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
    }

    return undefined;
  }
}

/**
 * Fallback/Enhanced scraper that uses Proxycurl for enrichment 
 * after initial discovery via Google Places or other sources.
 */
export class LinkedInCompanyScraper {
  private proxycurl: ProxycurlClient;
  private static GENERIC_LINKEDIN_COMPANY_URLS: Record<string, string[]> = {
    'construction': [
      'https://www.linkedin.com/company/balfour-beatty',
      'https://www.linkedin.com/company/skanska',
      'https://www.linkedin.com/company/laing-orourke',
      'https://www.linkedin.com/company/kier-group',
    ],
    'manufacturing': [
      'https://www.linkedin.com/company/siemens',
      'https://www.linkedin.com/company/rolls-royce',
      'https://www.linkedin.com/company/bae-systems',
    ],
    'it': [
      'https://www.linkedin.com/company/microsoft',
      'https://www.linkedin.com/company/google',
      'https://www.linkedin.com/company/amazon-web-services',
    ],
    'healthcare': [
      'https://www.linkedin.com/company/nhs',
      'https://www.linkedin.com/company/astrazeneca',
    ],
  };

  constructor() {
    this.proxycurl = new ProxycurlClient();
  }

  isConfigured(): boolean {
    return this.proxycurl.isConfigured();
  }

  /**
   * Discover companies by industry keyword using Proxycurl enrichment
   * on known LinkedIn company URLs
   */
  async discoverByIndustry(industry: string): Promise<ProxycurlCompanyResult[]> {
    if (!this.proxycurl.isConfigured()) {
      console.warn('[LinkedInCompanyScraper] Proxycurl not configured. Returning empty results.');
      return [];
    }

    const results: ProxycurlCompanyResult[] = [];
    const key = industry.toLowerCase();

    // Find matching industry URLs
    let urls: string[] = [];
    for (const [industryKey, industryUrls] of Object.entries(LinkedInCompanyScraper.GENERIC_LINKEDIN_COMPANY_URLS)) {
      if (key.includes(industryKey)) {
        urls = [...urls, ...industryUrls];
      }
    }

    // If no specific matches, use construction as default (broadest target)
    if (urls.length === 0) {
      urls = LinkedInCompanyScraper.GENERIC_LINKEDIN_COMPANY_URLS['construction'];
    }

    // Enrich each URL (limit to 5 to avoid rate limiting)
    const batch = urls.slice(0, 5);
    for (const url of batch) {
      try {
        const enriched = await this.proxycurl.enrichCompanyByLinkedInUrl(url);
        if (enriched) {
          results.push(enriched);
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`[LinkedInCompanyScraper] Failed to enrich ${url}:`, error);
      }
    }

    return results;
  }

  /**
   * Enrich company data using a known website URL
   */
  async enrichByWebsite(website: string): Promise<ProxycurlCompanyResult | null> {
    return this.proxycurl.enrichCompanyByWebsite(website);
  }
}

// ProxycurlClient is exported via its class declaration above