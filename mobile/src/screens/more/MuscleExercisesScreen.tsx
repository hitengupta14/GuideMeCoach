import React from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { LoadingView, ErrorView, EmptyView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function MuscleExercisesScreen({ route, navigation }: any) {
  const { colors } = useThemeStore();
  const { muscleId, muscleName } = route.params;

  const { data, isLoading, error } = useQuery({
    queryKey: ['muscle-exercises', muscleId],
    queryFn: () => apiClient.getMuscleExercises(muscleId),
  });
  const exercises = React.useMemo(() => {
    const groups = (data as any)?.exercises;
    if (!groups) return [];
    if (Array.isArray(groups)) return groups;
    return Object.values(groups as Record<string, any[]>).flat();
  }, [data]);

  if (isLoading) {
    return <LoadingView message="Loading exercises" />;
  }

  if (error) {
    return <ErrorView message="Failed to load exercises" />;
  }

  if (!exercises.length) {
    return <EmptyView title="No exercises found" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{muscleName}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{exercises.length} exercises</Text>
      <FlatList
        data={exercises}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('Exercises', {
                screen: 'ExerciseDetail',
                params: { exerciseId: item.id, exerciseName: item.name },
              })
            }
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{item.difficulty}</Text>
              </View>
              {item.equipment?.length ? (
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.equipment.join(', ').replace(/_/g, ' ')}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  title: { ...typography.heading1 },
  subtitle: { ...typography.body3, marginBottom: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  cardTitle: { ...typography.heading3 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  badgeText: { ...typography.caption1, fontWeight: '700', textTransform: 'capitalize' },
  meta: { ...typography.caption1, flex: 1 },
});
