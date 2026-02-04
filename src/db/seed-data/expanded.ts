// Expanded exercise catalog (programmatically generated)
// Goal: ensure the app ships with a broad library (~500+ exercises) across
// strength, mobility, rehab, and cardio, while keeping the data maintainable.

type Category = 'strength' | 'mobility' | 'rehab' | 'cardio'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type Equipment =
  | 'none'
  | 'dumbbell'
  | 'barbell'
  | 'resistance_band'
  | 'machine'
  | 'cable'
  | 'kettlebell'
  | 'pull_up_bar'
  | 'bench'
type Location = 'home' | 'gym' | 'both'
type MovementPattern =
  | 'push'
  | 'pull'
  | 'hinge'
  | 'squat'
  | 'rotate'
  | 'carry'
  | 'isolation'
type MuscleRole = 'primary' | 'secondary' | 'stabilizer'

export type SeedExercise = {
  name: string
  slug?: string
  category: Category
  difficulty: Difficulty
  equipment: Equipment[]
  location: Location
  movementPattern?: MovementPattern[]
  description: string
  stepByStep: string[]
  breathingTechnique?: string
  tempo?: string
  commonMistakes?: string[]
  injuryRisks?: string[]
  benefits?: {
    muscleGrowth?: boolean
    fatLoss?: boolean
    posture?: boolean
    mobility?: boolean
    rehab?: boolean
    sportsPerformance?: boolean
  }
  medicalFlags?: {
    notRecommendedFor: string[]
    safeFor: string[]
  }
  videos?: {
    demoVideo?: string
    commonMistakesVideo?: string
    beginnerVersionVideo?: string
  }
  thumbnailUrl?: string
  muscleGroups?: Array<{ muscleGroup: string; role: MuscleRole }>
}

type ExerciseBlueprint = {
  name: string
  category: Category
  difficulty: Difficulty
  equipment: Equipment[]
  location: Location
  movementPattern?: MovementPattern[]
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  stabilizerMuscles?: string[]
  description?: string
  stepByStep?: string[]
  breathingTechnique?: string
  tempo?: string
  commonMistakes?: string[]
  injuryRisks?: string[]
  benefits?: SeedExercise['benefits']
  medicalFlags?: SeedExercise['medicalFlags']
}

const MUSCLE_DISPLAY: Record<string, string> = {
  chest: 'Chest',
  upper_chest: 'Upper Chest',
  mid_chest: 'Mid Chest',
  lower_chest: 'Lower Chest',
  lats: 'Lats',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  front_delts: 'Front Delts',
  side_delts: 'Side Delts',
  rear_delts: 'Rear Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  upper_abs: 'Upper Abs',
  lower_abs: 'Lower Abs',
  obliques: 'Obliques',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  gastrocnemius_medial: 'Gastrocnemius (Medial)',
  gastrocnemius_lateral: 'Gastrocnemius (Lateral)',
  soleus: 'Soleus',
}

const PATTERN_STEPS: Record<MovementPattern, string[]> = {
  push: [
    'Set up your position and grip',
    'Brace your core and set your shoulders',
    'Lower the weight under control',
    'Pause briefly in a stable bottom position',
    'Press back to the start without bouncing',
    'Repeat while maintaining consistent form',
  ],
  pull: [
    'Set your stance and grip the handle/bar',
    'Brace your core and keep a neutral spine',
    'Initiate the pull by driving elbows back/down',
    'Squeeze the target muscles at peak contraction',
    'Return slowly to the start with control',
    'Repeat without using momentum',
  ],
  squat: [
    'Set your stance and brace your core',
    'Descend by bending hips and knees together',
    'Maintain a tall chest and neutral spine',
    'Reach a controlled depth without collapsing',
    'Drive up through the mid-foot to stand',
    'Repeat with the same tempo and depth',
  ],
  hinge: [
    'Set feet hip-width and brace your core',
    'Hinge at the hips while keeping a neutral spine',
    'Lower until you feel a strong stretch (no rounding)',
    'Drive hips forward to stand tall',
    'Keep the bar/weight close to your body',
    'Repeat with controlled reps',
  ],
  rotate: [
    'Set a stable stance and brace your core',
    'Rotate from the torso/hips (not the knees)',
    'Move through a comfortable range of motion',
    'Control the return to the start position',
    'Keep shoulders down and neck relaxed',
    'Repeat smoothly on both sides if applicable',
  ],
  carry: [
    'Pick up the weight safely and stand tall',
    'Brace your core and keep ribs stacked over hips',
    'Walk with short, controlled steps',
    'Keep shoulders down and posture upright',
    'Maintain even breathing and a firm grip',
    'Set the weight down safely to finish',
  ],
  isolation: [
    'Set up your body position and range of motion',
    'Move slowly through the working range',
    'Pause briefly at peak contraction',
    'Return under control without swinging',
    'Keep tension on the target muscle',
    'Repeat for smooth, consistent reps',
  ],
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function defaultBenefits(category: Category): SeedExercise['benefits'] {
  if (category === 'mobility') return { mobility: true, posture: true }
  if (category === 'rehab') return { rehab: true, posture: true }
  if (category === 'cardio') return { fatLoss: true, sportsPerformance: true }
  return { muscleGrowth: true, sportsPerformance: true }
}

function defaultBreathing(category: Category): string | undefined {
  if (category === 'strength') return 'Inhale on the lowering phase, exhale on the effort'
  if (category === 'cardio') return 'Natural rhythmic breathing'
  if (category === 'mobility') return 'Slow relaxed breathing throughout'
  if (category === 'rehab') return 'Slow controlled breathing; avoid holding your breath'
  return undefined
}

function muscleListToGroups(
  primaryMuscles?: string[],
  secondaryMuscles?: string[],
  stabilizerMuscles?: string[]
): SeedExercise['muscleGroups'] | undefined {
  const groups: NonNullable<SeedExercise['muscleGroups']> = []
  for (const m of primaryMuscles || []) groups.push({ muscleGroup: m, role: 'primary' })
  for (const m of secondaryMuscles || []) groups.push({ muscleGroup: m, role: 'secondary' })
  for (const m of stabilizerMuscles || []) groups.push({ muscleGroup: m, role: 'stabilizer' })
  return groups.length ? groups : undefined
}

function describeMuscles(primaryMuscles?: string[], secondaryMuscles?: string[]): string {
  const primary = (primaryMuscles || []).map((m) => MUSCLE_DISPLAY[m] || m)
  const secondary = (secondaryMuscles || []).map((m) => MUSCLE_DISPLAY[m] || m)
  const primaryText = primary.length ? primary.join(', ') : 'the target muscles'
  const secondaryText = secondary.length ? ` with help from ${secondary.join(', ')}` : ''
  return `${primaryText}${secondaryText}`
}

function makeExercise(b: ExerciseBlueprint): SeedExercise {
  const movement = b.movementPattern?.[0] ?? 'isolation'
  const stepByStep = b.stepByStep?.length ? b.stepByStep : PATTERN_STEPS[movement]

  const primaryMuscles = b.primaryMuscles || []
  const secondaryMuscles = b.secondaryMuscles || []

  const description =
    b.description ??
    `${b.name} is a ${b.category} exercise targeting ${describeMuscles(primaryMuscles, secondaryMuscles)}.`

  const tempo =
    b.tempo ??
    (b.category === 'strength' ? '2-0-1-0' : b.category === 'rehab' ? '3-1-3-0' : undefined)

  return {
    name: b.name,
    slug: slugify(b.name),
    category: b.category,
    difficulty: b.difficulty,
    equipment: b.equipment,
    location: b.location,
    movementPattern: b.movementPattern,
    description,
    stepByStep,
    breathingTechnique: b.breathingTechnique ?? defaultBreathing(b.category),
    tempo,
    commonMistakes: b.commonMistakes,
    injuryRisks: b.injuryRisks,
    benefits: b.benefits ?? defaultBenefits(b.category),
    medicalFlags: b.medicalFlags,
    muscleGroups: muscleListToGroups(b.primaryMuscles, b.secondaryMuscles, b.stabilizerMuscles),
  }
}

function flatMap<T, U>(items: T[], fn: (item: T) => U[]): U[] {
  const out: U[] = []
  for (const item of items) out.push(...fn(item))
  return out
}

function cross<A, B, R>(a: A[], b: B[], fn: (a: A, b: B) => R): R[] {
  return flatMap(a, (aa) => b.map((bb) => fn(aa, bb)))
}

// ---------- Strength (Chest) ----------

function buildChestStrength(): SeedExercise[] {
  const angles = [
    { label: 'Incline', focus: 'upper_chest' },
    { label: 'Flat', focus: 'mid_chest' },
    { label: 'Decline', focus: 'lower_chest' },
  ] as const

  const barbellMods = [
    { suffix: '(Paused)', difficulty: 'advanced' as const },
    { suffix: '(Tempo)', difficulty: 'advanced' as const },
    { suffix: '(Wide Grip)', difficulty: 'intermediate' as const },
    { suffix: '(Feet Up)', difficulty: 'intermediate' as const },
  ]

  const dumbbellMods = [
    { suffix: '(Neutral Grip)', difficulty: 'beginner' as const },
    { suffix: '(Alternating)', difficulty: 'beginner' as const },
    { suffix: '(Squeeze)', difficulty: 'intermediate' as const },
    { suffix: '(Single-Arm)', difficulty: 'intermediate' as const },
  ]

  const machineMods = [
    { suffix: '(Single-Arm)', difficulty: 'beginner' as const },
    { suffix: '(Slow Eccentric)', difficulty: 'intermediate' as const },
    { suffix: '(High Rep)', difficulty: 'beginner' as const },
  ]

  const presses = [
    ...cross(angles as any, barbellMods, (a: any, m: any) =>
      makeExercise({
        name: `${a.label} Barbell Bench Press ${m.suffix}`,
        category: 'strength',
        difficulty: m.difficulty,
        equipment: ['barbell', 'bench'],
        location: 'gym',
        movementPattern: ['push'],
        primaryMuscles: ['chest', a.focus],
        secondaryMuscles: ['front_delts', 'triceps'],
        commonMistakes: ['Elbows flaring excessively', 'Bouncing the bar', 'Losing upper back tightness'],
        injuryRisks: ['Shoulder irritation if range of motion is forced'],
      })
    ),
    ...cross(angles as any, dumbbellMods, (a: any, m: any) =>
      makeExercise({
        name: `${a.label} Dumbbell Press ${m.suffix}`,
        category: 'strength',
        difficulty: m.difficulty,
        equipment: ['dumbbell', 'bench'],
        location: 'gym',
        movementPattern: ['push'],
        primaryMuscles: ['chest', a.focus],
        secondaryMuscles: ['front_delts', 'triceps'],
        commonMistakes: ['Weights drifting too far forward', 'Cutting the range of motion short'],
        injuryRisks: ['Shoulder strain if elbows drop too low'],
      })
    ),
    ...cross(angles as any, machineMods, (a: any, m: any) =>
      makeExercise({
        name: `${a.label} Machine Chest Press ${m.suffix}`,
        category: 'strength',
        difficulty: m.difficulty,
        equipment: ['machine'],
        location: 'gym',
        movementPattern: ['push'],
        primaryMuscles: ['chest', a.focus],
        secondaryMuscles: ['front_delts', 'triceps'],
        commonMistakes: ['Seat height set incorrectly', 'Locking out aggressively'],
        injuryRisks: [],
      })
    ),
  ]

  const cablePresses = [
    {
      name: 'Low-to-High Cable Chest Press',
      primary: ['chest', 'upper_chest'],
    },
    {
      name: 'High-to-Low Cable Chest Press',
      primary: ['chest', 'lower_chest'],
    },
    {
      name: 'Single-Arm Cable Chest Press',
      primary: ['chest', 'mid_chest'],
    },
    {
      name: 'Standing Cable Chest Press (Split Stance)',
      primary: ['chest', 'mid_chest'],
    },
  ].map((t) =>
    makeExercise({
      name: t.name,
      category: 'strength',
      difficulty: 'intermediate',
      equipment: ['cable'],
      location: 'gym',
      movementPattern: ['push'],
      primaryMuscles: t.primary,
      secondaryMuscles: ['front_delts', 'triceps'],
      commonMistakes: ['Overextending the lower back', 'Letting shoulders roll forward'],
      injuryRisks: [],
    })
  )

  const flyMods = ['(Pause Stretch)', '(Slow Eccentric)', '(Partial reps)']
  const flyAngles = [
    { label: 'Incline', focus: 'upper_chest' },
    { label: 'Flat', focus: 'mid_chest' },
    { label: 'Decline', focus: 'lower_chest' },
  ]

  const flies = [
    ...cross(flyAngles as any, flyMods, (a: any, m: any) =>
      makeExercise({
        name: `${a.label} Cable Fly ${m}`,
        category: 'strength',
        difficulty: 'intermediate',
        equipment: ['cable'],
        location: 'gym',
        movementPattern: ['isolation'],
        primaryMuscles: ['chest', a.focus],
        stabilizerMuscles: ['front_delts'],
        commonMistakes: ['Bending elbows too much', 'Letting shoulders shrug up'],
        injuryRisks: ['Shoulder discomfort if range is too deep'],
      })
    ),
    ...cross(flyAngles as any, flyMods, (a: any, m: any) =>
      makeExercise({
        name: `${a.label} Dumbbell Fly ${m}`,
        category: 'strength',
        difficulty: 'intermediate',
        equipment: ['dumbbell', 'bench'],
        location: 'gym',
        movementPattern: ['isolation'],
        primaryMuscles: ['chest', a.focus],
        stabilizerMuscles: ['front_delts'],
        commonMistakes: ['Dropping too low', 'Turning it into a press'],
        injuryRisks: ['Pec strain if the stretch is forced'],
      })
    ),
  ]

  const pushUpVariants = [
    { name: 'Wide Push-Up', primary: ['chest', 'mid_chest'], secondary: ['triceps', 'front_delts'], diff: 'beginner' as const },
    { name: 'Close Push-Up', primary: ['chest', 'mid_chest'], secondary: ['triceps', 'front_delts'], diff: 'beginner' as const },
    { name: 'Diamond Push-Up', primary: ['triceps'], secondary: ['chest', 'front_delts'], diff: 'intermediate' as const },
    { name: 'Decline Push-Up (Feet Elevated)', primary: ['chest', 'upper_chest'], secondary: ['triceps', 'front_delts'], diff: 'intermediate' as const },
    { name: 'Incline Push-Up (Hands Elevated)', primary: ['chest', 'mid_chest'], secondary: ['triceps'], diff: 'beginner' as const },
    { name: 'Tempo Push-Up', primary: ['chest', 'mid_chest'], secondary: ['triceps', 'front_delts'], diff: 'intermediate' as const },
    { name: 'Paused Push-Up', primary: ['chest', 'mid_chest'], secondary: ['triceps', 'front_delts'], diff: 'advanced' as const },
    { name: 'Archer Push-Up', primary: ['chest', 'mid_chest'], secondary: ['triceps', 'front_delts'], diff: 'advanced' as const },
    { name: 'Plyometric Push-Up', primary: ['chest', 'mid_chest'], secondary: ['triceps', 'front_delts'], diff: 'advanced' as const },
    { name: 'Push-Up to Down Dog', primary: ['chest', 'mid_chest'], secondary: ['front_delts'], diff: 'intermediate' as const },
    { name: 'Knee Push-Up', primary: ['chest', 'mid_chest'], secondary: ['triceps'], diff: 'beginner' as const },
    { name: 'Hands-Release Push-Up', primary: ['chest', 'mid_chest'], secondary: ['triceps', 'front_delts'], diff: 'intermediate' as const },
  ].map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: ['none'],
      location: 'both',
      movementPattern: ['push'],
      primaryMuscles: v.primary,
      secondaryMuscles: v.secondary,
      commonMistakes: ['Sagging hips', 'Flaring elbows excessively', 'Incomplete range of motion'],
      injuryRisks: ['Wrist irritation if hands are poorly positioned'],
    })
  )

  const accessories = [
    makeExercise({
      name: 'Dumbbell Pullover (Bench)',
      category: 'strength',
      difficulty: 'intermediate',
      equipment: ['dumbbell', 'bench'],
      location: 'gym',
      movementPattern: ['pull'],
      primaryMuscles: ['chest', 'lats'],
      secondaryMuscles: ['triceps'],
      commonMistakes: ['Overarching the lower back', 'Going too deep'],
      injuryRisks: ['Shoulder discomfort if range is forced'],
    }),
    makeExercise({
      name: 'Chest Dip (Lean Forward)',
      category: 'strength',
      difficulty: 'advanced',
      equipment: ['pull_up_bar'],
      location: 'gym',
      movementPattern: ['push'],
      primaryMuscles: ['chest', 'lower_chest'],
      secondaryMuscles: ['triceps', 'front_delts'],
      commonMistakes: ['Shoulders rolling forward', 'Going too deep without control'],
      injuryRisks: ['Shoulder irritation if depth is excessive'],
    }),
    makeExercise({
      name: 'Resistance Band Chest Fly',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['resistance_band'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['chest', 'mid_chest'],
      stabilizerMuscles: ['front_delts'],
      commonMistakes: ['Twisting the torso', 'Letting shoulders shrug up'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Resistance Band Chest Press',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['resistance_band'],
      location: 'both',
      movementPattern: ['push'],
      primaryMuscles: ['chest', 'mid_chest'],
      secondaryMuscles: ['triceps', 'front_delts'],
      commonMistakes: ['Overextending the low back', 'Shrugging shoulders'],
      injuryRisks: [],
    }),
  ]

  return [...presses, ...cablePresses, ...flies, ...pushUpVariants, ...accessories]
}

// ---------- Strength (Back) ----------

function buildBackStrength(): SeedExercise[] {
  const pullUpGrips = [
    { name: 'Pull-Up (Wide Grip)', diff: 'advanced' as const },
    { name: 'Pull-Up (Close Grip)', diff: 'advanced' as const },
    { name: 'Pull-Up (Neutral Grip)', diff: 'advanced' as const },
    { name: 'Chin-Up (Supinated Grip)', diff: 'intermediate' as const },
    { name: 'Chin-Up (Close Grip)', diff: 'intermediate' as const },
    { name: 'Band-Assisted Pull-Up', diff: 'beginner' as const, eq: ['resistance_band', 'pull_up_bar'] as Equipment[] },
    { name: 'Isometric Pull-Up Hold', diff: 'advanced' as const },
    { name: 'Negative Pull-Up (Slow Lower)', diff: 'intermediate' as const },
    { name: 'Scapular Pull-Up', diff: 'beginner' as const },
    { name: 'Inverted Row (Underhand)', diff: 'intermediate' as const },
    { name: 'Inverted Row (Overhand)', diff: 'intermediate' as const },
    { name: 'Towel Pull-Up (Grip Focus)', diff: 'advanced' as const },
  ]

  const bodyweightPulls = pullUpGrips.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.eq ?? (v.name.includes('Row') ? ['pull_up_bar'] : ['pull_up_bar']),
      location: 'gym',
      movementPattern: ['pull'],
      primaryMuscles: ['lats', 'upper_back'],
      secondaryMuscles: ['biceps', 'forearms'],
      commonMistakes: ['Swinging and kipping', 'Shrugging shoulders up', 'Not reaching full extension'],
      injuryRisks: ['Elbow strain if volume is excessive'],
    })
  )

  const pulldownVariants = [
    { name: 'Lat Pulldown (Wide Grip)', diff: 'beginner' as const },
    { name: 'Lat Pulldown (Close Grip)', diff: 'beginner' as const },
    { name: 'Lat Pulldown (Neutral Grip)', diff: 'beginner' as const },
    { name: 'Lat Pulldown (Reverse Grip)', diff: 'intermediate' as const },
    { name: 'Single-Arm Lat Pulldown', diff: 'intermediate' as const },
    { name: 'Straight-Arm Cable Pulldown', diff: 'intermediate' as const },
    { name: 'Kneeling Lat Pulldown', diff: 'intermediate' as const },
    { name: 'Machine Pulldown (Single-Arm)', diff: 'beginner' as const, equipment: ['machine'] as Equipment[] },
    { name: 'Cable Pullover', diff: 'intermediate' as const },
    { name: 'Band Straight-Arm Pulldown', diff: 'beginner' as const, equipment: ['resistance_band'] as Equipment[] },
  ]

  const pulldowns = pulldownVariants.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.equipment ?? (v.name.includes('Band') ? ['resistance_band'] : ['cable']),
      location: v.name.includes('Band') ? 'both' : 'gym',
      movementPattern: ['pull'],
      primaryMuscles: ['lats'],
      secondaryMuscles: ['biceps', 'upper_back'],
      commonMistakes: ['Leaning back excessively', 'Pulling with arms only'],
      injuryRisks: ['Shoulder irritation if bar is pulled behind the neck'],
    })
  )

  const rowStyles = [
    { name: 'Pendlay Row', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Underhand Barbell Row', equipment: ['barbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Meadows Row', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Chest-Supported Dumbbell Row', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'beginner' as const },
    { name: 'Renegade Row', equipment: ['dumbbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Kroc Row (High Rep Dumbbell Row)', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'advanced' as const },
    { name: 'Seated Cable Row (Close Grip)', equipment: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Seated Cable Row (Wide Grip)', equipment: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Single-Arm Cable Row', equipment: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Machine Row', equipment: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Machine Row (Single-Arm)', equipment: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Dumbbell Rear-Delt Row', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Cable High Row', equipment: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Cable Low Row', equipment: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Barbell Row (Tempo)', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Barbell Row (Paused)', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Dumbbell Row (Paused)', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Dumbbell Row (Slow Eccentric)', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
  ]

  const rows = rowStyles.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.equipment,
      location: v.equipment.includes('resistance_band') ? 'both' : 'gym',
      movementPattern: v.name.includes('Row') ? ['pull'] : ['pull'],
      primaryMuscles: ['upper_back', 'lats'],
      secondaryMuscles: ['biceps', 'rear_delts'],
      stabilizerMuscles: v.name.includes('Pendlay') || v.name.includes('Barbell') ? ['lower_back'] : undefined,
      commonMistakes: ['Rounding the back', 'Jerking the weight', 'Letting shoulders roll forward'],
      injuryRisks: ['Lower back strain if bracing is poor'],
    })
  )

  const lowerBackAndTraps = [
    makeExercise({
      name: 'Back Extension (Isometric Hold)',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['bench'],
      location: 'gym',
      movementPattern: ['hinge'],
      primaryMuscles: ['lower_back'],
      secondaryMuscles: ['glutes', 'hamstrings'],
      commonMistakes: ['Hyperextending the spine', 'Rushing the reps'],
      injuryRisks: ['Lower back irritation if overextended'],
    }),
    makeExercise({
      name: 'Barbell Rack Pull (Above Knee)',
      category: 'strength',
      difficulty: 'advanced',
      equipment: ['barbell'],
      location: 'gym',
      movementPattern: ['hinge'],
      primaryMuscles: ['lower_back', 'upper_back'],
      secondaryMuscles: ['glutes', 'hamstrings', 'forearms'],
      commonMistakes: ['Yanking the bar', 'Rounding the back'],
      injuryRisks: ['Lower back strain if overloaded'],
    }),
    makeExercise({
      name: 'Dumbbell Shrug (Pause at Top)',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['dumbbell'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['upper_back'],
      secondaryMuscles: ['forearms'],
      commonMistakes: ['Rolling shoulders', 'Using momentum'],
      injuryRisks: ['Neck tension if shrugging aggressively'],
    }),
    makeExercise({
      name: 'Kettlebell Shrug',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['kettlebell'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['upper_back'],
      secondaryMuscles: ['forearms'],
      commonMistakes: ['Leaning forward', 'Rolling shoulders'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Prone Y Raise',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['dumbbell', 'bench'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['upper_back', 'rear_delts'],
      secondaryMuscles: [],
      commonMistakes: ['Using too much weight', 'Shrugging shoulders'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Prone T Raise',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['dumbbell', 'bench'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['upper_back', 'rear_delts'],
      secondaryMuscles: [],
      commonMistakes: ['Bending elbows excessively', 'Rushing reps'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Prone W Raise',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['dumbbell', 'bench'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['upper_back', 'rear_delts'],
      secondaryMuscles: [],
      commonMistakes: ['Overextending the low back', 'Shrugging'],
      injuryRisks: [],
    }),
  ]

  return [...bodyweightPulls, ...pulldowns, ...rows, ...lowerBackAndTraps]
}

// ---------- Strength (Legs) ----------

function buildLegStrength(): SeedExercise[] {
  const squatFamily = [
    { name: 'Front Squat', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Pause Back Squat', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Tempo Back Squat', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Box Squat', equipment: ['barbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'High Bar Back Squat', equipment: ['barbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Low Bar Back Squat', equipment: ['barbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Dumbbell Front Squat', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Dumbbell Split Squat', equipment: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Goblet Squat (Tempo)', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Hack Squat (Machine)', equipment: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Smith-Style Machine Squat', equipment: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Machine Squat (Narrow Stance)', equipment: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Machine Squat (Wide Stance)', equipment: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Heels-Elevated Squat', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Cyclist Squat (Heels Elevated)', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Overhead Squat', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Zercher Squat', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
  ]

  const squats = squatFamily.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.equipment,
      location: 'gym',
      movementPattern: ['squat'],
      primaryMuscles: ['quads'],
      secondaryMuscles: ['glutes', 'hamstrings'],
      stabilizerMuscles: ['lower_back'],
      commonMistakes: ['Knees collapsing inward', 'Losing brace', 'Cutting depth short'],
      injuryRisks: ['Knee irritation if form breaks down under load'],
    })
  )

  const lungeFamily = [
    { name: 'Reverse Lunge', equipment: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Forward Lunge', equipment: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Curtsy Lunge', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Lateral Lunge', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Barbell Reverse Lunge', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Bulgarian Split Squat (Paused)', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'advanced' as const },
    { name: 'Split Squat (Front Foot Elevated)', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Step-Up (High Box)', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Step-Down (Controlled)', equipment: ['bench'] as Equipment[], diff: 'beginner' as const },
    { name: 'Walking Lunge (Long Stride)', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Walking Lunge (Short Stride)', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Cossack Squat', equipment: ['none'] as Equipment[], diff: 'advanced' as const },
    { name: 'Skater Squat', equipment: ['none'] as Equipment[], diff: 'advanced' as const },
    { name: 'TRX-Style Assisted Split Squat', equipment: ['none'] as Equipment[], diff: 'beginner' as const },
    { name: 'Kettlebell Reverse Lunge', equipment: ['kettlebell'] as Equipment[], diff: 'beginner' as const },
  ]

  const lunges = lungeFamily.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.equipment,
      location: v.equipment.includes('none') ? 'both' : 'gym',
      movementPattern: ['squat'],
      primaryMuscles: ['glutes', 'quads'],
      secondaryMuscles: ['hamstrings', 'calves'],
      stabilizerMuscles: ['lower_back', 'obliques'],
      commonMistakes: ['Front knee collapsing inward', 'Pushing off the back foot', 'Losing balance'],
      injuryRisks: ['Knee irritation if alignment is poor'],
    })
  )

  const hingeFamily = [
    { name: 'Stiff-Leg Deadlift', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Dumbbell Romanian Deadlift (Single-Leg)', equipment: ['dumbbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Single-Leg Romanian Deadlift (Bodyweight)', equipment: ['none'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Good Morning (Tempo)', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Kettlebell Swing', equipment: ['kettlebell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Cable Pull-Through', equipment: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Hip Hinge Drill (Dowel)', equipment: ['none'] as Equipment[], diff: 'beginner' as const },
    { name: 'Barbell Hip Thrust', equipment: ['barbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Dumbbell Hip Thrust', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'beginner' as const },
    { name: 'Single-Leg Hip Thrust', equipment: ['bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Glute Bridge (Paused)', equipment: ['none'] as Equipment[], diff: 'beginner' as const },
    { name: 'Banded Glute Bridge', equipment: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
    { name: 'Cable Glute Kickback (Single-Leg)', equipment: ['cable'] as Equipment[], diff: 'beginner' as const },
  ]

  const hinges = hingeFamily.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.equipment,
      location: v.equipment.includes('none') || v.equipment.includes('resistance_band') ? 'both' : 'gym',
      movementPattern: ['hinge'],
      primaryMuscles: ['hamstrings', 'glutes'],
      secondaryMuscles: ['lower_back', 'calves'],
      stabilizerMuscles: ['obliques'],
      commonMistakes: ['Rounding the lower back', 'Turning it into a squat', 'Overextending at the top'],
      injuryRisks: ['Lower back strain if bracing is poor'],
    })
  )

  const legCurlFamily = [
    { name: 'Standing Cable Leg Curl', equipment: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Single-Leg Lying Leg Curl', equipment: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Seated Leg Curl (Paused)', equipment: ['machine'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Nordic Curl (Assisted)', equipment: ['none'] as Equipment[], diff: 'advanced' as const },
    { name: 'Hamstring Slider Curl', equipment: ['none'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Banded Hamstring Curl', equipment: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
    { name: 'Glute-Ham Raise (Assisted)', equipment: ['none'] as Equipment[], diff: 'advanced' as const },
    { name: 'Cable Leg Curl (Bilateral)', equipment: ['cable'] as Equipment[], diff: 'beginner' as const },
  ]

  const curls = legCurlFamily.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.equipment,
      location: v.equipment.includes('none') || v.equipment.includes('resistance_band') ? 'both' : 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['hamstrings'],
      secondaryMuscles: ['glutes', 'calves'],
      commonMistakes: ['Rushing the eccentric', 'Hips lifting off the pad'],
      injuryRisks: ['Hamstring cramp if overloaded'],
    })
  )

  const calfFamily = [
    { name: 'Single-Leg Calf Raise', equipment: ['none'] as Equipment[], diff: 'beginner' as const, focus: ['gastrocnemius_medial', 'gastrocnemius_lateral'] },
    { name: 'Donkey Calf Raise', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const, focus: ['gastrocnemius_medial', 'gastrocnemius_lateral'] },
    { name: 'Calf Raise (Slow Eccentric)', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const, focus: ['gastrocnemius_medial', 'gastrocnemius_lateral'] },
    { name: 'Seated Calf Raise (Paused)', equipment: ['machine'] as Equipment[], diff: 'intermediate' as const, focus: ['soleus'] },
    { name: 'Calf Press (Leg Press Machine)', equipment: ['machine'] as Equipment[], diff: 'beginner' as const, focus: ['calves'] },
    { name: 'Banded Calf Raise', equipment: ['resistance_band'] as Equipment[], diff: 'beginner' as const, focus: ['calves'] },
    { name: 'Calf Raise (Toes In)', equipment: ['dumbbell'] as Equipment[], diff: 'beginner' as const, focus: ['gastrocnemius_medial'] },
    { name: 'Calf Raise (Toes Out)', equipment: ['dumbbell'] as Equipment[], diff: 'beginner' as const, focus: ['gastrocnemius_lateral'] },
    { name: 'Soleus Raise (Bent Knee)', equipment: ['none'] as Equipment[], diff: 'beginner' as const, focus: ['soleus'] },
    { name: 'Calf Raise (Isometric Hold)', equipment: ['none'] as Equipment[], diff: 'beginner' as const, focus: ['calves'] },
  ]

  const calves = calfFamily.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.equipment,
      location: v.equipment.includes('machine') ? 'gym' : 'both',
      movementPattern: ['isolation'],
      primaryMuscles: unique(['calves', ...v.focus]),
      secondaryMuscles: [],
      commonMistakes: ['Bouncing the reps', 'Short range of motion'],
      injuryRisks: ['Achilles irritation if volume is excessive'],
    })
  )

  const adductionAbduction = [
    makeExercise({
      name: 'Cable Hip Abduction',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['cable'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['glutes'],
      secondaryMuscles: ['quads'],
      commonMistakes: ['Leaning excessively', 'Using momentum'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Banded Lateral Walk',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['resistance_band'],
      location: 'both',
      movementPattern: ['carry'],
      primaryMuscles: ['glutes'],
      secondaryMuscles: ['quads'],
      commonMistakes: ['Feet too close together', 'Letting knees cave in'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Machine Hip Abduction',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['machine'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['glutes'],
      secondaryMuscles: [],
      commonMistakes: ['Rushing reps', 'Overarching lower back'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Machine Hip Adduction',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['machine'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['quads'],
      secondaryMuscles: ['glutes'],
      commonMistakes: ['Using momentum', 'Short range of motion'],
      injuryRisks: [],
    }),
  ]

  return [...squats, ...lunges, ...hinges, ...curls, ...calves, ...adductionAbduction]
}

// ---------- Strength (Shoulders) ----------

function buildShoulderStrength(): SeedExercise[] {
  const presses = [
    { name: 'Seated Barbell Overhead Press', equipment: ['barbell', 'bench'] as Equipment[], diff: 'advanced' as const },
    { name: 'Standing Dumbbell Overhead Press (Neutral Grip)', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Single-Arm Dumbbell Overhead Press', equipment: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Kettlebell Overhead Press', equipment: ['kettlebell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Single-Arm Kettlebell Overhead Press', equipment: ['kettlebell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Push Press', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Machine Shoulder Press (Single-Arm)', equipment: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Cable Overhead Press', equipment: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Arnold Press (Seated)', equipment: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Z Press', equipment: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Landmine Press (Single-Arm)', equipment: ['barbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Handstand Pike Press (Feet Elevated)', equipment: ['bench'] as Equipment[], diff: 'advanced' as const },
  ]

  const pressExercises = presses.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.equipment,
      location: v.equipment.includes('none') ? 'both' : 'gym',
      movementPattern: ['push'],
      primaryMuscles: ['front_delts'],
      secondaryMuscles: ['side_delts', 'triceps'],
      stabilizerMuscles: ['obliques', 'lower_back'],
      commonMistakes: ['Overarching the low back', 'Letting elbows flare excessively'],
      injuryRisks: ['Shoulder irritation if pressing overhead without mobility'],
    })
  )

  const lateralRaiseMods = ['(Lean-Away)', '(Paused)', '(Slow Eccentric)', '(Partial reps)']
  const lateralRaises = [
    ...lateralRaiseMods.map((m) =>
      makeExercise({
        name: `Dumbbell Lateral Raise ${m}`,
        category: 'strength',
        difficulty: 'beginner',
        equipment: ['dumbbell'],
        location: 'gym',
        movementPattern: ['isolation'],
        primaryMuscles: ['side_delts'],
        secondaryMuscles: ['front_delts'],
        commonMistakes: ['Shrugging shoulders', 'Swinging the weights'],
        injuryRisks: [],
      })
    ),
    ...lateralRaiseMods.map((m) =>
      makeExercise({
        name: `Cable Lateral Raise ${m}`,
        category: 'strength',
        difficulty: 'intermediate',
        equipment: ['cable'],
        location: 'gym',
        movementPattern: ['isolation'],
        primaryMuscles: ['side_delts'],
        secondaryMuscles: ['front_delts'],
        commonMistakes: ['Using momentum', 'Letting shoulder roll forward'],
        injuryRisks: [],
      })
    ),
    ...lateralRaiseMods.map((m) =>
      makeExercise({
        name: `Machine Lateral Raise ${m}`,
        category: 'strength',
        difficulty: 'beginner',
        equipment: ['machine'],
        location: 'gym',
        movementPattern: ['isolation'],
        primaryMuscles: ['side_delts'],
        secondaryMuscles: ['front_delts'],
        commonMistakes: ['Too much weight', 'Short range of motion'],
        injuryRisks: [],
      })
    ),
  ]

  const rearDelt = [
    makeExercise({
      name: 'Reverse Fly (Incline Bench)',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['dumbbell', 'bench'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['rear_delts'],
      secondaryMuscles: ['upper_back'],
      commonMistakes: ['Shrugging', 'Using momentum'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Cable Rear Delt Fly (Cross-Body)',
      category: 'strength',
      difficulty: 'intermediate',
      equipment: ['cable'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['rear_delts'],
      secondaryMuscles: ['upper_back'],
      commonMistakes: ['Rotating torso', 'Shrugging shoulders'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Face Pull (Rope, Pause)',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['cable'],
      location: 'gym',
      movementPattern: ['pull'],
      primaryMuscles: ['rear_delts', 'upper_back'],
      secondaryMuscles: ['biceps'],
      commonMistakes: ['Pulling too low', 'Letting elbows drop'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Band Pull-Apart',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['resistance_band'],
      location: 'both',
      movementPattern: ['pull'],
      primaryMuscles: ['rear_delts', 'upper_back'],
      secondaryMuscles: [],
      commonMistakes: ['Arching low back', 'Shrugging shoulders'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Front Raise (Plate Style)',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['dumbbell'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['front_delts'],
      secondaryMuscles: [],
      commonMistakes: ['Swinging the weight', 'Shrugging'],
      injuryRisks: [],
    }),
    makeExercise({
      name: 'Scaption Raise',
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['dumbbell'],
      location: 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['side_delts'],
      secondaryMuscles: ['front_delts'],
      commonMistakes: ['Going too heavy', 'Shrugging'],
      injuryRisks: [],
    }),
  ]

  return [...pressExercises, ...lateralRaises, ...rearDelt]
}

// ---------- Strength (Arms) ----------

function buildArmStrength(): SeedExercise[] {
  const biceps = [
    // Dumbbell
    { name: 'Hammer Curl', eq: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Cross-Body Hammer Curl', eq: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Incline Dumbbell Curl', eq: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Incline Dumbbell Curl (Neutral Grip)', eq: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Spider Curl (Incline Bench)', eq: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Alternating Dumbbell Curl (Paused)', eq: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Zottman Curl', eq: ['dumbbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Bayesian Cable Curl', eq: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Cable Curl (Rope Attachment)', eq: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Cable Curl (Straight Bar)', eq: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Cable Curl (Reverse Grip)', eq: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Resistance Band Curl', eq: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
    { name: 'Resistance Band Hammer Curl', eq: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
    { name: 'Barbell Drag Curl', eq: ['barbell'] as Equipment[], diff: 'advanced' as const },
    { name: 'Barbell Curl (Wide Grip)', eq: ['barbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Barbell Curl (Close Grip)', eq: ['barbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'EZ-Style Curl (Barbell)', eq: ['barbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Reverse Curl (Barbell)', eq: ['barbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Kettlebell Curl', eq: ['kettlebell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Kettlebell Curl (Bottoms-Up)', eq: ['kettlebell'] as Equipment[], diff: 'advanced' as const },
    { name: '21s Curl (Dumbbell)', eq: ['dumbbell'] as Equipment[], diff: 'advanced' as const },
    { name: '21s Curl (Barbell)', eq: ['barbell'] as Equipment[], diff: 'advanced' as const },
  ].map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.eq,
      location: v.eq.includes('resistance_band') ? 'both' : 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['biceps'],
      secondaryMuscles: ['forearms'],
      commonMistakes: ['Swinging the weight', 'Elbows drifting forward', 'Short range of motion'],
      injuryRisks: ['Elbow irritation if volume is excessive'],
    })
  )

  const triceps = [
    { name: 'Cable Rope Pushdown (Paused)', eq: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Cable Straight-Bar Pushdown (Paused)', eq: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Reverse-Grip Cable Pushdown', eq: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Overhead Cable Triceps Extension (Rope)', eq: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Single-Arm Cable Triceps Pushdown', eq: ['cable'] as Equipment[], diff: 'beginner' as const },
    { name: 'Single-Arm Overhead Cable Extension', eq: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Dumbbell Overhead Triceps Extension (Single)', eq: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Dumbbell Overhead Triceps Extension (Two-Hand)', eq: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Skull Crusher (Dumbbell)', eq: ['dumbbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Skull Crusher (Barbell)', eq: ['barbell', 'bench'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Close-Grip Push-Up', eq: ['none'] as Equipment[], diff: 'beginner' as const },
    { name: 'Bench Dip', eq: ['bench'] as Equipment[], diff: 'beginner' as const },
    { name: 'Triceps Dip (Upright)', eq: ['pull_up_bar'] as Equipment[], diff: 'advanced' as const },
    { name: 'Dumbbell Triceps Kickback', eq: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Cable Triceps Kickback', eq: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Machine Triceps Extension', eq: ['machine'] as Equipment[], diff: 'beginner' as const },
    { name: 'Resistance Band Triceps Pushdown', eq: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
    { name: 'Resistance Band Overhead Triceps Extension', eq: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
  ].map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.eq,
      location: v.eq.includes('none') || v.eq.includes('resistance_band') ? 'both' : 'gym',
      movementPattern: ['isolation'],
      primaryMuscles: ['triceps'],
      secondaryMuscles: ['front_delts'],
      commonMistakes: ['Elbows flaring', 'Using momentum', 'Letting shoulders roll forward'],
      injuryRisks: ['Elbow irritation if load is excessive'],
    })
  )

  const forearms = [
    { name: 'Dead Hang (Time Under Tension)', eq: ['pull_up_bar'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Towel Dead Hang', eq: ['pull_up_bar'] as Equipment[], diff: 'advanced' as const },
    { name: 'Farmer Carry (Kettlebell)', eq: ['kettlebell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Suitcase Carry (Dumbbell)', eq: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Plate Pinch Hold (Simulated)', eq: ['dumbbell'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Wrist Curl (Dumbbell)', eq: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Reverse Wrist Curl (Dumbbell)', eq: ['dumbbell'] as Equipment[], diff: 'beginner' as const },
    { name: 'Cable Wrist Curl', eq: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Cable Reverse Wrist Curl', eq: ['cable'] as Equipment[], diff: 'intermediate' as const },
    { name: 'Band Finger Extension', eq: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
    { name: 'Band Wrist Extension', eq: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
    { name: 'Band Wrist Flexion', eq: ['resistance_band'] as Equipment[], diff: 'beginner' as const },
  ].map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.eq,
      location: v.eq.includes('resistance_band') ? 'both' : 'gym',
      movementPattern: v.name.includes('Carry') ? ['carry'] : ['isolation'],
      primaryMuscles: ['forearms'],
      secondaryMuscles: ['obliques'],
      commonMistakes: ['Letting shoulders shrug', 'Bending wrists excessively'],
      injuryRisks: ['Wrist irritation if range is forced'],
    })
  )

  return [...biceps, ...triceps, ...forearms]
}

// ---------- Strength (Core) ----------

function buildCoreStrength(): SeedExercise[] {
  const core = [
    { name: 'Reverse Crunch', eq: ['none'] as Equipment[], diff: 'beginner' as const, primary: ['abs', 'lower_abs'] },
    { name: 'Reverse Crunch (Bench)', eq: ['bench'] as Equipment[], diff: 'beginner' as const, primary: ['abs', 'lower_abs'] },
    { name: 'V-Up', eq: ['none'] as Equipment[], diff: 'advanced' as const, primary: ['abs', 'upper_abs', 'lower_abs'] },
    { name: 'Hollow Body Hold', eq: ['none'] as Equipment[], diff: 'intermediate' as const, primary: ['abs'] },
    { name: 'Hollow Body Rocks', eq: ['none'] as Equipment[], diff: 'advanced' as const, primary: ['abs'] },
    { name: 'Plank (Long Lever)', eq: ['none'] as Equipment[], diff: 'advanced' as const, primary: ['abs'] },
    { name: 'Side Plank (Reach Through)', eq: ['none'] as Equipment[], diff: 'intermediate' as const, primary: ['obliques'] },
    { name: 'Pallof Press', eq: ['cable'] as Equipment[], diff: 'beginner' as const, primary: ['obliques'] },
    { name: 'Pallof Press (Hold)', eq: ['cable'] as Equipment[], diff: 'beginner' as const, primary: ['obliques'] },
    { name: 'Band Pallof Press', eq: ['resistance_band'] as Equipment[], diff: 'beginner' as const, primary: ['obliques'] },
    { name: 'Cable Woodchop (High-to-Low)', eq: ['cable'] as Equipment[], diff: 'intermediate' as const, primary: ['obliques'] },
    { name: 'Cable Woodchop (Low-to-High)', eq: ['cable'] as Equipment[], diff: 'intermediate' as const, primary: ['obliques'] },
    { name: 'Cable Anti-Rotation Hold', eq: ['cable'] as Equipment[], diff: 'beginner' as const, primary: ['obliques'] },
    { name: 'Dead Bug (Band Resisted)', eq: ['resistance_band'] as Equipment[], diff: 'intermediate' as const, primary: ['abs'] },
    { name: 'Bird Dog (Band Resisted)', eq: ['resistance_band'] as Equipment[], diff: 'intermediate' as const, primary: ['abs'] },
    { name: 'Ab Wheel Rollout (Standing Progression)', eq: ['none'] as Equipment[], diff: 'advanced' as const, primary: ['abs'] },
    { name: 'Hanging Knee Raise', eq: ['pull_up_bar'] as Equipment[], diff: 'beginner' as const, primary: ['abs', 'lower_abs'] },
    { name: 'Toes-to-Bar', eq: ['pull_up_bar'] as Equipment[], diff: 'advanced' as const, primary: ['abs', 'lower_abs'] },
    { name: 'Cable Crunch (Kneeling, Pause)', eq: ['cable'] as Equipment[], diff: 'intermediate' as const, primary: ['abs', 'upper_abs'] },
    { name: 'Suitcase Carry (Kettlebell)', eq: ['kettlebell'] as Equipment[], diff: 'beginner' as const, primary: ['obliques'] },
    { name: 'Farmer Carry (Heavy)', eq: ['dumbbell'] as Equipment[], diff: 'advanced' as const, primary: ['obliques'] },
    { name: 'Bear Crawl (Forward)', eq: ['none'] as Equipment[], diff: 'intermediate' as const, primary: ['abs'] },
    { name: 'Bear Crawl (Backward)', eq: ['none'] as Equipment[], diff: 'intermediate' as const, primary: ['abs'] },
    { name: 'Mountain Climbers', eq: ['none'] as Equipment[], diff: 'beginner' as const, primary: ['abs'] },
    { name: 'High Plank Shoulder Taps', eq: ['none'] as Equipment[], diff: 'beginner' as const, primary: ['abs'] },
    { name: 'Hanging Windshield Wiper (Bent Knee)', eq: ['pull_up_bar'] as Equipment[], diff: 'advanced' as const, primary: ['obliques'] },
    { name: 'Russian Twist (Weighted)', eq: ['dumbbell'] as Equipment[], diff: 'intermediate' as const, primary: ['obliques'] },
    { name: 'Cable Rotation (Standing)', eq: ['cable'] as Equipment[], diff: 'intermediate' as const, primary: ['obliques'] },
  ]

  return core.map((v) =>
    makeExercise({
      name: v.name,
      category: 'strength',
      difficulty: v.diff,
      equipment: v.eq,
      location: v.eq.includes('cable') || v.eq.includes('machine') || v.eq.includes('bench') ? 'gym' : 'both',
      movementPattern: v.name.includes('Carry') ? ['carry'] : v.name.includes('Woodchop') || v.name.includes('Rotation') ? ['rotate'] : ['isolation'],
      primaryMuscles: v.primary,
      secondaryMuscles: ['lower_back'],
      commonMistakes: ['Rushing reps', 'Arching lower back', 'Holding breath'],
      injuryRisks: ['Lower back irritation if bracing is poor'],
    })
  )
}

// ---------- Mobility ----------

function buildMobility(): SeedExercise[] {
  const drills: ExerciseBlueprint[] = [
    {
      name: 'Shoulder CARs',
      category: 'mobility',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['front_delts', 'rear_delts'],
      stepByStep: [
        'Stand tall and brace lightly',
        'Make a slow, controlled shoulder circle',
        'Keep ribs down and avoid arching the back',
        'Move through your pain-free range only',
        'Repeat for the other direction',
        'Perform both shoulders',
      ],
    },
    {
      name: 'Thoracic Spine Rotation (Open Book)',
      category: 'mobility',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['rotate'],
      primaryMuscles: ['upper_back', 'obliques'],
      stepByStep: [
        'Lie on your side with knees bent',
        'Reach the top arm across your body',
        'Rotate open until you feel a stretch',
        'Keep knees stacked and hips still',
        'Return slowly and repeat',
        'Switch sides',
      ],
    },
    {
      name: 'Cat-Cow',
      category: 'mobility',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['upper_back', 'lower_back'],
      stepByStep: [
        'Start on hands and knees',
        'Round your spine gently (cat)',
        'Reverse into gentle extension (cow)',
        'Move slowly with your breath',
        'Keep shoulders away from ears',
        'Repeat smoothly',
      ],
    },
    {
      name: 'Hip 90/90 Switch',
      category: 'mobility',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['rotate'],
      primaryMuscles: ['glutes'],
      stepByStep: [
        'Sit in a 90/90 hip position',
        'Keep chest tall',
        'Switch knees to the other side',
        'Stay controlled; avoid collapsing',
        'Pause and breathe in each position',
        'Repeat for reps',
      ],
    },
    {
      name: 'Hip Flexor Stretch (Half-Kneeling)',
      category: 'mobility',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['quads'],
      stepByStep: [
        'Kneel with one knee down, other foot forward',
        'Tuck pelvis slightly (glute squeeze)',
        'Shift forward until you feel a hip stretch',
        'Keep ribs down and torso tall',
        'Hold and breathe slowly',
        'Switch sides',
      ],
    },
    {
      name: 'Ankle Dorsiflexion Rocks',
      category: 'mobility',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['calves', 'soleus'],
      stepByStep: [
        'Stand facing a wall with one foot forward',
        'Keep heel down and knee tracking over toes',
        'Gently rock knee toward the wall',
        'Stay in a pain-free range',
        'Repeat for reps',
        'Switch sides',
      ],
    },
  ]

  // Add breadth: repeatable, safe mobility staples by joint/region.
  const extraNames: Array<{ name: string; primary: string[]; equipment?: Equipment[] }> = [
    { name: 'World’s Greatest Stretch', primary: ['glutes', 'hamstrings', 'upper_back', 'obliques'] },
    { name: 'Hamstring Stretch (Supine Strap/Band)', primary: ['hamstrings'], equipment: ['resistance_band'] },
    { name: 'Calf Stretch (Straight Knee)', primary: ['calves', 'gastrocnemius_medial'] },
    { name: 'Calf Stretch (Bent Knee)', primary: ['soleus', 'calves'] },
    { name: 'Pec Doorway Stretch', primary: ['chest'] },
    { name: 'Lat Stretch (Child’s Pose Side Reach)', primary: ['lats'] },
    { name: 'Thoracic Extension on Bench', primary: ['upper_back'], equipment: ['bench'] },
    { name: 'Shoulder Wall Slides', primary: ['front_delts', 'upper_back'] },
    { name: 'Band Shoulder Dislocates', primary: ['front_delts'], equipment: ['resistance_band'] },
    { name: 'Wrist Circles', primary: ['forearms'] },
    { name: 'Wrist Flexor Stretch', primary: ['forearms'] },
    { name: 'Wrist Extensor Stretch', primary: ['forearms'] },
    { name: 'Neck Side Bend Stretch', primary: ['upper_back'] },
    { name: 'Triceps Stretch (Overhead)', primary: ['triceps'] },
    { name: 'Quadriceps Stretch (Standing)', primary: ['quads'] },
    { name: 'Adductor Rock-Back', primary: ['quads'] },
    { name: 'Glute Stretch (Figure-4)', primary: ['glutes'] },
    { name: 'Seated Piriformis Stretch', primary: ['glutes'] },
    { name: 'Thoracic Rotation (Thread the Needle)', primary: ['upper_back', 'obliques'] },
    { name: 'Hip Hinge Patterning (Wall Tap)', primary: ['hamstrings', 'glutes'] },
    { name: 'Ankle Alphabet', primary: ['calves'] },
    { name: 'Shoulder External Rotation Stretch', primary: ['rear_delts'] },
    { name: 'Shoulder Internal Rotation Stretch', primary: ['rear_delts'] },
    { name: 'Scapular Circles', primary: ['upper_back', 'rear_delts'] },
    { name: 'Chest Opener (Foam Roller Style)', primary: ['chest'] },
    { name: 'Spine Segmentation Roll Down', primary: ['lower_back', 'upper_back'] },
    { name: 'Couch Stretch', primary: ['quads'], equipment: ['bench'] },
    { name: 'Hip Airplane (Assisted)', primary: ['glutes'] },
    { name: 'Ankle Calf Raise to Stretch Flow', primary: ['calves'] },
    { name: 'Deep Squat Hold', primary: ['quads', 'glutes'] },
    { name: 'Shoulder Flexion Wall Stretch', primary: ['front_delts'] },
    { name: 'Thoracic Side Bend', primary: ['upper_back', 'obliques'] },
    { name: 'Hip Circles', primary: ['glutes'] },
    { name: 'Kneeling Adductor Stretch', primary: ['quads'] },
    { name: 'Hamstring Sweep', primary: ['hamstrings'] },
    { name: 'Dynamic Lunge + Rotation', primary: ['glutes', 'obliques'] },
    { name: 'Ankle Banded Mobilization', primary: ['calves', 'soleus'], equipment: ['resistance_band'] },
    { name: 'Shoulder Shrug + Depression Drill', primary: ['upper_back'] },
    { name: 'Scapular Wall Angels', primary: ['upper_back', 'rear_delts'] },
    { name: 'Thoracic Foam Roller Extensions', primary: ['upper_back'] },
    { name: 'Hip Flexion Lift-Offs', primary: ['quads'] },
    { name: 'Seated Straddle Fold', primary: ['hamstrings'] },
    { name: 'Standing Side Bend Stretch', primary: ['obliques'] },
    { name: 'Pigeon Stretch', primary: ['glutes'] },
    { name: 'Bear Sit (Shoulder External Rotation)', primary: ['rear_delts'] },
    { name: 'Ankle Soleus Stretch (Wall)', primary: ['soleus'] },
    { name: 'Calf Foam Roll (Quick Pass)', primary: ['calves'] },
    { name: 'Quad Foam Roll (Quick Pass)', primary: ['quads'] },
    { name: 'Thoracic Rotation (Quadruped)', primary: ['upper_back'] },
    { name: 'Hip Flexor Dynamic Pulses', primary: ['quads'] },
    { name: 'Shoulder Passive Hang (Light)', primary: ['lats', 'upper_back'], equipment: ['pull_up_bar'] },
  ]

  const more = extraNames.map((x) =>
    makeExercise({
      name: x.name,
      category: 'mobility',
      difficulty: 'beginner',
      equipment: x.equipment ?? ['none'],
      location: (x.equipment ?? ['none']).includes('machine') ? 'gym' : 'both',
      movementPattern: ['isolation'],
      primaryMuscles: (x.primary as any[]).filter((m) => typeof m === 'string') as string[],
      stepByStep: [
        'Get into a comfortable starting position',
        'Move slowly into the stretch or range',
        'Pause and breathe without forcing the position',
        'Maintain good posture and control',
        'Repeat for reps or hold as needed',
        'Switch sides if applicable',
      ],
      commonMistakes: ['Forcing range of motion', 'Holding breath', 'Moving too fast'],
      injuryRisks: [],
    })
  )

  return [...drills.map(makeExercise), ...more]
}

// ---------- Rehab ----------

function buildRehab(): SeedExercise[] {
  const rehab: ExerciseBlueprint[] = [
    {
      name: 'Banded Shoulder External Rotation (Elbow Tucked)',
      category: 'rehab',
      difficulty: 'beginner',
      equipment: ['resistance_band'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['rear_delts'],
      stepByStep: [
        'Stand sideways to the band anchor',
        'Keep elbow pinned to your side (90° bend)',
        'Rotate forearm outward slowly',
        'Pause briefly at end range',
        'Return slowly with control',
        'Repeat on both sides',
      ],
      commonMistakes: ['Elbow drifting away from body', 'Moving too fast'],
      injuryRisks: [],
    },
    {
      name: 'Banded Shoulder Internal Rotation (Elbow Tucked)',
      category: 'rehab',
      difficulty: 'beginner',
      equipment: ['resistance_band'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['front_delts'],
      stepByStep: [
        'Stand sideways to the band anchor',
        'Keep elbow pinned to your side (90° bend)',
        'Rotate forearm inward slowly',
        'Pause briefly at end range',
        'Return slowly with control',
        'Repeat on both sides',
      ],
      commonMistakes: ['Shrugging shoulder', 'Twisting torso'],
      injuryRisks: [],
    },
    {
      name: 'Scapular Wall Slide (Controlled)',
      category: 'rehab',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['upper_back', 'rear_delts'],
      stepByStep: [
        'Stand with back to a wall',
        'Keep ribs down and chin tucked',
        'Slide arms upward while keeping contact',
        'Stop before shoulders shrug',
        'Return slowly and repeat',
        'Keep movement smooth',
      ],
      commonMistakes: ['Arching lower back', 'Shrugging shoulders'],
      injuryRisks: [],
    },
    {
      name: 'Terminal Knee Extension (Band)',
      category: 'rehab',
      difficulty: 'beginner',
      equipment: ['resistance_band'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['quads'],
      stepByStep: [
        'Anchor band behind the knee',
        'Step back to create light tension',
        'Straighten knee by contracting the quad',
        'Pause at full extension',
        'Return slowly',
        'Repeat both legs',
      ],
      commonMistakes: ['Locking out aggressively', 'Letting knee cave inward'],
      injuryRisks: [],
    },
    {
      name: 'Glute Med Clamshell',
      category: 'rehab',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['glutes'],
      stepByStep: [
        'Lie on your side with knees bent',
        'Keep feet together and hips stacked',
        'Open top knee without rolling the pelvis',
        'Pause briefly at the top',
        'Lower slowly with control',
        'Repeat both sides',
      ],
      commonMistakes: ['Rolling backward', 'Using momentum'],
      injuryRisks: [],
    },
    {
      name: 'Dead Bug (Rehab Tempo)',
      category: 'rehab',
      difficulty: 'beginner',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['isolation'],
      primaryMuscles: ['abs'],
      stepByStep: [
        'Lie on your back with knees and hips at 90°',
        'Brace your core gently',
        'Extend opposite arm and leg slowly',
        'Keep lower back lightly pressed into the floor',
        'Return and switch sides',
        'Repeat with control',
      ],
      commonMistakes: ['Arching the lower back', 'Moving too fast'],
      injuryRisks: [],
    },
  ]

  const extras: Array<{ name: string; primary: string[]; equipment: Equipment[]; location: Location }> = [
    { name: 'Bird Dog (Rehab Tempo)', primary: ['abs'], equipment: ['none'], location: 'both' },
    { name: 'McGill Curl-Up', primary: ['abs'], equipment: ['none'], location: 'both' },
    { name: 'Side Plank (Short Lever)', primary: ['obliques'], equipment: ['none'], location: 'both' },
    { name: 'Glute Bridge (Isometric)', primary: ['glutes'], equipment: ['none'], location: 'both' },
    { name: 'Banded Glute Bridge (Rehab)', primary: ['glutes'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Glute Bridge March (Slow)', primary: ['glutes', 'abs'], equipment: ['none'], location: 'both' },
    { name: 'Straight Leg Raise (Quad Focus)', primary: ['quads'], equipment: ['none'], location: 'both' },
    { name: 'Quad Set (Isometric)', primary: ['quads'], equipment: ['none'], location: 'both' },
    { name: 'Heel Slide (Knee Mobility)', primary: ['quads'], equipment: ['none'], location: 'both' },
    { name: 'Spanish Squat (Band Assisted)', primary: ['quads'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Single-Leg Balance (Barefoot)', primary: ['calves'], equipment: ['none'], location: 'both' },
    { name: 'Eccentric Calf Raise (Achilles)', primary: ['calves', 'soleus'], equipment: ['none'], location: 'both' },
    { name: 'Tibialis Raise (Wall Lean)', primary: ['calves'], equipment: ['none'], location: 'both' },
    { name: 'Ankle Inversion/Eversion (Band)', primary: ['calves'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Hip Hinge to Wall (Rehab)', primary: ['hamstrings', 'glutes'], equipment: ['none'], location: 'both' },
    { name: 'Bodyweight Box Squat (Rehab)', primary: ['quads', 'glutes'], equipment: ['bench'], location: 'both' },
    { name: 'Step-Up (Low Height, Rehab)', primary: ['quads', 'glutes'], equipment: ['bench'], location: 'both' },
    { name: 'Hip Airplane (Assisted, Rehab)', primary: ['glutes'], equipment: ['none'], location: 'both' },
    { name: 'Side-Lying Hip Hike', primary: ['glutes'], equipment: ['none'], location: 'both' },
    { name: 'Band Pull-Apart (Rehab)', primary: ['upper_back', 'rear_delts'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Banded Face Pull (Rehab)', primary: ['rear_delts', 'upper_back'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Banded Row (Scapular Retraction)', primary: ['upper_back'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Wall Angel (Rehab)', primary: ['upper_back', 'rear_delts'], equipment: ['none'], location: 'both' },
    { name: 'Prone Cobra Hold', primary: ['upper_back'], equipment: ['none'], location: 'both' },
    { name: 'Scapular Push-Up', primary: ['upper_back'], equipment: ['none'], location: 'both' },
    { name: 'Scapular Pull-Up (Rehab)', primary: ['upper_back', 'lats'], equipment: ['pull_up_bar'], location: 'gym' },
    { name: 'Wall Sit (Rehab)', primary: ['quads'], equipment: ['none'], location: 'both' },
    { name: 'Hamstring Isometric (Bridge Hold)', primary: ['hamstrings'], equipment: ['none'], location: 'both' },
    { name: 'Hip Abduction (Side-Lying)', primary: ['glutes'], equipment: ['none'], location: 'both' },
    { name: 'Band Hip Abduction', primary: ['glutes'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Band Hip Adduction', primary: ['quads'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Forearm Plank (Rehab)', primary: ['abs'], equipment: ['none'], location: 'both' },
    { name: 'Shoulder Isometric External Rotation (Wall)', primary: ['rear_delts'], equipment: ['none'], location: 'both' },
    { name: 'Shoulder Isometric Internal Rotation (Wall)', primary: ['front_delts'], equipment: ['none'], location: 'both' },
    { name: 'Banded External Rotation (90° Abduction)', primary: ['rear_delts'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Banded Internal Rotation (90° Abduction)', primary: ['front_delts'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Wrist Pronation/Supination (Light)', primary: ['forearms'], equipment: ['dumbbell'], location: 'both' },
    { name: 'Wrist Extension Isometric (Band)', primary: ['forearms'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Wrist Flexion Isometric (Band)', primary: ['forearms'], equipment: ['resistance_band'], location: 'both' },
    { name: 'Rowing Pattern (Band)', primary: ['upper_back', 'lats'], equipment: ['resistance_band'], location: 'both' },
  ]

  const extraExercises = extras.map((x) =>
    makeExercise({
      name: x.name,
      category: 'rehab',
      difficulty: 'beginner',
      equipment: x.equipment,
      location: x.location,
      movementPattern: ['isolation'],
      primaryMuscles: x.primary,
      stepByStep: [
        'Set up in a stable position',
        'Move slowly through a comfortable range',
        'Stop if you feel sharp pain',
        'Keep tension light and controlled',
        'Rest as needed between sets',
        'Repeat for quality reps',
      ],
      commonMistakes: ['Pushing through pain', 'Rushing the reps', 'Holding breath'],
      injuryRisks: [],
      benefits: { rehab: true, posture: true },
    })
  )

  return [...rehab.map(makeExercise), ...extraExercises]
}

// ---------- Cardio ----------

function buildCardio(): SeedExercise[] {
  const cardio = [
    { name: 'Outdoor Running (Easy Pace)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Outdoor Running (Intervals)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Incline Treadmill Walk', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Treadmill Run (Intervals)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Stationary Bike (Steady State)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Stationary Bike (HIIT)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Rowing Machine (Steady State)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Rowing Machine (Intervals)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Elliptical (Steady State)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Elliptical (Intervals)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Stair Climber', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Jump Rope (Single Unders)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Jump Rope (Intervals)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Jumping Jacks', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'High Knees', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Burpees', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Mountain Climbers (Intervals)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Shadow Boxing (Rounds)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Skater Hops', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Fast Stair Walk (No Machine)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Kettlebell Swing (Conditioning)', equipment: ['kettlebell'] as Equipment[], location: 'gym' as const },
    { name: 'Sled Push (Simulated March)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Farmer Carry (Conditioning)', equipment: ['dumbbell'] as Equipment[], location: 'gym' as const },
    { name: 'Cycling (Outdoor)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Incline Walk (Outdoor Hills)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Jog-Walk-Jog (Fartlek)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Step-Ups (Continuous)', equipment: ['bench'] as Equipment[], location: 'both' as const },
    { name: 'Bear Crawl (Continuous)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Low-Impact March (Continuous)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Bodyweight Squat (Continuous)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Lunge (Continuous)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Jump Rope (Double Under Practice)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Swimming (Steady State)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Rowing Machine (Technique Focus)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Air Bike (Intervals)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Assault Bike (Steady State)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
    { name: 'Light Jog (Recovery)', equipment: ['none'] as Equipment[], location: 'both' as const },
    { name: 'Zone 2 Bike (Easy)', equipment: ['machine'] as Equipment[], location: 'gym' as const },
  ]

  return cardio.map((v) =>
    makeExercise({
      name: v.name,
      category: 'cardio',
      difficulty: v.name.includes('Intervals') || v.name.includes('HIIT') ? 'advanced' : 'beginner',
      equipment: v.equipment,
      location: v.location,
      movementPattern: ['squat'],
      primaryMuscles: ['quads', 'calves'],
      secondaryMuscles: ['glutes', 'abs'],
      stepByStep: [
        'Warm up for 3–5 minutes at an easy pace',
        'Set an intensity you can sustain safely',
        'Maintain tall posture and smooth breathing',
        'Adjust pace/resistance as needed',
        'Cool down for 3–5 minutes',
        'Stretch lightly if desired',
      ],
      commonMistakes: ['Starting too fast', 'Ignoring form', 'Skipping warm-up/cool-down'],
      injuryRisks: ['Overuse injury risk if volume increases too quickly'],
      benefits: { fatLoss: true, sportsPerformance: true },
    })
  )
}

export const expandedExercises: SeedExercise[] = [
  ...buildChestStrength(),
  ...buildBackStrength(),
  ...buildLegStrength(),
  ...buildShoulderStrength(),
  ...buildArmStrength(),
  ...buildCoreStrength(),
  ...buildMobility(),
  ...buildRehab(),
  ...buildCardio(),
]
