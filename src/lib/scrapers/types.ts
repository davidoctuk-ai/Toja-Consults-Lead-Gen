export interface ScrapedLead {
  companyName: string;
  website?: string;
  location?: string;
  country?: string;
  industry?: string;
  companySize?: string;
  description?: string;
  phone?: string;
  linkedinUrl?: string;
  source: string;
}

export interface LeadScraper {
  name: string;
  search(query: string, options?: any): Promise<ScrapedLead[]>;
}

export interface ScraperRateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
}

export interface ScraperError extends Error {
  code: 'RATE_LIMITED' | 'API_KEY_MISSING' | 'API_ERROR' | 'NO_RESULTS' | 'NETWORK_ERROR';
  retryAfterMs?: number;
}