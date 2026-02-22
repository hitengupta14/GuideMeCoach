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
  // India: ₹299/month; ₹2,499/year (discounted)
  // International: USD display pricing ($5/mo, $49/yr) charged as an INR equivalent for Razorpay.
  const INDIA_MONTHLY_PAISE = 29900
  const INDIA_YEARLY_PAISE = 249900
  const INTERNATIONAL_MONTHLY_PAISE = 41500 // Approx for $5 equivalent in INR
  const INTERNATIONAL_YEARLY_PAISE = 406700 // Approx for $49 equivalent in INR

  const amountPaise =
    tier === 'international'
      ? options.planType === 'premium-yearly'
        ? INTERNATIONAL_YEARLY_PAISE
        : INTERNATIONAL_MONTHLY_PAISE
      : options.planType === 'premium-yearly'
        ? INDIA_YEARLY_PAISE
        : INDIA_MONTHLY_PAISE

  const reason = tier === 'international'
    ? 'International pricing applied based on your detected country.'
    : 'India pricing applied based on your detected country.'

  return {
    amountPaise,
    currency: 'INR',
    tier,
    reason,
  }
}
