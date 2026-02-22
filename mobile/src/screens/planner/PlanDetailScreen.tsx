import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

function normalizePlanDays(planDataRaw: unknown): Array<{
  key: string;
  weekNumber?: number;
  dayNumber?: number;
  dayName: string;
  focusMuscles: string[];
  exercises: Array<{
    exerciseId?: string;
    exerciseName?: string;
    sets?: number;
    reps?: string;
    restSeconds?: number;
  }>;
}> {
  const planData =
    typeof planDataRaw === 'string'
      ? (() => {
          try {
            return JSON.parse(planDataRaw);
          } catch {
            return null;
          }
        })()
      : planDataRaw;

  const weeks = (planData as any)?.weeks;
  if (!Array.isArray(weeks)) return [];

  const out: any[] = [];
  for (const w of weeks) {
    const weekNumber =
      typeof w?.weekNumber === 'number'
        ? w.weekNumber
        : typeof w?.week === 'number'
          ? w.week
          : undefined;

    const days = Array.isArray(w?.days) ? w.days : [];
    days.forEach((d: any, idx: number) => {
      const dayNumber = typeof d?.dayNumber === 'number' ? d.dayNumber : idx + 1;
      const dayName = String(d?.dayName || d?.day || `Day ${dayNumber}`);
      const focusMuscles = Array.isArray(d?.focusMuscles)
        ? d.focusMuscles.filter(Boolean).map(String)
        : typeof d?.focusMuscle === 'string'
          ? [d.focusMuscle]
          : [];

      const exercises = Array.isArray(d?.exercises)
        ? d.exercises.map((ex: any) => ({
            exerciseId: typeof ex?.exerciseId === 'string' ? ex.exerciseId : undefined,
            exerciseName: typeof ex?.exerciseName === 'string' ? ex.exerciseName : typeof ex?.name === 'string' ? ex.name : undefined,
            sets: typeof ex?.sets === 'number' ? ex.sets : undefined,
            reps: typeof ex?.reps === 'string' ? ex.reps : undefined,
            restSeconds: typeof ex?.restSeconds === 'number' ? ex.restSeconds : undefined,
          }))
        : [];

      out.push({
        key: `${weekNumber || 'w'}-${dayNumber}`,
        weekNumber,
        dayNumber,
        dayName,
        focusMuscles,
        exercises,
      });
    });
  }

  return out;
}

export default function PlanDetailScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const route: any = useRoute();
  const planId = route?.params?.planId as string | undefined;
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const planQuery = useQuery({
    queryKey: ['plan', planId],
    enabled: !!planId,
    queryFn: async () => apiClient.getPlan(planId as string),
  });

  const plan: any = (planQuery.data as any)?.plan || null;
  const days = useMemo(() => normalizePlanDays(plan?.planData), [plan?.planData]);

  const activateMutation = useMutation({
    mutationFn: async () => apiClient.updatePlan(planId as string, { isActive: true }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['plans'] }),
        queryClient.invalidateQueries({ queryKey: ['today'] }),
        queryClient.invalidateQueries({ queryKey: ['plan', planId] }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => apiClient.deletePlan(planId as string),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['plans'] }),
        queryClient.invalidateQueries({ queryKey: ['today'] }),
      ]);
      navigation.goBack();
    },
  });

  if (!planId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Plan" onBackPress={() => navigation.goBack()} />
        <ErrorView message="Missing plan id." />
      </View>
    );
  }

  if (planQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Plan" onBackPress={() => navigation.goBack()} />
        <LoadingView message="Loading plan…" />
      </View>
    );
  }

  if (planQuery.error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Plan" onBackPress={() => navigation.goBack()} />
        <ErrorView message="Failed to load plan." />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Plan" onBackPress={() => navigation.goBack()} />
        <EmptyView title="Plan not found" subtitle="This plan may have been deleted." />
      </View>
    );
  }

  const isActive = Boolean(plan?.isActive);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Plan"
        subtitle={isActive ? 'Active plan' : 'Plan details'}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Delete plan?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: deleteMutation.isPending ? 'Deleting…' : 'Delete',
                  style: 'destructive',
                  onPress: () => deleteMutation.mutate(),
                },
              ]);
            }}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.error}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Delete plan"
          >
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.heading3, { color: colors.text }]} numberOfLines={2}>
            {plan?.name || 'Workout Plan'}
          </Text>
          {plan?.description ? (
            <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]} numberOfLines={3}>
              {plan.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={[styles.metaChip, { backgroundColor: `${colors.primary}14` }]}>
              <MaterialCommunityIcons name="calendar-range" size={14} color={colors.primary} />
              <Text style={[typography.caption1, { color: colors.text, fontWeight: '600' }]}>
                {plan?.durationWeeks || '—'} weeks
              </Text>
            </View>
            {isActive ? (
              <View style={[styles.metaChip, { backgroundColor: `${colors.success}18` }]}>
                <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                <Text style={[typography.caption1, { color: colors.text, fontWeight: '600' }]}>Active</Text>
              </View>
            ) : null}
          </View>

          {!isActive ? (
            <TouchableOpacity
              disabled={activateMutation.isPending || busy}
              activeOpacity={0.85}
              onPress={async () => {
                setBusy(true);
                try {
                  await activateMutation.mutateAsync();
                  Alert.alert('Activated', 'This plan is now your active plan.', [
                    { text: 'OK', style: 'cancel' },
                    { text: 'Open Today', onPress: () => navigation.navigate('Home', { screen: 'Today' }) },
                  ]);
                } finally {
                  setBusy(false);
                }
              }}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: activateMutation.isPending || busy ? 0.8 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons name="check" size={18} color={colors.textInverse} />
              <Text style={[typography.label1, { color: colors.textInverse }]}>
                {activateMutation.isPending ? 'Activating…' : 'Set as active'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Home', { screen: 'Today' })}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="calendar-check" size={18} color={colors.textInverse} />
              <Text style={[typography.label1, { color: colors.textInverse }]}>Open Today</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
          Schedule
        </Text>

        {days.length === 0 ? (
          <EmptyView
            title="No structured days found"
            subtitle="This plan doesn’t include a structured week/day schedule."
          />
        ) : (
          days.map((d) => (
            <View
              key={d.key}
              style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.dayHeader}>
                <View style={[styles.dayIcon, { backgroundColor: `${colors.primary}14` }]}>
                  <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {d.dayName}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]} numberOfLines={1}>
                    {d.weekNumber ? `Week ${d.weekNumber}` : 'Week'} • {d.exercises.length} exercise{d.exercises.length === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>

              {d.focusMuscles.length > 0 ? (
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  Focus: {d.focusMuscles.join(', ')}
                </Text>
              ) : null}

              {d.exercises.slice(0, 8).map((ex, idx) => (
                <View key={`${d.key}-${ex.exerciseId || idx}`} style={[styles.exerciseRow, { borderBottomColor: colors.border }]}>
                  <Text style={[typography.body3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {ex.exerciseName || 'Exercise'}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                    {ex.sets || '—'} × {ex.reps || '—'}
                  </Text>
                </View>
              ))}
              {d.exercises.length > 8 ? (
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  +{d.exercises.length - 8} more
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
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
  planCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
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
  dayCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dayIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

