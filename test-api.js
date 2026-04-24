const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing business search API...');
    
    const response = await axios.post('http://localhost:3002/api/businesses/search', {
      location: 'Denver, CO',
      categories: ['Restaurants']
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI();
