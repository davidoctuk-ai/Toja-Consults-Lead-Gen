import { LeadScraper } from './types';
import { GoogleMapsScraper } from './google-maps';
import { LinkedInScraper } from './linkedin';

export class ScraperFactory {
  static getScraper(type: string): LeadScraper {
    switch (type.toUpperCase()) {
      case 'GOOGLE_MAPS':
        return new GoogleMapsScraper();
      case 'LINKEDIN':
        return new LinkedInScraper();
      default:
        throw new Error(`Unknown scraper type: ${type}`);
    }
  }

  static getAllScrapers(): LeadScraper[] {
    return [
      new GoogleMapsScraper(),
      new LinkedInScraper()
    ];
  }

  /**
   * Get human-readable description for each scraper type
   */
  static getScraperInfo(type: string): { name: string; description: string; requiresKey: string } {
    switch (type.toUpperCase()) {
      case 'GOOGLE_MAPS':
        return {
          name: 'Google Places',
          description: 'Discover businesses via Google Places API (text search + place details)',
          requiresKey: 'GOOGLE_PLACES_API_KEY',
        };
      case 'LINKEDIN':
        return {
          name: 'LinkedIn (Proxycurl)',
          description: 'Enrich and discover companies via Proxycurl LinkedIn API',
          requiresKey: 'PROXYCURL_API_KEY',
        };
      default:
        return { name: type, description: 'Unknown scraper', requiresKey: '' };
    }
  }
}