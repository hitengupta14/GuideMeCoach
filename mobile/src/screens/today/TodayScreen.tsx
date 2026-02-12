import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth';

type TodayResponse = {
  hasActivePlan: boolean;
  plan?: { id: string; name?: string; description?: string; durationWeeks?: number };
  nextWorkout?: {
    weekNumber: number;
    dayNumber: number;
    dayName: string;
    focusMuscles?: string[];
    exercises: Array<{
      exerciseId: string;
      exerciseName: string;
      sets: number;
      reps: string;
      restSeconds?: number;
    }>;
    dayIndex: number;
    totalDays: number;
    completedSessionsForPlan: number;
  };
  error?: string;
};

export default function TodayScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const token = useAuthStore((s) => s.token);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['today', token],
    enabled: !!token,
    queryFn: () => apiClient.getToday(),
  });

  const today: TodayResponse = (data as any) || { hasActivePlan: false };

  const startPayload = useMemo(() => {
    if (!today?.plan?.id || !today?.nextWorkout?.exercises?.length) return null;
    return {
      planId: today.plan.id,
      dayName: today.nextWorkout.dayName,
      templateRequestId: `${Date.now()}`,
      templateExercises: today.nextWorkout.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.restSeconds,
      })),
    };
  }, [today?.plan?.id, today?.nextWorkout?.dayName, today?.nextWorkout?.exercises]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Today"
        subtitle="Your next workout, ready to go."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh today"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingView message="Loading today…" />
      ) : error ? (
        <ErrorView message="Failed to load today." />
      ) : !today?.hasActivePlan ? (
        <View style={{ flex: 1 }}>
          <EmptyView
            title="No active plan"
            subtitle="Activate a plan to get a daily workout and a clean Today flow."
          />
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('More', { screen: 'Planner' })}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="robot" size={18} color={colors.textInverse} />
              <Text style={[typography.label1, { color: colors.textInverse }]}>Set up a plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : today?.error && !today?.nextWorkout ? (
        <ErrorView message={today.error} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.success}18` }]}>
                <MaterialCommunityIcons name="calendar-check" size={22} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                  {today?.plan?.name || 'Active Plan'}
                </Text>
                <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                  {today?.plan?.description || 'Your plan is active.'}
                </Text>
              </View>
            </View>
          </View>

          {today?.nextWorkout ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                  <MaterialCommunityIcons name="fire" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {today.nextWorkout.dayName}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                    Week {today.nextWorkout.weekNumber} • Day {today.nextWorkout.dayNumber} •{' '}
                    {today.nextWorkout.completedSessionsForPlan}/{today.nextWorkout.totalDays} completed
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[typography.label2, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                  Exercises
                </Text>
                {today.nextWorkout.exercises.slice(0, 10).map((ex, idx) => (
                  <View
                    key={`${ex.exerciseId}-${idx}`}
                    style={[styles.exerciseRow, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[typography.body2, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                      {ex.exerciseName}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                      {ex.sets} × {ex.reps}
                    </Text>
                  </View>
                ))}
                {today.nextWorkout.exercises.length > 10 ? (
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                    +{today.nextWorkout.exercises.length - 10} more
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.ctaRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!startPayload || isFetching}
              onPress={() => {
                if (!startPayload) return;
                navigation.navigate('Workouts', { screen: 'WorkoutLogger', params: startPayload });
              }}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: startPayload ? colors.primary : colors.disabled,
                  opacity: startPayload ? 1 : 0.7,
                },
              ]}
            >
              <MaterialCommunityIcons name="play" size={18} color={colors.textInverse} />
              <Text style={[typography.label1, { color: colors.textInverse }]}>Start workout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('More', { screen: 'Plans' })}
              style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="clipboard-text" size={18} color={colors.primary} />
              <Text style={[typography.label1, { color: colors.text }]}>View plans</Text>
            </TouchableOpacity>
          </View>
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
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ctaRow: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  primaryBtn: {
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.md,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    ...shadows.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
});
