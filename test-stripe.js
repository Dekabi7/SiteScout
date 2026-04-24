const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  try {
    console.log('🧪 Testing Stripe connection...');
    
    // Test API connection by listing products
    const products = await stripe.products.list({ limit: 10 });
    
    console.log('✅ Stripe connection successful!');
    console.log(`📦 Found ${products.data.length} products:`);
    
    products.data.forEach(product => {
      console.log(`   - ${product.name} (${product.id})`);
    });
    
    // Test price retrieval
    const prices = await stripe.prices.list({ limit: 10 });
    console.log(`💰 Found ${prices.data.length} prices:`);
    
    prices.data.forEach(price => {
      const amount = (price.unit_amount / 100).toFixed(2);
      console.log(`   - $${amount}/${price.recurring?.interval || 'one-time'} (${price.id})`);
    });
    
    console.log('\n🎉 Stripe integration is working correctly!');
    
  } catch (error) {
    console.error('❌ Stripe connection failed:', error.message);
  }
}

testStripeConnection();
