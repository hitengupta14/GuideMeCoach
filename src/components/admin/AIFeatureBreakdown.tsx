'use client'

interface Feature {
  feature: string
  count: number
  cost: number
}

export default function AIFeatureBreakdown({ features }: { features: Feature[] }) {
  const total = features.reduce((sum, f) => sum + f.count, 0)

  const getFeatureColor = (feature: string) => {
    const colors: Record<string, string> = {
      planner: 'bg-blue-500',
      chat: 'bg-green-500',
      recommendations: 'bg-purple-500',
      insights: 'bg-orange-500',
    }
    return colors[feature] || 'bg-gray-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Usage by Feature
      </h3>
      
      <div className="space-y-4">
        {features.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No AI usage data yet
          </p>
        ) : (
          features.map((feature) => {
            const percentage = (feature.count / total) * 100
            return (
              <div key={feature.feature}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getFeatureColor(feature.feature)}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {feature.feature}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.count.toLocaleString()} requests
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${feature.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getFeatureColor(feature.feature)} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
