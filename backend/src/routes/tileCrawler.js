const express = require('express');
const router = express.Router();
const tileCrawlerService = require('../services/tileCrawlerService');

/**
 * Tile-based crawling routes for comprehensive business data collection
 */

// Start a comprehensive city crawl
router.post('/crawl-city', async (req, res) => {
  try {
    const { city, categories } = req.body;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'City name is required'
      });
    }
    
    console.log(`🚀 Starting tile-based crawl for ${city}`);
    
    // Start the crawl (this will run asynchronously)
    const results = await tileCrawlerService.crawlCity(city, categories);
    
    res.json({
      success: true,
      message: `Successfully crawled ${city}`,
      data: {
        city: results.city,
        totalTiles: results.totalTiles,
        successfulTiles: results.successfulTiles,
        failedTiles: results.failedTiles,
        totalBusinesses: results.totalBusinesses,
        stats: results.stats,
        duration: results.durationFormatted
      },
      businesses: results.businesses.slice(0, 100), // Return first 100 businesses
      hasMore: results.businesses.length > 100
    });
    
  } catch (error) {
    console.error('❌ Error in tile crawl:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get crawl statistics
router.get('/stats', (req, res) => {
  try {
    const stats = tileCrawlerService.crawlStats;
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Error getting crawl stats:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate tiles for a city (without crawling)
router.post('/generate-tiles', async (req, res) => {
  try {
    const { city, tileSize } = req.body;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'City name is required'
      });
    }
    
    const tiles = await tileCrawlerService.generateCityTiles(city, tileSize || 1);
    
    res.json({
      success: true,
      city: city,
      tileSize: tileSize || 1,
      totalTiles: tiles.length,
      tiles: tiles
    });
    
  } catch (error) {
    console.error('❌ Error generating tiles:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get business categories
router.get('/categories', (req, res) => {
  try {
    const categories = tileCrawlerService.getBusinessCategories();
    
    res.json({
      success: true,
      totalCategories: Object.keys(categories).length,
      categories: categories
    });
    
  } catch (error) {
    console.error('❌ Error getting categories:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Crawl a specific tile
router.post('/crawl-tile', async (req, res) => {
  try {
    const { tile, categories } = req.body;
    
    if (!tile || !tile.center) {
      return res.status(400).json({
        success: false,
        error: 'Tile object with center coordinates is required'
      });
    }
    
    const businesses = await tileCrawlerService.crawlTile(tile, categories);
    
    res.json({
      success: true,
      tile: tile.id,
      businessesFound: businesses.length,
      businesses: businesses
    });
    
  } catch (error) {
    console.error('❌ Error crawling tile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
