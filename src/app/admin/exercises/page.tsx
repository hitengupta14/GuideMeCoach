import { db } from '@/db'
import { exercises, exerciseMuscles, muscleGroups } from '@/db/schema'
import { sql, desc, like, or, eq, and } from 'drizzle-orm'
import ExerciseManagementTable from '@/components/admin/ExerciseManagementTable'

interface SearchParams {
  search?: string
  category?: string
  difficulty?: string
  page?: string
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const search = searchParams.search || ''
  const category = searchParams.category || 'all'
  const difficulty = searchParams.difficulty || 'all'
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20

  // Build where conditions array
  const whereConditions = []

  if (search) {
    whereConditions.push(
      or(
        like(exercises.name, `%${search}%`),
        like(exercises.description, `%${search}%`)
      )
    )
  }

  if (category !== 'all') {
    whereConditions.push(eq(exercises.category, category as any))
  }

  if (difficulty !== 'all') {
    whereConditions.push(eq(exercises.difficulty, difficulty as any))
  }

  // Execute query with conditions
  let allExercises: any[] = []
  if (whereConditions.length > 0) {
    allExercises = await db
      .select()
      .from(exercises)
      .where(and(...whereConditions))
      .orderBy(desc(exercises.createdAt))
  } else {
    allExercises = await db
      .select()
      .from(exercises)
      .orderBy(desc(exercises.createdAt))
  }

  // Get total count
  const totalExercises = allExercises.length

  // Paginate
  const startIndex = (page - 1) * pageSize
  const paginatedExercises = allExercises.slice(startIndex, startIndex + pageSize)

  // Get muscle groups for each exercise
  const exercisesWithMuscles = await Promise.all(
    paginatedExercises.map(async (exercise) => {
      const muscles = await db
        .select({
          name: muscleGroups.displayName,
          role: exerciseMuscles.role,
        })
        .from(exerciseMuscles)
        .leftJoin(muscleGroups, eq(exerciseMuscles.muscleGroupId, muscleGroups.id))
        .where(eq(exerciseMuscles.exerciseId, exercise.id))

      return {
        ...exercise,
        muscles: muscles.map(m => m.name).join(', '),
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Exercise Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage exercises, update content, and control quality.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/admin/exercises/new'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Exercise
        </button>
      </div>

      <ExerciseManagementTable
        exercises={exercisesWithMuscles}
        totalExercises={totalExercises}
        currentPage={page}
        pageSize={pageSize}
        searchTerm={search}
        categoryFilter={category}
        difficultyFilter={difficulty}
      />
    </div>
  )
}
