'use client'

import { 
  UsersIcon, 
  UserGroupIcon, 
  BoltIcon, 
  BeakerIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

interface Stats {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  newUsersThisWeek: number
  totalWorkouts: number
  workoutsThisWeek: number
  totalExercises: number
  aiRequestsToday: number
}

export default function DashboardStats({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: `+${stats.newUsersThisWeek} this week`,
      icon: UsersIcon,
      color: 'bg-blue-500',
      trend: 'up',
    },
    {
      title: 'Active Users (30d)',
      value: stats.activeUsers.toLocaleString(),
      change: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total`,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      trend: 'up',
    },
    {
      title: 'Premium Users',
      value: stats.premiumUsers.toLocaleString(),
      change: `${Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% conversion`,
      icon: BoltIcon,
      color: 'bg-purple-500',
      trend: 'up',
    },
    {
      title: 'Total Exercises',
      value: stats.totalExercises.toLocaleString(),
      change: 'In database',
      icon: BeakerIcon,
      color: 'bg-orange-500',
      trend: null,
    },
    {
      title: 'Workouts Logged',
      value: stats.totalWorkouts.toLocaleString(),
      change: `${stats.workoutsThisWeek} this week`,
      icon: ArrowTrendingUpIcon,
      color: 'bg-pink-500',
      trend: 'up',
    },
    {
      title: 'AI Requests Today',
      value: stats.aiRequestsToday.toLocaleString(),
      change: 'Monitor costs',
      icon: BoltIcon,
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
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {card.value}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {card.trend === 'up' && (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                )}
                {card.trend === 'down' && (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.change}
                </p>
              </div>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
