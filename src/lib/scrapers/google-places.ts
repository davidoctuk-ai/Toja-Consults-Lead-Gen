/**
 * Google Places API Client
 * 
 * Production-grade client for the Google Places API (Places API for Web).
 * Used to discover businesses by keyword and location for lead generation.
 * 
 * Docs: https://developers.google.com/maps/documentation/places/web-service/search-text
 */

export interface GooglePlacesSearchParams {
  query: string;
  location?: string;  // e.g., "London, UK"
  radius?: number;    // in meters, default 50000
  maxResults?: number; // max results to fetch (1-60 per API, we can paginate)
}

export interface GooglePlacesResult {
  placeId: string;
  name: string;
  formattedAddress?: string;
  website?: string;
  phoneNumber?: string;
  types?: string[];
  rating?: number;
  userRatingsTotal?: number;
}

export class GooglePlacesClient {
  private apiKey: string | null;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private requestCount: number = 0;
  private minuteStart: number = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 60; // Google's free tier limit
  private readonly MAX_REQUESTS_PER_DAY = 1000;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || null;
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
      console.warn(`[GooglePlacesClient] Rate limit reached. Waiting ${waitMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitMs + 1000));
      this.requestCount = 0;
      this.minuteStart = Date.now();
    }
    this.requestCount++;
  }

  private buildError(error: any, context: string): Error {
    if (error?.response?.status === 403) {
      const err = new Error('Google Places API key is invalid or has no access') as any;
      err.code = 'API_KEY_MISSING';
      return err;
    }
    if (error?.response?.status === 429 || error?.status === 429) {
      const err = new Error('Google Places API rate limit exceeded') as any;
      err.code = 'RATE_LIMITED';
      err.retryAfterMs = 60000;
      return err;
    }
    const err = new Error(`${context}: ${error?.message || error}`) as any;
    err.code = 'API_ERROR';
    return err;
  }

  /**
   * Text Search - Find businesses by keyword + location
   * https://developers.google.com/maps/documentation/places/web-service/search-text
   */
  async textSearch(params: GooglePlacesSearchParams): Promise<GooglePlacesResult[]> {
    if (!this.isConfigured()) {
      console.warn('[GooglePlacesClient] API key not configured. Returning empty results.');
      return [];
    }

    await this.rateLimitCheck();

    const allResults: GooglePlacesResult[] = [];
    let nextPageToken: string | null = null;
    const maxPages = Math.min(Math.ceil((params.maxResults || 20) / 20), 3); // Max 3 pages (60 results)

    for (let page = 0; page < maxPages; page++) {
      try {
        const searchUrl = new URL(`${this.baseUrl}/textsearch/json`);
        if (nextPageToken) {
          searchUrl.searchParams.set('pagetoken', nextPageToken);
        } else {
          let searchQuery = params.query;
          if (params.location) {
            searchQuery = `${params.query} in ${params.location}`;
          }
          searchUrl.searchParams.set('query', searchQuery);
          if (params.radius) {
            searchUrl.searchParams.set('radius', String(params.radius));
          }
        }
        searchUrl.searchParams.set('key', this.apiKey!);

        const response = await fetch(searchUrl.toString());
        const data = await response.json();

        if (data.status === 'REQUEST_DENIED') {
          throw this.buildError(
            { message: data.error_message || 'Request denied' },
            'Google Places textSearch'
          );
        }

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.error(`[GooglePlacesClient] textSearch error: ${data.status} - ${data.error_message || ''}`);
          break;
        }

        if (data.results) {
          // Filter for businesses (not administrative areas or routes)
          const businessResults = data.results.filter((r: any) => {
            const types = r.types || [];
            return !types.includes('administrative_area_level_1') &&
                   !types.includes('administrative_area_level_2') &&
                   !types.includes('country') &&
                   !types.includes('route');
          });

          for (const result of businessResults) {
            allResults.push({
              placeId: result.place_id,
              name: result.name,
              formattedAddress: result.formatted_address,
              types: result.types,
              rating: result.rating,
              userRatingsTotal: result.user_ratings_total,
            });
          }
        }

        nextPageToken = data.next_page_token || null;
        if (nextPageToken) {
          // Google requires a short delay before using the next page token
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        // If rate limited or API key issue, rethrow
        if (error.code === 'RATE_LIMITED' || error.code === 'API_KEY_MISSING') {
          throw error;
        }
        console.error(`[GooglePlacesClient] textSearch page ${page} failed:`, error);
        break;
      }
    }

    return allResults;
  }

  /**
   * Place Details - Get website, phone, and other details for a place
   * https://developers.google.com/maps/documentation/places/web-service/details
   */
  async getPlaceDetails(placeId: string): Promise<{ website?: string; phoneNumber?: string } | null> {
    if (!this.isConfigured()) return null;

    await this.rateLimitCheck();

    try {
      const detailUrl = new URL(`${this.baseUrl}/details/json`);
      detailUrl.searchParams.set('place_id', placeId);
      detailUrl.searchParams.set('fields', 'website,formatted_phone_number');
      detailUrl.searchParams.set('key', this.apiKey!);

      const response = await fetch(detailUrl.toString());
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          website: data.result.website || undefined,
          phoneNumber: data.result.formatted_phone_number || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error(`[GooglePlacesClient] getPlaceDetails failed for ${placeId}:`, error);
      return null;
    }
  }

  /**
   * Convenience: search businesses and enrich with website/phone details
   */
  async searchBusinesses(params: GooglePlacesSearchParams): Promise<GooglePlacesResult[]> {
    const results = await this.textSearch(params);
    
    // Enrich first 10 results with place details (limited to avoid rate issues)
    const enrichmentBatch = results.slice(0, 10);
    const enriched = await Promise.all(
      enrichmentBatch.map(async (r) => {
        const details = await this.getPlaceDetails(r.placeId);
        if (details) {
          r.website = details.website || r.website;
          r.phoneNumber = details.phoneNumber || r.phoneNumber;
        }
        return r;
      })
    );

    // Merge enriched back in
    const enrichedMap = new Map(enriched.map(r => [r.placeId, r]));
    return results.map(r => enrichedMap.get(r.placeId) || r);
  }
}