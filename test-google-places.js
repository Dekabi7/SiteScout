const axios = require('axios');

// Test Google Places API key
const API_KEY = 'AIzaSyBLTMJKg2Y11xezGNg3RiFNF75nstgJ7Jg';

async function testGooglePlacesAPI() {
  console.log('🧪 Testing Google Places API...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  
  try {
    // Test 1: Geocoding API
    console.log('\n📍 Testing Geocoding API...');
    const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'Denver, CO, USA',
        key: API_KEY
      }
    });
    
    if (geocodeResponse.data.status === 'OK') {
      console.log('✅ Geocoding API working');
      const location = geocodeResponse.data.results[0].geometry.location;
      console.log(`   Coordinates: ${location.lat}, ${location.lng}`);
    } else {
      console.log('❌ Geocoding API failed:', geocodeResponse.data.status);
      console.log('   Error:', geocodeResponse.data.error_message);
    }
    
    // Test 2: Places Text Search
    console.log('\n🔍 Testing Places Text Search...');
    const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: 'restaurants in Denver, CO',
        key: API_KEY
      }
    });
    
    if (placesResponse.data.status === 'OK') {
      console.log('✅ Places Text Search working');
      console.log(`   Found ${placesResponse.data.results.length} restaurants`);
      if (placesResponse.data.results.length > 0) {
        const firstResult = placesResponse.data.results[0];
        console.log(`   Example: ${firstResult.name} - ${firstResult.formatted_address}`);
      }
    } else {
      console.log('❌ Places Text Search failed:', placesResponse.data.status);
      console.log('   Error:', placesResponse.data.error_message);
    }
    
    // Test 3: Places Nearby Search
    console.log('\n📍 Testing Places Nearby Search...');
    const nearbyResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: '39.7392,-104.9903', // Denver coordinates
        radius: 5000,
        type: 'restaurant',
        key: API_KEY
      }
    });
    
    if (nearbyResponse.data.status === 'OK') {
      console.log('✅ Places Nearby Search working');
      console.log(`   Found ${nearbyResponse.data.results.length} nearby restaurants`);
    } else {
      console.log('❌ Places Nearby Search failed:', nearbyResponse.data.status);
      console.log('   Error:', nearbyResponse.data.error_message);
    }
    
    // Test 4: Place Details
    if (placesResponse.data.status === 'OK' && placesResponse.data.results.length > 0) {
      console.log('\n🏢 Testing Place Details...');
      const placeId = placesResponse.data.results[0].place_id;
      const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total',
          key: API_KEY
        }
      });
      
      if (detailsResponse.data.status === 'OK') {
        console.log('✅ Place Details working');
        const place = detailsResponse.data.result;
        console.log(`   Business: ${place.name}`);
        console.log(`   Address: ${place.formatted_address}`);
        console.log(`   Phone: ${place.formatted_phone_number || 'N/A'}`);
        console.log(`   Website: ${place.website || 'N/A'}`);
        console.log(`   Rating: ${place.rating || 'N/A'}`);
      } else {
        console.log('❌ Place Details failed:', detailsResponse.data.status);
        console.log('   Error:', detailsResponse.data.error_message);
      }
    }
    
    console.log('\n🎉 Google Places API testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing Google Places API:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testGooglePlacesAPI();
