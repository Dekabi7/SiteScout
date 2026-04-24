#!/usr/bin/env node

/**
 * Test script for Google Places API integration
 * Run this to verify your API key is working correctly
 */

require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY || API_KEY === 'YOUR_ACTUAL_API_KEY_HERE') {
  console.error('❌ Error: Google Places API key not configured');
  console.log('Please:');
  console.log('1. Get an API key from https://console.cloud.google.com/apis/credentials');
  console.log('2. Enable Places API, Geocoding API, and Maps JavaScript API');
  console.log('3. Set up billing in Google Cloud Console');
  console.log('4. Replace YOUR_ACTUAL_API_KEY_HERE in backend/.env with your actual API key');
  process.exit(1);
}

async function testGeocodingAPI() {
  console.log('🗺️ Testing Geocoding API...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'Denver, CO',
        key: API_KEY
      }
    });

    if (response.data.status === 'OK') {
      const result = response.data.results[0];
      console.log('✅ Geocoding API working!');
      console.log(`   Location: ${result.formatted_address}`);
      console.log(`   Coordinates: ${result.geometry.location.lat}, ${result.geometry.location.lng}`);
      return true;
    } else {
      console.error(`❌ Geocoding API error: ${response.data.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Geocoding API test failed:', error.message);
    return false;
  }
}

async function testPlacesAPI() {
  console.log('🏢 Testing Places API...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: '39.7392,-104.9903', // Denver coordinates
        radius: 1000,
        type: 'restaurant',
        key: API_KEY
      }
    });

    if (response.data.status === 'OK') {
      console.log('✅ Places API working!');
      console.log(`   Found ${response.data.results.length} restaurants near Denver`);
      if (response.data.results.length > 0) {
        const firstResult = response.data.results[0];
        console.log(`   Example: ${firstResult.name} - ${firstResult.vicinity}`);
      }
      return true;
    } else {
      console.error(`❌ Places API error: ${response.data.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Places API test failed:', error.message);
    return false;
  }
}

async function testPlacesTextSearch() {
  console.log('🔍 Testing Places Text Search API...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: 'restaurants in Denver, CO',
        key: API_KEY
      }
    });

    if (response.data.status === 'OK') {
      console.log('✅ Places Text Search API working!');
      console.log(`   Found ${response.data.results.length} restaurants in Denver`);
      if (response.data.results.length > 0) {
        const firstResult = response.data.results[0];
        console.log(`   Example: ${firstResult.name} - Rating: ${firstResult.rating || 'N/A'}`);
      }
      return true;
    } else {
      console.error(`❌ Places Text Search API error: ${response.data.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Places Text Search API test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Google Places API Integration...\n');
  
  const geocodingOk = await testGeocodingAPI();
  console.log('');
  
  const placesOk = await testPlacesAPI();
  console.log('');
  
  const textSearchOk = await testPlacesTextSearch();
  console.log('');
  
  if (geocodingOk && placesOk && textSearchOk) {
    console.log('🎉 All API tests passed! Your Google Places API is configured correctly.');
    console.log('You can now start the backend server and test the business search functionality.');
  } else {
    console.log('❌ Some API tests failed. Please check your configuration:');
    console.log('1. Verify your API key is correct');
    console.log('2. Ensure all required APIs are enabled in Google Cloud Console');
    console.log('3. Check that billing is set up');
    console.log('4. Verify API key restrictions allow your requests');
  }
}

runTests().catch(console.error);
