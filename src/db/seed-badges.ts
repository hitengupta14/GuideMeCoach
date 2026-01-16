import { db } from '@/db'
import { achievementBadges } from '@/db/schema'

export async function seedAchievementBadges() {
  const badges: Array<{
    name: string
    description: string
    icon: string
    criteria: { type: 'workout_count' | 'days_streak' | 'weight_loss' | 'milestone'; value: number }
  }> = [
    {
      name: 'First Workout',
      description: 'Complete your first workout',
      icon: '🏁',
      criteria: { type: 'workout_count', value: 1 },
    },
    {
      name: 'Week Warrior',
      description: 'Complete 7 workouts',
      icon: '💪',
      criteria: { type: 'workout_count', value: 7 },
    },
    {
      name: 'Consistency Master',
      description: 'Maintain a 14-day workout streak',
      icon: '🔥',
      criteria: { type: 'days_streak', value: 14 },
    },
    {
      name: '50 Workout Club',
      description: 'Complete 50 workouts',
      icon: '⭐',
      criteria: { type: 'workout_count', value: 50 },
    },
    {
      name: 'Weight Loss Hero',
      description: 'Lose 5 kg',
      icon: '⚖️',
      criteria: { type: 'weight_loss', value: 5 },
    },
    {
      name: 'Unstoppable',
      description: 'Maintain a 30-day workout streak',
      icon: '🚀',
      criteria: { type: 'days_streak', value: 30 },
    },
    {
      name: 'Century Club',
      description: 'Complete 100 workouts',
      icon: '💯',
      criteria: { type: 'workout_count', value: 100 },
    },
    {
      name: 'Transformation Artist',
      description: 'Lose 10 kg',
      icon: '🎨',
      criteria: { type: 'weight_loss', value: 10 },
    },
  ]

  for (const badge of badges) {
    await db.insert(achievementBadges).values(badge)
  }

  console.log('Achievement badges seeded successfully!')
}

// Run if called directly
if (require.main === module) {
  seedAchievementBadges()
}
