# 🚀 Google Places API Setup Guide

This guide will help you set up the Google Places API for SiteScout to fetch real business data.

## 📋 Prerequisites

- Google account
- Credit card for billing (Google provides $200 free credits monthly)
- 10-15 minutes to complete setup

## 🔧 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `SiteScout API` (or any name you prefer)
4. Click **"Create"**
5. Wait for project creation to complete

### 2. Enable Required APIs

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for and enable these APIs one by one:

   **Places API:**
   - Search: "Places API"
   - Click on "Places API"
   - Click **"Enable"**

   **Geocoding API:**
   - Search: "Geocoding API"
   - Click on "Geocoding API"
   - Click **"Enable"**

   **Maps JavaScript API:**
   - Search: "Maps JavaScript API"
   - Click on "Maps JavaScript API"
   - Click **"Enable"**

### 3. Set Up Billing

⚠️ **Important**: Google Places API requires billing to be enabled

1. Go to **"Billing"** in the Google Cloud Console
2. Click **"Link a billing account"**
3. Add a payment method (credit card)
4. Don't worry - you get $200 free credits monthly
5. The free tier covers most development and testing needs

### 4. Create API Key

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the generated API key (starts with `AIza...`)
4. Click **"Restrict Key"** to add security restrictions:

   **Application restrictions:**
   - Select **"HTTP referrers (web sites)"**
   - Add: `http://localhost:3000/*`
   - Add: `https://yourdomain.com/*` (for production)

   **API restrictions:**
   - Select **"Restrict key"**
   - Choose: Places API, Geocoding API, Maps JavaScript API

### 5. Configure Environment Variables

1. Create a file called `.env` in the `backend` folder
2. Copy the content from `env.example`
3. Replace `YOUR_ACTUAL_API_KEY_HERE` with your actual API key

```bash
# In backend/.env
GOOGLE_PLACES_API_KEY=AIzaSyBLTMJKg2Y11xezGNg3RiFNF75nstgJ7Jg
```

### 6. Test Your Setup

Run the test script to verify everything is working:

```bash
cd backend
node test-google-api.js
```

You should see:
```
🚀 Testing Google Places API Integration...

🗺️ Testing Geocoding API...
✅ Geocoding API working!
   Location: Denver, CO, USA
   Coordinates: 39.7392, -104.9903

🏢 Testing Places API...
✅ Places API working!
   Found 20 restaurants near Denver
   Example: The Capital Grille - 1450 Larimer St, Denver, CO 80202

🔍 Testing Places Text Search API...
✅ Places Text Search API working!
   Found 20 restaurants in Denver
   Example: The Capital Grille - Rating: 4.3

🎉 All API tests passed! Your Google Places API is configured correctly.
```

## 🧪 Test the Business Search

Once your API is working, test the business search:

```bash
# Start the backend server
cd backend
npm run dev

# Test city autocomplete
curl "http://localhost:3001/api/businesses/autocomplete?query=denver"

# Test business search
curl -X POST "http://localhost:3001/api/businesses/search" \
  -H "Content-Type: application/json" \
  -d '{"location":"Denver, CO","categories":["Restaurants","Salons"]}'
```

## 💰 Cost Information

- **Free Tier**: $200 credit monthly
- **Places API**: $0.017 per request
- **Geocoding API**: $0.005 per request
- **Typical usage**: 1000 searches = ~$20/month

## 🔒 Security Best Practices

1. **Restrict your API key** to specific domains
2. **Monitor usage** in Google Cloud Console
3. **Set up billing alerts** to avoid unexpected charges
4. **Use different keys** for development and production

## 🆘 Troubleshooting

### "REQUEST_DENIED" Error
- Check that all required APIs are enabled
- Verify billing is set up
- Ensure API key restrictions allow your requests

### "OVER_QUERY_LIMIT" Error
- Check your billing account
- Verify you haven't exceeded quotas
- Wait for quota reset (usually daily)

### "INVALID_REQUEST" Error
- Check your API key format
- Verify request parameters
- Ensure required fields are included

## 📞 Support

If you encounter issues:
1. Check the [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service)
2. Review your Google Cloud Console for error details
3. Check the SiteScout logs for specific error messages

---

**Next Steps**: Once your API is working, you can start the backend server and test the full business search functionality!
