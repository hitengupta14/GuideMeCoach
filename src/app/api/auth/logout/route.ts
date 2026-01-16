import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    const cookieStore = cookies()
    
    // Delete the session cookie
    cookieStore.delete('session')
    
    logger.info('User logged out')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Logout error', error as Error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
