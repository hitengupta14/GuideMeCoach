'use client'

import { useState } from 'react'

interface PricingRegionSelectorProps {
  defaultRegion?: 'india' | 'international'
  onRegionChange?: (region: 'india' | 'international') => void
  className?: string
}

export function PricingRegionSelector({
  defaultRegion = 'india',
  onRegionChange,
  className = '',
}: PricingRegionSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState<'india' | 'international'>(defaultRegion)

  const handleChange = (region: 'india' | 'international') => {
    setSelectedRegion(region)
    onRegionChange?.(region)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="pricing-region"
            checked={selectedRegion === 'india'}
            onChange={() => handleChange('india')}
            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
          />
          <span className="font-medium">India (₹299/mo • ₹2,499/yr)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="pricing-region"
            checked={selectedRegion === 'international'}
            onChange={() => handleChange('international')}
            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
          />
          <span className="font-medium">International ($5/mo • $49/yr)</span>
        </label>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
        <p className="font-semibold mb-1">ℹ Important</p>
        <p>
          This selection is for <strong>display preview only</strong>. The final price is decided server-side based on your detected country at checkout.
          Razorpay charges in <strong>INR</strong>; international prices are displayed in <strong>USD</strong>for convenience and are billed as INR equivalents.
          {selectedRegion === 'international' && (
            <span className="block mt-1">
              If you're in India at checkout, Indian pricing (₹299/mo) will be applied automatically.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
