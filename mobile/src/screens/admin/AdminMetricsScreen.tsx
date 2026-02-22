import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { ErrorView, LoadingView, EmptyView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

function toNumber(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function formatDateTime(input: unknown): string {
  if (!input) return '—';
  const date = input instanceof Date ? input : new Date(String(input));
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return date.toISOString();
  }
}

export default function AdminMetricsScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const query = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => apiClient.adminMetrics(),
  });

  const data = (query.data as any)?.data || (query.data as any) || {};
  const dayStats = data.dayStats || {};
  const topMetrics = data.topMetrics || [];
  const recentRows = useMemo(() => {
    const rows = data.rows || [];
    return rows.slice(0, 50);
  }, [data.rows]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScreenHeader
        title="Metrics"
        subtitle={`Counters for ${data.day || 'today'} (UTC)`}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => query.refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh metrics"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {query.isLoading ? (
        <LoadingView message="Loading metrics…" />
      ) : query.error ? (
        <ErrorView message="Failed to load metrics." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={Boolean(query.isFetching)} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Rows</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{toNumber(dayStats.rows)}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Total Count</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{toNumber(dayStats.total)}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Unique Metrics</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{toNumber(dayStats.uniqueMetrics)}</Text>
            </View>
          </View>

          <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Top metrics</Text>

          {topMetrics.length === 0 ? (
            <EmptyView title="No metrics" subtitle="No counters recorded for this day." />
          ) : (
            topMetrics.map((row: any, idx: number) => (
              <View
                key={`${row.metric || 'metric'}-${idx}`}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}> 
                  <MaterialCommunityIcons name="chart-bar" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {String(row.metric || 'metric')}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]}>Total: {toNumber(row.total)}</Text>
                </View>
              </View>
            ))
          )}

          <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Recent updates</Text>

          {recentRows.length === 0 ? (
            <EmptyView title="No updates" subtitle="No recent metric updates found." />
          ) : (
            recentRows.map((row: any, idx: number) => (
              <View
                key={`${row.key || 'row'}-${idx}`}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}> 
                  <MaterialCommunityIcons name="update" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {String(row.key || 'metric')}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]}>Count: {toNumber(row.count)}</Text>
                </View>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>{formatDateTime(row.updatedAt)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
