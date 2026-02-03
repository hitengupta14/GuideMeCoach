import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exerciseAlternatives, exercises, jointInvolvement, painEntries, users, userMedicalHistory } from '@/db/schema'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function normalizeEquipment(values: unknown): string[] {
  const raw = Array.isArray(values) ? values : []
  const out = new Set<string>()

  const mapOne = (v: unknown) => {
    if (typeof v !== 'string') return
    const s = v.trim().toLowerCase()
    if (!s) return

    const mapping: Record<string, string> = {
      dumbbells: 'dumbbell',
      dumbbell: 'dumbbell',
      barbell: 'barbell',
      kettlebells: 'kettlebell',
      kettlebell: 'kettlebell',
      resistance_bands: 'resistance_band',
      resistance_band: 'resistance_band',
      bands: 'resistance_band',
      band: 'resistance_band',
      machine: 'machine',
      machines: 'machine',
      cable: 'cable',
      cable_machine: 'cable',
      pullupbar: 'pull_up_bar',
      pull_up_bar: 'pull_up_bar',
      pullup_bar: 'pull_up_bar',
      bench: 'bench',
      none: 'none',
    }

    out.add(mapping[s] || s)
  }

  raw.forEach(mapOne)
  return Array.from(out)
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exerciseId = request.nextUrl.searchParams.get('exerciseId')
    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId is required' }, { status: 400 })
    }

    const [user] = await db
      .select({
        preferredLocation: users.preferredLocation,
        availableEquipment: users.availableEquipment,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const [medical] = await db
      .select({
        affectedJoints: userMedicalHistory.affectedJoints,
        excludeHighImpactActivities: userMedicalHistory.excludeHighImpactActivities,
        excludeHeavyLifting: userMedicalHistory.excludeHeavyLifting,
        excludeOverheadMovements: userMedicalHistory.excludeOverheadMovements,
      })
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1)

    const [recentPain] = await db
      .select({ joints: painEntries.joints })
      .from(painEntries)
      .where(eq(painEntries.userId, userId))
      .orderBy(desc(painEntries.recordedAt))
      .limit(1)

    const painJoints = Object.entries((recentPain?.joints || {}) as Record<string, number>)
      .filter(([, level]) => typeof level === 'number' && level >= 5)
      .map(([joint]) => joint)

    const affectedJoints = Array.from(
      new Set([...(medical?.affectedJoints || []), ...painJoints])
    ) as string[]

    const alternatives = await db
      .select({
        type: exerciseAlternatives.type,
        alternativeId: exercises.id,
        name: exercises.name,
        slug: exercises.slug,
        category: exercises.category,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        location: exercises.location,
      })
      .from(exerciseAlternatives)
      .innerJoin(exercises, eq(exerciseAlternatives.alternativeId, exercises.id))
      .where(eq(exerciseAlternatives.exerciseId, exerciseId))

    let filtered = alternatives

    // Location filter (if user has a preference)
    const location = (user?.preferredLocation || 'both') as string
    if (location !== 'both') {
      filtered = filtered.filter((a) => a.location === 'both' || a.location === location)
    }

    // Equipment filter (best-effort normalization)
    const equipment = normalizeEquipment(user?.availableEquipment)
    if (equipment.length > 0) {
      filtered = filtered.filter((a) => {
        const exEq = (a.equipment || []) as unknown as string[]
        if (exEq.includes('none')) return true
        return exEq.some((e) => equipment.includes(String(e)))
      })
    }

    // Joint safety filter (exclude "high involvement" exercises for affected joints)
    if (affectedJoints.length > 0 && filtered.length > 0) {
      const altIds = filtered.map((a) => a.alternativeId)
      const highRisk = await db
        .select({ exerciseId: jointInvolvement.exerciseId })
        .from(jointInvolvement)
        .where(
          and(
            inArray(jointInvolvement.exerciseId, altIds),
            inArray(jointInvolvement.joint, affectedJoints as any[]),
            eq(jointInvolvement.involvementLevel, 'high')
          )
        )

      const excludeIds = new Set(highRisk.map((r) => r.exerciseId))
      filtered = filtered.filter((a) => !excludeIds.has(a.alternativeId))
    }

    // Heuristic movement restrictions (same rules as filtered-exercises route, scoped to alternatives only)
    if (medical?.excludeHighImpactActivities) {
      filtered = filtered.filter((a) => {
        const text = `${a.name}`.toLowerCase()
        return !(text.includes('running') || text.includes('jump') || text.includes('plyometric') || text.includes('high-impact'))
      })
    }
    if (medical?.excludeHeavyLifting) {
      filtered = filtered.filter((a) => {
        const text = `${a.name}`.toLowerCase()
        return !(text.includes('deadlift') || text.includes('heavy') || text.includes('max'))
      })
    }
    if (medical?.excludeOverheadMovements) {
      filtered = filtered.filter((a) => {
        const text = `${a.name}`.toLowerCase()
        return !(text.includes('overhead') || text.includes('shoulder press') || text.includes('pull-up'))
      })
    }

    return NextResponse.json({
      options: filtered,
      meta: {
        total: alternatives.length,
        returned: filtered.length,
        affectedJoints,
      },
    })
  } catch (error) {
    console.error('Swap options error:', error)
    return NextResponse.json({ error: 'Failed to load swap options' }, { status: 500 })
  }
}
