import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

function toDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  const parsed = new Date(String(input));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWhen(input: unknown): string {
  const d = toDate(input);
  if (!d) return '—';
  try {
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return d.toISOString();
  }
}

function formatDuration(minutes: unknown): string {
  const n = typeof minutes === 'number' ? minutes : Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 60) return `${Math.round(n)}m`;
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function WorkoutHistoryScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workout-sessions'],
    queryFn: () => apiClient.listWorkoutSessions(),
  });

  const sessions = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list
      .slice()
      .sort((a: any, b: any) => {
        const ta = toDate(a?.completedAt || a?.createdAt)?.getTime() ?? 0;
        const tb = toDate(b?.completedAt || b?.createdAt)?.getTime() ?? 0;
        return tb - ta;
      });
  }, [data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Workout History"
        subtitle="Your recent sessions."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh workout history"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingView message="Loading sessions…" />
      ) : error ? (
        <ErrorView message="Failed to load workout history." />
      ) : sessions.length === 0 ? (
        <EmptyView title="No workouts yet" subtitle="Log your first workout to see it here." />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }: any) => {
            const when = formatWhen(item?.completedAt || item?.createdAt);
            const duration = formatDuration(item?.duration);
            const dayName = (item?.dayName as string) || 'Workout';
            const planLabel = item?.planId ? 'Plan' : null;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('WorkoutSummary', { sessionId: item.id })}
                style={[
                  styles.row,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                  <MaterialCommunityIcons name="dumbbell" size={22} color={colors.primary} />
                </View>

                <View style={styles.rowMain}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {dayName}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={1}>
                    {when}
                    {planLabel ? ` • ${planLabel}` : ''}
                  </Text>
                </View>

                <View style={styles.rowRight}>
                  <Text style={[typography.label2, { color: colors.text }]}>{duration}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

