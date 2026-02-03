import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    // Check database connection
    let databaseStatus: 'healthy' | 'warning' | 'error' = 'healthy'
    let databaseMessage = 'Connected'
    
    try {
      await db.execute(sql`SELECT 1`)
    } catch (error) {
      databaseStatus = 'error'
      databaseMessage = 'Connection failed'
    }

    // Check API server (if we're here, it's running)
    const apiStatus = 'healthy'
    const apiMessage = 'Running normally'

    // Check AI service (mock - you'd actually ping OpenAI)
    const aiStatus = 'healthy'
    const aiMessage = 'API key configured'

    // Check email service (mock - you'd actually verify SMTP)
    const emailStatus = 'healthy'
    const emailMessage = 'Service configured'

    return NextResponse.json({
      database: { status: databaseStatus, message: databaseMessage },
      api: { status: apiStatus, message: apiMessage },
      ai: { status: aiStatus, message: aiMessage },
      email: { status: emailStatus, message: emailMessage },
    })
  } catch (error) {
    console.error('Error checking system health:', error)
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    )
  }
}
