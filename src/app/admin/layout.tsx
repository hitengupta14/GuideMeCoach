import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/get-current-user'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Skip auth during build time
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    return <div>{children}</div>
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  console.log('[AdminLayout] Session cookie check:', {
    exists: !!sessionCookie?.value,
    value: sessionCookie?.value ? '(redacted)' : 'missing',
  })

  console.log('[AdminLayout] Cookie names:', cookieStore.getAll().map(c => c.name))

  const user = await getCurrentUser()

  if (!user) {
    console.error('[AdminLayout] User not authenticated')
    console.log('[AdminLayout] Session cookie:', sessionCookie?.value ? 'exists' : 'missing')
    redirect('/auth/login?redirect=%2Fadmin')
  }

  if (!user.isAdmin) {
    console.error('[AdminLayout] User is not admin:', user.id)
    redirect('/dashboard?error=not_admin')
  }

  console.log('[AdminLayout] Admin user verified:', { id: user.id, email: user.email, role: user.adminRole })

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
