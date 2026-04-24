#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 SiteScout Real Business Data Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  try {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ .env file created successfully!');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🔑 Google Places API Configuration:');
console.log('===================================');
console.log('To use real business data, you need a Google Places API key:');
console.log('');
console.log('1. Go to https://console.cloud.google.com/');
console.log('2. Create a new project or select an existing one');
console.log('3. Enable the "Places API" and "Geocoding API"');
console.log('4. Create credentials (API key)');
console.log('5. Add the API key to your .env file:');
console.log('   GOOGLE_PLACES_API_KEY=your_api_key_here');
console.log('');

console.log('📊 Current Configuration:');
console.log('=========================');

// Read current .env file
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  const apiKeyLine = lines.find(line => line.startsWith('GOOGLE_PLACES_API_KEY='));
  if (apiKeyLine) {
    const apiKey = apiKeyLine.split('=')[1];
    if (apiKey && apiKey !== 'your_google_places_api_key_here') {
      console.log('✅ Google Places API Key: Configured');
    } else {
      console.log('❌ Google Places API Key: Not configured (using fallback)');
    }
  } else {
    console.log('❌ Google Places API Key: Missing from .env file');
  }
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
}

console.log('\n🎯 Next Steps:');
console.log('==============');
console.log('1. Add your Google Places API key to the .env file');
console.log('2. Start the backend server: npm start');
console.log('3. Start the frontend: cd ../frontend && npm run dev');
console.log('4. Search for real businesses in your area!');
console.log('');

console.log('💡 Tips for Real Business Data:');
console.log('===============================');
console.log('- Start with smaller cities for faster results');
console.log('- Use specific categories like "Restaurants" or "Salons"');
console.log('- The system will automatically detect businesses without websites');
console.log('- Real API calls may take 10-30 seconds depending on location');
console.log('');

console.log('🔧 Fallback Mode:');
console.log('=================');
console.log('If no API key is configured, the system will use realistic mock data');
console.log('This allows you to test the interface while setting up real data');
console.log('');
