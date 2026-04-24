const axios = require('axios');
const usLocationsService = require('./usLocationsService');
require('dotenv').config();

class GooglePlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBLTMJKg2Y11xezGNg3RiFNF75nstgJ7Jg';
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    this.rateLimit = {
      requests: 0,
      lastReset: Date.now(),
      maxRequests: 50, // Conservative limit for free tier
      resetInterval: 60000 // 1 minute
    };
    this.requestQueue = [];
    this.isProcessingQueue = false;
    // Simple in-memory cache
    this.cache = new Map();
    this.CACHE_TTL = 3600 * 1000; // 1 hour
  }

  // Enhanced rate limiting with exponential backoff
  async checkRateLimit() {
    const now = Date.now();
    if (now - this.rateLimit.lastReset > this.rateLimit.resetInterval) {
      this.rateLimit.requests = 0;
      this.rateLimit.lastReset = now;
    }

    if (this.rateLimit.requests >= this.rateLimit.maxRequests) {
      const waitTime = this.rateLimit.resetInterval - (now - this.rateLimit.lastReset);
      if (waitTime > 0) {
        console.log(`Rate limit exceeded, waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.rateLimit.requests = 0;
        this.rateLimit.lastReset = Date.now();
      }
    }

    this.rateLimit.requests++;
  }

  // Enhanced business search with comprehensive Google Places API integration
  async searchBusinesses(location, categories = [], radius = 5000, minRating = 3.0) {
    try {
      const cacheKey = `${location}-${categories.join(',')}-${radius}-${minRating}`;
      if (this.cache.has(cacheKey)) {
        const cachedEntry = this.cache.get(cacheKey);
        if (Date.now() - cachedEntry.timestamp < this.CACHE_TTL) {
          console.log('✅ Returning cached results');
          return cachedEntry.data;
        }
        this.cache.delete(cacheKey);
      }

      console.log(`🔍 Starting business search for: ${location} (categories: ${categories.join(',')})`);

      // Require a valid API key for real business searches
      if (!this.apiKey || this.apiKey === 'test_key') {
        throw new Error('Google Places API key is required. Please configure GOOGLE_PLACES_API_KEY in your environment variables.');
      }

      await this.checkRateLimit();

      // Step 1: Get accurate coordinates for the location
      const coordinates = await this.getAccurateCoordinates(location);
      if (!coordinates) {
        console.error('❌ Could not find coordinates for location:', location);
        throw new Error('Could not find coordinates for location');
      }

      console.log(`📍 Geocoded location: ${location} (${coordinates.lat}, ${coordinates.lng})`);

      // Step 2: Search for businesses using multiple strategies
      const allBusinesses = [];

      // Strategy 1: Nearby search for each category
      if (categories && categories.length > 0) {
        console.log(`📊 Searching ${categories.length} categories: ${categories.join(', ')}`);

        // Parallelize category searches
        const categoryPromises = categories.map(async (category, i) => {
          try {
            // Add a small staggered delay to avoid hitting rate limits instantly
            await new Promise(resolve => setTimeout(resolve, i * 100));
            console.log(`🔎 Searching category: ${category}`);
            return await this.nearbySearch(coordinates, radius, category);
          } catch (error) {
            console.warn(`❌ Error searching category ${category}:`, error.message);
            return [];
          }
        });

        const results = await Promise.all(categoryPromises);
        results.forEach(r => allBusinesses.push(...r));
      } else {
        // If no categories specified, do a general search
        try {
          console.log('🔎 Performing general business search');
          const generalResults = await this.nearbySearch(coordinates, radius);
          allBusinesses.push(...generalResults);
        } catch (error) {
          console.warn('❌ General nearby search failed:', error.message);
        }
      }

      // Strategy 2: Text search for broader results (only if we need more results)
      if (allBusinesses.length < 20) {
        try {
          console.log('🔎 Performing text search for additional results');
          const textResults = await this.textSearch(location, categories);
          allBusinesses.push(...textResults);
        } catch (error) {
          console.warn('❌ Text search failed:', error.message);
        }
      }

      // Step 3: Remove duplicates and filter by rating
      const uniqueBusinesses = this.removeDuplicates(allBusinesses);
      console.log(`📈 Total businesses found: ${uniqueBusinesses.length}`);

      // Filter by minimum rating if specified
      const filteredBusinesses = uniqueBusinesses.filter(business =>
        !business.rating || business.rating >= minRating
      );
      console.log(`⭐ After rating filter (≥${minRating}): ${filteredBusinesses.length} businesses`);

      // Step 4: Get detailed information for each business
      const limitedBusinesses = filteredBusinesses.slice(0, 60); // Increased limit
      const detailedBusinesses = [];

      console.log(`🌐 Starting website detection for ${limitedBusinesses.length} businesses...`);

      // Process businesses in parallel with higher concurrency
      const concurrencyLimit = 10; // Increased from 3
      for (let i = 0; i < limitedBusinesses.length; i += concurrencyLimit) {
        const batch = limitedBusinesses.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(async (business, index) => {
          try {
            const details = await this.getBusinessDetails(business.place_id);
            return details;
          } catch (error) {
            console.error(`❌ Error getting details for business ${i + index}:`, error.message);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        detailedBusinesses.push(...batchResults.filter(result => result !== null));

        // Reduced delay between batches
        if (i + concurrencyLimit < limitedBusinesses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Step 5: Final processing and statistics
      const finalResults = detailedBusinesses.filter(business => business !== null);
      const withWebsites = finalResults.filter(b => b.has_website).length;
      const withoutWebsites = finalResults.filter(b => !b.has_website).length;

      console.log(`📊 Website detection results:`);
      console.log(`   - Businesses with websites: ${withWebsites}`);
      console.log(`   - Businesses without websites: ${withoutWebsites}`);
      console.log(`   - Total processed: ${finalResults.length}`);

      const response = {
        businesses: finalResults,
        search_location: {
          address: location,
          coordinates: coordinates
        }
      };

      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: response
      });

      return response;
    } catch (error) {
      console.error('❌ Error searching businesses:', error.message);

      // Handle specific API errors with helpful messages
      if (error.message.includes('Rate limit exceeded') || error.message.includes('OVER_QUERY_LIMIT')) {
        throw new Error('Google Places API rate limit exceeded. Please try again later or upgrade your API quota.');
      } else if (error.message.includes('REQUEST_DENIED')) {
        throw new Error('Google Places API access denied. Please check your API key and ensure the Places API is enabled.');
      } else if (error.message.includes('INVALID_REQUEST')) {
        throw new Error('Invalid request to Google Places API. Please check your search parameters.');
      }

      throw error;
    }
  }

  // Enhanced nearby search with better error handling and multiple attempts
  async nearbySearch(coordinates, radius, category = null) {
    try {
      await this.checkRateLimit();

      const searchParams = {
        location: `${coordinates.lat},${coordinates.lng}`,
        radius: Math.min(radius, 50000), // Google Places API max radius is 50km
        type: 'establishment',
        key: this.apiKey
      };

      // Add category-specific search terms
      if (category) {
        // Map our categories to Google Places keywords
        const categoryKeywords = {
          'Restaurants': 'restaurant food dining',
          'Salons': 'beauty salon hair',
          'Gyms': 'gym fitness workout',
          'Medical': 'doctor medical health',
          'Retail': 'store shopping retail',
          'Professional Services': 'lawyer accountant professional',
          'Home Services': 'plumber electrician home repair',
          'Automotive': 'auto repair car service',
          'Education': 'school education learning',
          'Entertainment': 'entertainment recreation',
          'Dentists': 'dentist dental care',
          'Auto Repair': 'auto repair car service',
          'Lawyers': 'lawyer legal services',
          'Real Estate': 'real estate agent property',
          'Construction': 'construction contractor building',
          'Plumbers': 'plumber plumbing repair',
          'Electricians': 'electrician electrical repair',
          'Cleaning Services': 'cleaning service housekeeping',
          'Pet Services': 'pet grooming veterinary',
          'Landscaping': 'landscaping lawn care',
          'Cafes': 'cafe coffee shop',
          'Bars': 'bar pub nightclub',
          'Fast Food': 'fast food restaurant',
          'Barbers': 'barber shop haircut',
          'Nail Salons': 'nail salon manicure',
          'Massage': 'massage therapy spa',
          'Yoga': 'yoga studio fitness',
          'Martial Arts': 'martial arts karate',
          'Swimming': 'swimming pool aquatic',
          'Clothing': 'clothing store fashion',
          'Electronics': 'electronics store technology',
          'Furniture': 'furniture store home',
          'Grocery': 'grocery store supermarket',
          'Pharmacy': 'pharmacy drugstore',
          'Gas Station': 'gas station fuel',
          'Car Wash': 'car wash auto cleaning',
          'Auto Dealer': 'car dealer automotive',
          'Accountant': 'accountant tax services',
          'Insurance': 'insurance agency coverage',
          'Bank': 'bank financial services',
          'HVAC': 'hvac heating cooling',
          'Locksmith': 'locksmith key service',
          'School': 'school education',
          'Daycare': 'daycare child care',
          'Tutoring': 'tutoring educational services',
          'Movie Theater': 'movie theater cinema',
          'Bowling': 'bowling alley recreation',
          'Arcade': 'arcade games entertainment',
          'Library': 'library books reading',
          'Museum': 'museum art culture',
          'Park': 'park recreation outdoor',
          'Hotel': 'hotel lodging accommodation',
          'Travel Agency': 'travel agency vacation',
          'Car Rental': 'car rental vehicle',
          'Church': 'church religious worship',
          'Mosque': 'mosque islamic worship',
          'Synagogue': 'synagogue jewish worship',
          'Temple': 'temple hindu buddhist',
          'Post Office': 'post office mail',
          'Courthouse': 'courthouse legal',
          'Police': 'police law enforcement',
          'Fire Station': 'fire station emergency',
          'Laundromat': 'laundromat laundry',
          'Dry Cleaning': 'dry cleaning service',
          'Storage': 'storage unit facility',
          'Funeral Home': 'funeral home services',
          'Pet Grooming': 'pet grooming animal',
          'Tattoo Parlor': 'tattoo parlor body art',
          'Pawn Shop': 'pawn shop loans',
          'Thrift Store': 'thrift store secondhand'
        };

        searchParams.keyword = categoryKeywords[category] || category;
      }

      console.log(`🔍 Nearby search: ${searchParams.location}, radius: ${searchParams.radius}m, keyword: ${searchParams.keyword || 'none'}`);

      let allResults = [];
      let pageToken = null;
      let pageCount = 0;
      const maxPages = 3; // Fetch up to 3 pages (60 results)

      do {
        if (pageToken) {
          searchParams.pagetoken = pageToken;
          // Google requires a short delay before the next page token is valid
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
          params: searchParams,
          timeout: 15000
        });

        if (response.data.status === 'OVER_QUERY_LIMIT') {
          throw new Error('Rate limit exceeded');
        }

        if (response.data.status === 'REQUEST_DENIED') {
          throw new Error('API key invalid or restricted');
        }

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
          console.warn(`⚠️ Nearby search error: ${response.data.status}`);
          break; // Stop pagination on error
        }

        const results = response.data.results || [];
        allResults.push(...results);

        pageToken = response.data.next_page_token;
        pageCount++;

        console.log(`   Page ${pageCount}: Found ${results.length} results (Total: ${allResults.length})`);

      } while (pageToken && pageCount < maxPages);

      console.log(`✅ Found ${allResults.length} businesses via nearby search`);
      return allResults;
    } catch (error) {
      console.error('❌ Nearby search error:', error.message);
      throw error;
    }
  }

  // Enhanced text search with better error handling and multiple search strategies
  async textSearch(location, categories = []) {
    try {
      await this.checkRateLimit();

      const allResults = [];

      // If categories provided, search for each one
      if (categories && categories.length > 0) {
        for (const category of categories) {
          try {
            const query = `${category} in ${location}, USA`;
            console.log(`🔍 Text search query: ${query}`);

            let categoryResults = [];
            let pageToken = null;
            let pageCount = 0;
            const maxPages = 3;

            do {
              const params = {
                query: query,
                key: this.apiKey
              };

              if (pageToken) {
                params.pagetoken = pageToken;
                await new Promise(resolve => setTimeout(resolve, 2000));
              }

              const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
                params: params,
                timeout: 15000
              });

              if (response.data.status === 'OVER_QUERY_LIMIT') {
                throw new Error('Rate limit exceeded');
              }

              if (response.data.status === 'REQUEST_DENIED') {
                throw new Error('API key invalid or restricted');
              }

              if (response.data.status === 'OK' && response.data.results) {
                categoryResults.push(...response.data.results);
                pageToken = response.data.next_page_token;
                pageCount++;
                console.log(`   Page ${pageCount}: Found ${response.data.results.length} results`);
              } else {
                if (response.data.status !== 'ZERO_RESULTS') {
                  console.warn(`⚠️ Text search error for ${category}: ${response.data.status}`);
                }
                break;
              }
            } while (pageToken && pageCount < maxPages);

            allResults.push(...categoryResults);
            console.log(`✅ Found ${categoryResults.length} total businesses for ${category}`);

            // Small delay between searches
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.warn(`❌ Text search failed for ${category}:`, error.message);
          }
        }
      } else {
        // General business search
        const query = `businesses in ${location}, USA`;
        console.log(`🔍 General text search query: ${query}`);

        let pageToken = null;
        let pageCount = 0;
        const maxPages = 3;

        do {
          const params = {
            query: query,
            key: this.apiKey
          };

          if (pageToken) {
            params.pagetoken = pageToken;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
            params: params,
            timeout: 15000
          });

          if (response.data.status === 'OVER_QUERY_LIMIT') {
            throw new Error('Rate limit exceeded');
          }

          if (response.data.status === 'REQUEST_DENIED') {
            throw new Error('API key invalid or restricted');
          }

          if (response.data.status === 'OK' && response.data.results) {
            allResults.push(...response.data.results);
            pageToken = response.data.next_page_token;
            pageCount++;
            console.log(`   Page ${pageCount}: Found ${response.data.results.length} results`);
          } else {
            if (response.data.status !== 'ZERO_RESULTS') {
              console.warn(`⚠️ General text search error: ${response.data.status}`);
            }
            break;
          }
        } while (pageToken && pageCount < maxPages);

        console.log(`✅ Found ${allResults.length} businesses via general text search`);
      }

      return allResults;
    } catch (error) {
      console.error('❌ Text search error:', error.message);
      throw error;
    }
  }

  // Search for businesses in a grid pattern to cover a larger area
  async searchInGrid(center, radius, category) {
    try {
      console.log(`🌐 Starting grid search for ${category} around ${center.lat}, ${center.lng}`);

      // Calculate grid points
      // 1 degree of latitude is approx 111km
      // 1 degree of longitude is approx 111km * cos(lat)
      // We want a grid of 3x3 points covering the radius

      const gridSize = 3; // 3x3 grid
      const stepSizeKm = (radius / 1000) * 0.8; // Step size slightly less than radius to ensure overlap
      const latStep = stepSizeKm / 111;
      const lngStep = stepSizeKm / (111 * Math.cos(center.lat * Math.PI / 180));

      const gridPoints = [];
      const offset = Math.floor(gridSize / 2);

      for (let i = -offset; i <= offset; i++) {
        for (let j = -offset; j <= offset; j++) {
          gridPoints.push({
            lat: center.lat + (i * latStep),
            lng: center.lng + (j * lngStep)
          });
        }
      }

      console.log(`📍 Generated ${gridPoints.length} grid points for search`);

      let allResults = [];

      // Search each grid point
      for (const point of gridPoints) {
        try {
          // Use a smaller radius for grid points to avoid too much overlap
          const pointRadius = radius * 0.6;
          const results = await this.nearbySearch(point, pointRadius, category);
          allResults.push(...results);

          // Small delay between grid points
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`⚠️ Grid point search failed:`, error.message);
        }
      }

      // Deduplicate results
      const uniqueResults = this.removeDuplicates(allResults);
      console.log(`✅ Grid search found ${uniqueResults.length} unique businesses (from ${allResults.length} total)`);

      return uniqueResults;
    } catch (error) {
      console.error('❌ Grid search error:', error.message);
      return []; // Return empty array on error to allow fallback
    }
  }

  // Remove duplicate businesses
  removeDuplicates(businesses) {
    const seen = new Set();
    return businesses.filter(business => {
      if (seen.has(business.place_id)) {
        return false;
      }
      seen.add(business.place_id);
      return true;
    });
  }

  // Note: Mock data methods removed - this service now uses only real Google Places API data

  // Get accurate coordinates for any US location using multiple strategies
  async getAccurateCoordinates(location) {
    try {
      console.log(`🗺️ Getting coordinates for: ${location}`);

      // Strategy 1: Try US locations service first (fastest)
      const usCoordinates = await usLocationsService.getCoordinates(location);
      if (usCoordinates) {
        console.log(`✅ Found coordinates from US locations service: ${usCoordinates.lat}, ${usCoordinates.lng}`);
        return usCoordinates;
      }

      // Require a valid API key for geocoding
      if (!this.apiKey || this.apiKey === 'test_key') {
        throw new Error('Google Places API key is required for geocoding. Please configure GOOGLE_PLACES_API_KEY in your environment variables.');
      }

      await this.checkRateLimit();

      // Strategy 2: Use Google Geocoding API for precise results
      try {
        console.log('🌐 Using Google Geocoding API...');
        const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address: `${location}, USA`,
            key: this.apiKey
          },
          timeout: 10000
        });

        if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
          const result = geocodeResponse.data.results[0];
          const coordinates = {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          };
          console.log(`✅ Found coordinates via Geocoding API: ${coordinates.lat}, ${coordinates.lng}`);
          return coordinates;
        }
      } catch (error) {
        console.warn('⚠️ Geocoding API failed:', error.message);
      }

      // Strategy 3: Use Google Places Text Search as fallback
      try {
        console.log('🔍 Using Google Places Text Search as fallback...');
        const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
          params: {
            query: `${location}, USA`,
            key: this.apiKey
          },
          timeout: 10000
        });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const result = response.data.results[0];
          const coordinates = {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          };
          console.log(`✅ Found coordinates via Places Text Search: ${coordinates.lat}, ${coordinates.lng}`);
          return coordinates;
        }
      } catch (error) {
        console.warn('⚠️ Places Text Search failed:', error.message);
      }

      console.error('❌ Could not find coordinates for location:', location);
      return null;
    } catch (error) {
      console.error('❌ Error getting coordinates:', error.message);
      return null;
    }
  }

  // Legacy method for backward compatibility
  async getCoordinates(location) {
    return this.getAccurateCoordinates(location);
  }

  // Get detailed information for a specific business
  async getBusinessDetails(placeId) {
    try {
      await this.checkRateLimit();

      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry,opening_hours,price_level,url',
          key: this.apiKey
        },
        timeout: 10000
      });

      if (response.data.status !== 'OK') {
        console.error(`❌ Error getting business details: ${response.data.status}`);
        return null;
      }

      const place = response.data.result;

      // Enhanced website detection logic
      const hasWebsite = this.detectWebsite(place.website);

      return {
        id: placeId, // Add ID field for compatibility
        google_place_id: placeId,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number || null,
        website: place.website || null,
        rating: place.rating || null,
        reviews_count: place.user_ratings_total || 0,
        category: this.extractCategory(place.types),
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        has_website: hasWebsite,
        website_url: place.website || null,
        detection_method: 'google_places_api',
        confidence_score: hasWebsite ? 1.0 : 0.9,
        opening_hours: place.opening_hours || null,
        price_level: place.price_level || null,
        google_url: place.url || null,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting business details:', error.message);
      return null;
    }
  }

  // Extract the most relevant category from Google Places types
  extractCategory(types) {
    if (!types || types.length === 0) return 'Other';

    const categoryMapping = {
      // Restaurants & Food
      'restaurant': 'Restaurants',
      'food': 'Restaurants',
      'meal_takeaway': 'Restaurants',
      'meal_delivery': 'Restaurants',
      'cafe': 'Restaurants',
      'bakery': 'Restaurants',
      'bar': 'Restaurants',
      'night_club': 'Restaurants',

      // Beauty & Salons
      'beauty_salon': 'Salons',
      'hair_care': 'Salons',
      'spa': 'Salons',
      'nail_salon': 'Salons',
      'barber': 'Salons',

      // Fitness & Gyms
      'gym': 'Gyms',
      'fitness_center': 'Gyms',
      'sports_complex': 'Gyms',
      'swimming_pool': 'Gyms',

      // Medical & Health
      'health': 'Medical',
      'doctor': 'Medical',
      'hospital': 'Medical',
      'dentist': 'Medical',
      'pharmacy': 'Medical',
      'veterinary_care': 'Medical',
      'physiotherapist': 'Medical',

      // Retail & Shopping
      'store': 'Retail',
      'shopping_mall': 'Retail',
      'clothing_store': 'Retail',
      'electronics_store': 'Retail',
      'furniture_store': 'Retail',
      'jewelry_store': 'Retail',
      'shoe_store': 'Retail',

      // Professional Services
      'lawyer': 'Professional Services',
      'accountant': 'Professional Services',
      'insurance_agency': 'Professional Services',
      'real_estate_agency': 'Professional Services',
      'travel_agency': 'Professional Services',

      // Home Services
      'plumber': 'Home Services',
      'electrician': 'Home Services',
      'locksmith': 'Home Services',
      'painter': 'Home Services',
      'roofing_contractor': 'Home Services',
      'hvac_contractor': 'Home Services',
      'landscaper': 'Home Services',
      'cleaning_service': 'Home Services',

      // Automotive
      'car_repair': 'Automotive',
      'gas_station': 'Automotive',
      'car_dealer': 'Automotive',
      'car_wash': 'Automotive',

      // Education
      'school': 'Education',
      'university': 'Education',
      'library': 'Education',

      // Entertainment
      'movie_theater': 'Entertainment',
      'amusement_park': 'Entertainment',
      'bowling_alley': 'Entertainment',
      'casino': 'Entertainment'
    };

    // Check for exact matches first
    for (const type of types) {
      if (categoryMapping[type]) {
        return categoryMapping[type];
      }
    }

    // Check for partial matches
    for (const type of types) {
      for (const [key, category] of Object.entries(categoryMapping)) {
        if (type.includes(key)) {
          return category;
        }
      }
    }

    return 'Other';
  }

  // Detect if a business has a real website (not just social media or third-party listings)
  detectWebsite(website) {
    if (!website) return false;

    // Convert to lowercase for easier checking
    const websiteLower = website.toLowerCase();

    // List of third-party platforms that don't count as real websites
    const thirdPartyPlatforms = [
      'yelp.com',
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'tiktok.com',
      'google.com/maps',
      'maps.google.com',
      'foursquare.com',
      'tripadvisor.com',
      'opentable.com',
      'grubhub.com',
      'doordash.com',
      'ubereats.com',
      'postmates.com',
      'zomato.com',
      'yellowpages.com',
      'whitepages.com',
      'superpages.com',
      'citysearch.com',
      'angieslist.com',
      'thumbtack.com',
      'homeadvisor.com',
      'nextdoor.com',
      'linkedin.com',
      'pinterest.com',
      'snapchat.com',
      'youtube.com',
      'vimeo.com',
      'tumblr.com',
      'reddit.com',
      'wikipedia.org',
      'wikimedia.org',
      'wix.com',
      'squarespace.com',
      'weebly.com',
      'wordpress.com',
      'blogspot.com',
      'medium.com',
      'substack.com',
      'patreon.com',
      'gofundme.com',
      'kickstarter.com',
      'indiegogo.com',
      'amazon.com',
      'ebay.com',
      'etsy.com',
      'shopify.com',
      'bigcommerce.com',
      'woocommerce.com',
      'magento.com',
      'prestashop.com',
      'opencart.com',
      'oscommerce.com',
      'zen-cart.com',
      'cubecart.com',
      'x-cart.com',
      'volusion.com',
      '3dcart.com',
      'bigcartel.com',
      'ecwid.com',
      'squarespace.com',
      'wix.com',
      'weebly.com',
      'webflow.com',
      'carrd.co',
      'strikingly.com',
      'tilda.cc',
      'mobirise.com',
      'bootstrap.com',
      'foundation.com',
      'bulma.io',
      'tailwindcss.com',
      'getbootstrap.com',
      'semantic-ui.com',
      'material-ui.com',
      'ant.design',
      'chakra-ui.com',
      'mantine.dev',
      'nextui.org',
      'radix-ui.com',
      'headlessui.dev',
      'reach-ui.dev',
      'ariakit.org',
      'react-spectrum.adobe.com',
      'atlaskit.atlassian.com',
      'carbon-design-system.com',
      'lightningdesignsystem.com',
      'polaris.shopify.com',
      'gestalt.pinterest.com',
      'baseweb.design',
      'backpack-ui.com',
      'orbit.kiwi',
      'eds.equinor.com',
      'design-system.w3.org',
      'designsystem.digital.gov',
      'designsystem.gov.au',
      'designsystem.gov.sg',
      'designsystem.gov.uk',
      'designsystem.gov.ca',
      'designsystem.gov.nz',
      'designsystem.gov.ie',
      'designsystem.gov.no',
      'designsystem.gov.se',
      'designsystem.gov.dk',
      'designsystem.gov.fi',
      'designsystem.gov.nl',
      'designsystem.gov.de',
      'designsystem.gov.fr',
      'designsystem.gov.it',
      'designsystem.gov.es',
      'designsystem.gov.pt',
      'designsystem.gov.gr',
      'designsystem.gov.pl',
      'designsystem.gov.cz',
      'designsystem.gov.hu',
      'designsystem.gov.ro',
      'designsystem.gov.bg',
      'designsystem.gov.hr',
      'designsystem.gov.si',
      'designsystem.gov.sk',
      'designsystem.gov.lt',
      'designsystem.gov.lv',
      'designsystem.gov.ee',
      'designsystem.gov.il',
      'designsystem.gov.ae',
      'designsystem.gov.sa',
      'designsystem.gov.qa',
      'designsystem.gov.kw',
      'designsystem.gov.bh',
      'designsystem.gov.om',
      'designsystem.gov.jo',
      'designsystem.gov.lb',
      'designsystem.gov.eg',
      'designsystem.gov.ma',
      'designsystem.gov.tn',
      'designsystem.gov.dz',
      'designsystem.gov.ly',
      'designsystem.gov.sd',
      'designsystem.gov.et',
      'designsystem.gov.ke',
      'designsystem.gov.ng',
      'designsystem.gov.gh',
      'designsystem.gov.ci',
      'designsystem.gov.sn',
      'designsystem.gov.ml',
      'designsystem.gov.bf',
      'designsystem.gov.ne',
      'designsystem.gov.td',
      'designsystem.gov.cm',
      'designsystem.gov.cf',
      'designsystem.gov.cg',
      'designsystem.gov.cd',
      'designsystem.gov.ga',
      'designsystem.gov.gq',
      'designsystem.gov.st',
      'designsystem.gov.ao',
      'designsystem.gov.zm',
      'designsystem.gov.zw',
      'designsystem.gov.bw',
      'designsystem.gov.na',
      'designsystem.gov.sz',
      'designsystem.gov.ls',
      'designsystem.gov.mg',
      'designsystem.gov.mu',
      'designsystem.gov.sc',
      'designsystem.gov.km',
      'designsystem.gov.dj',
      'designsystem.gov.so',
      'designsystem.gov.er',
      'designsystem.gov.ss',
      'designsystem.gov.rw',
      'designsystem.gov.bi',
      'designsystem.gov.tz',
      'designsystem.gov.ug',
      'designsystem.gov.mz',
      'designsystem.gov.mw'
    ];

    // Check if the website is a third-party platform
    for (const platform of thirdPartyPlatforms) {
      if (websiteLower.includes(platform)) {
        return false; // This is not a real business website
      }
    }

    // Check if it's a valid website format
    const validWebsitePattern = /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;

    if (!validWebsitePattern.test(website)) {
      return false; // Invalid website format
    }

    return true; // This appears to be a real business website
  }

  // Get city suggestions for autocomplete - uses only real US locations data
  async getCitySuggestions(query, country = null) {
    try {
      // Always use US locations service for consistent US city/zipcode data
      console.log('Using US locations service for city suggestions');
      return await usLocationsService.getCitySuggestions(query, country);
    } catch (error) {
      console.error('Error getting city suggestions:', error.message);
      // Return empty array if US service fails - no mock data fallback
      return [];
    }
  }

  // Legacy geocode method - now uses getAccurateCoordinates
  async geocodeLocation(location) {
    return this.getAccurateCoordinates(location);
  }
}

module.exports = new GooglePlacesService(); 