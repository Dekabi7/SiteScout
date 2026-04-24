# SiteScout Stripe Environment Setup Script
# Run this script to set up your environment variables

Write-Host "🚀 Setting up SiteScout Stripe Environment..." -ForegroundColor Green

# Set environment variables for current session
$env:STRIPE_SECRET_KEY = "sk_test_YOUR_STRIPE_SECRET_KEY"
$env:STRIPE_PUBLISHABLE_KEY = "pk_test_YOUR_STRIPE_PUBLISHABLE_KEY"
$env:STRIPE_PRO_MONTHLY_PRICE_ID = "price_1S1cdRGy88UAR5WvdOVCkK2L"
$env:STRIPE_PRO_YEARLY_PRICE_ID = "price_1S1cdSGy88UAR5WvzWuAGkDq"
$env:STRIPE_AGENCY_MONTHLY_PRICE_ID = "price_1S1cdSGy88UAR5Wvn4ZrKsO3"
$env:STRIPE_AGENCY_YEARLY_PRICE_ID = "price_1S1cdSGy88UAR5WvwzbXHZT1"

Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set up webhook endpoint in Stripe Dashboard" -ForegroundColor White
Write-Host "2. Get webhook secret and add it to STRIPE_WEBHOOK_SECRET" -ForegroundColor White
Write-Host "3. Start the backend server: npm run dev" -ForegroundColor White
Write-Host "4. Test the payment flow!" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Stripe Dashboard: https://dashboard.stripe.com/webhooks" -ForegroundColor Cyan
