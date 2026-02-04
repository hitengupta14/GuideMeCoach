import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, users, workoutPlans, aiResponseCache, userMedicalHistory, jointInvolvement } from '@/db/schema'
import { eq, and, ilike, inArray, desc, gt, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateWorkoutPlan, generateWorkoutPlanTemplate, getOpenAIModel, isOpenAIConfigured } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { verifySession } from '@/lib/auth-helpers'
import { hashAIRequest, getCachedAIResponse, cacheAIResponse } from '@/lib/ai-cache'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'
import type { WeeklyPlan } from '@/lib/planner/types'
import { filterByEquipment, filterByExperienceLevel, filterByGoal, filterByLocation, filterByMedicalConditions } from '@/lib/planner/filters'
import { sanitizePlanExercises } from '@/lib/planner/whitelist'

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 100)
}

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
      squat_rack: 'barbell',
      kettlebells: 'kettlebell',
      kettlebell: 'kettlebell',
      resistance_bands: 'resistance_band',
      resistance_band: 'resistance_band',
      bands: 'resistance_band',
      band: 'resistance_band',
      machine: 'machine',
      machines: 'machine',
      treadmill: 'machine',
      rowing_machine: 'machine',
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

function parseRestSeconds(rest: unknown): number {
  if (typeof rest === 'number' && Number.isFinite(rest)) return Math.max(0, Math.round(rest))
  if (typeof rest !== 'string') return 90
  const raw = rest.trim().toLowerCase()
  if (!raw) return 90

  // Common patterns: "90s", "90 sec", "2 min", "2mins", "120"
  const compact = raw.replace(/\s+/g, '')

  const minMatch = compact.match(/^(\d+(?:\.\d+)?)m(in)?s?$/)
  if (minMatch) {
    const minutes = Number(minMatch[1])
    if (Number.isFinite(minutes)) return Math.max(0, Math.round(minutes * 60))
  }

  const secMatch = compact.match(/^(\d+(?:\.\d+)?)s(ec(onds)?)?$/)
  if (secMatch) {
    const seconds = Number(secMatch[1])
    if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds))
  }

  const numeric = Number(compact)
  if (Number.isFinite(numeric)) return Math.max(0, Math.round(numeric))

  return 90
}

function splitFocusMuscles(focus: unknown): string[] {
  if (typeof focus !== 'string') return []
  const trimmed = focus.trim()
  if (!trimmed) return []
  // Split "Chest & Triceps", "Chest/Triceps", "Chest, Triceps"
  return trimmed
    .split(/,|\/|&| and /i)
    .map((s) => s.trim())
    .filter(Boolean)
}

type CatalogExercise = {
  id: string
  name: string
  slug: string
  category: string
  movementPattern: string[]
}

type PlanTemplate = {
  planName: string
  durationWeeks?: number
  description: string
  weeklyStructure: Array<{
    day: string
    focus: string
    exercises: Array<{
      category: string
      movementPattern?: string[]
      sets: number
      reps: string
      restSeconds?: unknown
      notes?: string
    }>
    totalDurationMinutes?: number
  }>
  progressionStrategy?: string
  deloadWeek?: string
  tips?: string[]
  tokensUsed?: number
}

function stableIndexFromHash(hashHex: string, modulo: number): number {
  if (modulo <= 1) return 0
  const slice = typeof hashHex === 'string' ? hashHex.slice(0, 8) : ''
  const n = Number.parseInt(slice, 16)
  if (!Number.isFinite(n) || n < 0) return 0
  return n % modulo
}

function matchesAnyMovementPattern(exercise: CatalogExercise, patterns: string[]): boolean {
  if (!Array.isArray(patterns) || patterns.length === 0) return true
  const exPatterns = Array.isArray(exercise.movementPattern) ? exercise.movementPattern : []
  if (exPatterns.length === 0) return false
  return patterns.some((p) => exPatterns.includes(p))
}

function pickExerciseForSlot(
  slot: PlanTemplate['weeklyStructure'][number]['exercises'][number],
  catalog: CatalogExercise[],
  usedIds: Set<string>,
  seed: { cacheKey: string; dayIndex: number; slotIndex: number }
): CatalogExercise {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('Exercise catalog is empty')
  }

  const category = typeof slot?.category === 'string' ? slot.category : ''
  const patterns = Array.isArray(slot?.movementPattern) ? slot.movementPattern : []

  const strict = catalog.filter((e) => String(e.category) === category && matchesAnyMovementPattern(e, patterns))
  const byCategory = catalog.filter((e) => String(e.category) === category)
  const byPattern = patterns.length > 0 ? catalog.filter((e) => matchesAnyMovementPattern(e, patterns)) : []

  let candidates = strict.length > 0 ? strict : byCategory.length > 0 ? byCategory : byPattern.length > 0 ? byPattern : catalog
  const unused = candidates.filter((e) => !usedIds.has(e.id))
  if (unused.length > 0) candidates = unused

  const pickHash = hashAIRequest('planner.slot.pick', {
    v: 1,
    cacheKey: seed.cacheKey,
    dayIndex: seed.dayIndex,
    slotIndex: seed.slotIndex,
    category,
    patterns: patterns.slice(0, 3),
    candidates: candidates.length,
  })

  const idx = stableIndexFromHash(pickHash, candidates.length)
  return candidates[idx]!
}

function resolveTemplateToCatalogPlan(template: PlanTemplate, catalog: CatalogExercise[], cacheKey: string, daysPerWeek: number, defaultDurationMinutes: number) {
  const usedIds = new Set<string>()
  const structure = Array.isArray(template?.weeklyStructure) ? template.weeklyStructure : []

  if (structure.length < daysPerWeek) {
    throw new Error(`AI plan template returned ${structure.length} days; expected ${daysPerWeek}`)
  }

  const weeklyStructure = structure.slice(0, daysPerWeek).map((day, dayIndex) => {
    const slots = Array.isArray(day?.exercises) ? day.exercises.slice(0, 6) : []
    if (slots.length === 0) {
      throw new Error(`AI plan template day "${day?.day || dayIndex + 1}" had no slots`)
    }

    const exercises = slots.map((slot, slotIndex) => {
      const picked = pickExerciseForSlot(slot, catalog, usedIds, { cacheKey, dayIndex, slotIndex })
      usedIds.add(picked.id)

      return {
        exerciseId: picked.id,
        sets: typeof slot?.sets === 'number' ? slot.sets : 3,
        reps: typeof slot?.reps === 'string' ? slot.reps : '8-12',
        restSeconds: parseRestSeconds(slot?.restSeconds),
        notes: typeof slot?.notes === 'string' ? slot.notes : undefined,
      }
    })

    return {
      day: typeof day?.day === 'string' ? day.day : `Day ${dayIndex + 1}`,
      focus: typeof day?.focus === 'string' ? day.focus : 'Workout',
      exercises,
      totalDurationMinutes:
        typeof day?.totalDurationMinutes === 'number' && Number.isFinite(day.totalDurationMinutes) && day.totalDurationMinutes > 0
          ? Math.round(day.totalDurationMinutes)
          : defaultDurationMinutes,
    }
  })

  return {
    planName: template.planName,
    durationWeeks: typeof template.durationWeeks === 'number' ? template.durationWeeks : 4,
    description: template.description,
    weeklyStructure,
    progressionStrategy: template.progressionStrategy,
    deloadWeek: template.deloadWeek,
    tips: Array.isArray(template.tips) ? template.tips : [],
  }
}

function summarizeAIError(error: unknown): {
  message: string
  status?: number
  code?: string | null
  type?: string
  requestId?: string
  retryable: boolean
  userMessage: string
} {
  const anyErr = error as any
  const status = typeof anyErr?.status === 'number' ? anyErr.status : undefined
  const code = typeof anyErr?.code === 'string' ? anyErr.code : anyErr?.code ?? undefined
  const type = typeof anyErr?.type === 'string' ? anyErr.type : undefined
  const requestId = typeof anyErr?.requestID === 'string' ? anyErr.requestID : undefined
  const message = typeof anyErr?.message === 'string' ? anyErr.message : String(error)

  const retryable =
    status === undefined ||
    status >= 500 ||
    (status === 429 && String(code || '').toLowerCase() !== 'insufficient_quota')

  const tags: string[] = []
  if (status !== undefined) tags.push(`OpenAI ${status}`)
  if (type) tags.push(type)
  if (code) tags.push(String(code))
  const prefix = tags.length > 0 ? `${tags.join(' ')}: ` : ''

  const safeMessage = message.length > 600 ? `${message.slice(0, 600)}…` : message
  const userMessage = `${prefix}${safeMessage}${requestId ? ` (requestId: ${requestId})` : ''}`

  return { message, status, code, type, requestId, retryable, userMessage }
}

async function findApprovedExerciseByName(
  exerciseName: string,
  memo: Map<string, { id: string; name: string; slug: string }>
): Promise<{ id: string; name: string; slug: string } | null> {
  const key = exerciseName.trim().toLowerCase()
  if (!key) return null
  const cached = memo.get(key)
  if (cached) return cached

  // Prefer slug match (stable)
  const s = slugify(exerciseName)
  if (s) {
    const bySlug = await db
      .select({ id: exercises.id, name: exercises.name, slug: exercises.slug })
      .from(exercises)
      .where(and(eq(exercises.reviewStatus, 'approved'), eq(exercises.slug, s)))
      .limit(1)
      .then((rows) => rows[0])
    if (bySlug?.id) {
      memo.set(key, bySlug)
      return bySlug
    }
  }

  // Case-insensitive exact match
  const exact = await db
    .select({ id: exercises.id, name: exercises.name, slug: exercises.slug })
    .from(exercises)
    .where(and(eq(exercises.reviewStatus, 'approved'), ilike(exercises.name, exerciseName.trim())))
    .limit(1)
    .then((rows) => rows[0])
  if (exact?.id) {
    memo.set(key, exact)
    return exact
  }

  // Partial match (best-effort)
  const partial = await db
    .select({ id: exercises.id, name: exercises.name, slug: exercises.slug })
    .from(exercises)
    .where(and(eq(exercises.reviewStatus, 'approved'), ilike(exercises.name, `%${exerciseName.trim()}%`)))
    .limit(1)
    .then((rows) => rows[0])
  if (partial?.id) {
    memo.set(key, partial)
    return partial
  }

  return null
}

async function buildWeeklyPlanFromAiPlan(
  aiPlan: any,
  options?: {
    allowedById?: Map<string, { id: string; name: string; slug: string }>
    allowedIds?: Set<string>
  }
): Promise<WeeklyPlan> {
  const weeklyStructure: any[] = Array.isArray(aiPlan?.weeklyStructure) ? aiPlan.weeklyStructure : []
  const nameMemo = new Map<string, { id: string; name: string; slug: string }>()

  // Build a lookup for referenced exercises (IDs only). Prefer provided catalog.
  const providedCatalog = options?.allowedById
  const referencedIds = new Set<string>()
  for (const day of weeklyStructure) {
    const exercisesForDay = Array.isArray(day?.exercises) ? day.exercises : []
    for (const ex of exercisesForDay) {
      const exId = typeof ex?.exerciseId === 'string' ? ex.exerciseId : typeof ex?.id === 'string' ? ex.id : null
      if (exId) referencedIds.add(exId)
    }
  }

  const catalogById =
    providedCatalog ??
    (referencedIds.size > 0
      ? new Map(
          (
            await db
              .select({ id: exercises.id, name: exercises.name, slug: exercises.slug })
              .from(exercises)
              .where(and(eq(exercises.reviewStatus, 'approved'), inArray(exercises.id, Array.from(referencedIds) as any)))
          ).map((r) => [r.id, r])
        )
      : new Map<string, { id: string; name: string; slug: string }>())

  return {
    weeks: [
      {
        weekNumber: 1,
        days: await Promise.all(
          weeklyStructure.map(async (day, idx) => {
            const exercisesForDay = Array.isArray(day?.exercises) ? day.exercises : []
            const mapped = await Promise.all(
              exercisesForDay.map(async (ex: any) => {
                const exerciseId =
                  typeof ex?.exerciseId === 'string'
                    ? ex.exerciseId
                    : typeof ex?.id === 'string'
                      ? ex.id
                      : null

                let resolved: { id: string; name: string; slug: string } | null = null

                if (exerciseId && (!options?.allowedIds || options.allowedIds.has(exerciseId))) {
                  resolved = catalogById.get(exerciseId) || null
                }

                if (!resolved) {
                  const name = typeof ex?.name === 'string' ? ex.name : ''
                  resolved = name ? await findApprovedExerciseByName(name, nameMemo) : null
                }

                if (!resolved) return null
                if (options?.allowedIds && !options.allowedIds.has(resolved.id)) return null

                return {
                  exerciseId: resolved.id,
                  exerciseName: resolved.name,
                  exerciseSlug: resolved.slug,
                  sets: typeof ex?.sets === 'number' ? ex.sets : 3,
                  reps: typeof ex?.reps === 'string' ? ex.reps : '8-12',
                  restSeconds: parseRestSeconds(ex?.restSeconds ?? ex?.rest),
                  notes: typeof ex?.notes === 'string' ? ex.notes : undefined,
                }
              })
            )

            const clean = mapped.filter(Boolean) as any[]
            if (clean.length === 0) {
              throw new Error(`AI plan day "${day?.day || idx + 1}" had no valid exercises after mapping`)
            }

            return {
              dayNumber: idx + 1,
              dayName: typeof day?.day === 'string' ? day.day : `Day ${idx + 1}`,
              focusMuscles: splitFocusMuscles(day?.focus),
              exercises: clean,
            }
          })
        ),
      },
    ],
  }
}

async function generatePlan(request: NextRequest) {
  try {
    // Rate limiting - stricter for AI endpoints
    const rateLimitResult = await aiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many AI workout generation requests. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter?.toString() || '3600' }
        }
      )
    }

    // Verify session
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

    const body = await request.json()
    const {
      goal,
      experienceLevel,
      daysPerWeek,
      equipment,
      medicalConditions,
      duration,
      preferredLocation: requestedPreferredLocation,
      weight: requestedWeight,
    } = body

    // Validation
    if (!goal || !experienceLevel || !daysPerWeek) {
      return NextResponse.json(
        { error: 'goal, experienceLevel, and daysPerWeek are required' },
        { status: 400 }
      )
    }

    if (daysPerWeek < 1 || daysPerWeek > 7) {
      return NextResponse.json(
        { error: 'daysPerWeek must be between 1 and 7' },
        { status: 400 }
      )
    }

    // Get user profile
    const [user] = await db
      .select({
        name: users.name,
        age: users.age,
        weight: users.weight,
        height: users.height,
        gender: users.gender,
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        availableEquipment: users.availableEquipment,
        preferredLocation: users.preferredLocation,
        timeAvailability: users.timeAvailability,
        medicalConditions: users.medicalConditions,
        painAreas: users.painAreas,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Allow AI plan generation even if profile is incomplete. Prefer request values when present.
    const missingProfileFields: string[] = []
    const requestEquipment = Array.isArray(equipment) ? equipment : []
    const requestWeight = typeof requestedWeight === 'number' && Number.isFinite(requestedWeight) ? requestedWeight : null
    const requestLocation =
      typeof requestedPreferredLocation === 'string' ? requestedPreferredLocation.trim().toLowerCase() : ''

    if (!user.weight && requestWeight === null) missingProfileFields.push('weight')
    if ((!user.availableEquipment || user.availableEquipment.length === 0) && requestEquipment.length === 0) {
      missingProfileFields.push('available equipment')
    }
    if (!user.preferredLocation && !requestLocation) missingProfileFields.push('preferred workout location')

    if (missingProfileFields.length > 0) {
      logger.info('AI planner requested with incomplete profile', { userId, missingProfileFields })
    }

    const normalizedRequestEquipment = normalizeEquipment(requestEquipment)
    const normalizedProfileEquipment = normalizeEquipment(user.availableEquipment)
    const availableEquipment = normalizedRequestEquipment.length > 0 ? normalizedRequestEquipment : normalizedProfileEquipment

    const preferredLocationCandidate = (requestLocation || user.preferredLocation || 'both') as string
    const preferredLocation =
      preferredLocationCandidate === 'home' ||
      preferredLocationCandidate === 'gym' ||
      preferredLocationCandidate === 'both'
        ? (preferredLocationCandidate as 'home' | 'gym' | 'both')
        : 'both'

    // We enforce Premium access for the AI planner (free quota is 0).
    if (!premium.isPremium) {
      return NextResponse.json(
        {
          error: 'AI planner not available on Free plan',
          message: 'Upgrade to Premium to access AI-powered workout plans. See /pricing for details.',
        },
        { status: 403 }
      )
    }

    // Load medical history before caching so we don't serve unsafe plans from cache.
    const [medicalData] = await db
      .select({
        medicalConditions: userMedicalHistory.medicalConditions,
        affectedJoints: userMedicalHistory.affectedJoints,
      })
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1)

    const storedMedicalConditions = (medicalData?.medicalConditions || []) as string[]
    const affectedJoints = (medicalData?.affectedJoints || []) as string[]
    const requestMedicalConditions = Array.isArray(medicalConditions) ? (medicalConditions as string[]) : []
    const profileMedicalConditions = (user.medicalConditions || []) as string[]

    const activeMedical = Array.from(
      new Set(
        [...storedMedicalConditions, ...profileMedicalConditions, ...requestMedicalConditions]
          .map((c) => (typeof c === 'string' ? c.trim().toLowerCase() : ''))
          .filter(Boolean)
      )
    )

    const equipmentForKey = [...availableEquipment].map((e) => String(e).trim().toLowerCase()).filter(Boolean).sort()
    const medicalForKey = [...activeMedical].sort()
    const jointsForKey = [...affectedJoints].map((j) => String(j).trim().toLowerCase()).filter(Boolean).sort()

    const effectiveWeight = requestWeight ?? (typeof user.weight === 'number' ? user.weight : null)
    const cacheKey = hashAIRequest('planner', {
      v: 2,
      userId,
      goal,
      experienceLevel,
      daysPerWeek,
      equipment: equipmentForKey,
      medicalConditions: medicalForKey,
      affectedJoints: jointsForKey,
      duration: duration || 60,
      preferredLocation,
      age: typeof user.age === 'number' ? user.age : null,
      weight: effectiveWeight,
      height: typeof user.height === 'number' ? user.height : null,
    })

    // Check cache first (7 days TTL for workout plans).
    const cachedPlan = await getCachedAIResponse(cacheKey, 168)
    
    if (cachedPlan) {
      logger.info('Using cached AI workout plan', { cacheKey, userId })

      try {
        const planData = await buildWeeklyPlanFromAiPlan(cachedPlan)

        // Save the cached plan to user's account
        const [savedPlan] = await db
          .insert(workoutPlans)
          .values({
            userId,
            name: cachedPlan.planName || `${goal} - ${daysPerWeek} days/week`,
            description: cachedPlan.description || `AI-generated ${goal} plan`,
            durationWeeks: typeof cachedPlan.durationWeeks === 'number' ? cachedPlan.durationWeeks : 4,
            planData: planData as any,
            isActive: false,
            updatedAt: new Date(),
          })
          .returning()

        // Cached responses don't incur an OpenAI call; do not burn quota.
        const quota = await checkQuota(userId, 'planner', premium.isPremium)

        return NextResponse.json({
          plan: savedPlan,
          aiDetails: cachedPlan,
          cached: true,
          quota: {
            used: quota.used,
            remaining: quota.remaining,
            limit: quota.limit,
            resetAt: quota.resetAt,
          },
        }, { status: 201 })
      } catch (cacheBuildError) {
        logger.warn('Cached AI plan could not be mapped to existing exercises; regenerating', {
          userId,
          cacheKey,
          error: cacheBuildError instanceof Error ? cacheBuildError.message : String(cacheBuildError),
        })
        // Fall through to fresh AI generation.
      }
    }

    // PHASE 1: Check AI quota BEFORE making an OpenAI call.
    const quota = await checkQuota(userId, 'planner', premium.isPremium)

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'AI planner quota exceeded',
          quota: {
            used: quota.used,
            limit: quota.limit,
            resetAt: quota.resetAt,
          },
          message: `You've used all ${quota.limit} AI plans this month. Resets on ${new Date(quota.resetAt).toLocaleDateString()}`,
        },
        { status: 403 }
      )
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI plan generation not available. Please configure OpenAI.' },
        { status: 503 }
      )
    }

    logger.info('Generating AI workout plan', { userId, goal, daysPerWeek, remaining: quota.remaining })

    // Track AI usage start time
    const startTime = Date.now()
    let aiSuccess = true
    let aiError: string | undefined
    let aiPlan: any

    logger.info('Medical conditions for AI plan', {
      userId,
      conditions: activeMedical,
      affectedJoints,
    })

    // Build an allowed exercise catalog for AI to pick from (existing approved exercises only).
    const approved = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        slug: exercises.slug,
        category: exercises.category,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        location: exercises.location,
        movementPattern: exercises.movementPattern,
        benefits: exercises.benefits,
        medicalFlags: exercises.medicalFlags,
      })
      .from(exercises)
      .where(eq(exercises.reviewStatus, 'approved'))

    const transformed = approved.map((ex) => ({
      ...ex,
      equipment: (ex.equipment || []) as unknown as string[],
      movementPattern: (ex.movementPattern || []) as unknown as string[],
      benefits: ex.benefits as any,
      medicalFlags: (ex.medicalFlags || { notRecommendedFor: [], safeFor: [] }) as any,
    })) as any[]

    let pool = transformed
    if (activeMedical.length > 0) {
      pool = filterByMedicalConditions(pool, activeMedical).safe as any
    }

    if (affectedJoints.length > 0) {
      const validJoints = Array.from(
        new Set(
          affectedJoints
            .map((j) => (typeof j === 'string' ? j.trim().toLowerCase() : ''))
            .filter((j) =>
              ['knee', 'lower_back', 'shoulder', 'elbow', 'wrist', 'hip', 'ankle', 'neck'].includes(j)
            )
        )
      )

      if (validJoints.length > 0) {
        try {
          const risky = await db
            .select({ exerciseId: jointInvolvement.exerciseId })
            .from(jointInvolvement)
            .where(and(inArray(jointInvolvement.joint, validJoints as any), eq(jointInvolvement.involvementLevel, 'high')))

          const riskyIds = new Set<string>(risky.map((r) => r.exerciseId))
          if (riskyIds.size > 0) {
            pool = pool.filter((e: any) => !riskyIds.has(e.id)) as any
          }
        } catch (jointError) {
          logger.warn('Joint involvement filtering failed; continuing without it', {
            userId,
            error: jointError instanceof Error ? jointError.message : String(jointError),
          })
        }
      }
    }

    if (availableEquipment.length > 0) {
      pool = filterByEquipment(pool, availableEquipment) as any
    }
    if (preferredLocation !== 'both') {
      pool = filterByLocation(pool, preferredLocation) as any
    }
    pool = filterByExperienceLevel(pool, experienceLevel) as any

    const goalPool = filterByGoal(pool, goal) as any[]
    const mainPool = goalPool.length > 0 ? goalPool : pool
    const supportPool = pool.filter((e: any) => e.category !== 'strength')

    const byName = (a: any, b: any) => String(a.name).localeCompare(String(b.name))
    const MAIN_LIMIT = 90
    const SUPPORT_LIMIT = 40
    const MAX_ALLOWED = 120

    const combined = [
      ...[...mainPool].sort(byName).slice(0, MAIN_LIMIT),
      ...[...supportPool].sort(byName).slice(0, SUPPORT_LIMIT),
    ]

    const allowed: any[] = []
    const seen = new Set<string>()
    for (const ex of combined) {
      if (!ex?.id) continue
      if (seen.has(ex.id)) continue
      seen.add(ex.id)
      allowed.push(ex)
      if (allowed.length >= MAX_ALLOWED) break
    }

    if (allowed.length < 30) {
      logger.warn('Allowed exercise catalog is very small; plan quality may suffer', {
        userId,
        preferredLocation,
        availableEquipment,
        count: allowed.length,
      })
    }

    const allowedIds = new Set<string>(allowed.map((e) => e.id))
    const allowedById = new Map<string, { id: string; name: string; slug: string }>(
      allowed.map((e) => [e.id, { id: e.id, name: e.name, slug: e.slug }])
    )
    const catalogForSelection: CatalogExercise[] = allowed.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      category: String(e.category),
      movementPattern: (e.movementPattern || []) as string[],
    }))

    // Retry logic for AI generation (max 2 attempts)
    const MAX_ATTEMPTS = 2

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        logger.info('Attempting AI plan generation', { attempt, userId, goal })

        const template = (await generateWorkoutPlanTemplate({
          goal,
          experienceLevel,
          daysPerWeek,
          preferredLocation,
          equipment: availableEquipment,
          medicalConditions: activeMedical,
          affectedJoints,
          duration: duration || 60,
          userProfile: {
            name: user.name || undefined,
            age: user.age || undefined,
            weight: requestWeight ?? user.weight ?? undefined,
            height: user.height || undefined,
          },
        })) as PlanTemplate

        const resolved = resolveTemplateToCatalogPlan(template, catalogForSelection, cacheKey, daysPerWeek, duration || 60)
        aiPlan = {
          ...resolved,
          tokensUsed: template.tokensUsed,
        }

        break
      } catch (generationError: any) {
        const info = summarizeAIError(generationError)
        aiError = info.userMessage

        logger.warn('AI plan generation attempt failed', {
          attempt,
          userId,
          goal,
          status: info.status,
          code: info.code,
          type: info.type,
          requestId: info.requestId,
          message: info.message,
          retryable: info.retryable,
        })

        const canRetry = attempt < MAX_ATTEMPTS && info.retryable
        if (canRetry) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }

        // Two-stage planner failed; attempt a single-stage fallback (uses compact allowed catalog).
        try {
          logger.info('Falling back to catalog-based AI planner', { userId, goal, experienceLevel, daysPerWeek })

          const allowedForAi = allowed.map((e) => ({
            id: e.id,
            name: e.name,
            category: String(e.category),
            difficulty: String(e.difficulty),
            equipment: (e.equipment || []) as string[],
            location: String(e.location),
            movementPattern: (e.movementPattern || []) as string[],
          }))

          aiPlan = await generateWorkoutPlan({
            goal,
            experienceLevel,
            daysPerWeek,
            equipment: availableEquipment,
            medicalConditions: activeMedical,
            affectedJoints,
            duration: duration || 60,
            userProfile: {
              name: user.name || undefined,
              age: user.age || undefined,
              weight: requestWeight ?? user.weight ?? undefined,
              height: user.height || undefined,
            },
            allowedExercises: allowedForAi,
          })

          break
        } catch (fallbackError) {
          logger.warn('Catalog-based AI planner fallback failed', {
            userId,
            goal,
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          })
        }

        // All retries exhausted OR non-retryable error -> try fallback cache.
        aiSuccess = false
        logger.info('Attempting fallback to cached plan', { userId, goal, experienceLevel, daysPerWeek })

        const cutoffTime = new Date(Date.now() - 168 * 60 * 60 * 1000)
        let fallbackPlan: any | null = null

        try {
          const base = and(
            eq(aiResponseCache.feature, 'planner'),
            gt(aiResponseCache.createdAt, cutoffTime),
            sql`(${aiResponseCache.metadata} ->> 'goal') = ${goal}`,
            sql`(${aiResponseCache.metadata} ->> 'experienceLevel') = ${experienceLevel}`
          )

          const exact = await db
            .select({ response: aiResponseCache.response })
            .from(aiResponseCache)
            .where(and(base, sql`(${aiResponseCache.metadata} ->> 'daysPerWeek') = ${String(daysPerWeek)}`))
            .orderBy(desc(aiResponseCache.createdAt))
            .limit(1)
            .then((rows) => rows[0]?.response)

          fallbackPlan =
            exact ||
            (await db
              .select({ response: aiResponseCache.response })
              .from(aiResponseCache)
              .where(base)
              .orderBy(desc(aiResponseCache.createdAt))
              .limit(1)
              .then((rows) => rows[0]?.response)) ||
            null
        } catch (cacheError) {
          logger.warn('Failed to retrieve fallback plan', { error: (cacheError as Error).message })
        }

        if (fallbackPlan) {
          try {
            const rawPlanData = await buildWeeklyPlanFromAiPlan(fallbackPlan, { allowedById, allowedIds })
            const planData = sanitizePlanExercises(rawPlanData, allowedIds)

            const [savedPlan] = await db
              .insert(workoutPlans)
              .values({
                userId,
                name: fallbackPlan.planName || `${goal} - ${daysPerWeek} days/week`,
                description: fallbackPlan.description || `AI-generated ${goal} plan`,
                durationWeeks: typeof fallbackPlan.durationWeeks === 'number' ? fallbackPlan.durationWeeks : 4,
                planData: planData as any,
                isActive: false,
                updatedAt: new Date(),
              })
              .returning()

            await decrementQuota(userId, 'planner', premium.isPremium)

            return NextResponse.json(
              {
                plan: savedPlan,
                aiDetails: fallbackPlan,
                cached: true,
                fallback: true,
                quota: {
                  used: quota.used + 1,
                  remaining: quota.remaining - 1,
                  limit: quota.limit,
                  resetAt: quota.resetAt,
                },
              },
              { status: 201 }
            )
          } catch (fallbackBuildError) {
            logger.warn('Fallback cached plan could not be mapped to allowed exercises', {
              userId,
              goal,
              error: fallbackBuildError instanceof Error ? fallbackBuildError.message : String(fallbackBuildError),
            })
          }
        }

        const retryAfter =
          typeof generationError?.headers?.get === 'function'
            ? generationError.headers.get('retry-after') || generationError.headers.get('Retry-After')
            : null

        logger.error('AI plan generation failed after retries, no fallback', generationError, {
          userId,
          goal,
          experienceLevel,
          daysPerWeek,
          openaiStatus: info.status,
          openaiType: info.type,
          openaiCode: info.code,
          openaiRequestId: info.requestId,
        })

        return NextResponse.json(
          {
            error: 'Failed to generate workout plan. Please try again in a moment.',
            details: info.userMessage,
          },
          {
            status: info.status === 429 ? 429 : 503,
            headers: retryAfter ? { 'Retry-After': String(retryAfter) } : undefined,
          }
        )
      }
    }

    try {
      const rawPlanData = await buildWeeklyPlanFromAiPlan(aiPlan, { allowedById, allowedIds })
      const planData = sanitizePlanExercises(rawPlanData, allowedIds)

      // Save plan to database
      // Note: Constraints are enforced in the AI prompt itself (see src/lib/ai.ts)
      // The prompt instructs AI to follow: max 6 exercises, 60 min sessions, rest days, etc.
      const [savedPlan] = await db
        .insert(workoutPlans)
        .values({
          userId,
          name: aiPlan.planName || `${goal} - ${daysPerWeek} days/week`,
          description: aiPlan.description || `AI-generated ${goal} plan`,
          durationWeeks: typeof aiPlan.durationWeeks === 'number' ? aiPlan.durationWeeks : 4, // Default 4 weeks
          planData: planData as any,
          isActive: false, // User needs to activate it
          updatedAt: new Date(),
        })
        .returning()

      // PHASE 1: Decrement quota AFTER successful generation
      await decrementQuota(userId, 'planner', premium.isPremium)

      // Cache the AI response for future users
      await cacheAIResponse(cacheKey, 'planner', aiPlan, {
        goal,
        experienceLevel,
        daysPerWeek,
        equipment: availableEquipment,
        medicalConditions: activeMedical,
        duration: duration || 60,
        preferredLocation,
      })

      // Calculate response time
      const responseTime = Date.now() - startTime

      // Log AI usage for monitoring
      await logAIUsage({
        userId,
        feature: 'planner',
        model: getOpenAIModel(),
        tokensUsed: aiPlan.tokensUsed || undefined,
        responseTime,
        success: true,
      })

      logger.info('AI workout plan created', { planId: savedPlan.id, userId, quotaRemaining: quota.remaining - 1 })

      return NextResponse.json({
        plan: savedPlan,
        aiDetails: aiPlan,
        quota: {
          used: quota.used + 1,
          remaining: quota.remaining - 1,
          limit: quota.limit,
          resetAt: quota.resetAt,
        },
        metadata: {
          goal,
          experienceLevel,
          daysPerWeek,
          progressionStrategy: aiPlan.progressionStrategy,
          weeklyStructure: aiPlan.weeklyStructure,
          tips: aiPlan.tips,
        }
      }, { status: 201 })
    } catch (aiGenerationError) {
      aiSuccess = false
      aiError = (aiGenerationError as Error).message

      // Log failed AI usage
      await logAIUsage({
        userId,
        feature: 'planner',
        model: getOpenAIModel(),
        responseTime: Date.now() - startTime,
        success: false,
        errorMessage: aiError,
      })

      throw aiGenerationError
    }
  } catch (error) {
    logger.error('AI plan generation error', error as Error)
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    )
  }
}

export const POST = withApiTelemetry(generatePlan, { name: 'planner.ai-generate' })
