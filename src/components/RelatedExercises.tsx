import Link from 'next/link'
import { Exercise } from '@/db/schema'

interface ExerciseWithMuscles extends Exercise {
  muscles?: Array<{
    muscleGroupId: string
    muscleGroupName: string
    role: string
  }>
}

interface RelatedExercisesProps {
  currentExercise: ExerciseWithMuscles
  allExercises: ExerciseWithMuscles[]
}

export function RelatedExercises({ currentExercise, allExercises }: RelatedExercisesProps) {
  // Get muscle groups that the current exercise targets
  const currentMuscleGroups = new Set(
    (currentExercise.muscles || []).map(m => m.muscleGroupName)
  )

  // If no muscle groups, show nothing
  if (currentMuscleGroups.size === 0) {
    return null
  }

  // Find exercises that share at least one muscle group (excluding current)
  const relatedExercises = allExercises
    .filter((exercise: ExerciseWithMuscles) => {
      // Don't include the current exercise
      if (exercise.id === currentExercise.id) return false

      // Check if they share any muscle groups
      const exerciseMuscles = new Set(
        (exercise.muscles || []).map(m => m.muscleGroupName)
      )

      // Find intersection
      for (let muscle of currentMuscleGroups) {
        if (exerciseMuscles.has(muscle)) return true
      }

      return false
    })
    .slice(0, 6) // Limit to 6 exercises

  if (relatedExercises.length === 0) {
    return null
  }

  // Get the primary muscle groups for display
  const primaryMuscles = (currentExercise.muscles || [])
    .filter(m => m.role === 'primary')
    .map(m => m.muscleGroupName)
    .join(', ')

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h3 className="text-2xl font-bold mb-2">🔗 Related Exercises</h3>
      {primaryMuscles && (
        <p className="text-sm text-gray-600 mb-6">
          Other exercises that work {primaryMuscles}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedExercises.map((exercise: ExerciseWithMuscles) => {
          // Find shared muscles
          const sharedMuscles = (exercise.muscles || [])
            .filter(m => currentMuscleGroups.has(m.muscleGroupName))
            .map(m => m.muscleGroupName)
            .slice(0, 2)
            .join(', ')

          return (
            <Link
              key={exercise.id}
              href={`/exercises/${exercise.slug}`}
              className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-lg border border-gray-200 hover:border-primary-300 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 transition line-clamp-2">
                  {exercise.name}
                </h4>
                <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full bg-gray-200 group-hover:bg-primary-200 text-gray-700 group-hover:text-primary-700 transition whitespace-nowrap">
                  {exercise.difficulty}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                  {exercise.category}
                </span>
                {exercise.location && (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    {exercise.location}
                  </span>
                )}
              </div>

              {sharedMuscles && (
                <p className="text-xs text-primary-600 font-medium mb-3 bg-primary-50 px-2 py-1 rounded inline-block">
                  Also works: {sharedMuscles}
                </p>
              )}

              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{exercise.description}</p>

              <div className="flex items-center gap-1 text-primary-600 group-hover:text-primary-700 font-medium text-sm">
                View exercise
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
