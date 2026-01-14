// Back Exercises - All subtypes (Lats, Upper Back, Lower Back)
export const backExercises = [
  // Lats Exercises
  {
    name: 'Bent Over Barbell Row',
    slug: 'bent-over-barbell-row',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['pull', 'hinge'],
    description: 'A fundamental compound rowing movement that targets the latissimus dorsi and upper back through horizontal pulling.',
    stepByStep: [
      'Stand with feet shoulder-width apart',
      'Hinge at hips with slight knee bend',
      'Grasp barbell with hands slightly wider than shoulder width',
      'Maintain neutral spine throughout',
      'Row barbell toward lower chest',
      'Squeeze lats at top of movement',
      'Lower weight in controlled manner'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pulling',
    tempo: '2-0-1-0',
    commonMistakes: ['Rounding lower back', 'Using too much weight', 'Incomplete range of motion', 'Elbows too far from body'],
    injuryRisks: ['Lower back strain', 'Biceps tendinitis', 'Hamstring strain'],
    benefits: { muscleGrowth: true, posture: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'lats', role: 'primary' },
      { muscleGroup: 'upper_back', role: 'primary' },
      { muscleGroup: 'biceps', role: 'secondary' }
    ]
  },
  {
    name: 'Dumbbell Row',
    slug: 'dumbbell-row',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['pull'],
    description: 'Single-arm or double-arm dumbbell row allowing unilateral development and increased range of motion.',
    stepByStep: [
      'Support one knee on bench with opposite foot on floor',
      'Hold dumbbell with arm extended toward floor',
      'Pull dumbbell toward hip in controlled motion',
      'Squeeze lat and back muscles at top',
      'Lower dumbbell in controlled manner',
      'Complete set on one side before switching'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pulling',
    tempo: '2-0-1-0',
    commonMistakes: ['Rotating torso excessively', 'Not achieving full stretch at bottom', 'Using momentum'],
    injuryRisks: ['Lower back strain', 'Shoulder impingement'],
    benefits: { muscleGrowth: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'lats', role: 'primary' },
      { muscleGroup: 'upper_back', role: 'secondary' },
      { muscleGroup: 'biceps', role: 'secondary' }
    ]
  },
  {
    name: 'Lat Pulldown',
    slug: 'lat-pulldown',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['pull'],
    description: 'Vertical pulling movement targeting latissimus dorsi through cable-based resistance. Excellent lat isolation exercise.',
    stepByStep: [
      'Sit upright in lat pulldown machine',
      'Grip bar with hands wider than shoulder width',
      'Plant feet firmly on floor',
      'Pull bar down toward upper chest',
      'Feel lat contraction at bottom',
      'Control return to starting position',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Exhale while pulling down, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Pulling bar to waist instead of chest', 'Excessive forward lean', 'Incomplete range of motion'],
    injuryRisks: ['Shoulder impingement', 'Biceps strain'],
    benefits: { muscleGrowth: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'lats', role: 'primary' },
      { muscleGroup: 'biceps', role: 'secondary' }
    ]
  },
  {
    name: 'T-Bar Row',
    slug: 't-bar-row',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['pull', 'hinge'],
    description: 'Horizontal rowing movement using T-bar apparatus for enhanced lat and upper back activation.',
    stepByStep: [
      'Stand astride T-bar with feet shoulder-width apart',
      'Hinge at hips and grasp handles',
      'Keep back straight throughout movement',
      'Pull bar toward chest in controlled motion',
      'Squeeze lats and back at top',
      'Lower bar in controlled manner'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pulling',
    tempo: '2-0-1-0',
    commonMistakes: ['Lower back rounding', 'Incomplete range of motion', 'Using arms instead of back'],
    injuryRisks: ['Lower back strain', 'Biceps strain'],
    benefits: { muscleGrowth: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'lats', role: 'primary' },
      { muscleGroup: 'upper_back', role: 'primary' },
      { muscleGroup: 'biceps', role: 'secondary' }
    ]
  },
  {
    name: 'Assisted Pull-ups',
    slug: 'assisted-pull-ups',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['pull_up_bar'],
    location: 'gym',
    movementPattern: ['pull'],
    description: 'Vertical pulling exercise with machine assistance allowing progressive lat and back development.',
    stepByStep: [
      'Select appropriate assistance weight',
      'Grip bar with hands slightly wider than shoulder width',
      'Place knees on pad for support',
      'Pull body upward toward bar',
      'Achieve chin above bar position',
      'Lower body in controlled manner',
      'Fully extend arms at bottom'
    ],
    breathingTechnique: 'Exhale while pulling up, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Excessive momentum', 'Incomplete range of motion', 'Using legs to push'],
    injuryRisks: ['Shoulder impingement', 'Biceps tendinitis'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'lats', role: 'primary' },
      { muscleGroup: 'biceps', role: 'primary' }
    ]
  },
  {
    name: 'Seal Rows',
    slug: 'seal-rows',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell', 'bench'],
    location: 'gym',
    movementPattern: ['pull'],
    description: 'Chest-supported rowing movement that eliminates lower back involvement for pure lat and back isolation.',
    stepByStep: [
      'Set incline bench and lie with chest on pad',
      'Grasp barbell with hands shoulder-width apart',
      'Row barbell toward lower chest',
      'Squeeze lats and back at top',
      'Control return to starting position',
      'Maintain contact with bench throughout'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pulling',
    tempo: '2-0-1-0',
    commonMistakes: ['Lifting chest off pad', 'Not achieving full range of motion', 'Using momentum'],
    injuryRisks: ['Shoulder strain', 'Elbow strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'lats', role: 'primary' },
      { muscleGroup: 'upper_back', role: 'secondary' }
    ]
  },
  {
    name: 'Rowing Machine',
    slug: 'rowing-machine',
    category: 'cardio',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['pull', 'hinge'],
    description: 'Full-body cardio exercise that engages lats, back, and core while providing cardiovascular benefits.',
    stepByStep: [
      'Sit on rowing machine seat',
      'Place feet in footrests securely',
      'Grasp handle with hands shoulder-width apart',
      'Drive legs while pulling handle toward torso',
      'Hinge forward from hips to return',
      'Repeat in smooth, fluid motion'
    ],
    breathingTechnique: 'Exhale during pull, inhale during return',
    tempo: '1-1-1-0',
    commonMistakes: ['Using arms instead of legs', 'Rounding back excessively', 'Incomplete leg extension'],
    injuryRisks: ['Lower back strain if form is poor'],
    benefits: { cardio: true, muscleGrowth: true, fatLoss: true },
    muscleGroups: [
      { muscleGroup: 'lats', role: 'secondary' },
      { muscleGroup: 'upper_back', role: 'secondary' }
    ]
  },

  // Upper Back Exercises
  {
    name: 'Face Pulls',
    slug: 'face-pulls',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['pull'],
    description: 'Shoulder health exercise that targets rear deltoids and upper back through high cable pulling motion.',
    stepByStep: [
      'Set cable to face height',
      'Grasp rope attachment with both hands',
      'Stand with feet shoulder-width apart',
      'Pull rope toward face while spreading ends',
      'Bring elbows high and wide',
      'Squeeze upper back and rear shoulders',
      'Return to starting position in controlled manner'
    ],
    breathingTechnique: 'Exhale while pulling, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using weight too heavy', 'Incomplete range of motion', 'Not spreading rope ends'],
    injuryRisks: [],
    benefits: { posture: true, rehab: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'upper_back', role: 'primary' },
      { muscleGroup: 'rear_delts', role: 'primary' }
    ]
  },
  {
    name: 'Reverse Pec Deck',
    slug: 'reverse-pec-deck',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['pull'],
    description: 'Machine-based exercise isolating rear deltoids and upper back through controlled motion.',
    stepByStep: [
      'Sit upright in reverse pec deck machine',
      'Adjust seat height so handles align with shoulders',
      'Grasp handles with straight arms',
      'Pull handles backward in wide arc motion',
      'Squeeze upper back and rear shoulders at contraction',
      'Return to starting position'
    ],
    breathingTechnique: 'Exhale while pulling, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Incomplete range of motion', 'Rounding upper back'],
    injuryRisks: [],
    benefits: { posture: true },
    muscleGroups: [
      { muscleGroup: 'upper_back', role: 'primary' },
      { muscleGroup: 'rear_delts', role: 'primary' }
    ]
  },
  {
    name: 'Barbell Shrugs',
    slug: 'barbell-shrugs',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation exercise for trapezius and upper back through shoulder shrugging motion with barbell.',
    stepByStep: [
      'Stand upright holding barbell at hip level',
      'Keep arms straight throughout',
      'Lift shoulders toward ears in shrugging motion',
      'Hold at top for brief pause',
      'Lower shoulders in controlled manner',
      'Repeat for desired reps'
    ],
    breathingTechnique: 'Exhale while shrugging, inhale while lowering',
    tempo: '1-1-1-0',
    commonMistakes: ['Bending arms', 'Using too much weight', 'Incomplete shoulder elevation'],
    injuryRisks: ['Neck strain if excessive weight used'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'upper_back', role: 'primary' }
    ]
  },
  {
    name: 'Dumbbell Shrugs',
    slug: 'dumbbell-shrugs',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Dumbbell version of shrugs allowing greater range of motion for trapezius and upper back.',
    stepByStep: [
      'Stand upright holding dumbbells at sides',
      'Keep arms straight throughout',
      'Lift shoulders toward ears in shrugging motion',
      'Hold briefly at top',
      'Lower shoulders in controlled manner'
    ],
    breathingTechnique: 'Exhale while shrugging, inhale while lowering',
    tempo: '1-1-1-0',
    commonMistakes: ['Bending arms', 'Dropping weights suddenly', 'Incomplete shoulder elevation'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'upper_back', role: 'primary' }
    ]
  },
  {
    name: 'Upright Row',
    slug: 'upright-row',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell'],
    location: 'gym',
    movementPattern: ['pull'],
    description: 'Vertical pulling movement that targets trapezius and upper back while involving shoulder muscles.',
    stepByStep: [
      'Stand upright holding barbell at hip level',
      'Grip width narrower than shoulder width',
      'Pull barbell upward along body',
      'Lift elbows high and wide',
      'Bring bar toward chin level',
      'Lower in controlled manner'
    ],
    breathingTechnique: 'Exhale while pulling up, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Excessive weight causing improper form', 'Bar drifting away from body', 'Incomplete range of motion'],
    injuryRisks: ['Shoulder impingement if form is poor', 'Neck strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'upper_back', role: 'primary' },
      { muscleGroup: 'side_delts', role: 'secondary' }
    ]
  },

  // Lower Back Exercises
  {
    name: 'Deadlifts',
    slug: 'deadlifts',
    category: 'strength',
    difficulty: 'advanced',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['hinge'],
    description: 'Fundamental compound lift engaging entire posterior chain including lower back, glutes, and hamstrings.',
    stepByStep: [
      'Stand with feet hip-width apart',
      'Barbell over mid-foot',
      'Bend at hips and knees to grasp bar',
      'Maintain neutral spine throughout',
      'Drive through heels to stand',
      'Lock hips and knees at top',
      'Lower bar in controlled manner by hinging at hips'
    ],
    breathingTechnique: 'Inhale before lift, hold breath during lift, exhale at top',
    tempo: '2-0-2-0',
    commonMistakes: ['Rounding lower back', 'Bar drifting away from body', 'Incomplete hip extension', 'Starting with hips too high'],
    injuryRisks: ['Lower back strain if form is compromised', 'Knee strain', 'Hamstring strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'lower_back', role: 'primary' },
      { muscleGroup: 'glutes', role: 'primary' },
      { muscleGroup: 'hamstrings', role: 'primary' }
    ]
  },
  {
    name: 'Romanian Deadlifts',
    slug: 'romanian-deadlifts',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell'],
    location: 'gym',
    movementPattern: ['hinge'],
    description: 'Hip hinge movement emphasizing hamstring and lower back while maintaining straighter legs than conventional deadlifts.',
    stepByStep: [
      'Stand with feet hip-width apart',
      'Hold barbell at hip height',
      'Hinge at hips while keeping knees slightly bent',
      'Lower bar along legs until feeling hamstring stretch',
      'Maintain neutral spine throughout',
      'Drive hips forward to return to standing'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while standing',
    tempo: '2-0-2-0',
    commonMistakes: ['Rounding lower back', 'Knees bending too much', 'Not achieving full stretch'],
    injuryRisks: ['Lower back strain if form is poor', 'Hamstring strain'],
    benefits: { muscleGrowth: true, posture: true, mobility: true },
    muscleGroups: [
      { muscleGroup: 'lower_back', role: 'primary' },
      { muscleGroup: 'hamstrings', role: 'primary' },
      { muscleGroup: 'glutes', role: 'secondary' }
    ]
  },
  {
    name: 'Hyperextensions',
    slug: 'hyperextensions',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine', 'bench'],
    location: 'gym',
    movementPattern: ['hinge'],
    description: 'Isolation exercise targeting lower back and glutes through spinal extension movement.',
    stepByStep: [
      'Position body on hyperextension machine',
      'Secure feet under foot pads',
      'Fold body forward from hips',
      'Maintain neutral spine throughout',
      'Extend back to raise torso toward horizontal',
      'Control descent in controlled manner'
    ],
    breathingTechnique: 'Inhale while folding, exhale while extending',
    tempo: '2-0-2-0',
    commonMistakes: ['Excessive spinal extension beyond parallel', 'Using momentum', 'Incomplete range of motion'],
    injuryRisks: ['Excessive lower back strain if weight too heavy', 'Lumbar discomfort'],
    benefits: { muscleGrowth: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'lower_back', role: 'primary' },
      { muscleGroup: 'glutes', role: 'secondary' }
    ]
  },
  {
    name: 'Good Mornings',
    slug: 'good-mornings',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['hinge'],
    description: 'Hip hinge exercise with barbell on shoulders targeting lower back and hamstrings.',
    stepByStep: [
      'Position barbell across upper back',
      'Stand with feet hip-width apart',
      'Hinge forward at hips maintaining straight back',
      'Lower torso parallel to ground',
      'Return to standing by driving hips forward',
      'Maintain neutral spine throughout'
    ],
    breathingTechnique: 'Inhale while folding, exhale while standing',
    tempo: '2-0-2-0',
    commonMistakes: ['Rounding lower back', 'Using excessive weight', 'Incomplete range of motion'],
    injuryRisks: ['Lower back strain', 'Hamstring strain'],
    benefits: { muscleGrowth: true, posture: true, mobility: true },
    muscleGroups: [
      { muscleGroup: 'lower_back', role: 'primary' },
      { muscleGroup: 'hamstrings', role: 'primary' }
    ]
  },
  {
    name: 'Cable Woodchops',
    slug: 'cable-woodchops',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['rotate'],
    description: 'Rotational core and lower back exercise using cable resistance for functional strength.',
    stepByStep: [
      'Stand perpendicular to cable machine',
      'Grasp handle at shoulder height',
      'Rotate torso pulling handle across body diagonally downward',
      'Complete movement fully',
      'Return to starting position in controlled manner',
      'Complete set on one side before switching'
    ],
    breathingTechnique: 'Exhale during rotation, inhale during return',
    tempo: '1-0-2-0',
    commonMistakes: ['Using arms instead of core', 'Incomplete range of motion', 'Excessive weight'],
    injuryRisks: ['Lower back strain', 'Lumbar rotation strain'],
    benefits: { muscleGrowth: true, posture: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'lower_back', role: 'secondary' },
      { muscleGroup: 'obliques', role: 'primary' }
    ]
  }
]
