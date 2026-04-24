const axios = require('axios');
const googlePlacesService = require('./googlePlacesService');
const usLocationsService = require('./usLocationsService');

/**
 * Tile-based crawling service for comprehensive business data collection
 * 
 * This service implements systematic city coverage by:
 * 1. Breaking cities into geo-tiles (1km² squares)
 * 2. Crawling each tile with all business categories
 * 3. Paginating through all results
 * 4. Merging and deduplicating data
 * 5. Tracking coverage and deltas
 */

class TileCrawlerService {
  constructor() {
    this.tileSize = 1000; // 1km radius for each tile
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second between retries
    this.crawlStats = {
      tilesProcessed: 0,
      businessesFound: 0,
      categoriesSearched: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Generate geo-tiles for a city using a grid-based approach
   * @param {string} cityName - Name of the city to tile
   * @param {number} tileSizeKm - Size of each tile in kilometers
   * @returns {Array} Array of tile objects with center coordinates
   */
  async generateCityTiles(cityName, tileSizeKm = 1) {
    try {
      console.log(`🗺️ Generating tiles for ${cityName}...`);
      
      // Get city boundaries from US locations service
      const cityData = await usLocationsService.getCoordinates(cityName);
      if (!cityData) {
        throw new Error(`Could not find coordinates for ${cityName}`);
      }

      const { lat: centerLat, lng: centerLng } = cityData;
      
      // Calculate approximate city bounds (this is a simplified approach)
      // In production, you'd want to use actual city boundary data
      const cityRadius = this.getCityRadius(cityName);
      const latRange = cityRadius / 111; // Rough conversion: 1 degree ≈ 111km
      const lngRange = cityRadius / (111 * Math.cos(centerLat * Math.PI / 180));
      
      const tiles = [];
      const tileSizeDegrees = tileSizeKm / 111;
      
      // Generate grid of tiles
      for (let lat = centerLat - latRange; lat < centerLat + latRange; lat += tileSizeDegrees) {
        for (let lng = centerLng - lngRange; lng < centerLng + lngRange; lng += tileSizeDegrees) {
          tiles.push({
            id: `tile_${lat.toFixed(4)}_${lng.toFixed(4)}`,
            center: { lat: lat + tileSizeDegrees/2, lng: lng + tileSizeDegrees/2 },
            bounds: {
              north: lat + tileSizeDegrees,
              south: lat,
              east: lng + tileSizeDegrees,
              west: lng
            },
            city: cityName,
            size: tileSizeKm
          });
        }
      }
      
      console.log(`✅ Generated ${tiles.length} tiles for ${cityName}`);
      return tiles;
      
    } catch (error) {
      console.error(`❌ Error generating tiles for ${cityName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get approximate city radius based on city size
   * @param {string} cityName - Name of the city
   * @returns {number} Radius in kilometers
   */
  getCityRadius(cityName) {
    const citySizes = {
      'new york': 25,
      'los angeles': 30,
      'chicago': 20,
      'houston': 25,
      'phoenix': 20,
      'philadelphia': 15,
      'san antonio': 20,
      'san diego': 15,
      'dallas': 20,
      'san jose': 15,
      'austin': 15,
      'jacksonville': 20,
      'fort worth': 15,
      'columbus': 15,
      'charlotte': 15,
      'san francisco': 10,
      'indianapolis': 15,
      'seattle': 15,
      'denver': 15,
      'washington': 15,
      'boston': 10,
      'el paso': 15,
      'nashville': 15,
      'detroit': 15,
      'oklahoma city': 15,
      'portland': 15,
      'las vegas': 15,
      'memphis': 15,
      'louisville': 15,
      'baltimore': 15,
      'milwaukee': 15,
      'albuquerque': 15,
      'tucson': 15,
      'fresno': 15,
      'sacramento': 15,
      'mesa': 15,
      'kansas city': 15,
      'atlanta': 15,
      'long beach': 10,
      'colorado springs': 15,
      'raleigh': 15,
      'miami': 15,
      'virginia beach': 15,
      'omaha': 15,
      'oakland': 10,
      'minneapolis': 15,
      'tulsa': 15,
      'arlington': 15,
      'tampa': 15,
      'new orleans': 15
    };
    
    const cityKey = cityName.toLowerCase();
    return citySizes[cityKey] || 10; // Default 10km radius
  }

  /**
   * Comprehensive category taxonomy for systematic business discovery
   * Based on Google Places API types and common business categories
   */
  getBusinessCategories() {
    return {
      // Food & Dining
      'restaurant': ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'],
      'cafe': ['cafe', 'coffee_shop', 'bakery'],
      'bar': ['bar', 'night_club', 'liquor_store'],
      'fast_food': ['fast_food_restaurant', 'food_court'],
      
      // Health & Beauty
      'salon': ['hair_care', 'beauty_salon', 'spa'],
      'barber': ['hair_care', 'barber_shop'],
      'nail_salon': ['beauty_salon', 'nail_salon'],
      'massage': ['spa', 'massage_therapist'],
      'medical': ['hospital', 'doctor', 'dentist', 'pharmacy', 'veterinary_care'],
      
      // Fitness & Recreation
      'gym': ['gym', 'fitness_center', 'sports_club'],
      'yoga': ['yoga_studio', 'pilates_studio'],
      'martial_arts': ['martial_arts_school'],
      'swimming': ['swimming_pool'],
      
      // Retail & Shopping
      'clothing': ['clothing_store', 'shoe_store', 'jewelry_store'],
      'electronics': ['electronics_store', 'mobile_phone_shop'],
      'furniture': ['furniture_store', 'home_goods_store'],
      'grocery': ['grocery_or_supermarket', 'convenience_store'],
      'pharmacy': ['pharmacy', 'drugstore'],
      
      // Automotive
      'auto_repair': ['car_repair', 'auto_parts_store'],
      'gas_station': ['gas_station'],
      'car_wash': ['car_wash'],
      'auto_dealer': ['car_dealer', 'motorcycle_dealer'],
      
      // Professional Services
      'lawyer': ['lawyer', 'legal_services'],
      'accountant': ['accountant', 'tax_advisor'],
      'real_estate': ['real_estate_agency'],
      'insurance': ['insurance_agency'],
      'bank': ['bank', 'atm', 'credit_union'],
      
      // Home Services
      'plumber': ['plumber'],
      'electrician': ['electrician'],
      'hvac': ['hvac_contractor'],
      'landscaping': ['landscaper', 'lawn_care_service'],
      'cleaning': ['cleaning_service'],
      'locksmith': ['locksmith'],
      
      // Education & Childcare
      'school': ['school', 'university', 'college'],
      'daycare': ['child_care_agency', 'preschool'],
      'tutoring': ['tutoring_service'],
      
      // Entertainment & Recreation
      'movie_theater': ['movie_theater'],
      'bowling': ['bowling_alley'],
      'arcade': ['amusement_center'],
      'library': ['library'],
      'museum': ['museum'],
      'park': ['park'],
      
      // Travel & Lodging
      'hotel': ['lodging', 'hotel'],
      'travel_agency': ['travel_agency'],
      'car_rental': ['car_rental_agency'],
      
      // Religious
      'church': ['church', 'place_of_worship'],
      'mosque': ['mosque'],
      'synagogue': ['synagogue'],
      'temple': ['hindu_temple', 'buddhist_temple'],
      
      // Government & Public
      'post_office': ['post_office'],
      'courthouse': ['courthouse'],
      'police': ['police'],
      'fire_station': ['fire_station'],
      
      // Other Services
      'laundromat': ['laundry'],
      'dry_cleaning': ['dry_cleaning_service'],
      'storage': ['storage'],
      'funeral_home': ['funeral_home'],
      'pet_grooming': ['pet_grooming_service'],
      'tattoo_parlor': ['tattoo_parlor'],
      'pawn_shop': ['pawn_shop'],
      'thrift_store': ['thrift_store']
    };
  }

  /**
   * Crawl a single tile for all business categories
   * @param {Object} tile - Tile object with center coordinates
   * @param {Array} categories - Array of category names to search
   * @returns {Array} Array of businesses found in this tile
   */
  async crawlTile(tile, categories = null) {
    try {
      console.log(`🔍 Crawling tile ${tile.id} (${tile.center.lat.toFixed(4)}, ${tile.center.lng.toFixed(4)})`);
      
      const allBusinesses = [];
      const categoryMap = this.getBusinessCategories();
      const searchCategories = categories || Object.keys(categoryMap);
      
      for (const categoryName of searchCategories) {
        const googleTypes = categoryMap[categoryName];
        if (!googleTypes) continue;
        
        console.log(`  📂 Searching category: ${categoryName}`);
        
        for (const googleType of googleTypes) {
          try {
            // Search for businesses of this type in this tile
            const businesses = await this.searchTileForType(tile, googleType, categoryName);
            allBusinesses.push(...businesses);
            
            this.crawlStats.categoriesSearched++;
            
            // Add delay to respect rate limits
            await this.delay(100);
            
          } catch (error) {
            console.error(`    ❌ Error searching ${googleType} in tile ${tile.id}:`, error.message);
            this.crawlStats.errors++;
          }
        }
      }
      
      // Deduplicate businesses within this tile
      const uniqueBusinesses = this.deduplicateBusinesses(allBusinesses);
      
      console.log(`  ✅ Found ${uniqueBusinesses.length} unique businesses in tile ${tile.id}`);
      this.crawlStats.tilesProcessed++;
      this.crawlStats.businessesFound += uniqueBusinesses.length;
      
      return uniqueBusinesses;
      
    } catch (error) {
      console.error(`❌ Error crawling tile ${tile.id}:`, error.message);
      this.crawlStats.errors++;
      return [];
    }
  }

  /**
   * Search a specific tile for a specific business type
   * @param {Object} tile - Tile object
   * @param {string} googleType - Google Places API type
   * @param {string} categoryName - Human-readable category name
   * @returns {Array} Array of businesses found
   */
  async searchTileForType(tile, googleType, categoryName) {
    const businesses = [];
    let nextPageToken = null;
    let pageCount = 0;
    const maxPages = 3; // Google Places API limit
    
    do {
      try {
        pageCount++;
        console.log(`    🔍 Page ${pageCount} for ${googleType}`);
        
        const response = await googlePlacesService.nearbySearch(
          tile.center,
          this.tileSize,
          googleType
        );
        
        if (response && response.results) {
          // Process each business result
          for (const place of response.results) {
            const business = await this.processBusinessResult(place, categoryName, tile);
            if (business) {
              businesses.push(business);
            }
          }
          
          // Check for next page
          nextPageToken = response.next_page_token;
          if (nextPageToken) {
            // Google requires a delay before using next_page_token
            await this.delay(2000);
          }
        }
        
      } catch (error) {
        console.error(`    ❌ Error on page ${pageCount} for ${googleType}:`, error.message);
        break;
      }
      
    } while (nextPageToken && pageCount < maxPages);
    
    return businesses;
  }

  /**
   * Process a single business result from Google Places API
   * @param {Object} place - Google Places API result
   * @param {string} categoryName - Business category
   * @param {Object} tile - Source tile
   * @returns {Object} Processed business object
   */
  async processBusinessResult(place, categoryName, tile) {
    try {
      // Get detailed business information
      const details = await googlePlacesService.getBusinessDetails(place.place_id);
      if (!details) return null;
      
      return {
        id: place.place_id,
        google_place_id: place.place_id,
        name: details.name || place.name,
        address: details.address || place.vicinity,
        phone: details.phone,
        website: details.website,
        rating: details.rating || place.rating,
        reviews_count: details.reviews_count || place.user_ratings_total || 0,
        category: categoryName,
        latitude: details.latitude || place.geometry.location.lat,
        longitude: details.longitude || place.geometry.location.lng,
        location: {
          lat: details.latitude || place.geometry.location.lat,
          lng: details.longitude || place.geometry.location.lng
        },
        has_website: !!details.website,
        website_url: details.website,
        detection_method: 'tile_crawl',
        confidence_score: 0.95,
        source_tile: tile.id,
        source_city: tile.city,
        last_updated: new Date().toISOString(),
        opening_hours: details.opening_hours,
        price_level: details.price_level,
        types: place.types || []
      };
      
    } catch (error) {
      console.error(`❌ Error processing business ${place.place_id}:`, error.message);
      return null;
    }
  }

  /**
   * Deduplicate businesses based on place_id
   * @param {Array} businesses - Array of business objects
   * @returns {Array} Deduplicated array
   */
  deduplicateBusinesses(businesses) {
    const seen = new Set();
    return businesses.filter(business => {
      if (seen.has(business.google_place_id)) {
        return false;
      }
      seen.add(business.google_place_id);
      return true;
    });
  }

  /**
   * Crawl an entire city systematically
   * @param {string} cityName - Name of the city to crawl
   * @param {Array} categories - Optional array of specific categories to crawl
   * @returns {Object} Crawl results and statistics
   */
  async crawlCity(cityName, categories = null) {
    try {
      console.log(`🚀 Starting comprehensive crawl of ${cityName}...`);
      this.crawlStats.startTime = new Date();
      this.crawlStats.tilesProcessed = 0;
      this.crawlStats.businessesFound = 0;
      this.crawlStats.categoriesSearched = 0;
      this.crawlStats.errors = 0;
      
      // Generate tiles for the city
      const tiles = await this.generateCityTiles(cityName);
      console.log(`📊 Will crawl ${tiles.length} tiles`);
      
      const allBusinesses = [];
      const failedTiles = [];
      
      // Crawl each tile
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        console.log(`\n📍 Processing tile ${i + 1}/${tiles.length}: ${tile.id}`);
        
        try {
          const tileBusinesses = await this.crawlTile(tile, categories);
          allBusinesses.push(...tileBusinesses);
          
          // Progress update
          if ((i + 1) % 10 === 0) {
            console.log(`\n📈 Progress: ${i + 1}/${tiles.length} tiles, ${allBusinesses.length} businesses found`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to crawl tile ${tile.id}:`, error.message);
          failedTiles.push(tile);
        }
        
        // Add delay between tiles to respect rate limits
        await this.delay(500);
      }
      
      // Final deduplication across all tiles
      const uniqueBusinesses = this.deduplicateBusinesses(allBusinesses);
      
      this.crawlStats.endTime = new Date();
      const duration = this.crawlStats.endTime - this.crawlStats.startTime;
      
      const results = {
        city: cityName,
        totalTiles: tiles.length,
        successfulTiles: tiles.length - failedTiles.length,
        failedTiles: failedTiles.length,
        totalBusinesses: uniqueBusinesses.length,
        businesses: uniqueBusinesses,
        stats: this.crawlStats,
        duration: duration,
        durationFormatted: this.formatDuration(duration)
      };
      
      console.log(`\n🎉 Crawl completed for ${cityName}!`);
      console.log(`📊 Results:`);
      console.log(`   Tiles processed: ${results.successfulTiles}/${results.totalTiles}`);
      console.log(`   Businesses found: ${results.totalBusinesses}`);
      console.log(`   Categories searched: ${this.crawlStats.categoriesSearched}`);
      console.log(`   Errors: ${this.crawlStats.errors}`);
      console.log(`   Duration: ${results.durationFormatted}`);
      
      return results;
      
    } catch (error) {
      console.error(`❌ Error crawling city ${cityName}:`, error.message);
      throw error;
    }
  }

  /**
   * Format duration in human-readable format
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Utility function to add delays
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new TileCrawlerService();
