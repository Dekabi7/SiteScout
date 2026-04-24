# SiteScout Stripe Integration Setup Guide

This guide will help you set up Stripe payment processing for the SiteScout application.

## 🚀 Quick Start

### 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business verification
3. Get your API keys from the Stripe Dashboard

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory with your Stripe credentials:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Set Up Stripe Products and Prices

Run the automated setup script:

```bash
cd backend
npm run setup:stripe
```

This will create:
- SiteScout Pro product with monthly ($29) and yearly ($278.40) pricing
- SiteScout Agency product with monthly ($99) and yearly ($950.40) pricing

### 4. Add Price IDs to Environment

After running the setup script, add the generated price IDs to your `.env` file:

```bash
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly_id_here
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_id_here
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_agency_monthly_id_here
STRIPE_AGENCY_YEARLY_PRICE_ID=price_agency_yearly_id_here
```

### 5. Configure Webhooks

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret and add it to your `.env` file

### 6. Frontend Configuration

Add your Stripe publishable key to the frontend environment:

```bash
# In frontend/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## 📋 Features Implemented

### Backend Features
- ✅ Stripe Checkout Session creation
- ✅ Customer Portal integration
- ✅ Subscription management
- ✅ Webhook handling for subscription events
- ✅ Database integration for subscription tracking

### Frontend Features
- ✅ Pricing page with plan selection
- ✅ Stripe Checkout integration
- ✅ Dashboard with subscription status
- ✅ Billing portal access
- ✅ Plan feature display

### Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 50 exports/day, Basic search, CSV export, Email support |
| Pro | $29/month | 500 exports/day, Advanced filters, Priority support, API access |
| Agency | $99/month | Unlimited exports, White-label reports, Dedicated support |

## 🔧 Manual Setup (Alternative)

If you prefer to set up products manually in the Stripe Dashboard:

### 1. Create Products

**SiteScout Pro**
- Name: SiteScout Pro
- Description: For growing agencies - 500 exports per day, advanced filters, priority support

**SiteScout Agency**
- Name: SiteScout Agency
- Description: For large agencies - unlimited exports, white-label reports, dedicated support

### 2. Create Prices

**Pro Plan Prices:**
- Monthly: $29.00/month
- Yearly: $278.40/year (20% discount)

**Agency Plan Prices:**
- Monthly: $99.00/month
- Yearly: $950.40/year (20% discount)

### 3. Configure Trial Periods

- Pro Plan: 7-day trial
- Agency Plan: 14-day trial

## 🧪 Testing

### Test Cards

Use these test card numbers in Stripe Checkout:

- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

### Test Mode vs Live Mode

- **Development**: Use test keys (`sk_test_`, `pk_test_`)
- **Production**: Use live keys (`sk_live_`, `pk_live_`)

## 🔒 Security Considerations

1. **Never expose secret keys** in frontend code
2. **Always verify webhook signatures** (implemented)
3. **Use HTTPS** in production
4. **Implement proper error handling** (implemented)
5. **Validate subscription status** before granting access

## 📊 Database Schema

The following fields are added to the `users` table:

```sql
stripe_customer_id VARCHAR(255),
stripe_subscription_id VARCHAR(255)
```

## 🚨 Troubleshooting

### Common Issues

1. **"Price not configured" error**
   - Ensure price IDs are correctly set in environment variables
   - Verify prices exist in your Stripe dashboard

2. **Webhook signature verification failed**
   - Check that webhook secret is correct
   - Ensure webhook endpoint is accessible

3. **Subscription not updating**
   - Verify webhook events are being received
   - Check database connection and queries

4. **Checkout session creation fails**
   - Verify Stripe secret key is correct
   - Check that price IDs are valid

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

## 📞 Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For SiteScout integration issues:
- Check the application logs
- Verify environment configuration
- Test with Stripe's test mode first

## 🔄 Updates and Maintenance

### Regular Tasks
1. Monitor webhook delivery in Stripe Dashboard
2. Review failed payments and subscription cancellations
3. Update pricing if needed (create new prices, don't modify existing ones)
4. Monitor Stripe API version updates

### Version Updates
When updating Stripe SDK:
1. Update `stripe` package in backend
2. Update `@stripe/stripe-js` in frontend
3. Test all payment flows
4. Review breaking changes in Stripe changelog

---

**Note**: This integration is designed for production use but should be thoroughly tested in Stripe's test mode before going live.
