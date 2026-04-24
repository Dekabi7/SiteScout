# SiteScout Pricing Update - Stripe Setup Instructions

## Updated Pricing Structure

### 1. Starter (Free) Plan
- **Price**: $0/month
- **No Stripe setup needed** (free tier)

### 2. Pro Plan
- **Monthly**: $149/month
  - Create price ID: `price_pro_monthly_149`
  - Set environment variable: `STRIPE_PRO_MONTHLY_PRICE_ID`

- **Yearly**: $1,490/year (~2 months free)
  - Create price ID: `price_pro_yearly_1490`
  - Set environment variable: `STRIPE_PRO_YEARLY_PRICE_ID`

### 3. Agency Plan
- **Monthly**: $249/month
  - Create price ID: `price_agency_monthly_249`
  - Set environment variable: `STRIPE_AGENCY_MONTHLY_PRICE_ID`

- **Yearly**: $2,490/year (~2 months free)
  - Create price ID: `price_agency_yearly_2490`
  - Set environment variable: `STRIPE_AGENCY_YEARLY_PRICE_ID`

### 4. Founding Member Plan
- **Monthly**: $99/month
  - Create price ID: `price_founding_monthly_99`
  - Set environment variable: `STRIPE_FOUNDING_MONTHLY_PRICE_ID`

- **Yearly**: $1,188/year
  - Create price ID: `price_founding_yearly_1188`
  - Set environment variable: `STRIPE_FOUNDING_YEARLY_PRICE_ID`

## Steps to Create in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. For each plan:
   - Enter product name (e.g., "SiteScout Pro")
   - Add description
   - Create pricing with the amounts above
   - Copy the price IDs

## Environment Variables

Add to `backend/.env` or `backend/config.env`:

```bash
# Stripe Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_xxx
STRIPE_AGENCY_YEARLY_PRICE_ID=price_xxx
STRIPE_FOUNDING_MONTHLY_PRICE_ID=price_xxx
STRIPE_FOUNDING_YEARLY_PRICE_ID=price_xxx
```

## Trial Periods

Automatically set by the code:
- **Starter**: No trial (permanent free)
- **Pro**: 7-day trial
- **Agency**: 14-day trial
- **Founding Member**: 7-day trial

## Plan Limits Summary

| Feature | Starter | Pro | Agency | Founding |
|---------|---------|-----|--------|----------|
| Daily Searches | 10 | 500 | 2,500 | 500 |
| Daily Cities | 1 | Unlimited | Unlimited | Unlimited |
| Monthly Exports | 0 | 1,000 | 10,000 | 1,000 |
| Bulk Export Size | 0 | 100 | 1,000 | 100 |
| Saved Leads | 0 | 100 | Unlimited | 100 |
| AI Emails/Month | 0 | 200 | 1,000 | 200 |
| AI Templates | 0 | 10 | 50 | 10 |
| Team Members | 1 | 1 | 3 | 1 |
