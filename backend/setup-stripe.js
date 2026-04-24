#!/usr/bin/env node

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  try {
    console.log('🚀 Setting up Stripe products and prices for SiteScout...\n');

    // Create products
    const proProduct = await stripe.products.create({
      name: 'SiteScout Pro',
      description: 'For growing agencies - 500 exports per day, advanced filters, priority support',
      metadata: {
        plan_type: 'pro'
      }
    });

    const agencyProduct = await stripe.products.create({
      name: 'SiteScout Agency',
      description: 'For large agencies - unlimited exports, white-label reports, dedicated support',
      metadata: {
        plan_type: 'agency'
      }
    });

    console.log('✅ Products created:');
    console.log(`   Pro: ${proProduct.id}`);
    console.log(`   Agency: ${agencyProduct.id}\n`);

    // Create prices for Pro plan
    const proMonthlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'pro',
        interval: 'month'
      }
    });

    const proYearlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 27840, // $29.00 * 12 * 0.8 (20% discount)
      currency: 'usd',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan_type: 'pro',
        interval: 'year'
      }
    });

    // Create prices for Agency plan
    const agencyMonthlyPrice = await stripe.prices.create({
      product: agencyProduct.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'agency',
        interval: 'month'
      }
    });

    const agencyYearlyPrice = await stripe.prices.create({
      product: agencyProduct.id,
      unit_amount: 95040, // $99.00 * 12 * 0.8 (20% discount)
      currency: 'usd',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan_type: 'agency',
        interval: 'year'
      }
    });

    console.log('✅ Prices created:');
    console.log(`   Pro Monthly: ${proMonthlyPrice.id} ($29/month)`);
    console.log(`   Pro Yearly: ${proYearlyPrice.id} ($278.40/year)`);
    console.log(`   Agency Monthly: ${agencyMonthlyPrice.id} ($99/month)`);
    console.log(`   Agency Yearly: ${agencyYearlyPrice.id} ($950.40/year)\n`);

    console.log('📋 Add these environment variables to your .env file:\n');
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthlyPrice.id}`);
    console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${proYearlyPrice.id}`);
    console.log(`STRIPE_AGENCY_MONTHLY_PRICE_ID=${agencyMonthlyPrice.id}`);
    console.log(`STRIPE_AGENCY_YEARLY_PRICE_ID=${agencyYearlyPrice.id}\n`);

    console.log('🎉 Stripe setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Add the price IDs to your .env file');
    console.log('2. Set up webhook endpoints in your Stripe dashboard');
    console.log('3. Configure your webhook secret in .env');

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error.message);
    process.exit(1);
  }
}

// Check if STRIPE_SECRET_KEY is set
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.log('\nPlease set your Stripe secret key:');
  console.log('export STRIPE_SECRET_KEY=sk_test_your_key_here');
  process.exit(1);
}

if (require.main === module) {
  setupStripeProducts();
}

module.exports = { setupStripeProducts };
