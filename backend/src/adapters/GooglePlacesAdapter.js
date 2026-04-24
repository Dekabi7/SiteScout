const axios = require('axios');
require('dotenv').config();

class GooglePlacesAdapter {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || 'test_key';
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    this.rateLimit = {
      requests: 0,
      lastReset: Date.now(),
      maxRequests: 50,
      resetInterval: 60000 // 1 minute
    };
  }

  // Generate geo tiles around real geocoded center (no hardcoded bounds)
  generateTilesAround(coordinates, city, state, tileSize = 0.01, gridRadius = 10) {
    const tiles = [];
    const { lat: centerLat, lng: centerLng } = coordinates;

    for (let i = -gridRadius; i <= gridRadius; i++) {
      for (let j = -gridRadius; j <= gridRadius; j++) {
        const lat = centerLat + i * tileSize;
        const lng = centerLng + j * tileSize;
        tiles.push({
          id: `tile_${city}_${state}_${lat.toFixed(4)}_${lng.toFixed(4)}`,
          center: { lat, lng }
        });
      }
    }
    return tiles;
  }

  // Search businesses in a specific tile with pagination
  async searchTile(tile, category, pageToken = null) {
    try {
      await this.checkRateLimit();
      
      const params = {
        location: `${tile.center.lat},${tile.center.lng}`,
        radius: 5000, // 5km radius for each tile
        type: 'establishment',
        key: this.apiKey
      };

      if (category) {
        params.keyword = category;
      }

      if (pageToken) {
        params.pagetoken = pageToken;
      }

      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
        params,
        timeout: 10000
      });

      if (response.data.status === 'OVER_QUERY_LIMIT') {
        throw new Error('Rate limit exceeded');
      }

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.warn(`Tile search error: ${response.data.status}`);
        return { businesses: [], nextPageToken: null };
      }

      return {
        businesses: response.data.results || [],
        nextPageToken: response.data.next_page_token || null
      };

    } catch (error) {
      console.error('Error searching tile:', error.message);
      throw error;
    }
  }

  // Search all tiles for a city with pagination
  async searchCity(city, state, categories = [], maxResultsPerCategory = 100) {
    const results = [];
    // Use Google geocoding to get real center
    const geocode = await this.geocodeCityCenter(city, state);
    if (!geocode) return results;
    const tiles = this.generateTilesAround(geocode, city, state);
    console.log(`🔍 Generated ${tiles.length} tiles for ${city}, ${state}`);
    
    for (const category of categories) {
      console.log(`📊 Searching category: ${category}`);
      let categoryResults = [];
      
      for (const tile of tiles) {
        try {
          let pageToken = null;
          let pageCount = 0;
          const maxPages = 3; // Limit pages per tile to avoid rate limits
          
          do {
            const tileResult = await this.searchTile(tile, category, pageToken);
            categoryResults.push(...tileResult.businesses);
            pageToken = tileResult.nextPageToken;
            pageCount++;
            
            // Small delay between pages
            if (pageToken && pageCount < maxPages) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } while (pageToken && pageCount < maxPages);
          
          // Limit results per category
          if (categoryResults.length >= maxResultsPerCategory) {
            categoryResults = categoryResults.slice(0, maxResultsPerCategory);
            break;
          }
          
        } catch (error) {
          console.error(`Error searching tile ${tile.id} for category ${category}:`, error.message);
          // Continue with next tile
        }
      }
      
      // Remove duplicates within category
      const uniqueResults = this.removeDuplicates(categoryResults);
      results.push(...uniqueResults);
      
      console.log(`✅ Found ${uniqueResults.length} unique businesses for ${category}`);
    }
    
    // Remove duplicates across all categories
    const finalResults = this.removeDuplicates(results);
    console.log(`📈 Total unique businesses found: ${finalResults.length}`);
    
    return finalResults;
  }

  async geocodeCityCenter(city, state) {
    try {
      const address = state ? `${city}, ${state}, USA` : `${city}, USA`;
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: this.apiKey
        },
        timeout: 10000
      });
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].geometry.location;
      }
      return null;
    } catch (e) {
      console.error('Error geocoding city center:', e.message);
      return null;
    }
  }

  // Remove duplicate businesses based on place_id
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

  // Check rate limiting
  async checkRateLimit() {
    const now = Date.now();
    if (now - this.rateLimit.lastReset > this.rateLimit.resetInterval) {
      this.rateLimit.requests = 0;
      this.rateLimit.lastReset = now;
    }
    
    if (this.rateLimit.requests >= this.rateLimit.maxRequests) {
      const waitTime = this.rateLimit.resetInterval - (now - this.rateLimit.lastReset);
      if (waitTime > 0) {
        console.log(`⏳ Rate limit exceeded, waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.rateLimit.requests = 0;
        this.rateLimit.lastReset = Date.now();
      }
    }
    
    this.rateLimit.requests++;
  }

  // Get detailed information for a business
  async getBusinessDetails(placeId) {
    try {
      await this.checkRateLimit();
      
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry',
          key: this.apiKey
        },
        timeout: 10000
      });

      if (response.data.status !== 'OK') {
        console.error(`Error getting business details: ${response.data.status}`);
        return null;
      }

      const place = response.data.result;
      
      return {
        google_place_id: placeId,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number || null,
        website: place.website || null,
        rating: place.rating || null,
        reviews_count: place.user_ratings_total || 0,
        category: this.extractCategory(place.types),
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        }
      };
    } catch (error) {
      console.error('Error getting business details:', error.message);
      return null;
    }
  }

  // Extract category from Google Places types
  extractCategory(types) {
    if (!types || types.length === 0) return 'Other';
    
    const categoryMapping = {
      'restaurant': 'Restaurants',
      'food': 'Restaurants',
      'beauty_salon': 'Salons',
      'hair_care': 'Salons',
      'gym': 'Gyms',
      'health': 'Medical',
      'doctor': 'Medical',
      'store': 'Retail',
      'shopping': 'Retail'
    };

    for (const type of types) {
      for (const [key, category] of Object.entries(categoryMapping)) {
        if (type.includes(key)) {
          return category;
        }
      }
    }

    return 'Other';
  }

  // Removed mock data generation
}

module.exports = GooglePlacesAdapter;


