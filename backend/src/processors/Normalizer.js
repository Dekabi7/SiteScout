const axios = require('axios');
require('dotenv').config();

class Normalizer {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY || 'test_key';
    this.geocodingCache = new Map();
  }

  // Normalize a business object
  async normalize(business) {
    try {
      const normalized = {
        ...business,
        name: this.normalizeName(business.name),
        phone: this.normalizePhone(business.phone || business.formatted_phone_number),
        address: await this.normalizeAddress(business.address || business.formatted_address),
        category: this.normalizeCategory(business.category || business.types?.[0]),
        source: business.source || 'google_places'
      };

      // Add geocoding if coordinates are missing or inaccurate
      if (!normalized.location || this.needsGeocoding(normalized)) {
        const geocoded = await this.geocodeAddress(normalized.address);
        if (geocoded) {
          normalized.location = geocoded.location;
          normalized.geocoded = true;
        }
      }

      return normalized;
    } catch (error) {
      console.error('Error normalizing business:', error.message);
      return business; // Return original if normalization fails
    }
  }

  // Normalize business name
  normalizeName(name) {
    if (!name) return '';
    
    return name
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\-&'.,]/g, '') // Remove special characters except common business ones
      .substring(0, 100); // Limit length
  }

  // Normalize phone number
  normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone; // Return original if can't normalize
  }

  // Normalize address
  async normalizeAddress(address) {
    if (!address) return '';
    
    let normalized = address
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/,+/, ',') // Replace multiple commas with single comma
      .replace(/\s*,\s*/g, ', '); // Normalize comma spacing
    
    // Try to geocode for better address formatting
    const geocoded = await this.geocodeAddress(normalized);
    if (geocoded && geocoded.formatted_address) {
      return geocoded.formatted_address;
    }
    
    return normalized;
  }

  // Normalize category
  normalizeCategory(category) {
    if (!category) return 'Other';
    
    const categoryMapping = {
      'restaurant': 'Restaurants',
      'food': 'Restaurants',
      'beauty_salon': 'Salons',
      'hair_care': 'Salons',
      'gym': 'Gyms',
      'fitness': 'Gyms',
      'health': 'Medical',
      'doctor': 'Medical',
      'dentist': 'Dentists',
      'lawyer': 'Lawyers',
      'attorney': 'Lawyers',
      'plumber': 'Plumbers',
      'electrician': 'Electricians',
      'landscaping': 'Landscaping',
      'auto_repair': 'Auto Repair',
      'real_estate': 'Real Estate',
      'construction': 'Construction',
      'contractor': 'Construction',
      'cleaning': 'Cleaning Services',
      'pet': 'Pet Services'
    };
    
    const normalized = category.toLowerCase().replace(/[^a-z]/g, '');
    return categoryMapping[normalized] || 'Other';
  }

  // Check if business needs geocoding
  needsGeocoding(business) {
    if (!business.location) return true;
    
    const { lat, lng } = business.location;
    
    // Check if coordinates are valid
    if (!lat || !lng || lat === 0 || lng === 0) return true;
    
    // Check if coordinates are within reasonable bounds
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return true;
    
    return false;
  }

  // Geocode an address using Google Geocoding API
  async geocodeAddress(address) {
    if (!address) return null;
    
    // Check cache first
    const cacheKey = address.toLowerCase().trim();
    if (this.geocodingCache.has(cacheKey)) {
      return this.geocodingCache.get(cacheKey);
    }
    
    try {
      // If no API key, return mock data
      if (!this.googleApiKey || this.googleApiKey === 'test_key') {
        const mockResult = this.getMockGeocode(address);
        this.geocodingCache.set(cacheKey, mockResult);
        return mockResult;
      }
      
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: address,
          key: this.googleApiKey
        },
        timeout: 5000
      });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const geocoded = {
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          formatted_address: result.formatted_address,
          address_components: result.address_components
        };
        
        // Cache the result
        this.geocodingCache.set(cacheKey, geocoded);
        return geocoded;
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error.message);
      return null;
    }
  }

  // Get mock geocoding data for testing
  getMockGeocode(address) {
    // Simple mock based on address content
    const mockLocations = {
      'denver': { lat: 39.7392, lng: -104.9903, formatted_address: 'Denver, CO, USA' },
      'austin': { lat: 30.2672, lng: -97.7431, formatted_address: 'Austin, TX, USA' },
      'new york': { lat: 40.7128, lng: -74.0060, formatted_address: 'New York, NY, USA' },
      'los angeles': { lat: 34.0522, lng: -118.2437, formatted_address: 'Los Angeles, CA, USA' },
      'chicago': { lat: 41.8781, lng: -87.6298, formatted_address: 'Chicago, IL, USA' }
    };
    
    const addressLower = address.toLowerCase();
    for (const [city, coords] of Object.entries(mockLocations)) {
      if (addressLower.includes(city)) {
        return {
          location: coords,
          formatted_address: coords.formatted_address,
          address_components: []
        };
      }
    }
    
    // Default mock location
    return {
      location: { lat: 39.7392, lng: -104.9903 },
      formatted_address: address,
      address_components: []
    };
  }

  // Batch normalize multiple businesses
  async normalizeBatch(businesses) {
    const normalized = [];
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      const batchPromises = batch.map(business => this.normalize(business));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        normalized.push(...batchResults);
      } catch (error) {
        console.error(`Error normalizing batch ${i}-${i + batchSize}:`, error.message);
        // Add original businesses if normalization fails
        normalized.push(...batch);
      }
      
      // Small delay between batches
      if (i + batchSize < businesses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return normalized;
  }
}

module.exports = Normalizer;


