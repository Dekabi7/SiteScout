const express = require('express');
const router = express.Router();
const GooglePlacesAdapter = require('../adapters/GooglePlacesAdapter');
const YelpAdapter = require('../adapters/YelpAdapter');
const Normalizer = require('../processors/Normalizer');
const Deduper = require('../processors/Deduper');
const UrlVerifier = require('../processors/UrlVerifier');
const PresenceScorer = require('../processors/PresenceScorer');
const RepositoryFactory = require('../repositories/RepositoryFactory');
const googlePlacesService = require('../services/googlePlacesService');

// Initialize processors
const googlePlacesAdapter = new GooglePlacesAdapter();
const yelpAdapter = new YelpAdapter();
const normalizer = new Normalizer();
const deduper = new Deduper();
const urlVerifier = new UrlVerifier();
const presenceScorer = new PresenceScorer();

// Initialize repository
let repository = null;
RepositoryFactory.initializeRepository()
  .then(repo => {
    repository = repo;
    console.log('✅ Repository initialized');
  })
  .catch(error => {
    console.error('❌ Failed to initialize repository:', error.message);
  });

// Autocomplete cities endpoint
router.get('/autocomplete', async (req, res) => {
  try {
    const { query, country } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = await googlePlacesService.getCitySuggestions(query, country);
    res.json({ success: true, suggestions });

  } catch (error) {
    console.error('Error in city autocomplete:', error);
    res.status(500).json({
      error: 'Failed to get city suggestions',
      message: error.message
    });
  }
});

// Search for businesses by location and filters
router.post('/search', async (req, res) => {
  try {
    const { location, categories, category, radius = 5000, minRating = 0 } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required',
        message: 'Please provide a valid location to search for businesses'
      });
    }

    console.log(`🔍 Starting business search for: ${location} (categories: ${categories || category})`);

    // Get coordinates for the location (this will be done inside the search method)
    // We'll get the geocoded location from the search results

    // Parse location to extract city and state
    const locationParts = location.split(',').map(part => part.trim());
    const city = locationParts[0];
    const state = locationParts[1] || '';

    // Determine categories to search
    const searchCategories = categories || (category ? [category] : ['Restaurants', 'Salons', 'Gyms']);

    // Step 1: Search using optimized Google Places Service
    console.log(`📊 Searching ${searchCategories.length} categories using Google Places Service...`);
    let allBusinesses = [];
    let searchLocationData = null;

    try {
      // Use the optimized service which supports parallel execution and caching
      const result = await googlePlacesService.searchBusinesses(location, searchCategories, radius, minRating);

      if (result && result.businesses) {
        allBusinesses = result.businesses;
        searchLocationData = result.search_location;
        console.log(`✅ Google Places Service found ${allBusinesses.length} businesses`);
      }
    } catch (error) {
      console.error('❌ Google Places search failed:', error.message);
      allBusinesses = [];
    }

    // Step 2: Search using Yelp Adapter as fallback (optional, can be disabled for speed)
    // Only use Yelp if we have very few results
    if (allBusinesses.length < 5) {
      console.log(`📊 Searching using Yelp as fallback...`);
      try {
        const yelpBusinesses = await yelpAdapter.searchArea(location, searchCategories);
        allBusinesses.push(...yelpBusinesses);
        console.log(`✅ Yelp found ${yelpBusinesses.length} additional businesses`);
      } catch (error) {
        console.error('❌ Yelp search failed:', error.message);
      }
    }

    console.log(`📈 Total businesses found: ${allBusinesses.length}`);

    // Step 3: Normalize business data
    console.log(`🔧 Normalizing business data...`);
    const normalizedBusinesses = await normalizer.normalizeBatch(allBusinesses);
    console.log(`✅ Normalized ${normalizedBusinesses.length} businesses`);

    // Step 4: Remove duplicates
    console.log(`🔄 Removing duplicates...`);
    const uniqueBusinesses = deduper.dedupe(normalizedBusinesses);
    console.log(`✅ After deduplication: ${uniqueBusinesses.length} unique businesses`);

    // Step 5: Filter by minimum rating
    const filteredBusinesses = uniqueBusinesses.filter(business =>
      business.rating && business.rating >= minRating
    );
    console.log(`⭐ After rating filter (≥${minRating}): ${filteredBusinesses.length} businesses`);

    // Step 6: Score presence (simplified for now)
    console.log(`🌐 Scoring business presence...`);
    const scoredBusinesses = filteredBusinesses.map(business => {
      const presenceScore = presenceScorer.scoreBusiness(business);
      return {
        ...business,
        has_website: presenceScore.hasWebsite,
        website_url: business.website,
        presence_score: presenceScore,
        last_updated: new Date().toISOString()
      };
    });

    // Step 7: Save to repository
    if (repository) {
      try {
        console.log(`💾 Saving ${scoredBusinesses.length} businesses to repository...`);
        await repository.saveBusinesses(scoredBusinesses);

        // Save search history
        await repository.saveSearchHistory({
          userId: null, // Will be added when auth is implemented
          location,
          city,
          state,
          categories: searchCategories,
          radius,
          minRating,
          resultsCount: scoredBusinesses.length,
          businessesWithoutWebsites: scoredBusinesses.filter(b => !b.has_website).length,
          searchDurationMs: Date.now() - Date.now() // Will be calculated properly
        });
      } catch (error) {
        console.error('❌ Error saving to repository:', error.message);
        // Continue without failing the search
      }
    }

    // Calculate statistics from the results
    const businessesWithWebsites = scoredBusinesses.filter(business => business.has_website);
    const businessesWithoutWebsites = scoredBusinesses.filter(business => !business.has_website);

    const searchStats = {
      total_searched: scoredBusinesses.length,
      with_websites: businessesWithWebsites.length,
      without_websites: businessesWithoutWebsites.length,
      detection_accuracy: scoredBusinesses.length > 0 ?
        (businessesWithoutWebsites.length / scoredBusinesses.length * 100).toFixed(1) : 0,
      average_presence_score: businessesWithoutWebsites.length > 0 ?
        (businessesWithoutWebsites.reduce((sum, b) => sum + b.presence_score.score, 0) / businessesWithoutWebsites.length).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: businessesWithoutWebsites, // Return only businesses without websites (our target audience)
      total: businessesWithoutWebsites.length,
      search_location: searchLocationData || {
        address: location,
        city: city,
        state: state
      },
      search_params: {
        location,
        categories: searchCategories,
        radius,
        minRating
      },
      statistics: searchStats,
      message: businessesWithoutWebsites.length > 0 ?
        `Found ${businessesWithoutWebsites.length} businesses without websites` :
        'No businesses without websites found in this area'
    });

  } catch (error) {
    console.error('❌ Error in business search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search businesses',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get business statistics
router.get('/statistics', async (req, res) => {
  try {
    if (!repository) {
      return res.status(503).json({
        success: false,
        error: 'Repository not initialized',
        message: 'Database connection not available'
      });
    }

    const { city, state, category } = req.query;
    const filters = { city, state, category };

    const stats = await repository.getBusinessStatistics(filters);

    res.json({
      success: true,
      statistics: stats,
      filters: filters
    });

  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

// Get businesses without websites from database
router.get('/businesses/without-websites', async (req, res) => {
  try {
    if (!repository) {
      return res.status(503).json({
        success: false,
        error: 'Repository not initialized',
        message: 'Database connection not available'
      });
    }

    const {
      city,
      state,
      category,
      categories,
      minRating = 0,
      limit = 100,
      offset = 0
    } = req.query;

    const filters = {
      city,
      state,
      category,
      categories: categories ? categories.split(',') : undefined,
      minRating: parseFloat(minRating),
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const businesses = await repository.getBusinessesWithoutWebsites(filters);

    res.json({
      success: true,
      data: businesses,
      total: businesses.length,
      filters: filters
    });

  } catch (error) {
    console.error('Error getting businesses without websites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get businesses',
      message: error.message
    });
  }
});

// Get business details by ID
router.get('/business/:id', async (req, res) => {
  try {
    if (!repository) {
      return res.status(503).json({
        success: false,
        error: 'Repository not initialized',
        message: 'Database connection not available'
      });
    }

    const { id } = req.params;
    const business = await repository.getBusinessById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
        message: `No business found with ID ${id}`
      });
    }

    res.json({
      success: true,
      business: business
    });

  } catch (error) {
    console.error('Error getting business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get business',
      message: error.message
    });
  }
});

// Export businesses as CSV
router.post('/export', async (req, res) => {
  try {
    const { businessIds, format = 'csv' } = req.body;

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return res.status(400).json({ error: 'Business IDs are required' });
    }

    // For now, return mock data since database is not set up
    const mockBusinesses = businessIds.map((id, index) => ({
      id,
      name: `Mock Business ${index + 1}`,
      category: 'Other',
      address: `Mock Address ${index + 1}`,
      phone: null,
      website: null,
      rating: 4.0,
      reviews_count: 50,
      has_website: false,
      website_url: null,
      detection_method: 'mock',
      confidence_score: 0.8,
      last_updated: new Date().toISOString()
    }));

    // If repository available, fetch from DB
    if (!repository) {
      return res.status(503).json({
        success: false,
        error: 'Repository not initialized',
        message: 'Database connection not available'
      });
    }

    const found = [];
    for (const id of businessIds) {
      try {
        const row = await repository.getBusinessById(id);
        if (row) found.push(row);
      } catch (_) { }
    }

    if (format === 'csv') {
      const csvHeaders = ['Name', 'Category', 'Address', 'Phone', 'Rating', 'Reviews', 'Last Updated'];
      const csvRows = found.map(b => [
        b.name,
        b.category,
        b.address,
        b.phone || '',
        b.rating || '',
        b.reviews_count || '',
        b.updated_at || b.last_updated || new Date().toISOString()
      ]);
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sitescout_leads.csv"');
      return res.send(csvContent);
    }

    return res.json({ success: true, data: found, total: found.length });

  } catch (error) {
    console.error('Error exporting businesses:', error);
    res.status(500).json({
      error: 'Failed to export businesses',
      message: error.message
    });
  }
});

// Export by Google Place IDs
router.post('/export/byPlaceId', async (req, res) => {
  try {
    const { googlePlaceIds = [], format = 'csv' } = req.body;

    if (!Array.isArray(googlePlaceIds) || googlePlaceIds.length === 0) {
      return res.status(400).json({ error: 'googlePlaceIds are required' });
    }

    if (!repository) {
      return res.status(503).json({
        success: false,
        error: 'Repository not initialized',
        message: 'Database connection not available'
      });
    }

    const found = [];
    for (const placeId of googlePlaceIds) {
      try {
        const row = await repository.getBusinessByGooglePlaceId(placeId);
        if (row) found.push(row);
      } catch (_) { }
    }

    if (format === 'csv') {
      const csvHeaders = ['Name', 'Category', 'Address', 'Phone', 'Rating', 'Reviews', 'Last Updated'];
      const csvRows = found.map(b => [
        b.name,
        b.category,
        b.address,
        b.phone || '',
        b.rating || '',
        b.reviews_count || '',
        b.updated_at || b.last_updated || new Date().toISOString()
      ]);
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sitescout_leads.csv"');
      return res.send(csvContent);
    }

    return res.json({ success: true, data: found, total: found.length });
  } catch (error) {
    console.error('Error exporting by place IDs:', error);
    res.status(500).json({ error: 'Failed to export businesses', message: error.message });
  }
});

// Get search history for a user
router.get('/history', async (req, res) => {
  try {
    if (!repository) {
      return res.status(503).json({
        success: false,
        error: 'Repository not initialized',
        message: 'Database connection not available'
      });
    }

    const { userId, limit = 20, offset = 0 } = req.query;
    const searches = await repository.getSearchHistory(userId, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      searches: searches
    });

  } catch (error) {
    console.error('Error getting search history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search history',
      message: error.message
    });
  }
});


module.exports = router; 