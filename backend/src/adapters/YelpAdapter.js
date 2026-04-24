const axios = require('axios');
require('dotenv').config();

class YelpAdapter {
  constructor() {
    this.apiKey = process.env.YELP_API_KEY || 'test_key';
    this.baseUrl = 'https://api.yelp.com/v3';
    this.rateLimit = {
      requests: 0,
      lastReset: Date.now(),
      maxRequests: 100,
      resetInterval: 60000 // 1 minute
    };
  }

  // Search businesses in a specific area
  async searchArea(location, categories = [], limit = 50) {
    try {
      await this.checkRateLimit();
      
      const results = [];
      
      for (const category of categories) {
        const params = {
          location: location,
          categories: this.mapCategoryToYelp(category),
          limit: Math.min(limit, 50), // Yelp max is 50 per request
          sort_by: 'best_match'
        };

        const response = await axios.get(`${this.baseUrl}/businesses/search`, {
          params,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 10000
        });

        if (response.data.businesses) {
          results.push(...response.data.businesses);
        }
        
        // Small delay between category requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return this.normalizeResults(results);
      
    } catch (error) {
      console.error('Error searching Yelp:', error.message);
      return this.getMockData(location, categories);
    }
  }

  // Map our categories to Yelp categories
  mapCategoryToYelp(category) {
    const categoryMapping = {
      'Restaurants': 'restaurants',
      'Salons': 'beautysvc',
      'Gyms': 'fitness',
      'Medical': 'health',
      'Retail': 'shopping',
      'Dentists': 'dentists',
      'Lawyers': 'attorneys',
      'Plumbers': 'plumbing',
      'Electricians': 'electricians',
      'Landscaping': 'landscaping',
      'Auto Repair': 'autorepair',
      'Real Estate': 'realestate',
      'Construction': 'contractors',
      'Cleaning Services': 'homeservices',
      'Pet Services': 'petservices'
    };
    
    return categoryMapping[category] || 'restaurants';
  }

  // Normalize Yelp results to match our format
  normalizeResults(businesses) {
    return businesses.map(business => ({
      place_id: `yelp_${business.id}`,
      name: business.name,
      formatted_address: business.location.address1 || business.location.display_address?.join(', ') || '',
      rating: business.rating,
      user_ratings_total: business.review_count,
      types: business.categories?.map(cat => cat.alias) || [],
      geometry: {
        location: {
          lat: business.coordinates.latitude,
          lng: business.coordinates.longitude
        }
      },
      website: business.url,
      phone: business.display_phone,
      source: 'yelp'
    }));
  }

  // Mock data for testing
  getMockData(location, categories) {
    const mockBusinesses = [];
    
    categories.forEach((category, categoryIndex) => {
      for (let i = 0; i < 15; i++) {
        mockBusinesses.push({
          place_id: `yelp_mock_${category}_${i}`,
          name: `Yelp ${category} Business ${i + 1}`,
          formatted_address: `${200 + i * 10} Oak St, ${location}`,
          rating: 3.5 + (i % 4) * 0.3,
          user_ratings_total: 15 + (i * 7) % 150,
          types: [category.toLowerCase()],
          geometry: {
            location: {
              lat: 39.7392 + (i * 0.002),
              lng: -104.9903 + (i * 0.002)
            }
          },
          source: 'yelp_mock'
        });
      }
    });
    
    return mockBusinesses;
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
        console.log(`⏳ Yelp rate limit exceeded, waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.rateLimit.requests = 0;
        this.rateLimit.lastReset = Date.now();
      }
    }
    
    this.rateLimit.requests++;
  }
}

module.exports = YelpAdapter;


