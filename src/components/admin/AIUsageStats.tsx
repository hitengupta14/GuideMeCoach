'use client'

import {
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface Stats {
  requests: {
    total: number
    today: number
    last7Days: number
    last30Days: number
  }
  success: {
    successful: number
    failed: number
    rate: number
  }
  costs: {
    total: number
    today: number
    last7Days: number
    last30Days: number
  }
  tokens: {
    total: number
  }
  performance: {
    avgResponseTime: number
  }
}

export default function AIUsageStats({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: 'Total AI Requests',
      value: stats.requests.total.toLocaleString(),
      subtext: `${stats.requests.today} today | ${stats.requests.last7Days} this week`,
      icon: BoltIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Success Rate',
      value: `${stats.success.rate.toFixed(1)}%`,
      subtext: `${stats.success.successful.toLocaleString()} successful | ${stats.success.failed.toLocaleString()} failed`,
      icon: CheckCircleIcon,
      color: stats.success.rate >= 95 ? 'bg-green-500' : 'bg-yellow-500',
    },
    {
      title: 'Total Cost',
      value: `$${stats.costs.total.toFixed(2)}`,
      subtext: `$${stats.costs.today.toFixed(2)} today | $${stats.costs.last30Days.toFixed(2)} (30d)`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Tokens Used',
      value: (stats.tokens.total / 1000).toFixed(1) + 'K',
      subtext: `Across all AI features`,
      icon: BoltIcon,
      color: 'bg-orange-500',
    },
    {
      title: 'Avg Response Time',
      value: `${(stats.performance.avgResponseTime / 1000).toFixed(2)}s`,
      subtext: 'Across all requests',
      icon: ClockIcon,
      color: stats.performance.avgResponseTime < 3000 ? 'bg-green-500' : 'bg-yellow-500',
    },
    {
      title: 'Daily Average Cost',
      value: `$${(stats.costs.last30Days / 30).toFixed(2)}`,
      subtext: 'Based on last 30 days',
      icon: CurrencyDollarIcon,
      color: 'bg-pink-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {card.title}
            </p>
            <div className={`${card.color} p-2 rounded-lg`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {card.value}
          </p>
          
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {card.subtext}
          </p>
        </div>
      ))}
    </div>
  )
}
