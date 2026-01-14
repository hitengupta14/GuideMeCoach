import Link from 'next/link'

interface AlternativesProps {
  slug: string
  alternatives?: {
    easier?: string[]
    harder?: string[]
    equipment_free?: string[]
    same_level?: string[]
  }
}

export function ExerciseAlternatives({ slug, alternatives }: AlternativesProps) {
  if (!alternatives || Object.values(alternatives).every(arr => !arr || arr.length === 0)) {
    return null
  }

  const getExerciseName = (exerciseSlug: string) => {
    // Convert slug to display name (e.g., 'incline-barbell-bench-press' -> 'Incline Barbell Bench Press')
    return exerciseSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const AlternativeSection = ({
    title,
    items,
    icon,
    color,
  }: {
    title: string
    items?: string[]
    icon: string
    color: string
  }) => {
    if (!items || items.length === 0) return null

    return (
      <div className="space-y-3">
        <h4 className={`font-semibold ${color} mb-3 flex items-center gap-2`}>
          <span className="text-lg">{icon}</span>
          {title}
        </h4>
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item}
              href={`/exercises/${item}`}
              className="block p-3 bg-gray-50 hover:bg-primary-50 rounded-lg border border-gray-200 hover:border-primary-300 transition"
            >
              <div className="text-sm font-medium text-gray-900 hover:text-primary-700">
                {getExerciseName(item)}
              </div>
              <div className="text-xs text-gray-500">View details →</div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h3 className="text-2xl font-bold mb-6">💡 Exercise Alternatives</h3>

      <div className="space-y-8">
        <AlternativeSection
          title="Easier Variations"
          items={alternatives.easier}
          icon="📉"
          color="text-green-700"
        />

        <AlternativeSection
          title="Harder Variations"
          items={alternatives.harder}
          icon="📈"
          color="text-orange-700"
        />

        <AlternativeSection
          title="Equipment-Free Options"
          items={alternatives.equipment_free}
          icon="🏠"
          color="text-blue-700"
        />

        <AlternativeSection
          title="Same Level Alternatives"
          items={alternatives.same_level}
          icon="⚖️"
          color="text-purple-700"
        />
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <span className="font-semibold">Tip:</span> Can't do this exercise? Try one of the alternatives above based on your current fitness level or available equipment.
        </p>
      </div>
    </section>
  )
}
