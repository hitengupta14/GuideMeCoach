// Core Exercises - All subtypes (Abs, Upper Abs, Lower Abs, Obliques)
export const coreExercises = [
  // General Abs Exercises
  {
    name: 'Crunches',
    slug: 'crunches',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['isolation'],
    description: 'Classic abdominal exercise targeting rectus abdominis through spinal flexion.',
    stepByStep: [
      'Lie on back with knees bent and feet flat',
      'Position hands behind head or across chest',
      'Curl shoulders off ground toward knees',
      'Achieve peak abdominal contraction at top',
      'Lower shoulders back to ground',
      'Maintain constant tension throughout'
    ],
    breathingTechnique: 'Exhale while crunching, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Pulling on neck causing strain', 'Using momentum', 'Incomplete range of motion'],
    injuryRisks: ['Neck strain', 'Lower back strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'abs', role: 'primary' },
      { muscleGroup: 'upper_abs', role: 'primary' }
    ]
  },
  {
    name: 'Machine Crunches',
    slug: 'machine-crunches',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Machine-based crunch providing guided movement for safe abs isolation.',
    stepByStep: [
      'Sit in machine with feet secured',
      'Grasp handles at chest level',
      'Curl forward by flexing abs',
      'Achieve maximum abdominal contraction',
      'Return to starting position in controlled manner',
      'Maintain upright posture at start'
    ],
    breathingTechnique: 'Exhale while crunching, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Incomplete range of motion', 'Excessive weight'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'abs', role: 'primary' }
    ]
  },
  {
    name: 'Decline Sit-ups',
    slug: 'decline-sit-ups',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['bench'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Sit-ups on decline bench increasing difficulty and range of motion for abdominal development.',
    stepByStep: [
      'Lie on decline bench with feet secured',
      'Position hands behind head or across chest',
      'Curl torso upward toward knees',
      'Achieve full abdominal contraction at top',
      'Lower torso back to starting position',
      'Control descent throughout movement'
    ],
    breathingTechnique: 'Exhale while sitting up, inhale while lowering',
    tempo: '2-0-2-0',
    commonMistakes: ['Pulling on neck', 'Using momentum to complete rep', 'Insufficient decline angle'],
    injuryRisks: ['Neck strain', 'Lower back strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'abs', role: 'primary' },
      { muscleGroup: 'upper_abs', role: 'primary' }
    ]
  },
  {
    name: 'Cable Crunch',
    slug: 'cable-crunch',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Cable-based crunch providing constant tension throughout abdominal flexion.',
    stepByStep: [
      'Kneel facing cable machine',
      'Grasp rope attachment at chest level',
      'Flex abs to curl torso forward',
      'Achieve maximum abdominal contraction',
      'Return to starting position in controlled manner',
      'Feel constant tension throughout set'
    ],
    breathingTechnique: 'Exhale while flexing, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using arms instead of abs', 'Incomplete range of motion', 'Excessive weight'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'abs', role: 'primary' }
    ]
  },

  // Upper Abs Specific Exercises
  {
    name: 'Ab Wheel Rollouts',
    slug: 'ab-wheel-rollouts',
    category: 'strength',
    difficulty: 'advanced',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['isolation'],
    description: 'Advanced abdominal exercise using ab wheel for intense upper and lower abs engagement.',
    stepByStep: [
      'Start on knees holding ab wheel',
      'Roll forward extending body in straight line',
      'Achieve full body extension at bottom',
      'Maintain abdominal contraction throughout',
      'Roll back to starting position',
      'Control movement both directions'
    ],
    breathingTechnique: 'Inhale while rolling out, exhale while returning',
    tempo: '2-0-2-0',
    commonMistakes: ['Using lower back instead of abs', 'Allowing hips to sag', 'Incomplete extension'],
    injuryRisks: ['Lower back strain', 'Shoulder strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'abs', role: 'primary' },
      { muscleGroup: 'upper_abs', role: 'primary' },
      { muscleGroup: 'lower_abs', role: 'primary' }
    ]
  },
  {
    name: 'Hanging Leg Raises',
    slug: 'hanging-leg-raises',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['pull_up_bar'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Challenging lower abs exercise using body weight for hip flexion.',
    stepByStep: [
      'Hang from pull-up bar with arms extended',
      'Keep legs straight',
      'Raise legs until parallel to ground or higher',
      'Lower legs in controlled manner',
      'Maintain grip on bar throughout',
      'Avoid excessive swinging'
    ],
    breathingTechnique: 'Exhale while raising legs, inhale while lowering',
    tempo: '2-0-2-0',
    commonMistakes: ['Using momentum to swing legs', 'Incomplete range of motion', 'Lower back compensation'],
    injuryRisks: ['Lower back strain', 'Hip flexor strain', 'Grip fatigue'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'lower_abs', role: 'primary' },
      { muscleGroup: 'abs', role: 'secondary' }
    ]
  },
  {
    name: 'Incline Sit-ups',
    slug: 'incline-sit-ups',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['bench'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Sit-ups on incline bench for moderate difficulty abdominal development.',
    stepByStep: [
      'Lie on inclined bench with feet secured',
      'Position hands behind head or across chest',
      'Curl torso upward toward knees',
      'Achieve abdominal contraction at top',
      'Lower torso back to starting position',
      'Control movement throughout'
    ],
    breathingTechnique: 'Exhale while sitting up, inhale while lowering',
    tempo: '2-0-2-0',
    commonMistakes: ['Pulling on neck', 'Using momentum', 'Insufficient incline'],
    injuryRisks: ['Neck strain', 'Lower back strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'upper_abs', role: 'primary' },
      { muscleGroup: 'abs', role: 'secondary' }
    ]
  },

  // Lower Abs Specific Exercises
  {
    name: 'Lying Leg Raises',
    slug: 'lying-leg-raises',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['bench'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Lower abdominal exercise using hip flexion while lying on back.',
    stepByStep: [
      'Lie on back on flat bench',
      'Position legs extended or slightly bent',
      'Raise legs until perpendicular to ground',
      'Achieve peak lower ab contraction at top',
      'Lower legs in controlled manner',
      'Avoid lower back lift-off from bench'
    ],
    breathingTechnique: 'Exhale while raising legs, inhale while lowering',
    tempo: '2-0-2-0',
    commonMistakes: ['Bouncing legs at bottom', 'Lower back lifting off bench', 'Using momentum'],
    injuryRisks: ['Lower back strain', 'Hip flexor strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'lower_abs', role: 'primary' },
      { muscleGroup: 'abs', role: 'secondary' }
    ]
  },
  {
    name: 'Captain\'s Chair Raises',
    slug: 'captain-s-chair-raises',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Lower abs exercise using captain\'s chair machine for supported leg raises.',
    stepByStep: [
      'Sit in captain\'s chair with arms on handles',
      'Keep back against pad',
      'Raise legs by flexing hips',
      'Bring knees toward chest',
      'Lower legs in controlled manner',
      'Maintain upright position throughout'
    ],
    breathingTechnique: 'Exhale while raising legs, inhale while lowering',
    tempo: '2-0-2-0',
    commonMistakes: ['Using momentum to swing', 'Not achieving full range of motion', 'Lower back rounding'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'lower_abs', role: 'primary' },
      { muscleGroup: 'abs', role: 'secondary' }
    ]
  },

  // Obliques Exercises
  {
    name: 'Russian Twists',
    slug: 'russian-twists',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['rotate'],
    description: 'Seated rotational core exercise targeting obliques through torso rotation.',
    stepByStep: [
      'Sit on floor with knees bent',
      'Lean back slightly maintaining balance',
      'Hold weight at chest level',
      'Rotate torso side to side in controlled motion',
      'Achieve full range of motion each side',
      'Maintain stable base throughout'
    ],
    breathingTechnique: 'Natural breathing pattern throughout set',
    tempo: '1-0-1-0',
    commonMistakes: ['Excessive backward lean', 'Insufficient rotation', 'Feet lifting off ground'],
    injuryRisks: ['Lower back strain', 'Lumbar rotation strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'obliques', role: 'primary' }
    ]
  },
  {
    name: 'Side Plank',
    slug: 'side-plank',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['isolation'],
    description: 'Isometric exercise targeting obliques and lateral core muscles for stability.',
    stepByStep: [
      'Lie on side with forearm supporting body',
      'Position elbow directly under shoulder',
      'Lift hips off ground creating straight line',
      'Maintain position for desired time',
      'Keep body in alignment throughout hold',
      'Repeat on opposite side'
    ],
    breathingTechnique: 'Continuous steady breathing throughout hold',
    tempo: '0-30-0-0',
    commonMistakes: ['Hips sagging toward ground', 'Excessive upper body lean', 'Uneven weight distribution'],
    injuryRisks: ['Shoulder strain', 'Lower back strain'],
    benefits: { muscleGrowth: true, posture: true, stability: true },
    muscleGroups: [
      { muscleGroup: 'obliques', role: 'primary' }
    ]
  },
  {
    name: 'Landmine Rotations',
    slug: 'landmine-rotations',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['rotate'],
    description: 'Rotational movement using landmine apparatus for functional core and oblique development.',
    stepByStep: [
      'Stand with barbell in landmine holder',
      'Hold end of barbell at chest height',
      'Rotate torso side to side in controlled motion',
      'Keep feet planted throughout rotation',
      'Achieve full range of motion each side',
      'Control barbell throughout movement'
    ],
    breathingTechnique: 'Exhale during rotation, inhale during return',
    tempo: '1-0-2-0',
    commonMistakes: ['Rotating from arms instead of core', 'Feet moving during rotation', 'Incomplete range of motion'],
    injuryRisks: ['Lower back strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true, functional: true },
    muscleGroups: [
      { muscleGroup: 'obliques', role: 'primary' }
    ]
  },
  {
    name: 'Suitcase Carries',
    slug: 'suitcase-carries',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    location: 'gym',
    movementPattern: ['carry'],
    description: 'Single-sided loaded carry targeting obliques and lateral core stability.',
    stepByStep: [
      'Stand upright holding dumbbell at side',
      'Maintain tall posture without leaning',
      'Walk forward for desired distance',
      'Keep shoulders level',
      'Maintain firm grip throughout',
      'Return to start and switch sides'
    ],
    breathingTechnique: 'Natural breathing pattern',
    tempo: '1-0-1-0',
    commonMistakes: ['Leaning toward loaded side', 'Shoulder shrugging', 'Uneven posture'],
    injuryRisks: [],
    benefits: { muscleGrowth: true, posture: true, stability: true },
    muscleGroups: [
      { muscleGroup: 'obliques', role: 'primary' }
    ]
  },

  // General Core Exercises
  {
    name: 'Plank Hold',
    slug: 'plank-hold',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['isolation'],
    description: 'Fundamental core stability exercise targeting entire abdominal region through isometric hold.',
    stepByStep: [
      'Position body in forearm plank',
      'Forearms parallel on ground',
      'Maintain straight line from head to heels',
      'Engage core throughout hold',
      'Hold for desired time duration',
      'Avoid hips sagging or pike raising'
    ],
    breathingTechnique: 'Continuous steady breathing throughout hold',
    tempo: '0-30-0-0',
    commonMistakes: ['Hips sagging toward ground', 'Hips piking upward', 'Uneven weight distribution'],
    injuryRisks: ['Lower back strain', 'Shoulder strain if improper form'],
    benefits: { muscleGrowth: true, posture: true, stability: true },
    muscleGroups: [
      { muscleGroup: 'abs', role: 'primary' },
      { muscleGroup: 'upper_abs', role: 'secondary' },
      { muscleGroup: 'lower_abs', role: 'secondary' }
    ]
  },
  {
    name: 'Dead Bug',
    slug: 'dead-bug',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['isolation'],
    description: 'Core stability exercise targeting lower abs and promoting safe spinal positioning.',
    stepByStep: [
      'Lie on back with arms extended toward ceiling',
      'Hips and knees at 90 degrees',
      'Lower opposite arm and leg in controlled manner',
      'Maintain lower back contact with ground',
      'Return to starting position',
      'Alternate sides in controlled fashion'
    ],
    breathingTechnique: 'Exhale while extending limbs, inhale while returning',
    tempo: '2-0-2-0',
    commonMistakes: ['Lower back lifting off ground', 'Excessive speed', 'Incomplete range of motion'],
    injuryRisks: [],
    benefits: { muscleGrowth: true, posture: true, rehab: true },
    muscleGroups: [
      { muscleGroup: 'lower_abs', role: 'primary' },
      { muscleGroup: 'abs', role: 'secondary' }
    ]
  },
  {
    name: 'Bird Dog',
    slug: 'bird-dog',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['isolation'],
    description: 'Core stability and back extension exercise for lower back and glute engagement.',
    stepByStep: [
      'Start on hands and knees',
      'Extend opposite arm and leg',
      'Achieve full extension of limbs',
      'Maintain neutral spine throughout',
      'Return to starting position',
      'Alternate sides in controlled manner'
    ],
    breathingTechnique: 'Exhale while extending, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Arching lower back excessively', 'Uneven extension', 'Rushed movement'],
    injuryRisks: [],
    benefits: { muscleGrowth: true, posture: true, rehab: true, stability: true },
    muscleGroups: [
      { muscleGroup: 'abs', role: 'secondary' },
      { muscleGroup: 'lower_back', role: 'primary' }
    ]
  }
]
