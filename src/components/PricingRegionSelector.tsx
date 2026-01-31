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
          <span className="font-medium">India Pricing (₹299/month)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="pricing-region"
            checked={selectedRegion === 'international'}
            onChange={() => handleChange('international')}
            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
          />
          <span className="font-medium">International Pricing ($5/month)</span>
        </label>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
        <p className="font-semibold mb-1">ℹ️ Important</p>
        <p>
          This selection is for <strong>display purposes only</strong>. The final price is determined by your payment method (card issuing country).
          {selectedRegion === 'international' && (
            <span className="block mt-1">
              If your card is issued in India, Indian pricing (₹299) will be applied automatically.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
