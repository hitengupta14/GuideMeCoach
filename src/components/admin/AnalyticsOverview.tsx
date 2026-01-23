'use client'

import { 
  UsersIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BeakerIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

interface Metrics {
  users: {
    total: number
    new30Days: number
    new7Days: number
    active30Days: number
    premium: number
    unverified: number
  }
  workouts: {
    total: number
    last30Days: number
    last7Days: number
    avgDuration: number
  }
  plans: {
    total: number
    active: number
  }
  ai: {
    requests30Days: number
    cost30Days: number
  }
  content: {
    exercises: number
  }
}

export default function AnalyticsOverview({ metrics }: { metrics: Metrics }) {
  const cards = [
    {
      title: 'Total Users',
      value: metrics.users.total.toLocaleString(),
      change: `+${metrics.users.new7Days} this week`,
      subtext: `${metrics.users.active30Days} active (30d)`,
      icon: UsersIcon,
      color: 'bg-blue-500',
      trend: 'up',
    },
    {
      title: 'Premium Conversion',
      value: `${((metrics.users.premium / metrics.users.total) * 100).toFixed(1)}%`,
      change: `${metrics.users.premium} premium users`,
      subtext: `${metrics.users.unverified} unverified emails`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      trend: 'up',
    },
    {
      title: 'Workouts Logged',
      value: metrics.workouts.total.toLocaleString(),
      change: `${metrics.workouts.last7Days} this week`,
      subtext: `Avg ${metrics.workouts.avgDuration} min/workout`,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      trend: 'up',
    },
    {
      title: 'Active Plans',
      value: metrics.plans.active.toLocaleString(),
      change: `${metrics.plans.total} total created`,
      subtext: `${((metrics.plans.active / metrics.users.total) * 100).toFixed(1)}% of users`,
      icon: BeakerIcon,
      color: 'bg-orange-500',
      trend: null,
    },
    {
      title: 'AI Requests (30d)',
      value: metrics.ai.requests30Days.toLocaleString(),
      change: `$${metrics.ai.cost30Days.toFixed(2)} cost`,
      subtext: `Avg ${(metrics.ai.requests30Days / 30).toFixed(0)}/day`,
      icon: ChartBarIcon,
      color: 'bg-pink-500',
      trend: 'up',
    },
    {
      title: 'Exercise Library',
      value: metrics.content.exercises.toLocaleString(),
      change: 'Total exercises',
      subtext: 'Content database',
      icon: BeakerIcon,
      color: 'bg-yellow-500',
      trend: null,
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
          
          <div className="flex items-center gap-2 mb-1">
            {card.trend === 'up' && (
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
            )}
            {card.trend === 'down' && (
              <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {card.change}
            </p>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {card.subtext}
          </p>
        </div>
      ))}
    </div>
  )
}
