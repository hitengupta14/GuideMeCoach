import { redirect } from 'next/navigation'
import { getCurrentAdminUser } from '@/lib/get-current-user'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Skip auth during build time
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    return <div>{children}</div>
  }

  const user = await getCurrentAdminUser()

  if (!user) {
    redirect('/auth/login?redirect=/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader user={user} />
      <div className="flex">
        <AdminSidebar role={user.adminRole as any} />
        <main className="flex-1 p-8 ml-64">
          {children}
        </main>
      </div>
    </div>
  )
}
