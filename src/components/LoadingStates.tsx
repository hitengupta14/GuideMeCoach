export function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'detail' | 'list' }) {
  if (type === 'card') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden animate-pulse">
        <div className="bg-gray-300 dark:bg-gray-800 h-48"></div>
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-300 dark:bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
          <div className="flex gap-2 mt-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'detail') {
    return (
      <div className="animate-pulse space-y-8">
        <div className="space-y-3">
          <div className="h-8 bg-gray-300 dark:bg-gray-800 rounded w-1/4"></div>
          <div className="h-12 bg-gray-300 dark:bg-gray-800 rounded w-2/3"></div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  // list type
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      ))}
    </div>
  )
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message = 'Please try again later',
  action
}: { 
  title?: string
  message?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center max-w-md mx-auto">
      <div className="text-5xl mb-4"></div>
      <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">{title}</h3>
      <p className="text-red-700 dark:text-red-300 mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function EmptyState({ 
  title = 'No results found', 
  message = 'Try adjusting your filters',
  icon = ''
}: { 
  title?: string
  message?: string
  icon?: string
}) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-2xl p-8 text-center max-w-md mx-auto">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-yellow-900 dark:text-yellow-200 mb-2">{title}</h3>
      <p className="text-yellow-700 dark:text-yellow-300">{message}</p>
    </div>
  )
}
