const googlePlacesService = require('./backend/src/services/googlePlacesService');

async function testOptimization() {
    console.log('🧪 Testing Search Optimization...');

    const location = 'Denver, CO';
    const categories = ['Restaurants', 'Gyms'];

    // First Search (Uncached)
    console.log('\n--- First Search (Uncached) ---');
    const start1 = Date.now();
    try {
        const result1 = await googlePlacesService.searchBusinesses(location, categories);
        const duration1 = Date.now() - start1;
        console.log(`✅ Search 1 completed in ${duration1}ms`);
        console.log(`   Found ${result1.businesses.length} businesses`);
        console.log(`   Search Location:`, result1.search_location);

        if (!result1.search_location || !result1.search_location.coordinates) {
            console.error('❌ FAIL: Response missing search_location with coordinates');
        } else {
            console.log('✅ PASS: Response includes search_location');
        }

    } catch (error) {
        console.error('❌ Search 1 failed:', error.message);
        return;
    }

    // Second Search (Cached)
    console.log('\n--- Second Search (Cached) ---');
    const start2 = Date.now();
    try {
        const result2 = await googlePlacesService.searchBusinesses(location, categories);
        const duration2 = Date.now() - start2;
        console.log(`✅ Search 2 completed in ${duration2}ms`);
        console.log(`   Found ${result2.businesses.length} businesses`);

        if (duration2 < 100) {
            console.log('✅ PASS: Caching is working (response time < 100ms)');
        } else {
            console.warn('⚠️ WARN: Caching might not be working (response time > 100ms)');
        }
    } catch (error) {
        console.error('❌ Search 2 failed:', error.message);
    }
}

testOptimization();
