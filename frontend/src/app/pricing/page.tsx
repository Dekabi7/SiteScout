"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PRICING_PLANS, type PlanFeatures } from "@/config/pricing";
import { Check, Zap, Building2, Rocket } from "lucide-react";

export default function PricingPage() {
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFoundingOffer, setShowFoundingOffer] = useState(true);

  // Filter out founding member plan from main display
  const mainPlans = PRICING_PLANS.filter(plan => plan.id !== 'founding');
  const foundingPlan = PRICING_PLANS.find(plan => plan.id === 'founding');

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    if (planId === 'starter') {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:3001/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId,
          interval: billingInterval === 'year' ? 'year' : 'month',
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStripe = async (publishableKey: string) => {
    if (typeof window !== 'undefined' && !window.Stripe) {
      const { loadStripe } = await import('@stripe/stripe-js');
      return loadStripe(publishableKey);
    }
    return window.Stripe?.(publishableKey);
  };

  const getDisplayPrice = (plan: PlanFeatures) => {
    return billingInterval === 'year' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getMonthlyEquivalent = (plan: PlanFeatures) => {
    if (billingInterval === 'year' && plan.yearlyPrice > 0) {
      return Math.round(plan.yearlyPrice / 12);
    }
    return plan.monthlyPrice;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return <Rocket className="w-6 h-6" />;
      case 'pro': return <Zap className="w-6 h-6" />;
      case 'agency': return <Building2 className="w-6 h-6" />;
      default: return <Check className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              SiteScout
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find businesses without websites and grow your client base. Start free, upgrade anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <div className="flex">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingInterval === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingInterval === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Yearly
                <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  2 Months Free
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Founding Member Offer Banner */}
        {showFoundingOffer && foundingPlan && (
          <div className="max-w-5xl mx-auto mb-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white relative">
            <button
              onClick={() => setShowFoundingOffer(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              ✕
            </button>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm font-bold">
                    🔥 LIMITED OFFER
                  </span>
                  <span className="text-white/90 text-sm">Only 30 spots available</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Founding Member - $99/month Forever</h3>
                <p className="text-white/90 mb-4">
                  Get Pro features at a lifetime locked-in price. First 30 customers only!
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">✓ Price locked forever</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">✓ Exclusive badge</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">✓ Early access</span>
                </div>
              </div>
              <button
                onClick={() => handleSubscribe('founding')}
                disabled={isLoading}
                className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Claim Your Spot →
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {mainPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                  ⚡ MOST POPULAR
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${plan.id === 'starter' ? 'bg-gray-100 text-gray-600' : plan.id === 'pro' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{plan.displayName}</h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      ${getDisplayPrice(plan)}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-gray-600 ml-2">
                        /{billingInterval === 'year' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {plan.monthlyPrice > 0 && billingInterval === 'year' && (
                    <p className="text-sm text-gray-500 mt-1">
                      ${getMonthlyEquivalent(plan)}/month billed annually
                    </p>
                  )}
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading || plan.id === 'starter'}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors mb-6 ${plan.id === 'starter'
                    ? 'bg-gray-100 text-gray-600 cursor-default'
                    : plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                >
                  {plan.id === 'starter' ? 'Get Started Free' : `Start ${plan.trialDays}-Day Trial`}
                </button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>Support:</strong> {plan.support}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Response time: {plan.supportResponseTime}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What happens after my trial?
              </h3>
              <p className="text-gray-600">
                After your trial period, you&apos;ll be automatically charged for your selected plan. You can cancel anytime during the trial with no charges.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I upgrade or downgrade?
              </h3>
              <p className="text-gray-600">
                Yes! Upgrades take effect immediately. Downgrades take effect at the next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Is the Founding Member price really locked forever?
              </h3>
              <p className="text-gray-600">
                Yes! Founding Members lock in the $99/month rate for life, even as we raise prices for new customers.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to find your next clients?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join agencies and freelancers using SiteScout to grow their business.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            Start Free Today
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
