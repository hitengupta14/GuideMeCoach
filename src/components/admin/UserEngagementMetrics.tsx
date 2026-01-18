'use client'

export default function UserEngagementMetrics() {
  // This would fetch real data in production
  const metrics = [
    { label: 'Daily Active Users', value: '1,234', trend: '+12%' },
    { label: 'Weekly Active Users', value: '3,456', trend: '+8%' },
    { label: 'Avg Session Duration', value: '24 min', trend: '+5%' },
    { label: 'Feature Adoption Rate', value: '67%', trend: '+3%' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        User Engagement
      </h3>
      
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50"
          >
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metric.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metric.value}
              </p>
            </div>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {metric.trend}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
