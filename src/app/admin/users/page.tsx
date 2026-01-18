import { db } from '@/db'
import { users, workoutSessions } from '@/db/schema'
import { sql, eq, gte, desc, or, like, and } from 'drizzle-orm'
import UserManagementTable from '@/components/admin/UserManagementTable'

interface SearchParams {
  search?: string
  filter?: string
  page?: string
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const search = searchParams.search || ''
  const filter = searchParams.filter || 'all'
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20

  // Build where conditions
  const whereConditions = []

  if (search) {
    whereConditions.push(
      or(
        like(users.email, `%${search}%`),
        like(users.name, `%${search}%`)
      )
    )
  }

  // Apply additional filters
  switch (filter) {
    case 'premium':
      whereConditions.push(eq(users.isPremium, true))
      break
    case 'admin':
      whereConditions.push(eq(users.isAdmin, true))
      break
    case 'unverified':
      whereConditions.push(eq(users.emailVerified, false))
      break
  }

  // Execute query
  let allUsers: any[] = []
  if (whereConditions.length > 0) {
    allUsers = await db
      .select()
      .from(users)
      .where(and(...whereConditions))
      .orderBy(desc(users.createdAt))
  } else {
    allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
  }

  // Get total count
  const totalUsers = allUsers.length

  // Paginate
  const startIndex = (page - 1) * pageSize
  const paginatedUsers = allUsers.slice(startIndex, startIndex + pageSize)

  // Get activity stats for each user
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const usersWithStats = await Promise.all(
    paginatedUsers.map(async (user) => {
      const workoutCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(workoutSessions)
        .where(
          sql`${workoutSessions.userId} = ${user.id} AND ${workoutSessions.completedAt} >= ${thirtyDaysAgo}`
        )

      return {
        ...user,
        recentWorkouts: workoutCount[0]?.count || 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          User Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage all users, view activity, and perform administrative actions.
        </p>
      </div>

      <UserManagementTable
        users={usersWithStats}
        totalUsers={totalUsers}
        currentPage={page}
        pageSize={pageSize}
        searchTerm={search}
        filter={filter}
      />
    </div>
  )
}
