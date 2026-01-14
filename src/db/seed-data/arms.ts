// Arms Exercises - All subtypes (Biceps, Triceps, Forearms)
export const armsExercises = [
  // Biceps Exercises
  {
    name: 'Barbell Curls',
    slug: 'barbell-curls',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Classic bicep exercise using barbell for maximum strength development of biceps brachii.',
    stepByStep: [
      'Stand upright with barbell at hip height',
      'Keep elbows pinned to sides',
      'Curl barbell toward shoulders',
      'Achieve full bicep contraction at top',
      'Lower barbell in controlled manner',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Exhale while curling, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Swinging weight using momentum', 'Elbows moving away from body', 'Incomplete range of motion'],
    injuryRisks: ['Biceps tendinitis', 'Lower back strain from swinging'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'biceps', role: 'primary' },
      { muscleGroup: 'forearms', role: 'secondary' }
    ]
  },
  {
    name: 'Dumbbell Curls',
    slug: 'dumbbell-curls',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Dumbbell version of curls allowing unilateral bicep development and increased range of motion.',
    stepByStep: [
      'Stand upright holding dumbbells at sides',
      'Keep elbows pinned to sides',
      'Curl dumbbells toward shoulders',
      'Achieve full bicep contraction',
      'Lower dumbbells in controlled manner',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Exhale while curling, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum to swing weight', 'Elbows moving away from body', 'Unilateral strength imbalance'],
    injuryRisks: ['Biceps strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'biceps', role: 'primary' },
      { muscleGroup: 'forearms', role: 'secondary' }
    ]
  },
  {
    name: 'Cable Curls',
    slug: 'cable-curls',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Cable-based curl providing constant tension throughout movement for bicep development.',
    stepByStep: [
      'Stand facing cable machine with handle at hip height',
      'Keep elbows pinned to sides',
      'Curl handle toward face',
      'Achieve full bicep contraction',
      'Lower handle in controlled manner',
      'Maintain upright posture'
    ],
    breathingTechnique: 'Exhale while curling, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Elbows moving away', 'Incomplete range of motion'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'biceps', role: 'primary' }
    ]
  },
  {
    name: 'Machine Bicep Curl',
    slug: 'machine-bicep-curl',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Machine-based bicep curl providing stable, guided movement for bicep isolation.',
    stepByStep: [
      'Sit upright in machine',
      'Position upper arms on pads',
      'Grasp handles at chest level',
      'Curl handles toward face',
      'Achieve full bicep contraction',
      'Return to starting position in controlled manner'
    ],
    breathingTechnique: 'Exhale while curling, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Incomplete range of motion', 'Back lifting off pad'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'biceps', role: 'primary' }
    ]
  },
  {
    name: 'Preacher Curls',
    slug: 'preacher-curls',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Preacher curl using preacher bench for strict bicep movement with reduced momentum.',
    stepByStep: [
      'Position upper arms on preacher curl pad',
      'Hold barbell with hands shoulder-width apart',
      'Curl weight toward face in controlled motion',
      'Achieve full bicep contraction at top',
      'Lower weight in controlled manner',
      'Maintain arm contact with pad throughout'
    ],
    breathingTechnique: 'Exhale while curling, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Lifting elbows off pad', 'Using momentum', 'Incomplete range of motion'],
    injuryRisks: ['Biceps tendinitis', 'Elbow strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'biceps', role: 'primary' },
      { muscleGroup: 'forearms', role: 'secondary' }
    ]
  },
  {
    name: 'Concentration Curls',
    slug: 'concentration-curls',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['dumbbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolated bicep exercise performed seated for intense bicep peak contraction.',
    stepByStep: [
      'Sit upright on bench',
      'Hold dumbbell with one hand',
      'Rest elbow on inner thigh',
      'Curl dumbbell toward shoulder',
      'Squeeze bicep at top of movement',
      'Lower dumbbell in controlled manner',
      'Complete set on one arm before switching'
    ],
    breathingTechnique: 'Exhale while curling, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Not achieving full range of motion', 'Excessive weight'],
    injuryRisks: ['Biceps strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'biceps', role: 'primary' }
    ]
  },

  // Triceps Exercises
  {
    name: 'Barbell Bench Press (Close Grip)',
    slug: 'barbell-bench-press-close-grip',
    category: 'strength',
    difficulty: 'advanced',
    equipment: ['barbell', 'bench'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Close grip bench press shifting emphasis to triceps while maintaining chest involvement.',
    stepByStep: [
      'Lie flat on bench with eyes under barbell',
      'Grip barbell with hands narrower than shoulder width',
      'Lower bar to chest in controlled motion',
      'Press bar upward explosively',
      'Keep elbows closer to body than wide-grip variation',
      'Maintain full control throughout'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Grip too narrow', 'Elbows flaring excessively', 'Wrist pain from narrow grip'],
    injuryRisks: ['Wrist strain', 'Elbow strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'triceps', role: 'primary' },
      { muscleGroup: 'mid_chest', role: 'secondary' },
      { muscleGroup: 'front_delts', role: 'secondary' }
    ]
  },
  {
    name: 'Tricep Dips',
    slug: 'tricep-dips',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['pull_up_bar'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Bodyweight dip exercise that heavily targets triceps, with secondary chest involvement when leaning.',
    stepByStep: [
      'Grip dip bars with hands shoulder-width apart',
      'Support yourself with arms extended',
      'Lower body by bending elbows',
      'Lower until upper arms parallel to ground',
      'Drive through palms to return to starting position',
      'Maintain upright posture for tricep emphasis'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing up',
    tempo: '2-0-1-0',
    commonMistakes: ['Excessive body lean', 'Insufficient range of motion', 'Flaring elbows too wide'],
    injuryRisks: ['Shoulder impingement', 'Elbow strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'triceps', role: 'primary' },
      { muscleGroup: 'lower_chest', role: 'secondary' }
    ]
  },
  {
    name: 'Tricep Rope Pushdown',
    slug: 'tricep-rope-pushdown',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Cable-based tricep exercise using rope attachment for elbow extension and tricep isolation.',
    stepByStep: [
      'Stand facing cable machine',
      'Grasp rope with both hands at shoulder height',
      'Keep elbows pinned to sides',
      'Push rope downward by extending elbows',
      'Achieve full tricep contraction at bottom',
      'Return rope to shoulder height in controlled manner'
    ],
    breathingTechnique: 'Exhale while pushing down, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Moving elbows away from body', 'Using momentum', 'Not achieving full extension'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'triceps', role: 'primary' }
    ]
  },
  {
    name: 'Tricep Bar Pushdown',
    slug: 'tricep-bar-pushdown',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Cable tricep pushdown using straight bar for tricep isolation.',
    stepByStep: [
      'Stand facing cable machine',
      'Grasp bar with both hands at shoulder height',
      'Keep elbows pinned to sides',
      'Push bar downward by extending elbows',
      'Achieve full tricep contraction at bottom',
      'Return bar to shoulder height in controlled manner'
    ],
    breathingTechnique: 'Exhale while pushing down, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Elbows moving away from body', 'Using momentum', 'Not achieving full extension'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'triceps', role: 'primary' }
    ]
  },
  {
    name: 'Skull Crushers',
    slug: 'skull-crushers',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Elbow extension exercise performed lying on bench targeting triceps through overhead motion.',
    stepByStep: [
      'Lie on flat bench holding barbell above chest',
      'Keep elbows stationary',
      'Lower weight by flexing elbows',
      'Lower until bar near top of head',
      'Extend elbows to return to starting position',
      'Maintain control throughout movement'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while extending',
    tempo: '2-0-1-0',
    commonMistakes: ['Elbows flaring outward', 'Using momentum', 'Lowering too far causing head contact'],
    injuryRisks: ['Elbow strain', 'Triceps tendinitis'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'triceps', role: 'primary' }
    ]
  },
  {
    name: 'Overhead Tricep Extension',
    slug: 'overhead-tricep-extension',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell', 'cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Tricep extension with weight held overhead for long-head tricep emphasis.',
    stepByStep: [
      'Stand holding dumbbell overhead with both hands',
      'Keep elbows stationary pointing forward',
      'Lower weight behind head by flexing elbows',
      'Achieve full tricep stretch at bottom',
      'Extend elbows to return to starting position',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while extending',
    tempo: '2-0-1-0',
    commonMistakes: ['Elbows flaring outward', 'Using momentum', 'Incomplete range of motion'],
    injuryRisks: ['Lower back strain', 'Elbow strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'triceps', role: 'primary' }
    ]
  },

  // Forearms Exercises
  {
    name: 'Barbell Wrist Curls',
    slug: 'barbell-wrist-curls',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Wrist flexion exercise targeting forearm flexors for forearm strength development.',
    stepByStep: [
      'Sit on bench with forearms resting on thighs',
      'Hold barbell with hands outside knees',
      'Lower weight by flexing wrists downward',
      'Achieve full range of motion at bottom',
      'Curl weight upward using wrist flexion',
      'Maintain control throughout movement'
    ],
    breathingTechnique: 'Exhale while curling up, inhale while lowering',
    tempo: '1-0-1-0',
    commonMistakes: ['Moving elbows or forearms', 'Using momentum', 'Incomplete range of motion'],
    injuryRisks: ['Wrist strain', 'Forearm strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'forearms', role: 'primary' }
    ]
  },
  {
    name: 'Barbell Wrist Extensions',
    slug: 'barbell-wrist-extensions',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Wrist extension exercise targeting forearm extensors for balanced forearm development.',
    stepByStep: [
      'Sit on bench with forearms resting on thighs',
      'Hold barbell with hands inside knees',
      'Lower weight by extending wrists downward',
      'Achieve full range of motion at bottom',
      'Raise weight upward using wrist extension',
      'Maintain control throughout movement'
    ],
    breathingTechnique: 'Exhale while extending up, inhale while lowering',
    tempo: '1-0-1-0',
    commonMistakes: ['Moving elbows or forearms', 'Using momentum', 'Incomplete range of motion'],
    injuryRisks: ['Wrist strain', 'Tennis elbow'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'forearms', role: 'primary' }
    ]
  },
  {
    name: 'Dumbbell Farmer Carries',
    slug: 'dumbbell-farmer-carries',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    location: 'gym',
    movementPattern: ['carry'],
    description: 'Functional exercise that develops forearm grip strength and core stability through loaded carries.',
    stepByStep: [
      'Stand upright holding dumbbells at sides',
      'Maintain upright posture',
      'Walk forward for desired distance',
      'Keep shoulders back and core engaged',
      'Maintain firm grip throughout carry',
      'Return dumbbells to ground in controlled manner'
    ],
    breathingTechnique: 'Natural breathing pattern',
    tempo: '1-0-1-0',
    commonMistakes: ['Shoulder shrugging', 'Leaning to one side', 'Hunched posture'],
    injuryRisks: [],
    benefits: { muscleGrowth: true, sportsPerformance: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'forearms', role: 'primary' }
    ]
  },
  {
    name: 'Wrist Roller',
    slug: 'wrist-roller',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['none'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Wrist roller exercise developing forearm endurance and grip strength through wrist rotation.',
    stepByStep: [
      'Hold wrist roller at arm\u0027s length in front of body',
      'Roll handle forward to wrap rope around roller',
      'Unroll rope by reversing direction',
      'Maintain arm extension throughout',
      'Complete set and reverse wrist position'
    ],
    breathingTechnique: 'Natural breathing pattern',
    tempo: '1-0-1-0',
    commonMistakes: ['Bending elbows during roll', 'Moving arms', 'Excessive weight'],
    injuryRisks: ['Wrist strain', 'Forearm strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'forearms', role: 'primary' }
    ]
  },
  {
    name: 'Reverse Barbell Curls',
    slug: 'reverse-barbell-curls',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Reverse curl with overhand grip emphasizing forearm extensors for balanced arm development.',
    stepByStep: [
      'Stand upright with barbell at hip height',
      'Use overhand grip slightly wider than shoulder width',
      'Keep elbows pinned to sides',
      'Curl barbell toward shoulders',
      'Achieve full contraction in forearms',
      'Lower barbell in controlled manner'
    ],
    breathingTechnique: 'Exhale while curling, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Swinging momentum', 'Elbows moving away from body', 'Incomplete range of motion'],
    injuryRisks: ['Wrist strain', 'Forearm strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'forearms', role: 'primary' },
      { muscleGroup: 'biceps', role: 'secondary' }
    ]
  }
]
