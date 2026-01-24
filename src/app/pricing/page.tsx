'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/solid'

const PRICING_PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Browse 500+ exercises',
      'Log workouts',
      'Track progress',
      'View statistics',
      'No AI features',
    ],
    cta: 'Get Started',
    ctaLink: '/auth/signup',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '₹249',
    period: '/month',
    description: 'AI-powered personalization',
    features: [
      'All Free features',
      'AI Workout Planner (2/month)',
      'AI Chat Support (25 messages/month)',
      'AI Weekly Insights (1/week)',
      'AI Plan Edits (3/month)',
      'Priority support',
      'Ad-free experience',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/subscribe/premium',
    highlighted: true,
  },
  {
    name: 'Premium Yearly',
    price: '₹2,490',
    period: '/year',
    description: 'Best value - save 17%',
    features: [
      'All Premium features',
      'All AI features',
      'Priority support',
      'Early access to new features',
      'Save ₹3,478/year vs monthly',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/subscribe/premium-yearly',
    highlighted: false,
  },
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto mb-12">
        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          ← Back to Home
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Unlock AI-powered workout planning and personalized guidance
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Yearly
            </button>
            <span className="ml-4 inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
              Save 17%
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PRICING_PLANS.map((plan, index) => (
            <div
              key={index}
              className={`rounded-xl transition-all duration-300 ${
                plan.highlighted
                  ? 'ring-2 ring-blue-600 transform scale-105 shadow-2xl bg-white dark:bg-gray-900'
                  : 'bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-blue-600 text-white text-center py-2 rounded-t-xl font-semibold">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 h-12">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">{plan.period}</span>
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.ctaLink}
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors mb-8 ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features List */}
                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! Cancel your subscription anytime without penalties. No long-term contracts.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 7-day money-back guarantee if you\'re not satisfied.',
              },
              {
                q: 'Can I upgrade/downgrade?',
                a: 'Yes, change your plan anytime. We\'ll prorate charges fairly.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Get 7 days free when you upgrade to Premium. No credit card required to start.',
              },
            ].map((faq, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Questions? We're here to help.
          </p>
          <Link
            href="mailto:support@guidemecoach.com"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
          >
            Contact our support team →
          </Link>
        </div>
      </div>
    </div>
  )
}
