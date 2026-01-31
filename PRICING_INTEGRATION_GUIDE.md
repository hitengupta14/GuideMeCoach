# Pricing Page Integration Example

## Add Regional Pricing Selector to Your Pricing Page

Here's how to integrate the new regional pricing system into your existing pricing page:

### 1. Import the Component

```tsx
import { PricingRegionSelector } from '@/components/PricingRegionSelector'
```

### 2. Add State for Selected Region

```tsx
'use client'

import { useState } from 'react'

export default function PricingPage() {
  const [selectedRegion, setSelectedRegion] = useState<'india' | 'international'>('india')
  
  // ...rest of your component
}
```

### 3. Add the Selector Above Your Pricing Cards

```tsx
<div className="max-w-4xl mx-auto px-4 py-12">
  {/* Regional Pricing Selector */}
  <PricingRegionSelector
    defaultRegion="india"
    onRegionChange={setSelectedRegion}
    className="mb-8"
  />

  {/* Your existing pricing cards */}
  <div className="grid md:grid-cols-2 gap-6">
    <PricingCard
      title="Premium Monthly"
      price={selectedRegion === 'india' ? '₹299' : '$5'}
      features={[...]}
      onSubscribe={() => handleSubscribe('premium')}
    />
    <PricingCard
      title="Premium Yearly"
      price={selectedRegion === 'india' ? '₹2,990' : '$50'}
      features={[...]}
      onSubscribe={() => handleSubscribe('premium-yearly')}
    />
  </div>
</div>
```

### 4. Update Your Subscribe Handler

```tsx
async function handleSubscribe(planType: 'premium' | 'premium-yearly') {
  try {
    const response = await fetch('/api/v1/subscription/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        planType,
        displayRegion: selectedRegion, // Pass for analytics
      }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    // Show pricing reason if different from selected
    if (data.data.pricing.tier !== selectedRegion) {
      alert(data.data.pricing.reason)
    }

    // Open Razorpay checkout with server-decided amount
    const options = {
      key: data.data.keyId,
      amount: data.data.amount,
      currency: data.data.currency,
      name: 'GuideMeCoach Premium',
      description: data.data.plan.name,
      order_id: data.data.orderId,
      handler: function (response: any) {
        // Payment success - show confirmation
        console.log('Payment successful:', response)
        window.location.href = '/dashboard?payment=success'
      },
      prefill: {
        name: data.data.userDetails.name,
        email: data.data.userDetails.email,
      },
      theme: {
        color: '#667eea',
      },
    }

    const razorpay = new (window as any).Razorpay(options)
    razorpay.open()
  } catch (error) {
    console.error('Subscription error:', error)
    alert('Failed to create subscription. Please try again.')
  }
}
```

### 5. Add Razorpay Script to Layout

In your root layout or pricing page:

```tsx
<Script
  src="https://checkout.razorpay.com/v1/checkout.js"
  strategy="lazyOnload"
/>
```

---

## Full Working Example

```tsx
'use client'

import { useState } from 'react'
import Script from 'next/script'
import { PricingRegionSelector } from '@/components/PricingRegionSelector'

export default function PricingPage() {
  const [selectedRegion, setSelectedRegion] = useState<'india' | 'international'>('india')
  const token = localStorage.getItem('token')

  async function handleSubscribe(planType: 'premium' | 'premium-yearly') {
    if (!token) {
      window.location.href = '/login?redirect=/pricing'
      return
    }

    try {
      const response = await fetch('/api/v1/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planType,
          displayRegion: selectedRegion,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Alert if pricing differs from selection
      if (data.data.pricing.tier !== selectedRegion) {
        alert(`⚠️ ${data.data.pricing.reason}`)
      }

      // Open Razorpay checkout
      const options = {
        key: data.data.keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        name: 'GuideMeCoach Premium',
        description: data.data.plan.name,
        order_id: data.data.orderId,
        handler: function (response: any) {
          window.location.href = '/dashboard?payment=success'
        },
        prefill: {
          name: data.data.userDetails.name,
          email: data.data.userDetails.email,
        },
        theme: {
          color: '#667eea',
        },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to create subscription. Please try again.')
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">
          Choose Your Plan
        </h1>

        <PricingRegionSelector
          defaultRegion="india"
          onRegionChange={setSelectedRegion}
          className="mb-8"
        />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <div className="border rounded-lg p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-bold mb-2">Premium Monthly</h3>
            <div className="text-4xl font-bold mb-4">
              {selectedRegion === 'india' ? '₹299' : '$5'}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li>✓ AI Workout Planner (2/month)</li>
              <li>✓ AI Chat Support (25 msgs/month)</li>
              <li>✓ Weekly AI Insights</li>
              <li>✓ Priority Support</li>
            </ul>
            <button
              onClick={() => handleSubscribe('premium')}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
            >
              Subscribe Now
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="border rounded-lg p-6 hover:shadow-lg transition border-purple-500">
            <div className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
              BEST VALUE
            </div>
            <h3 className="text-xl font-bold mb-2">Premium Yearly</h3>
            <div className="text-4xl font-bold mb-4">
              {selectedRegion === 'india' ? '₹2,990' : '$50'}
              <span className="text-sm font-normal text-gray-500">/year</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li>✓ All Premium Features</li>
              <li>✓ Unlimited AI Features</li>
              <li>✓ Early Access to New Features</li>
              <li>✓ Save {selectedRegion === 'india' ? '16%' : '16%'}</li>
            </ul>
            <button
              onClick={() => handleSubscribe('premium-yearly')}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
```

---

## Notes

1. **Display-Only Region**: The selector is for display purposes. The backend decides the final price.
2. **Transparent Alerts**: If the final tier differs from the selected region, show an alert with the reason.
3. **Razorpay Script**: Load the Razorpay checkout script before opening the modal.
4. **Auth Check**: Redirect to login if user is not authenticated.
5. **Success Redirect**: Redirect to dashboard with `?payment=success` query param to show confirmation.

---

## Testing

1. Select "India" → Subscribe → Verify ₹299 in Razorpay modal
2. Select "International" → Subscribe → Verify backend-decided amount (may differ if card is Indian)
3. Complete payment → Check confirmation email for pricing reason
4. Check DB → Verify `billing_country` and `pricing_tier` are set

---

Ready to integrate! 🚀
