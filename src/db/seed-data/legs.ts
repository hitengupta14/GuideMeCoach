// Legs Exercises - All subtypes (Quads, Hamstrings, Glutes, Calves)
export const legsExercises = [
  // Quads Exercises
  {
    name: 'Barbell Back Squat',
    slug: 'barbell-back-squat',
    category: 'strength',
    difficulty: 'advanced',
    equipment: ['barbell', 'bench'],
    location: 'gym',
    movementPattern: ['squat'],
    description: 'Fundamental compound leg exercise targeting quadriceps and glutes through barbell loaded squat pattern.',
    stepByStep: [
      'Position barbell on upper back',
      'Stand with feet shoulder-width apart',
      'Keep chest up and core engaged',
      'Descend by bending hips and knees',
      'Lower until thighs parallel to ground',
      'Drive through heels to return to standing',
      'Maintain neutral spine throughout'
    ],
    breathingTechnique: 'Inhale while descending, exhale while rising',
    tempo: '3-0-1-0',
    commonMistakes: ['Forward lean excessive', 'Knees caving inward', 'Not achieving depth', 'Feet too narrow'],
    injuryRisks: ['Knee strain', 'Lower back strain', 'Patellar tendinitis'],
    benefits: { muscleGrowth: true, sportsPerformance: true, fatLoss: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' },
      { muscleGroup: 'glutes', role: 'primary' },
      { muscleGroup: 'hamstrings', role: 'secondary' }
    ]
  },
  {
    name: 'Dumbbell Goblet Squat',
    slug: 'dumbbell-goblet-squat',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    location: 'gym',
    movementPattern: ['squat'],
    description: 'Dumbbell squat variation holding weight at chest allowing better upright position and quad emphasis.',
    stepByStep: [
      'Hold dumbbell vertically at chest',
      'Stand with feet hip to shoulder-width apart',
      'Descend by bending hips and knees',
      'Lower until thighs parallel to ground',
      'Keep chest up throughout movement',
      'Drive through heels to return to standing'
    ],
    breathingTechnique: 'Inhale while descending, exhale while rising',
    tempo: '2-0-1-0',
    commonMistakes: ['Knees caving inward', 'Excessive forward lean', 'Not achieving depth'],
    injuryRisks: ['Knee strain if depth excessive', 'Lower back strain'],
    benefits: { muscleGrowth: true, mobility: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' },
      { muscleGroup: 'glutes', role: 'primary' }
    ]
  },
  {
    name: 'Leg Press',
    slug: 'leg-press',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['squat'],
    description: 'Machine-based leg press providing safe, bilateral leg development with quad and glute targeting.',
    stepByStep: [
      'Sit upright in leg press machine',
      'Position feet hip to shoulder-width apart on platform',
      'Plant feet firmly',
      'Lower platform by bending knees',
      'Lower until knees roughly 90 degrees',
      'Drive through heels to extend legs',
      'Avoid locking knees at top'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Excessive depth straining knees', 'Feet too high or low', 'Locking out knees'],
    injuryRisks: ['Knee strain', 'Lower back discomfort'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' },
      { muscleGroup: 'glutes', role: 'primary' }
    ]
  },
  {
    name: 'Machine Leg Press Variations',
    slug: 'machine-leg-press-variations',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['squat'],
    description: 'Various leg press machine variations including V-press and horizontal press for quad development.',
    stepByStep: [
      'Adjust machine to match body alignment',
      'Position feet appropriately for specific variation',
      'Lower weight in controlled manner',
      'Press back to starting position',
      'Maintain consistent form throughout set'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Improper foot placement', 'Excessive depth', 'Using momentum'],
    injuryRisks: ['Knee strain', 'Lower back discomfort'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' },
      { muscleGroup: 'glutes', role: 'secondary' }
    ]
  },
  {
    name: 'Hack Squat',
    slug: 'hack-squat',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['squat'],
    description: 'Machine-based squat variation providing guided movement with heavy quad emphasis and minimal lower back involvement.',
    stepByStep: [
      'Position shoulders under shoulder pads',
      'Place feet hip to shoulder-width apart',
      'Lower body by bending knees',
      'Descend until thighs parallel to ground',
      'Drive through heels to return to start',
      'Keep back against pad throughout'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Excessive depth', 'Feet too narrow', 'Knees caving'],
    injuryRisks: ['Knee strain', 'Patellar tendinitis'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' }
    ]
  },
  {
    name: 'Leg Extension',
    slug: 'leg-extension',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation exercise for quadriceps using machine-guided knee extension movement.',
    stepByStep: [
      'Sit upright in leg extension machine',
      'Position foot pad above ankles',
      'Extend legs fully by straightening knees',
      'Hold briefly at top',
      'Lower weight in controlled manner',
      'Avoid locking knees at extension'
    ],
    breathingTechnique: 'Exhale while extending, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Excessive weight causing jerky motion', 'Not achieving full extension', 'Locking knees'],
    injuryRisks: ['Patellar tendinitis', 'Knee strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' }
    ]
  },
  {
    name: 'Bulgarian Split Squat',
    slug: 'bulgarian-split-squat',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['squat'],
    description: 'Single-leg dominant squat variation with rear foot elevated for quad and glute emphasis.',
    stepByStep: [
      'Position one foot on elevated surface behind',
      'Step forward with other leg',
      'Lower body by bending front leg',
      'Lower until front thigh parallel to ground',
      'Drive through front heel to return to start',
      'Complete all reps on one leg before switching'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while rising',
    tempo: '2-0-1-0',
    commonMistakes: ['Front knee extending too far', 'Excessive forward lean', 'Back foot position too high'],
    injuryRisks: ['Front knee strain', 'Hip flexor tightness', 'Balance issues'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' },
      { muscleGroup: 'glutes', role: 'secondary' }
    ]
  },
  {
    name: 'Walking Lunge',
    slug: 'walking-lunge',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    location: 'both',
    movementPattern: ['squat'],
    description: 'Dynamic leg exercise that develops quads, glutes, and balance through forward stepping motion.',
    stepByStep: [
      'Stand upright holding dumbbells at sides',
      'Step forward with one leg',
      'Lower body until both knees roughly 90 degrees',
      'Drive through front heel to step forward',
      'Alternate legs in continuous walking motion',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Inhale while stepping, exhale while driving',
    tempo: '2-0-1-0',
    commonMistakes: ['Leaning forward excessively', 'Front knee extending too far', 'Insufficient depth'],
    injuryRisks: ['Knee strain', 'Lower back strain', 'Balance issues'],
    benefits: { muscleGrowth: true, fatLoss: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' },
      { muscleGroup: 'glutes', role: 'primary' },
      { muscleGroup: 'hamstrings', role: 'secondary' }
    ]
  },
  {
    name: 'Treadmill Running',
    slug: 'treadmill-running',
    category: 'cardio',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['squat'],
    description: 'Cardiovascular exercise that engages quads and entire lower body through running motion.',
    stepByStep: [
      'Start treadmill at walking pace',
      'Gradually increase to running speed',
      'Maintain proper running form',
      'Lean slightly forward',
      'Land midfoot with each stride'
    ],
    breathingTechnique: 'Natural rhythmic breathing pattern',
    tempo: '1-0-1-0',
    commonMistakes: ['Excessive impact on joints', 'Poor posture', 'Overstriding'],
    injuryRisks: ['Knee strain', 'Shin splints', 'Hip strain'],
    benefits: { cardio: true, fatLoss: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' }
    ]
  },
  {
    name: 'Stationary Bike',
    slug: 'stationary-bike',
    category: 'cardio',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['squat'],
    description: 'Low-impact cardiovascular exercise engaging quads while being gentle on joints.',
    stepByStep: [
      'Adjust seat height for proper leg extension',
      'Adjust seat distance from pedals',
      'Begin pedaling at steady pace',
      'Gradually increase resistance as desired',
      'Maintain consistent cadence'
    ],
    breathingTechnique: 'Natural rhythmic breathing',
    tempo: '1-0-1-0',
    commonMistakes: ['Seat too high or low', 'Excessive resistance too soon', 'Poor posture'],
    injuryRisks: [],
    benefits: { cardio: true, fatLoss: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'primary' }
    ]
  },
  {
    name: 'Quad Stretch',
    slug: 'quad-stretch',
    category: 'mobility',
    difficulty: 'beginner',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['isolation'],
    description: 'Static stretching exercise targeting quadriceps for mobility and recovery.',
    stepByStep: [
      'Stand on one leg',
      'Pull other foot toward buttocks',
      'Keep knees close together',
      'Feel stretch in front of thigh',
      'Hold for 20-30 seconds',
      'Repeat on other side'
    ],
    breathingTechnique: 'Deep, steady breathing throughout hold',
    tempo: '0-30-0-0',
    commonMistakes: ['Pulling knee too far away from body', 'Arching lower back', 'Bouncing stretch'],
    injuryRisks: [],
    benefits: { mobility: true },
    muscleGroups: [
      { muscleGroup: 'quads', role: 'secondary' }
    ]
  },
  // Hamstrings Exercises
  {
    name: 'Lying Leg Curl',
    slug: 'lying-leg-curl',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation exercise for hamstrings using machine-guided knee flexion while lying prone.',
    stepByStep: [
      'Lie face down on leg curl machine',
      'Position foot pad behind ankles',
      'Curl legs upward by flexing knees',
      'Bring heels toward glutes',
      'Hold briefly at top',
      'Lower weight in controlled manner'
    ],
    breathingTechnique: 'Exhale while curling, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Excessive weight causing hip lifting', 'Not achieving full curl', 'Jerky motion'],
    injuryRisks: ['Hamstring strain', 'Lower back discomfort'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'hamstrings', role: 'primary' }
    ]
  },
  {
    name: 'Seated Leg Curl',
    slug: 'seated-leg-curl',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Seated variation of leg curl isolating hamstrings with more stable, upright position.',
    stepByStep: [
      'Sit upright in seated leg curl machine',
      'Position foot pad against ankles',
      'Curl legs downward by flexing knees',
      'Achieve strong hamstring contraction',
      'Hold briefly at bottom',
      'Extend legs in controlled manner'
    ],
    breathingTechnique: 'Exhale while curling, inhale while extending',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Not achieving full contraction', 'Feet slipping'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'hamstrings', role: 'primary' }
    ]
  },
  {
    name: 'Nordic Hamstring Curl',
    slug: 'nordic-hamstring-curl',
    category: 'strength',
    difficulty: 'advanced',
    equipment: ['pull_up_bar'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Advanced bodyweight exercise for eccentric hamstring strength and injury prevention.',
    stepByStep: [
      'Kneel on padded surface',
      'Secure feet under sturdy anchor',
      'Lower body forward in controlled manner',
      'Use hands to catch fall if needed',
      'Return to kneeling position',
      'Use maximum eccentric control'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while returning',
    tempo: '3-0-1-0',
    commonMistakes: ['Too much momentum lowering', 'Dropping suddenly', 'Insufficient hamstring control'],
    injuryRisks: ['Hamstring rupture if not done carefully', 'Knee strain'],
    benefits: { muscleGrowth: true, rehab: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'hamstrings', role: 'primary' }
    ]
  },
  {
    name: 'Glute-Ham Raise',
    slug: 'glute-ham-raise',
    category: 'strength',
    difficulty: 'advanced',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Advanced exercise targeting hamstrings and glutes through hip extension and knee flexion.',
    stepByStep: [
      'Position on glute-ham machine',
      'Secure feet under foot pads',
      'Lower torso by flexing knees',
      'Extend hips and knees to raise torso',
      'Maintain upright torso position',
      'Control descent throughout movement'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while raising',
    tempo: '3-0-1-0',
    commonMistakes: ['Using momentum', 'Incomplete range of motion', 'Lower back hyperextension'],
    injuryRisks: ['Hamstring strain', 'Lower back strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'hamstrings', role: 'primary' },
      { muscleGroup: 'glutes', role: 'primary' }
    ]
  },

  // Glutes Exercises
  {
    name: 'Hip Thrusts',
    slug: 'hip-thrusts',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['barbell', 'bench'],
    location: 'gym',
    movementPattern: ['hinge'],
    description: 'Glute-dominant hip extension exercise with barbell providing maximum glute activation.',
    stepByStep: [
      'Sit on floor with back against bench',
      'Position barbell across hips',
      'Place feet flat on floor',
      'Drive through heels to lift hips',
      'Achieve full hip extension at top',
      'Squeeze glutes maximally',
      'Lower hips in controlled manner'
    ],
    breathingTechnique: 'Exhale while driving hips, inhale while lowering',
    tempo: '1-1-2-0',
    commonMistakes: ['Not achieving full hip extension', 'Excessive lower back hyperextension', 'Using knees instead of hips'],
    injuryRisks: ['Lower back strain if hyperextended'],
    benefits: { muscleGrowth: true, posture: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'glutes', role: 'primary' },
      { muscleGroup: 'hamstrings', role: 'secondary' }
    ]
  },
  {
    name: 'Glute Bridge',
    slug: 'glute-bridge',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['hinge'],
    description: 'Bodyweight glute-dominant exercise that can be easily loaded with weight for progression.',
    stepByStep: [
      'Lie on back with knees bent',
      'Place feet flat on floor',
      'Drive through heels to lift hips',
      'Achieve full hip extension at top',
      'Squeeze glutes at top position',
      'Lower hips in controlled manner'
    ],
    breathingTechnique: 'Exhale while driving hips, inhale while lowering',
    tempo: '1-1-2-0',
    commonMistakes: ['Not achieving full hip extension', 'Feet too close to body', 'Using lower back instead of glutes'],
    injuryRisks: [],
    benefits: { muscleGrowth: true, posture: true, rehab: true },
    muscleGroups: [
      { muscleGroup: 'glutes', role: 'primary' },
      { muscleGroup: 'hamstrings', role: 'secondary' }
    ]
  },
  {
    name: 'Cable Kickbacks',
    slug: 'cable-kickbacks',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['hinge'],
    description: 'Isolation exercise for glutes using cable resistance for constant tension throughout movement.',
    stepByStep: [
      'Attach ankle cuff to cable machine',
      'Stand facing cable machine',
      'Keep supporting leg slightly bent',
      'Extend working leg backward in controlled motion',
      'Squeeze glutes at full extension',
      'Return to starting position',
      'Complete set on one leg before switching'
    ],
    breathingTechnique: 'Exhale while extending, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Not achieving full range of motion', 'Leaning forward excessively'],
    injuryRisks: ['Lower back strain if form is poor'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'glutes', role: 'primary' }
    ]
  },

  // Calves Exercises (including gastrocnemius and soleus)
  {
    name: 'Standing Calf Raise',
    slug: 'standing-calf-raise',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['barbell', 'dumbbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation exercise for calves emphasizing gastrocnemius through standing ankle plantarflexion.',
    stepByStep: [
      'Stand upright holding weight at sides',
      'Position feet hip-width apart',
      'Rise up onto balls of feet',
      'Achieve maximum ankle plantarflexion',
      'Hold briefly at top',
      'Lower heels back to ground in controlled manner'
    ],
    breathingTechnique: 'Exhale while rising, inhale while lowering',
    tempo: '1-1-2-0',
    commonMistakes: ['Partial range of motion', 'Using momentum', 'Not achieving full elevation'],
    injuryRisks: ['Calf cramp', 'Achilles tendinitis if excessive weight'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'calves', role: 'primary' },
      { muscleGroup: 'gastrocnemius_lateral', role: 'primary' },
      { muscleGroup: 'gastrocnemius_medial', role: 'primary' }
    ]
  },
  {
    name: 'Seated Calf Raise',
    slug: 'seated-calf-raise',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine', 'barbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Seated calf raise emphasizing soleus muscle with knees bent position.',
    stepByStep: [
      'Sit upright on bench or machine',
      'Position weight across thighs',
      'Place balls of feet on elevated surface',
      'Raise heels by plantarflexing ankles',
      'Achieve full ankle extension at top',
      'Lower heels in controlled manner'
    ],
    breathingTechnique: 'Exhale while raising, inhale while lowering',
    tempo: '1-1-2-0',
    commonMistakes: ['Partial range of motion', 'Using arms to assist', 'Incomplete plantarflexion'],
    injuryRisks: ['Achilles tendinitis', 'Calf cramping'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'calves', role: 'primary' },
      { muscleGroup: 'soleus', role: 'primary' }
    ]
  },
  {
    name: 'Machine Calf Raise',
    slug: 'machine-calf-raise',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Machine-based calf raise providing safe, guided movement for calf development.',
    stepByStep: [
      'Position shoulders under shoulder pads',
      'Stand upright on machine',
      'Place balls of feet on foot plate',
      'Rise onto balls of feet in controlled motion',
      'Achieve full ankle extension at top',
      'Lower heels to starting position',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Exhale while rising, inhale while lowering',
    tempo: '1-1-2-0',
    commonMistakes: ['Partial range of motion', 'Leaning forward', 'Using momentum'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'calves', role: 'primary' },
      { muscleGroup: 'gastrocnemius_lateral', role: 'primary' },
      { muscleGroup: 'gastrocnemius_medial', role: 'primary' }
    ]
  },
  {
    name: 'Jump Rope',
    slug: 'jump-rope',
    category: 'cardio',
    difficulty: 'intermediate',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['isolation'],
    description: 'Cardiovascular exercise that develops calf muscles and endurance through repeated ankle plantarflexion.',
    stepByStep: [
      'Hold rope handles at waist height',
      'Jump with both feet simultaneously',
      'Rotate rope over head and body',
      'Land on balls of feet',
      'Maintain consistent rhythm',
      'Perform for desired duration'
    ],
    breathingTechnique: 'Natural rhythmic breathing',
    tempo: '1-0-1-0',
    commonMistakes: ['Landing on heels', 'Excessive jumping height', 'Inconsistent rhythm'],
    injuryRisks: ['Calf strain', 'Achilles tendinitis', 'Ankle strain'],
    benefits: { cardio: true, muscleGrowth: true, fatLoss: true },
    muscleGroups: [
      { muscleGroup: 'calves', role: 'primary' },
      { muscleGroup: 'gastrocnemius_lateral', role: 'primary' },
      { muscleGroup: 'gastrocnemius_medial', role: 'primary' }
    ]
  }
]
