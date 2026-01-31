export type PricingTier = 'india' | 'international'

export type PlanType = 'premium' | 'premium-yearly'

export interface PricingDecision {
  amountPaise: number
  currency: 'INR' | 'USD' | 'EUR'
  tier: PricingTier
  reason?: string
}

function inferTierFromCountry(countryCode?: string | null): PricingTier {
  if (!countryCode) return 'international'
  const code = countryCode.trim().toUpperCase()
  return code === 'IN' ? 'india' : 'international'
}

export function decidePricing(options: {
  planType: PlanType
  billingCountry?: string | null
  lockedTier?: PricingTier | null
}): PricingDecision {
  const tier = options.lockedTier ?? inferTierFromCountry(options.billingCountry)

  // Amounts in paise (smallest unit) for Razorpay
  // India: ₹299/month; International: equivalent monthly in INR for now
  const INDIA_MONTHLY_PAISE = 29900
  const INTERNATIONAL_MONTHLY_PAISE = 41500 // Approx for $5 equivalent in INR

  let amountPaise = INDIA_MONTHLY_PAISE
  if (tier === 'international') {
    amountPaise = INTERNATIONAL_MONTHLY_PAISE
  }

  if (options.planType === 'premium-yearly') {
    // 12x monthly; simple scaling; discounting can be applied later server-side
    amountPaise = amountPaise * 12
  }

  const reason = tier === 'international'
    ? 'International pricing applied based on your payment method.'
    : 'India pricing applied based on your payment method.'

  return {
    amountPaise,
    currency: 'INR',
    tier,
    reason,
  }
}
