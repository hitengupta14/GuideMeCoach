import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// In-memory storage for demo (replace with database in production)
const sorenessData: Record<string, Array<{
  date: string
  areas: Record<string, number>
  notes?: string
}>> = {}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = verified.payload.userId as string
    const { days = '30' } = Object.fromEntries(new URL(req.url).searchParams)

    const userSoreness = sorenessData[userId] || []
    const recentDays = parseInt(days as string)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - recentDays)

    const filteredSoreness = userSoreness.filter(
      entry => new Date(entry.date) >= cutoffDate
    )

    // Calculate average soreness by body part
    const bodyPartAverages: Record<string, number[]> = {}
    filteredSoreness.forEach(entry => {
      Object.entries(entry.areas).forEach(([part, level]) => {
        if (!bodyPartAverages[part]) {
          bodyPartAverages[part] = []
        }
        bodyPartAverages[part].push(level)
      })
    })

    const averageSoreness = Object.entries(bodyPartAverages).reduce(
      (acc, [part, levels]) => {
        const avg = levels.length > 0 ? (levels.reduce((a, b) => a + b, 0) / levels.length) : 0
        acc[part] = avg.toFixed(1)
        return acc
      },
      {} as Record<string, string>
    )

    return Response.json({
      soreness: filteredSoreness,
      averageSoreness,
      trend: 'stable', // Could be 'improving', 'worsening'
    })
  } catch (error) {
    console.error('Soreness fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch soreness data' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = verified.payload.userId as string
    const { areas, notes } = await req.json()

    if (!areas || typeof areas !== 'object') {
      return Response.json(
        { error: 'areas object is required (e.g., {chest: 5, shoulders: 3})' },
        { status: 400 }
      )
    }

    // Validate pain levels (1-10)
    for (const [_, level] of Object.entries(areas)) {
      if (typeof level !== 'number' || level < 0 || level > 10) {
        return Response.json(
          { error: 'Pain levels must be between 0-10' },
          { status: 400 }
        )
      }
    }

    if (!sorenessData[userId]) {
      sorenessData[userId] = []
    }

    const sorenessEntry = {
      date: new Date().toISOString(),
      areas,
      notes,
    }

    sorenessData[userId].push(sorenessEntry)

    return Response.json({
      success: true,
      message: 'Soreness recorded',
      entry: sorenessEntry,
    })
  } catch (error) {
    console.error('Soreness update error:', error)
    return Response.json(
      { error: 'Failed to record soreness' },
      { status: 500 }
    )
  }
}
