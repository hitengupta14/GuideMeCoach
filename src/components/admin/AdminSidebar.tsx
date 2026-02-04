'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UsersIcon, 
  BeakerIcon, 
  ChartBarIcon, 
  CpuChipIcon, 
  BanknotesIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { getAdminPermissions } from '@/lib/admin-permissions'

interface AdminSidebarProps {
  role: 'super_admin' | 'content_admin' | 'support_admin'
}

export default function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname()
  const permissions = getAdminPermissions(role)

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon, show: true },
    { 
      name: 'Users', 
      href: '/admin/users', 
      icon: UsersIcon, 
      show: permissions.canManageUsers || permissions.canViewAnalytics 
    },
    { 
      name: 'Exercises', 
      href: '/admin/exercises', 
      icon: BeakerIcon, 
      show: permissions.canManageExercises 
    },
    { 
      name: 'Analytics', 
      href: '/admin/analytics', 
      icon: ChartBarIcon, 
      show: permissions.canViewAnalytics 
    },
    {
      name: 'Metrics',
      href: '/admin/metrics',
      icon: ChartBarIcon,
      show: permissions.canViewAnalytics,
    },
    { 
      name: 'AI Monitoring', 
      href: '/admin/ai-monitoring', 
      icon: CpuChipIcon, 
      show: permissions.canViewAnalytics 
    },
    { 
      name: 'Subscriptions', 
      href: '/admin/subscriptions', 
      icon: BanknotesIcon, 
      show: permissions.canManageSubscriptions 
    },
    { 
      name: 'Email Campaigns', 
      href: '/admin/emails', 
      icon: EnvelopeIcon, 
      show: permissions.canManageUsers 
    },
    { 
      name: 'Activity Logs', 
      href: '/admin/logs', 
      icon: DocumentTextIcon, 
      show: true 
    },
    { 
      name: 'Audit Logs', 
      href: '/admin/audit-logs', 
      icon: DocumentTextIcon, 
      show: permissions.canManageUsers 
    },
    { 
      name: 'Admin Users', 
      href: '/admin/admin-users', 
      icon: ShieldCheckIcon, 
      show: permissions.canManageAdmins 
    },
    { 
      name: 'Settings', 
      href: '/admin/settings', 
      icon: Cog6ToothIcon, 
      show: permissions.canManageSystem 
    },
  ].filter(item => item.show)

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
