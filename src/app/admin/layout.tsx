import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/get-current-user'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login?redirect=%2Fadmin')
  }

  if (!user.isAdmin) {
    redirect('/dashboard?error=not_admin')
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
