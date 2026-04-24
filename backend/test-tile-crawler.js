#!/usr/bin/env node

/**
 * Test script for tile-based crawling system
 * This demonstrates comprehensive business data collection
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testTileCrawler() {
  console.log('🚀 Testing Tile-Based Crawling System...\n');
  
  try {
    // Test 1: Get available categories
    console.log('📂 Test 1: Getting business categories...');
    const categoriesResponse = await axios.get(`${API_BASE}/api/crawler/categories`);
    console.log(`✅ Found ${categoriesResponse.data.totalCategories} business categories`);
    console.log(`   Categories: ${Object.keys(categoriesResponse.data.categories).slice(0, 10).join(', ')}...\n`);
    
    // Test 2: Generate tiles for a small city
    console.log('🗺️ Test 2: Generating tiles for Austin, TX...');
    const tilesResponse = await axios.post(`${API_BASE}/api/crawler/generate-tiles`, {
      city: 'Austin, TX',
      tileSize: 2 // 2km tiles for faster testing
    });
    console.log(`✅ Generated ${tilesResponse.data.totalTiles} tiles for Austin`);
    console.log(`   First tile: ${tilesResponse.data.tiles[0].id}\n`);
    
    // Test 3: Crawl a single tile (limited categories for testing)
    console.log('🔍 Test 3: Crawling a single tile...');
    const firstTile = tilesResponse.data.tiles[0];
    const tileCrawlResponse = await axios.post(`${API_BASE}/api/crawler/crawl-tile`, {
      tile: firstTile,
      categories: ['restaurant', 'cafe', 'bar'] // Limited for testing
    });
    console.log(`✅ Found ${tileCrawlResponse.data.businessesFound} businesses in tile ${firstTile.id}`);
    if (tileCrawlResponse.data.businesses.length > 0) {
      const firstBusiness = tileCrawlResponse.data.businesses[0];
      console.log(`   Example: ${firstBusiness.name} - ${firstBusiness.category}\n`);
    }
    
    // Test 4: Get crawl statistics
    console.log('📊 Test 4: Getting crawl statistics...');
    const statsResponse = await axios.get(`${API_BASE}/api/crawler/stats`);
    console.log(`✅ Crawl statistics:`);
    console.log(`   Tiles processed: ${statsResponse.data.stats.tilesProcessed}`);
    console.log(`   Businesses found: ${statsResponse.data.stats.businessesFound}`);
    console.log(`   Categories searched: ${statsResponse.data.stats.categoriesSearched}`);
    console.log(`   Errors: ${statsResponse.data.stats.errors}\n`);
    
    console.log('🎉 All tile crawler tests passed!');
    console.log('\n💡 Next steps:');
    console.log('1. Try crawling a full city: POST /api/crawler/crawl-city');
    console.log('2. Monitor progress with: GET /api/crawler/stats');
    console.log('3. Use specific categories for targeted searches');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

async function testFullCityCrawl() {
  console.log('\n🏙️ Testing Full City Crawl (Austin, TX)...');
  console.log('⚠️ This will take several minutes and use API quota...\n');
  
  try {
    const crawlResponse = await axios.post(`${API_BASE}/api/crawler/crawl-city`, {
      city: 'Austin, TX',
      categories: ['restaurant', 'cafe', 'bar', 'salon', 'gym'] // Limited categories for testing
    });
    
    console.log('🎉 Full city crawl completed!');
    console.log(`📊 Results:`);
    console.log(`   City: ${crawlResponse.data.data.city}`);
    console.log(`   Tiles: ${crawlResponse.data.data.successfulTiles}/${crawlResponse.data.data.totalTiles}`);
    console.log(`   Businesses: ${crawlResponse.data.data.totalBusinesses}`);
    console.log(`   Duration: ${crawlResponse.data.data.duration}`);
    console.log(`   Has more data: ${crawlResponse.data.hasMore}`);
    
  } catch (error) {
    console.error('❌ Full city crawl failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--full-crawl')) {
    await testFullCityCrawl();
  } else {
    await testTileCrawler();
  }
}

main().catch(console.error);
