/**
 * Simple, doable nutrition guidance (not strict diet plans).
 * Returns calorie range + protein minimum + meal templates with Indian context.
 */

interface NutritionGuidance {
  calorieRange: { min: number; max: number }
  proteinMinimum: number // grams/day
  simpleRules: string[]
  mealTemplates: {
    breakfast: string[]
    lunch: string[]
    dinner: string[]
    snacks: string[]
  }
  indianContext: string[]
  avoidAdvice: string[]
}

interface UserProfile {
  weight: number // kg
  height: number // cm
  age: number
  gender: 'male' | 'female' | 'other'
  goal: string // 'fat_loss' | 'muscle_gain' | 'maintenance'
  activityLevel: 'sedentary' | 'moderate' | 'active' // based on workouts/week
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure) using Mifflin-St Jeor equation.
 */
function calculateTDEE(profile: UserProfile): number {
  let bmr: number

  if (profile.gender === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
  }

  // Activity multiplier
  const multipliers = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.75,
  }

  return bmr * multipliers[profile.activityLevel]
}

/**
 * Generate doable nutrition guidance (no strict meal plans).
 */
export function generateNutritionGuidance(profile: UserProfile): NutritionGuidance {
  const tdee = calculateTDEE(profile)

  let calorieMin: number
  let calorieMax: number
  let proteinMin: number

  // Goal-based adjustments
  if (profile.goal === 'fat_loss') {
    calorieMin = Math.round(tdee * 0.8)
    calorieMax = Math.round(tdee * 0.9)
    proteinMin = Math.round(profile.weight * 1.8) // 1.8g/kg for muscle preservation
  } else if (profile.goal === 'muscle_gain') {
    calorieMin = Math.round(tdee * 1.1)
    calorieMax = Math.round(tdee * 1.2)
    proteinMin = Math.round(profile.weight * 2.0) // 2g/kg for muscle growth
  } else {
    // maintenance
    calorieMin = Math.round(tdee * 0.95)
    calorieMax = Math.round(tdee * 1.05)
    proteinMin = Math.round(profile.weight * 1.6)
  }

  const simpleRules = [
    `Aim for ${calorieMin}-${calorieMax} calories per day`,
    `Get at least ${proteinMin}g protein daily`,
    'Add protein to 2 main meals per day',
    'Avoid liquid calories (soda, packaged juice, excess chai)',
    'Drink 2-3 liters of water daily',
  ]

  const mealTemplates = {
    breakfast: [
      '3-4 eggs (boiled/omelette) + 2 roti OR oats with curd',
      'Paneer paratha (2) + curd',
      'Dosa (2-3) + sambhar + egg whites',
      'Poha with peanuts + boiled eggs',
    ],
    lunch: [
      '2-3 roti + dal (1 bowl) + sabzi + curd',
      'Rice (1 cup) + rajma/chole + salad',
      'Chicken/fish curry + 2 roti + vegetables',
      'Khichdi with paneer + raita',
    ],
    dinner: [
      '2 roti + grilled chicken/fish + vegetables',
      'Dal (1 bowl) + sabzi + 1-2 roti + salad',
      'Egg curry (3-4 eggs) + 2 roti',
      'Paneer tikka + roti + vegetables',
    ],
    snacks: [
      'Roasted chana (chickpeas)',
      'Peanuts (handful)',
      'Curd (1 bowl)',
      'Banana + whey protein shake',
      'Sprouts salad',
    ],
  }

  const indianContext = [
    'Dal, paneer, curd, and eggs are great protein sources',
    'Control roti/rice portions based on your goal',
    'Use ghee/oil in moderation (1-2 tbsp per meal)',
    'Festival/cheat meals are okay once a week',
    'Home-cooked food > outside food',
  ]

  const avoidAdvice = [
    "Don't ban any foods completely",
    "Don't count every single calorie obsessively",
    "Don't skip meals to 'save' calories",
    "Don't drink calories (soda, packaged juice)",
  ]

  return {
    calorieRange: { min: calorieMin, max: calorieMax },
    proteinMinimum: proteinMin,
    simpleRules,
    mealTemplates,
    indianContext,
    avoidAdvice,
  }
}
