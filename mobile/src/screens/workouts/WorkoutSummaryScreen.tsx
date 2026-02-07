import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { Card } from '../../components/Card';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

function toDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  const parsed = new Date(String(input));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(input: unknown): string {
  const d = toDate(input);
  if (!d) return '—';
  try {
    return d.toLocaleString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

function formatVolume(volume: number): string {
  if (!Number.isFinite(volume) || volume <= 0) return '—';
  if (volume >= 1_000_000) return `${Math.round(volume / 1_000_000)}M`;
  if (volume >= 10_000) return `${Math.round(volume / 1_000)}K`;
  return `${Math.round(volume)}`;
}

export default function WorkoutSummaryScreen({ navigation }: any) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';
  const route: any = useRoute();
  const sessionId = route?.params?.sessionId as string | undefined;

  const sessionQuery = useQuery({
    queryKey: ['workout-session', sessionId],
    enabled: !!sessionId,
    queryFn: () => apiClient.getWorkoutSession(sessionId as string),
  });

  const logsQuery = useQuery({
    queryKey: ['workout-logs', sessionId],
    enabled: !!sessionId,
    queryFn: () => apiClient.getSessionLogs(sessionId as string),
  });

  const setsQuery = useQuery({
    queryKey: ['workout-sets', sessionId],
    enabled: !!sessionId,
    queryFn: () => apiClient.getWorkoutSets(sessionId as string),
  });

  const loading = sessionQuery.isLoading || logsQuery.isLoading || setsQuery.isLoading;
  const error = sessionQuery.error || logsQuery.error || setsQuery.error;

  const session: any = sessionQuery.data || null;
  const logs: any[] = useMemo(
    () => (Array.isArray(logsQuery.data) ? (logsQuery.data as any[]) : []),
    [logsQuery.data]
  );
  const sets: any[] = useMemo(
    () => (Array.isArray(setsQuery.data) ? (setsQuery.data as any[]) : []),
    [setsQuery.data]
  );

  const derived = useMemo(() => {
    const byExercise = new Map<string, { exerciseId: string; exerciseName: string; sets: any[] }>();

    for (const s of sets) {
      const id = String(s?.exerciseId || '');
      if (!id) continue;
      const current = byExercise.get(id) || {
        exerciseId: id,
        exerciseName: String(s?.exerciseName || 'Exercise'),
        sets: [],
      };
      current.sets.push(s);
      byExercise.set(id, current);
    }

    const grouped = Array.from(byExercise.values()).map((g) => ({
      ...g,
      sets: g.sets
        .slice()
        .sort((a: any, b: any) => {
          const aw = a?.isWarmup ? 1 : 0;
          const bw = b?.isWarmup ? 1 : 0;
          if (aw !== bw) return aw - bw;
          return Number(a?.setNumber || 0) - Number(b?.setNumber || 0);
        }),
    }));

    grouped.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

    let totalReps = 0;
    let totalVolume = 0;
    for (const s of sets) {
      const reps = typeof s?.completedReps === 'number' ? s.completedReps : Number(s?.completedReps);
      const weight = typeof s?.weight === 'number' ? s.weight : Number(s?.weight);
      if (Number.isFinite(reps)) totalReps += reps;
      if (Number.isFinite(reps) && Number.isFinite(weight)) totalVolume += reps * weight;
    }

    const exerciseCount = grouped.length > 0 ? grouped.length : new Set(logs.map((l) => l?.exerciseId)).size;
    return {
      grouped,
      exerciseCount,
      totalSets: sets.length,
      totalReps,
      totalVolume,
    };
  }, [sets, logs]);

  if (!sessionId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Workout Summary" onBackPress={() => navigation.goBack()} />
        <ErrorView message="Missing workout session id." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Workout Summary"
        subtitle={session ? `${session.dayName || 'Workout'} • ${formatDate(session.completedAt || session.createdAt)}` : ' '}
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <LoadingView message="Loading summary…" />
      ) : error ? (
        <ErrorView message="Failed to load workout summary." />
      ) : !session ? (
        <EmptyView title="Session not found" subtitle="This workout may have been deleted." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Duration</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{formatDuration(session.duration)}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Exercises</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{derived.exerciseCount || 0}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Sets</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{derived.totalSets || 0}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Volume</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{formatVolume(derived.totalVolume)}</Text>
            </View>
          </View>

          {derived.grouped.length > 0 ? (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.md }]}>
                Exercises
              </Text>

              {derived.grouped.map((group) => (
                <Card key={group.exerciseId} variant="elevated" isDark={isDark} style={styles.exerciseCard}>
                  <View style={[styles.exerciseHeader, { borderBottomColor: colors.border }]}>
                    <View style={[styles.exerciseIcon, { backgroundColor: `${colors.primary}14` }]}>
                      <MaterialCommunityIcons name="dumbbell" size={18} color={colors.primary} />
                    </View>
                    <Text style={[typography.label1, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                      {group.exerciseName}
                    </Text>
                  </View>

                  <View style={styles.exerciseBody}>
                    {group.sets.map((s: any) => {
                      const reps = typeof s?.completedReps === 'number' ? s.completedReps : Number(s?.completedReps);
                      const weight = typeof s?.weight === 'number' ? s.weight : Number(s?.weight);
                      const repsLabel = Number.isFinite(reps) ? `${reps}` : '—';
                      const weightLabel = Number.isFinite(weight) ? `${weight}` : '—';
                      return (
                        <View key={`${group.exerciseId}-${s?.isWarmup ? 'w' : 's'}-${s?.setNumber}`} style={styles.setRow}>
                          <Text style={[typography.caption1, { color: colors.textSecondary, width: 54 }]}>
                            {s?.isWarmup ? `W${s?.setNumber}` : `S${s?.setNumber}`}
                          </Text>
                          <Text style={[typography.body3, { color: colors.text, flex: 1 }]}>
                            {weightLabel} kg × {repsLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              ))}
            </View>
          ) : logs.length > 0 ? (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.md }]}>
                Exercises
              </Text>
              {logs.map((log: any) => (
                <View
                  key={String(log?.id || log?.exerciseId)}
                  style={[styles.logRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.exerciseIcon, { backgroundColor: `${colors.primary}14` }]}>
                    <MaterialCommunityIcons name="dumbbell" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                      {log?.exerciseName || 'Exercise'}
                    </Text>
                    <Text style={[typography.body3, { color: colors.textSecondary }]}>
                      {log?.completedSets ?? '—'} sets • {log?.completedReps ?? '—'} reps
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: spacing['2xl'] }}>
              <EmptyView
                title="No exercise details yet"
                subtitle="Your next workout will show full set-by-set details once logged."
              />
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('WorkoutHistory')}
            style={[styles.secondaryCta, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
            <Text style={[typography.label1, { color: colors.text }]}>Back to history</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  exerciseCard: {
    marginBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  exerciseIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  secondaryCta: {
    marginTop: spacing.lg,
    height: 52,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.md,
  },
});
