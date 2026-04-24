# Google Places API Setup Guide

## Overview
SiteScout uses Google Places API to fetch real business data, including:
- Business search by location and category
- Business details (name, address, phone, website, rating)
- Geocoding (converting addresses to coordinates)
- City/zipcode autocomplete

## Prerequisites
- Google Cloud Platform account
- Billing enabled on your Google Cloud project
- Basic knowledge of Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "sitescout-business-api")
4. Click "Create"

### 2. Enable Required APIs
1. In your project, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Places API** - For business search and details
   - **Geocoding API** - For address to coordinate conversion
   - **Maps JavaScript API** - For map functionality

### 3. Create API Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. **Important**: Restrict the API key to only the APIs you need

### 4. Restrict API Key (Security)
1. Click on your API key to edit it
2. Under "Application restrictions", select "HTTP referrers (web sites)"
3. Add your domain(s) or use "localhost" for development
4. Under "API restrictions", select "Restrict key"
5. Select only the APIs you enabled in step 2
6. Click "Save"

### 5. Configure Environment Variables
1. Copy `backend/env.example` to `backend/.env`
2. Set your Google Places API key:
   ```bash
   GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```

### 6. Test the Setup
1. Restart your backend server
2. Test the city autocomplete:
   ```bash
   curl "http://localhost:3001/api/businesses/autocomplete?query=denver"
   ```
3. Test business search:
   ```bash
   curl -X POST "http://localhost:3001/api/businesses/search" \
     -H "Content-Type: application/json" \
     -d '{"location":"Denver, CO","categories":["Restaurants"]}'
   ```

## API Usage & Limits

### Free Tier Limits
- **Places API**: 1,000 requests/day
- **Geocoding API**: 2,500 requests/day
- **Maps JavaScript API**: 25,000 map loads/month

### Paid Tier
- $0.017 per 1,000 additional requests
- $0.005 per 1,000 additional geocoding requests

### Rate Limiting
The backend includes built-in rate limiting:
- Maximum 50 requests per minute
- Exponential backoff for failed requests
- Fallback to mock data when limits are exceeded

## Troubleshooting

### Common Issues

#### 1. "REQUEST_DENIED" Error
- Check if the API key is correct
- Verify the APIs are enabled
- Check if billing is enabled
- Ensure the API key has proper restrictions

#### 2. "OVER_QUERY_LIMIT" Error
- You've exceeded your daily quota
- Wait until the next day or upgrade to paid tier
- Check your usage in Google Cloud Console

#### 3. "INVALID_REQUEST" Error
- Check the request format
- Verify location parameters are valid
- Ensure category names are supported

#### 4. CORS Issues
- Verify FRONTEND_URL in your .env file
- Check if the frontend is running on the correct port

### Debug Mode
Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

### Testing Without API Key
For development/testing, you can use mock data by setting:
```bash
GOOGLE_PLACES_API_KEY=test_key
```

## Production Considerations

### Security
- Never expose your API key in client-side code
- Use environment variables for all sensitive data
- Restrict API keys to specific domains/IPs
- Monitor API usage regularly

### Performance
- Implement caching for frequently searched locations
- Use the built-in rate limiting
- Consider implementing Redis for better caching
- Monitor response times and optimize queries

### Cost Optimization
- Cache geocoding results
- Implement smart retry logic
- Monitor usage patterns
- Set up billing alerts

## Support
- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Cloud Support](https://cloud.google.com/support)

## Next Steps
Once Google Places API is working:
1. Test business search functionality
2. Verify website detection is working
3. Test export functionality
4. Set up Stripe for billing
5. Configure production environment
