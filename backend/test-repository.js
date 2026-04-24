const axios = require('axios');

async function testRepository() {
  try {
    console.log('🧪 Testing repository endpoints...');
    
    // Test statistics endpoint
    console.log('\n📊 Testing statistics endpoint...');
    const statsResponse = await axios.get('http://localhost:3002/api/businesses/statistics');
    console.log('Statistics:', JSON.stringify(statsResponse.data, null, 2));
    
    // Test businesses without websites endpoint
    console.log('\n🏢 Testing businesses without websites endpoint...');
    const businessesResponse = await axios.get('http://localhost:3002/api/businesses/businesses/without-websites?limit=5');
    console.log('Businesses without websites:', JSON.stringify(businessesResponse.data, null, 2));
    
    // Test search history endpoint
    console.log('\n📚 Testing search history endpoint...');
    const historyResponse = await axios.get('http://localhost:3002/api/businesses/history?limit=5');
    console.log('Search history:', JSON.stringify(historyResponse.data, null, 2));
    
    console.log('\n✅ All repository tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Repository test failed:', error.response?.data || error.message);
  }
}

testRepository();






