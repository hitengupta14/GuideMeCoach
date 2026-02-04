import { db } from '@/db'
import { metricsCounters } from '@/db/schema'
import { and, desc, ilike, like, sql } from 'drizzle-orm'

interface SearchParams {
  day?: string
  metric?: string
  q?: string
  limit?: string
}

function getUtcDayString(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseMetricKey(key: string) {
  const [day, metric, tags] = key.split('|')
  return { day: day || '', metric: metric || '', tags: tags || '' }
}

function isMissingTableError(error: any, table: string) {
  const message = String(error?.message || '')
  return error?.code === '42P01' && message.toLowerCase().includes(table.toLowerCase())
}

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const day = typeof searchParams.day === 'string' && searchParams.day.length > 0
    ? searchParams.day
    : getUtcDayString(new Date())
  const metricFilter = typeof searchParams.metric === 'string' ? searchParams.metric.trim() : ''
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const limitRaw = parseInt(searchParams.limit || '200', 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(1000, Math.max(50, limitRaw)) : 200

  const metricExpr = sql<string>`split_part(${metricsCounters.key}, '|', 2)`

  try {
    const whereConditions = [like(metricsCounters.key, `${day}|%`)]
    if (metricFilter) {
      whereConditions.push(sql`${metricExpr} = ${metricFilter}`)
    }
    if (q) {
      whereConditions.push(ilike(metricsCounters.key, `%${q}%`))
    }

    const whereClause =
      whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)

    const [dayStats] = await db
      .select({
        rows: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${metricsCounters.count}), 0)`,
        uniqueMetrics: sql<number>`count(distinct ${metricExpr})`,
      })
      .from(metricsCounters)
      .where(whereClause)

    const topMetrics = await db
      .select({
        metric: metricExpr,
        total: sql<number>`sum(${metricsCounters.count})`,
      })
      .from(metricsCounters)
      .where(like(metricsCounters.key, `${day}|%`))
      .groupBy(metricExpr)
      .orderBy(desc(sql`sum(${metricsCounters.count})`))
      .limit(15)

    const metricOptions = await db
      .select({ metric: metricExpr })
      .from(metricsCounters)
      .where(like(metricsCounters.key, `${day}|%`))
      .groupBy(metricExpr)
      .orderBy(metricExpr)

    const rows = await db
      .select({
        key: metricsCounters.key,
        count: metricsCounters.count,
        updatedAt: metricsCounters.updatedAt,
        createdAt: metricsCounters.createdAt,
      })
      .from(metricsCounters)
      .where(whereClause)
      .orderBy(desc(metricsCounters.updatedAt))
      .limit(limit)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Metrics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            DB-backed counters for API traffic, rate limits, and exceptions.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day (UTC)
              </label>
              <input
                type="date"
                name="day"
                defaultValue={day}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Metric
              </label>
              <select
                name="metric"
                defaultValue={metricFilter}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                {metricOptions.map((m) => (
                  <option key={m.metric} value={m.metric}>
                    {m.metric}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contains (Key)
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="path=/api/..., statusClass=5xx, ..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-end gap-2">
              <input type="hidden" name="limit" value={String(limit)} />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Rows</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {dayStats?.rows || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Count</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {dayStats?.total || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Unique Metrics</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {dayStats?.uniqueMetrics || 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Metrics ({day})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topMetrics.map((m) => (
                  <tr key={m.metric} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{m.metric}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 text-right">
                      {Number(m.total) || 0}
                    </td>
                  </tr>
                ))}
                {topMetrics.length === 0 && (
                  <tr>
                    <td className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400" colSpan={2}>
                      No metrics found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Keys (showing {rows.length} / {limit})
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Keys are stored as <span className="font-mono">day|metric|tag1=v1,tag2=v2</span>.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rows.map((r) => {
                  const parsed = parseMetricKey(r.key)
                  return (
                    <tr key={r.key} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{parsed.metric}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{parsed.day}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 font-mono max-w-[40rem] truncate">
                        {parsed.tags || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right">
                        {r.count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                      No metrics found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    if (isMissingTableError(error, 'metrics_counters')) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Metrics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              The <span className="font-mono">metrics_counters</span> table is missing.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Run <span className="font-mono">npm run db:push</span> (or apply migrations) and refresh.
            </p>
          </div>
        </div>
      )
    }

    throw error
  }
}
