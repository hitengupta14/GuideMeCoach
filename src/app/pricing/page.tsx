'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useSession } from '@/hooks/useSession'
import { PricingRegionSelector } from '@/components/PricingRegionSelector'

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    priceIndia: '₹0',
    priceInternational: '$0',
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
    highlighted: false,
  },
  {
    id: 'premium',
    name: 'Premium Monthly',
    priceIndia: '₹299',
    priceInternational: '$5',
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
    highlighted: true,
  },
  {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    priceIndia: '₹2,499',
    priceInternational: '$49',
    period: '/year',
    description: 'Best value - save 17%',
    features: [
      'All Premium features',
      'All AI features',
      'Priority support',
      'Early access to new features',
      'Save 16% vs monthly',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
]

function PricingContent() {
  const [isCancelling, setIsCancelling] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<'india' | 'international'>('india')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useSession({ required: false })
  const { subscriptionStatus, isPremium, refetch } = useSubscriptionStatus()

  // Refetch subscription status when pricing page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      refetch()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetch])

  // Check if coming from payment
  useEffect(() => {
    const isFromPayment = searchParams?.get('from') === 'payment'
    if (isFromPayment) {
      refetch()
    }
  }, [searchParams, refetch])

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll keep premium access until your current period ends, but no renewal will occur.')) {
      return
    }

    setIsCancelling(true)

    try {
      const response = await fetch('/api/v1/subscription/cancel', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        alert('Subscription cancellation requested successfully!')
        refetch() // Refresh subscription status
      } else {
        const error = await response.json()
        alert(`Failed to cancel: ${error.message}`)
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view pricing
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sign in to see your subscription status and upgrade options.
          </p>
          <Link
            href={`/auth/login?redirect=/pricing`}
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Log In
          </Link>
        </div>
      </div>
    )
  }

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
            {isPremium ? 'Manage Your Subscription' : 'Simple, Transparent Pricing'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {isPremium
              ? subscriptionStatus?.message
              : 'Unlock AI-powered workout planning and personalized guidance'}
          </p>

          {/* Current Plan Status Badge */}
          {isPremium && subscriptionStatus && (
            <div className="inline-block mb-8 px-6 py-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                ✓ {subscriptionStatus.planType === 'premium-yearly' ? 'Premium Yearly' : 'Premium Monthly'} Active
              </p>
              {subscriptionStatus.daysRemaining > 0 && (
                <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                  Renews in {subscriptionStatus.daysRemaining} day{subscriptionStatus.daysRemaining !== 1 ? 's' : ''}
                </p>
              )}
              {subscriptionStatus.pendingPlanType && (
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-2">
                  ⏳ {subscriptionStatus.pendingPlanType === 'premium-yearly' ? 'Yearly' : 'Monthly'} plan scheduled after current expires
                </p>
              )}
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          )}
        </div>

        {/* Regional Pricing Selector - Only show if not premium */}
        {!isPremium && (
          <div className="max-w-2xl mx-auto mb-12">
            <PricingRegionSelector
              defaultRegion="india"
              onRegionChange={setSelectedRegion}
            />
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PRICING_PLANS.map((plan) => {
            const isCurrentPlan = isPremium && subscriptionStatus?.planType === plan.id;
            const hasPendingPlan = subscriptionStatus?.pendingPlanType;
            const isPendingPlan = hasPendingPlan && subscriptionStatus?.pendingPlanType === plan.id;
            
            // User can only change plan if:
            // 1. They're not on this plan already
            // 2. They don't already have a pending plan scheduled
            const canChangeToPlan = isPremium && !isCurrentPlan && !hasPendingPlan && plan.id !== 'free';

            return (
              <div
                key={plan.id}
                className={`rounded-xl transition-all duration-300 ${
                  isCurrentPlan
                    ? 'ring-2 ring-green-600 transform scale-100 shadow-2xl bg-white dark:bg-gray-900'
                    : isPendingPlan
                    ? 'ring-2 ring-amber-500 transform scale-100 shadow-2xl bg-white dark:bg-gray-900'
                    : plan.highlighted
                    ? 'ring-2 ring-blue-600 transform scale-105 shadow-2xl bg-white dark:bg-gray-900'
                    : 'bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl'
                }`}
              >
                {/* Badge */}
                {isCurrentPlan && (
                  <div className="bg-green-600 text-white text-center py-2 rounded-t-xl font-semibold">
                    ✓ Current Plan
                  </div>
                )}
                {isPendingPlan && (
                  <div className="bg-amber-500 text-white text-center py-2 rounded-t-xl font-semibold">
                    ⏳ Scheduled to Activate
                  </div>
                )}
                {!isCurrentPlan && !isPendingPlan && plan.highlighted && (
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
                      {selectedRegion === 'india' ? plan.priceIndia : plan.priceInternational}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">{plan.period}</span>
                  </div>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="block w-full text-center py-3 rounded-lg font-semibold mb-8 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : isPendingPlan ? (
                    <div className="mb-8">
                      <button
                        disabled
                        className="block w-full text-center py-3 rounded-lg font-semibold mb-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 cursor-not-allowed"
                      >
                        ⏳ Activates When Current Plan Ends
                      </button>
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                        Scheduled for {subscriptionStatus?.pendingPlanStartsAt ? new Date(subscriptionStatus.pendingPlanStartsAt).toLocaleDateString() : 'plan expiry'}
                      </p>
                    </div>
                  ) : hasPendingPlan ? (
                    <button
                      disabled
                      className="block w-full text-center py-3 rounded-lg font-semibold mb-8 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                    >
                      Plan Change Pending
                    </button>
                  ) : canChangeToPlan ? (
                    <div>
                      <button
                        onClick={() => router.push(`/subscribe/${plan.id}`)}
                        className="block w-full text-center py-3 rounded-lg font-semibold mb-4 bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                      >
                        Change Plan
                      </button>
                      <p className="text-xs text-amber-700 dark:text-amber-400 text-center font-medium">
                        ⏳ Activates after current plan ends
                      </p>
                    </div>
                  ) : plan.id === 'free' ? (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="block w-full text-center py-3 rounded-lg font-semibold mb-8 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {isPremium ? 'Current Features' : "You're on Free"}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/subscribe/${plan.id}`)}
                      className="block w-full text-center py-3 rounded-lg font-semibold mb-8 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      {plan.cta}
                    </button>
                  )}

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
            );
          })}
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
                a: 'Yes, change your plan anytime. When upgrading, new plan activates after current plan ends.',
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

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading pricing...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
