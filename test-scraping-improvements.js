const googlePlacesService = require('./backend/src/services/googlePlacesService');

async function testScraping() {
    console.log('🧪 Testing Scraping Improvements...');

    const location = 'New York, NY';
    const category = 'Restaurants';
    const radius = 5000;

    // Test Pagination (via nearbySearch)
    console.log('\n--- Testing Pagination (nearbySearch) ---');
    try {
        // We need coordinates for nearbySearch
        const coordinates = await googlePlacesService.getAccurateCoordinates(location);
        if (!coordinates) {
            throw new Error('Could not get coordinates');
        }

        const start = Date.now();
        const results = await googlePlacesService.nearbySearch(coordinates, radius, category);
        const duration = Date.now() - start;

        console.log(`✅ Search completed in ${duration}ms`);
        console.log(`   Found ${results.length} businesses`);

        if (results.length > 20) {
            console.log('✅ PASS: Pagination is working (results > 20)');
        } else {
            console.warn('⚠️ WARN: Pagination might not be working or not enough results (results <= 20)');
        }
    } catch (error) {
        console.error('❌ Pagination test failed:', error.message);
    }

    // Test Grid Search (Optional)
    console.log('\n--- Testing Grid Search ---');
    try {
        const coordinates = await googlePlacesService.getAccurateCoordinates(location);
        const start = Date.now();
        // Use a small radius for grid search test to avoid too many calls
        const results = await googlePlacesService.searchInGrid(coordinates, 2000, category);
        const duration = Date.now() - start;

        console.log(`✅ Grid search completed in ${duration}ms`);
        console.log(`   Found ${results.length} businesses`);
    } catch (error) {
        console.error('❌ Grid search test failed:', error.message);
    }
}

testScraping();
