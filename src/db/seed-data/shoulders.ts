// Shoulders Exercises - All subtypes (Front Delts, Side Delts, Rear Delts)
export const shouldersExercises = [
  // Front Deltoids Exercises
  {
    name: 'Barbell Overhead Press',
    slug: 'barbell-overhead-press',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Compound shoulder press movement targeting front deltoids with secondary chest and triceps involvement.',
    stepByStep: [
      'Stand with feet shoulder-width apart',
      'Position barbell at shoulder height',
      'Keep core engaged and glutes tight',
      'Press barbell overhead in controlled motion',
      'Achieve full arm extension at top',
      'Lower barbell back to shoulders',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Inhale at start, exhale while pressing overhead',
    tempo: '2-0-1-0',
    commonMistakes: ['Excessive lower back arch', 'Bar path drifting forward', 'Incomplete range of motion'],
    injuryRisks: ['Shoulder impingement', 'Lower back strain', 'Rotator cuff strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'front_delts', role: 'primary' },
      { muscleGroup: 'side_delts', role: 'secondary' },
      { muscleGroup: 'triceps', role: 'secondary' }
    ]
  },
  {
    name: 'Dumbbell Shoulder Press',
    slug: 'dumbbell-shoulder-press',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Dumbbell variation of shoulder press allowing increased range of motion and unilateral development.',
    stepByStep: [
      'Sit upright on bench holding dumbbells at shoulder height',
      'Press dumbbells overhead in controlled motion',
      'Achieve full arm extension at top',
      'Lower dumbbells back to shoulder height',
      'Maintain upright posture throughout set'
    ],
    breathingTechnique: 'Inhale at start, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Dumbbells drifting too far apart', 'Incomplete range of motion', 'Excessive lower back arch'],
    injuryRisks: ['Shoulder impingement', 'Rotator cuff strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'front_delts', role: 'primary' },
      { muscleGroup: 'side_delts', role: 'secondary' },
      { muscleGroup: 'triceps', role: 'secondary' }
    ]
  },
  {
    name: 'Machine Shoulder Press',
    slug: 'machine-shoulder-press',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Machine-based shoulder press providing stable, guided movement for shoulder development.',
    stepByStep: [
      'Sit upright in machine',
      'Adjust seat height so handles align with shoulder height',
      'Grip handles firmly',
      'Press handles overhead in controlled motion',
      'Achieve full arm extension at top',
      'Return to starting position'
    ],
    breathingTechnique: 'Exhale while pressing, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Incorrect seat height', 'Partial range of motion', 'Using momentum'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'front_delts', role: 'primary' },
      { muscleGroup: 'side_delts', role: 'secondary' }
    ]
  },
  {
    name: 'Incline Dumbbell Press',
    slug: 'incline-dumbbell-press',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Incline bench press targeting front deltoids with secondary chest involvement.',
    stepByStep: [
      'Lie on inclined bench at 45-60 degree angle',
      'Hold dumbbells at shoulder height',
      'Press dumbbells upward and slightly inward',
      'Achieve full arm extension at top',
      'Lower dumbbells back to shoulder height',
      'Control descent throughout movement'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Dumbbells too close together', 'Incomplete range of motion', 'Bouncing weight'],
    injuryRisks: ['Shoulder strain', 'Rotator cuff strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'front_delts', role: 'primary' },
      { muscleGroup: 'upper_chest', role: 'secondary' }
    ]
  },
  {
    name: 'Front Dumbbell Raise',
    slug: 'front-dumbbell-raise',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation exercise for front deltoids using dumbbell lifting motion.',
    stepByStep: [
      'Stand upright holding dumbbells at thigh height',
      'Keep slight bend in elbows',
      'Raise dumbbells to shoulder height in controlled motion',
      'Achieve slight overextension at top',
      'Lower dumbbells back to starting position',
      'Maintain controlled movement throughout'
    ],
    breathingTechnique: 'Exhale while raising, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum to lift', 'Excessive weight', 'Incomplete range of motion'],
    injuryRisks: ['Shoulder strain', 'Rotator cuff strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'front_delts', role: 'primary' }
    ]
  },
  {
    name: 'Front Cable Raise',
    slug: 'front-cable-raise',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Cable-based front shoulder raise providing constant tension for front deltoid isolation.',
    stepByStep: [
      'Stand facing cable machine',
      'Grasp handle with both hands',
      'Raise handle to shoulder height in controlled motion',
      'Feel front shoulder contraction at top',
      'Lower handle in controlled manner',
      'Maintain slight elbow bend throughout'
    ],
    breathingTechnique: 'Exhale while raising, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Not achieving full range of motion', 'Elbows bending excessively'],
    injuryRisks: ['Shoulder strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'front_delts', role: 'primary' }
    ]
  },

  // Side Deltoids Exercises
  {
    name: 'Dumbbell Lateral Raise',
    slug: 'dumbbell-lateral-raise',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation exercise for lateral deltoids using dumbbell lateral motion for shoulder width development.',
    stepByStep: [
      'Stand upright holding dumbbells at sides',
      'Keep slight bend in elbows',
      'Raise dumbbells out to sides to shoulder height',
      'Achieve full shoulder abduction at top',
      'Lower dumbbells back to starting position',
      'Maintain controlled movement throughout'
    ],
    breathingTechnique: 'Exhale while raising, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum to lift', 'Excessive weight limiting range of motion', 'Not reaching shoulder height'],
    injuryRisks: ['Shoulder impingement', 'Rotator cuff strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'side_delts', role: 'primary' }
    ]
  },
  {
    name: 'Cable Lateral Raise',
    slug: 'cable-lateral-raise',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Cable-based lateral shoulder raise providing constant tension throughout movement.',
    stepByStep: [
      'Stand perpendicular to cable machine',
      'Grasp handle with arm extended',
      'Raise arm out to side to shoulder height',
      'Achieve full shoulder abduction at top',
      'Lower arm in controlled manner',
      'Maintain slight elbow bend throughout'
    ],
    breathingTechnique: 'Exhale while raising, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Not achieving shoulder height', 'Body swaying'],
    injuryRisks: ['Shoulder impingement'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'side_delts', role: 'primary' }
    ]
  },
  {
    name: 'Machine Lateral Raise',
    slug: 'machine-lateral-raise',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Machine-based lateral shoulder raise providing stable, guided movement.',
    stepByStep: [
      'Sit upright in machine',
      'Adjust seat height appropriate to body',
      'Grip handles firmly',
      'Push handles out to sides in controlled motion',
      'Achieve full shoulder abduction at top',
      'Return to starting position'
    ],
    breathingTechnique: 'Exhale while pushing, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Incorrect seat height', 'Partial range of motion', 'Using momentum'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'side_delts', role: 'primary' }
    ]
  },

  // Rear Deltoids Exercises
  {
    name: 'Face Pulls',
    slug: 'face-pulls',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['pull'],
    description: 'Shoulder health exercise targeting rear deltoids through high cable pulling motion.',
    stepByStep: [
      'Set cable to face height',
      'Grasp rope attachment with both hands',
      'Pull rope toward face while spreading ends',
      'Bring elbows high and wide',
      'Squeeze upper back and rear shoulders',
      'Return to starting position in controlled manner'
    ],
    breathingTechnique: 'Exhale while pulling, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using weight too heavy', 'Not spreading rope ends', 'Incomplete range of motion'],
    injuryRisks: [],
    benefits: { posture: true, rehab: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'rear_delts', role: 'primary' },
      { muscleGroup: 'upper_back', role: 'secondary' }
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
    description: 'Machine-based exercise isolating rear deltoids through controlled motion.',
    stepByStep: [
      'Sit upright in reverse pec deck machine',
      'Adjust seat height so handles align with shoulders',
      'Grasp handles with straight arms',
      'Pull handles backward in wide arc motion',
      'Squeeze rear shoulders and upper back',
      'Return to starting position'
    ],
    breathingTechnique: 'Exhale while pulling, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Incomplete range of motion', 'Rounding upper back'],
    injuryRisks: [],
    benefits: { posture: true },
    muscleGroups: [
      { muscleGroup: 'rear_delts', role: 'primary' },
      { muscleGroup: 'upper_back', role: 'secondary' }
    ]
  },
  {
    name: 'Dumbbell Reverse Fly',
    slug: 'dumbbell-reverse-fly',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Dumbbell-based reverse fly isolating rear deltoids through horizontal abduction.',
    stepByStep: [
      'Lie chest down on inclined bench',
      'Hold dumbbells with arms extended to sides',
      'Raise dumbbells out to sides in arc motion',
      'Achieve full shoulder abduction at top',
      'Squeeze rear shoulders at contraction',
      'Lower dumbbells in controlled manner'
    ],
    breathingTechnique: 'Exhale while raising, inhale while lowering',
    tempo: '1-0-2-0',
    commonMistakes: ['Using momentum', 'Not achieving full range of motion', 'Elbows bending excessively'],
    injuryRisks: ['Shoulder strain'],
    benefits: { muscleGrowth: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'rear_delts', role: 'primary' }
    ]
  },
  {
    name: 'Cable Reverse Fly',
    slug: 'cable-reverse-fly',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Cable-based reverse fly providing constant tension for rear deltoid isolation.',
    stepByStep: [
      'Stand between two cable machines',
      'Grasp left handle with right hand and vice versa',
      'Pull handles outward in wide arc motion',
      'Achieve full shoulder abduction at top',
      'Squeeze rear shoulders',
      'Return to center in controlled manner'
    ],
    breathingTechnique: 'Exhale while pulling, inhale while returning',
    tempo: '1-0-2-0',
    commonMistakes: ['Using too much weight', 'Not achieving full range of motion', 'Body swaying'],
    injuryRisks: ['Shoulder strain'],
    benefits: { muscleGrowth: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'rear_delts', role: 'primary' }
    ]
  }
]
