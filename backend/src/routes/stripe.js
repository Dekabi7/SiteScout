const express = require('express');

// Initialize Stripe only if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.log('⚠️ Stripe API key not configured - Stripe features will be disabled');
}

const { query, getOne } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Stripe product/price IDs (you'll need to create these in your Stripe dashboard)
// Pro: $149/month or $1,490/year
// Agency: $249/month or $2,490/year
// Founding: $99/month or $1,188/year
const STRIPE_PRODUCTS = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly_149',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly_1490'
  },
  agency: {
    monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID || 'price_agency_monthly_249',
    yearly: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID || 'price_agency_yearly_2490'
  },
  founding: {
    monthly: process.env.STRIPE_FOUNDING_MONTHLY_PRICE_ID || 'price_founding_monthly_99',
    yearly: process.env.STRIPE_FOUNDING_YEARLY_PRICE_ID || 'price_founding_yearly_1188'
  }
};

// Helper function to check if Stripe is available
function isStripeAvailable() {
  return stripe !== null;
}

// Create checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  if (!isStripeAvailable()) {
    return res.status(503).json({
      error: 'Stripe not configured',
      message: 'Payment processing is currently unavailable'
    });
  }

  try {
    const { planId, interval, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!planId || !interval || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'planId, interval, successUrl, and cancelUrl are required'
      });
    }

    // Validate plan
    if (!['pro', 'agency', 'founding'].includes(planId)) {
      return res.status(400).json({
        error: 'Invalid plan',
        details: 'Plan must be "pro", "agency", or "founding"'
      });
    }

    // Validate interval
    if (!['month', 'year'].includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval',
        details: 'Interval must be either "month" or "year"'
      });
    }

    // Get the appropriate price ID
    const priceId = STRIPE_PRODUCTS[planId]?.[interval === 'year' ? 'yearly' : 'monthly'];

    if (!priceId) {
      return res.status(400).json({
        error: 'Price not configured',
        details: `Price for plan ${planId} with interval ${interval} is not configured`
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: req.user.email,
      metadata: {
        userId: userId,
        planId: planId,
        interval: interval
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planId: planId,
          interval: interval
        },
        trial_period_days: planId === 'agency' ? 14 : 7 // Agency: 14 days, Pro/Founding: 7 days
      }
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

// Create customer portal session
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  if (!isStripeAvailable()) {
    return res.status(503).json({
      error: 'Stripe not configured',
      message: 'Payment processing is currently unavailable'
    });
  }

  try {
    const userId = req.user.id;

    // Get user's Stripe customer ID
    const user = await getOne(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({
        error: 'No subscription found',
        details: 'User does not have an active subscription'
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      error: 'Failed to create portal session',
      details: error.message
    });
  }
});

// Get subscription status
router.get('/subscription', authenticateToken, async (req, res) => {
  if (!isStripeAvailable()) {
    return res.status(503).json({
      error: 'Stripe not configured',
      message: 'Payment processing is currently unavailable'
    });
  }

  try {
    const userId = req.user.id;

    const user = await getOne(`
      SELECT 
        stripe_customer_id,
        stripe_subscription_id,
        plan_type,
        trial_ends_at,
        created_at
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    let subscription = null;
    if (user.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      } catch (error) {
        console.error('Error retrieving subscription:', error);
        // Subscription might not exist in Stripe anymore
      }
    }

    res.status(200).json({
      user: {
        planType: user.plan_type,
        trialEndsAt: user.trial_ends_at,
        createdAt: user.created_at,
        hasStripeCustomer: !!user.stripe_customer_id,
        hasStripeSubscription: !!user.stripe_subscription_id
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start,
        trialEnd: subscription.trial_end
      } : null
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      error: 'Failed to get subscription',
      details: error.message
    });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isStripeAvailable()) {
    return res.status(503).json({
      error: 'Stripe not configured',
      message: 'Webhook processing is currently unavailable'
    });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook handlers
async function handleCheckoutSessionCompleted(session) {
  const { userId, planId, interval } = session.metadata;

  // Update user with Stripe customer ID
  await query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [session.customer, userId]
  );

  console.log(`Checkout completed for user ${userId}, plan ${planId}`);
}

async function handleSubscriptionCreated(subscription) {
  const { userId, planId, interval } = subscription.metadata;

  // Update user with subscription details
  await query(
    `UPDATE users SET 
      stripe_subscription_id = $1,
      plan_type = $2,
      trial_ends_at = $3
     WHERE id = $4`,
    [
      subscription.id,
      planId,
      subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      userId
    ]
  );

  console.log(`Subscription created for user ${userId}, plan ${planId}`);
}

async function handleSubscriptionUpdated(subscription) {
  const { userId, planId } = subscription.metadata;

  // Update user subscription status
  await query(
    `UPDATE users SET 
      plan_type = $1,
      trial_ends_at = $2
     WHERE id = $3`,
    [
      planId,
      subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      userId
    ]
  );

  console.log(`Subscription updated for user ${userId}, plan ${planId}`);
}

async function handleSubscriptionDeleted(subscription) {
  const { userId } = subscription.metadata;

  // Downgrade user to free plan
  await query(
    `UPDATE users SET 
      stripe_subscription_id = NULL,
      plan_type = 'free',
      trial_ends_at = NULL
     WHERE id = $1`,
    [userId]
  );

  console.log(`Subscription deleted for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(invoice) {
  // Handle successful payment
  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice) {
  // Handle failed payment
  console.log(`Payment failed for invoice ${invoice.id}`);
}

module.exports = router;
