// Chest Exercises - All subtypes (Upper, Mid, Lower)
export const chestExercises = [
  // Upper Chest Exercises
  {
    name: 'Incline Barbell Bench Press',
    slug: 'incline-barbell-bench-press',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell', 'bench'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'A compound upper chest exercise performed with barbell on an inclined bench. Targets the clavicular head of the pectoralis major.',
    stepByStep: [
      'Set incline bench to 30-45 degrees',
      'Position barbell at shoulder width',
      'Plant feet firmly on floor',
      'Lower bar to upper chest in controlled manner',
      'Press bar explosively upward to starting position',
      'Squeeze chest at top of movement'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Barbell too low on chest', 'Elbows flaring too wide', 'Not using full range of motion'],
    injuryRisks: ['Shoulder impingement', 'Pectoralis strain', 'Rotator cuff strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'upper_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'secondary' },
      { muscleGroup: 'triceps', role: 'secondary' }
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
    description: 'Single-arm or double-arm dumbbell press on inclined bench. Great for upper chest development with greater range of motion than barbell.',
    stepByStep: [
      'Set incline bench to 30-45 degrees',
      'Hold dumbbells at shoulder height',
      'Press dumbbells upward and slightly inward',
      'Lower dumbbells in controlled manner',
      'Repeat for desired reps',
      'Keep core engaged throughout'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Dumbbells too close together', 'Not achieving full stretch at bottom', 'Bouncing the weight'],
    injuryRisks: ['Shoulder strain', 'Pectoralis tendinitis'],
    benefits: { muscleGrowth: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'upper_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'secondary' },
      { muscleGroup: 'triceps', role: 'secondary' }
    ]
  },
  {
    name: 'Incline Machine Press',
    slug: 'incline-machine-press',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Machine-based incline press that provides stable, guided movement for upper chest targeting.',
    stepByStep: [
      'Adjust machine seat height so handles align with upper chest',
      'Grip handles at chest level',
      'Press handles forward and slightly upward',
      'Return to starting position in controlled manner',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Inhale during return, exhale during press',
    tempo: '2-0-1-0',
    commonMistakes: ['Incorrect seat height', 'Partial range of motion', 'Excessive forward lean'],
    injuryRisks: [],
    benefits: { muscleGrowth: true, posture: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'upper_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'secondary' }
    ]
  },
  {
    name: 'Incline Dumbbell Flyes',
    slug: 'incline-dumbbell-flyes',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation exercise for upper chest using dumbbells with a flying motion on inclined bench.',
    stepByStep: [
      'Lie on incline bench with dumbbells held above chest',
      'Slightly bend elbows',
      'Lower dumbbells in arc motion outward',
      'Bring dumbbells back to starting position',
      'Maintain constant elbow bend angle throughout'
    ],
    breathingTechnique: 'Inhale while opening arms, exhale while closing',
    tempo: '2-0-2-0',
    commonMistakes: ['Overly rigid arms', 'Too heavy weight reducing range of motion', 'Dropping dumbbells too fast'],
    injuryRisks: ['Shoulder strain', 'Pectoralis strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'upper_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'stabilizer' }
    ]
  },

  // Mid Chest Exercises
  {
    name: 'Flat Barbell Bench Press',
    slug: 'flat-barbell-bench-press',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['barbell', 'bench'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'The classic compound chest exercise. Primary movement for overall chest development targeting the sternal portion.',
    stepByStep: [
      'Lie flat on bench with eyes under barbell',
      'Grip barbell slightly wider than shoulder width',
      'Lower bar to mid-chest in controlled motion',
      'Press bar upward explosively',
      'Lock arms at top but avoid hyperextension',
      'Maintain shoulder blade retraction throughout'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Barbell too high on chest', 'Feet not planted', 'Elbows flaring excessively', 'Bouncing the bar'],
    injuryRisks: ['Pectoralis major tear', 'Shoulder impingement', 'Rotator cuff strain'],
    benefits: { muscleGrowth: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'mid_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'secondary' },
      { muscleGroup: 'triceps', role: 'secondary' }
    ]
  },
  {
    name: 'Flat Dumbbell Press',
    slug: 'flat-dumbbell-press',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Dumbbell variation of flat bench press allowing for increased range of motion and unilateral strength development.',
    stepByStep: [
      'Lie on flat bench holding dumbbells at chest level',
      'Press dumbbells upward and slightly inward',
      'Lower dumbbells back to chest level',
      'Feel full chest stretch at bottom position',
      'Press with control throughout movement'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Dumbbells too close together', 'Uncontrolled descent', 'Feet off floor'],
    injuryRisks: ['Shoulder instability', 'Pectoralis strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'mid_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'secondary' },
      { muscleGroup: 'triceps', role: 'secondary' }
    ]
  },
  {
    name: 'Flat Machine Press',
    slug: 'flat-machine-press',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Machine-based chest press that provides stable, bilateral pressing motion for mid-chest targeting.',
    stepByStep: [
      'Adjust seat height so handles align with mid-chest',
      'Grip handles firmly',
      'Press handles forward in controlled manner',
      'Return to starting position',
      'Keep chest up and shoulders back'
    ],
    breathingTechnique: 'Inhale during return, exhale during press',
    tempo: '2-0-1-0',
    commonMistakes: ['Incorrect seat height', 'Partial range of motion'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'mid_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'secondary' }
    ]
  },
  {
    name: 'Flat Dumbbell Flyes',
    slug: 'flat-dumbbell-flyes',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation movement that stretches and strengthens the chest through a flying motion on flat bench.',
    stepByStep: [
      'Lie on flat bench with dumbbells held above chest',
      'Slightly bend elbows',
      'Lower dumbbells in arc motion outward',
      'Feel stretch across entire chest at bottom',
      'Bring dumbbells back to center in flying motion'
    ],
    breathingTechnique: 'Inhale while opening arms, exhale while closing',
    tempo: '2-0-2-0',
    commonMistakes: ['Elbows locked straight', 'Dropping dumbbells', 'Not achieving full stretch'],
    injuryRisks: ['Shoulder strain', 'Pectoralis strain'],
    benefits: { muscleGrowth: true, mobility: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'mid_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'stabilizer' }
    ]
  },
  {
    name: 'Chest Flyes Machine',
    slug: 'chest-flyes-machine',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Machine-based chest fly that isolates chest muscles with stable, guided motion.',
    stepByStep: [
      'Sit upright in machine',
      'Grip handles with elbows at shoulder height',
      'Push handles together in controlled arc motion',
      'Return to starting position',
      'Maintain upright posture throughout'
    ],
    breathingTechnique: 'Exhale during press, inhale during return',
    tempo: '1-0-2-0',
    commonMistakes: ['Leaning back', 'Using too much weight', 'Partial range of motion'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'mid_chest', role: 'primary' }
    ]
  },
  {
    name: 'Cable Chest Flyes',
    slug: 'cable-chest-flyes',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['cable'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Cable-based chest fly providing constant tension throughout movement for mid-chest isolation.',
    stepByStep: [
      'Set cable height to mid-chest level',
      'Stand in staggered stance between cable machines',
      'Grip handles with arms extended',
      'Bring handles together in controlled arc',
      'Feel contraction at bottom',
      'Return to starting position'
    ],
    breathingTechnique: 'Exhale during contraction, inhale during return',
    tempo: '2-0-2-0',
    commonMistakes: ['Too much weight causing jerky motion', 'Incomplete range of motion', 'Using momentum'],
    injuryRisks: ['Shoulder strain', 'Pectoralis strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'mid_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'stabilizer' }
    ]
  },

  // Lower Chest Exercises
  {
    name: 'Decline Dumbbell Press',
    slug: 'decline-dumbbell-press',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Dumbbell press on decline bench allowing greater range of motion for lower chest development.',
    stepByStep: [
      'Adjust bench to decline position',
      'Secure feet in foot pad',
      'Hold dumbbells at chest level',
      'Press dumbbells upward and slightly inward',
      'Lower dumbbells back to chest',
      'Feel chest stretch at bottom position'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing',
    tempo: '2-0-1-0',
    commonMistakes: ['Dumbbells too close together', 'Uncontrolled descent', 'Not enough decline'],
    injuryRisks: ['Shoulder strain', 'Abdominal strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'lower_chest', role: 'primary' },
      { muscleGroup: 'triceps', role: 'secondary' }
    ]
  },
  {
    name: 'Decline Dumbbell Flyes',
    slug: 'decline-dumbbell-flyes',
    category: 'strength',
    difficulty: 'intermediate',
    equipment: ['dumbbell', 'bench'],
    location: 'gym',
    movementPattern: ['isolation'],
    description: 'Isolation exercise isolating lower chest using dumbbells with flying motion on decline bench.',
    stepByStep: [
      'Lie on decline bench with dumbbells held above chest',
      'Slightly bend elbows',
      'Lower dumbbells in arc motion outward',
      'Feel stretch across lower chest at bottom',
      'Return dumbbells to starting position'
    ],
    breathingTechnique: 'Inhale while opening arms, exhale while closing',
    tempo: '2-0-2-0',
    commonMistakes: ['Arms too rigid', 'Dumbbells dropping too fast', 'Incomplete range of motion'],
    injuryRisks: ['Shoulder strain', 'Pectoralis strain'],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'lower_chest', role: 'primary' }
    ]
  },
  {
    name: 'Decline Machine Press',
    slug: 'decline-machine-press',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['machine'],
    location: 'gym',
    movementPattern: ['push'],
    description: 'Machine-based decline press providing stable pressing motion for lower chest targeting.',
    stepByStep: [
      'Adjust machine seat to decline position',
      'Position seat so handles align with lower chest',
      'Grip handles firmly',
      'Press handles forward in controlled manner',
      'Return to starting position'
    ],
    breathingTechnique: 'Inhale during return, exhale during press',
    tempo: '2-0-1-0',
    commonMistakes: ['Incorrect seat height', 'Partial range of motion'],
    injuryRisks: [],
    benefits: { muscleGrowth: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'lower_chest', role: 'primary' }
    ]
  },
  {
    name: 'Push-ups',
    slug: 'push-ups',
    category: 'strength',
    difficulty: 'beginner',
    equipment: ['none'],
    location: 'both',
    movementPattern: ['push'],
    description: 'Bodyweight compound exercise that targets chest, shoulders, and triceps. Great for building chest endurance.',
    stepByStep: [
      'Assume push-up position with hands slightly wider than shoulders',
      'Keep body in straight line from head to heels',
      'Lower body by bending elbows',
      'Lower until chest nearly touches floor',
      'Push through palms to return to starting position'
    ],
    breathingTechnique: 'Inhale while lowering, exhale while pressing up',
    tempo: '2-0-1-0',
    commonMistakes: ['Hips sagging', 'Incomplete range of motion', 'Elbows flaring too wide'],
    injuryRisks: ['Shoulder impingement', 'Wrist strain'],
    benefits: { muscleGrowth: true, fatLoss: true, sportsPerformance: true },
    muscleGroups: [
      { muscleGroup: 'chest', role: 'primary' },
      { muscleGroup: 'mid_chest', role: 'primary' },
      { muscleGroup: 'front_delts', role: 'secondary' },
      { muscleGroup: 'triceps', role: 'secondary' }
    ]
  }
]
