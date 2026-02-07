import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

type ExerciseBenefitKey =
  | 'muscleGrowth'
  | 'fatLoss'
  | 'posture'
  | 'mobility'
  | 'rehab'
  | 'sportsPerformance';

const BENEFIT_LABELS: Record<ExerciseBenefitKey, string> = {
  muscleGrowth: 'Muscle Growth',
  fatLoss: 'Fat Loss',
  posture: 'Posture',
  mobility: 'Mobility',
  rehab: 'Rehabilitation',
  sportsPerformance: 'Sports Performance',
};

function humanizeEnum(input: string): string {
  return input.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeRole(role: string): 'primary' | 'secondary' | 'stabilizer' {
  const v = String(role || '').toLowerCase();
  if (v === 'secondary' || v === 'stabilizer') return v;
  return 'primary';
}

export default function ExerciseDetailScreen({ route, navigation }: any) {
  const { exerciseId, exerciseName } = route.params || {};
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [isFavorite, setIsFavorite] = useState(false);

  const {
    data: exerciseDetail,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['exerciseDetail', exerciseId],
    enabled: Boolean(exerciseId),
    queryFn: () => apiClient.getExercise(exerciseId),
  });

  const { data: favoriteList } = useQuery({
    queryKey: ['favorites', user?.id],
    enabled: !!user?.id,
    queryFn: () => apiClient.listFavorites(user!.id),
  });

  const favoriteExerciseIds = useMemo(() => {
    const list = Array.isArray(favoriteList) ? favoriteList : [];
    return new Set<string>(list.map((f: any) => f.exerciseId).filter(Boolean));
  }, [favoriteList]);

  useEffect(() => {
    if (!exerciseId) return;
    setIsFavorite(favoriteExerciseIds.has(exerciseId));
  }, [exerciseId, favoriteExerciseIds]);

  const addFavoriteMutation = useMutation({
    mutationFn: (id: string) => apiClient.addFavorite(user!.id, id),
    onSuccess: async (_data, id) => {
      await qc.invalidateQueries({ queryKey: ['favorites', user?.id] });
      if (id === exerciseId) setIsFavorite(true);
    },
    onError: async (err: any, id) => {
      // Treat "already favorited" as success to keep UX smooth.
      if (typeof err?.status === 'number' && err.status === 409) {
        await qc.invalidateQueries({ queryKey: ['favorites', user?.id] });
        if (id === exerciseId) setIsFavorite(true);
        return;
      }
      Alert.alert('Error', err?.message || 'Failed to add to favorites');
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (id: string) => apiClient.removeFavorite(user!.id, id),
    onSuccess: async (_data, id) => {
      await qc.invalidateQueries({ queryKey: ['favorites', user?.id] });
      if (id === exerciseId) setIsFavorite(false);
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to remove from favorites');
    },
  });

  const toggleFavorite = () => {
    if (!user?.id) {
      Alert.alert('Login required', 'Please log in to save favorites.');
      return;
    }
    if (!exerciseId) return;
    if (isFavorite) removeFavoriteMutation.mutate(exerciseId);
    else addFavoriteMutation.mutate(exerciseId);
  };

  const payload: any = exerciseDetail || {};
  const exercise: any = payload.exercise || {};
  const musclesRaw: any[] = Array.isArray(payload.muscles)
    ? payload.muscles
    : Array.isArray(exercise.muscles)
      ? exercise.muscles
      : [];
  const muscles = musclesRaw
    .map((m) => ({
      id: m.muscleGroupId || m.id,
      displayName: m.muscleGroupName || m.displayName || m.name,
      role: normalizeRole(m.role),
    }))
    .filter((m) => Boolean(m.id) && Boolean(m.displayName));

  const alternatives: any[] = Array.isArray(payload.alternatives) ? payload.alternatives : [];

  const steps: string[] = Array.isArray(exercise.stepByStep)
    ? exercise.stepByStep
    : Array.isArray(exercise.instructions)
      ? exercise.instructions
      : [];

  const benefitKeys = Object.entries((exercise.benefits || {}) as Record<string, unknown>)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
    .filter((k): k is ExerciseBenefitKey => k in BENEFIT_LABELS);

  const handleAddToWorkout = () => {
    if (!exercise?.id) return;
    navigation.navigate('Workouts', {
      screen: 'WorkoutLogger',
      params: {
        addExercise: {
          id: exercise.id,
          name: exercise.name,
          requestId: String(Date.now()),
        },
      },
    });
  };

  if (!exerciseId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Exercise
          </Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.center}>
          <Text style={[typography.body2, { color: colors.textSecondary }]}>Missing exercise id.</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {exerciseName || 'Exercise'}
          </Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {exerciseName || 'Exercise'}
          </Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.center}>
          <Text style={[typography.body2, { color: colors.error, marginBottom: spacing.md }]}>
            Failed to load exercise.
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
            <Text style={[typography.label1, { color: colors.primary, marginLeft: spacing.sm }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const difficulty = String(exercise.difficulty || '').toLowerCase();
  const difficultyColor =
    difficulty === 'beginner'
      ? colors.success
      : difficulty === 'intermediate'
        ? colors.warning
        : difficulty === 'advanced'
          ? colors.error
          : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {exercise.name || exerciseName || 'Exercise'}
        </Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.iconBtn} hitSlop={10}>
          <MaterialCommunityIcons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? colors.error : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['4xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <View style={[styles.pill, { backgroundColor: `${difficultyColor}20` }]}>
              <Text style={[typography.label2, { color: difficultyColor }]}>
                {difficulty ? humanizeEnum(difficulty) : 'Difficulty'}
              </Text>
            </View>
            {exercise.category ? (
              <View style={[styles.pill, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[typography.label2, { color: colors.primary }]}>{humanizeEnum(exercise.category)}</Text>
              </View>
            ) : null}
            {exercise.location ? (
              <View style={[styles.pill, { backgroundColor: `${colors.secondary}18` }]}>
                <Text style={[typography.label2, { color: colors.secondary }]}>{humanizeEnum(exercise.location)}</Text>
              </View>
            ) : null}
          </View>

          {exercise.description ? (
            <Text style={[typography.body2, { color: colors.textSecondary, marginTop: spacing.md }]}>
              {exercise.description}
            </Text>
          ) : null}

          {Array.isArray(exercise.equipment) && exercise.equipment.length > 0 ? (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[typography.label1, { color: colors.text, marginBottom: spacing.sm }]}>Equipment</Text>
              <View style={styles.tagsRow}>
                {exercise.equipment.map((eq: string) => (
                  <View key={eq} style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                      {humanizeEnum(String(eq))}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* Muscles */}
        {muscles.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="dumbbell" size={18} color={colors.primary} />
              <Text style={[typography.heading3, { color: colors.text, marginLeft: spacing.sm }]}>Muscles Worked</Text>
            </View>
            {muscles.map((m) => {
              const roleColor =
                m.role === 'primary' ? colors.success : m.role === 'secondary' ? colors.warning : colors.primary;
              return (
                <View key={`${m.id}-${m.role}`} style={styles.muscleRow}>
                  <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20` }]}>
                    <Text style={[typography.caption2, { color: roleColor, fontWeight: '700' }]}>
                      {humanizeEnum(m.role)}
                    </Text>
                  </View>
                  <Text style={[typography.body2, { color: colors.text, marginLeft: spacing.md, flex: 1 }]}>
                    {m.displayName}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* How to Perform */}
        {steps.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="format-list-numbered" size={18} color={colors.primary} />
              <Text style={[typography.heading3, { color: colors.text, marginLeft: spacing.sm }]}>How to Perform</Text>
            </View>
            {steps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={[typography.caption1, { color: colors.textInverse, fontWeight: '700' }]}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={[typography.body2, { color: colors.text, flex: 1, marginLeft: spacing.md }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Breathing & Tempo */}
        {exercise.breathingTechnique || exercise.tempo ? (
          <View style={styles.grid2}>
            {exercise.breathingTechnique ? (
              <View style={[styles.card, styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[typography.label1, { color: colors.text }]}>Breathing</Text>
                <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  {exercise.breathingTechnique}
                </Text>
              </View>
            ) : null}
            {exercise.tempo ? (
              <View style={[styles.card, styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[typography.label1, { color: colors.text }]}>Tempo</Text>
                <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.xs }]}>
                  {exercise.tempo}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Benefits */}
        {benefitKeys.length > 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: `${colors.success}12`, borderColor: `${colors.success}30` },
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="star" size={18} color={colors.success} />
              <Text style={[typography.heading3, { color: colors.text, marginLeft: spacing.sm }]}>Benefits</Text>
            </View>
            {benefitKeys.map((k) => (
              <View key={k} style={styles.bulletRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                <Text style={[typography.body2, { color: colors.text, marginLeft: spacing.sm }]}>
                  {BENEFIT_LABELS[k]}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Common Mistakes */}
        {Array.isArray(exercise.commonMistakes) && exercise.commonMistakes.length > 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}35` },
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={colors.warning} />
              <Text style={[typography.heading3, { color: colors.text, marginLeft: spacing.sm }]}>Common Mistakes</Text>
            </View>
            {exercise.commonMistakes.map((mistake: string, idx: number) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[typography.body2, { color: colors.textSecondary }]}>{'\u2022'}</Text>
                <Text style={[typography.body2, { color: colors.text, marginLeft: spacing.sm, flex: 1 }]}>
                  {mistake}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Injury Risks */}
        {Array.isArray(exercise.injuryRisks) && exercise.injuryRisks.length > 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: `${colors.error}12`, borderColor: `${colors.error}35` },
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="hospital-box" size={18} color={colors.error} />
              <Text style={[typography.heading3, { color: colors.text, marginLeft: spacing.sm }]}>Injury Risks</Text>
            </View>
            {exercise.injuryRisks.map((risk: string, idx: number) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[typography.body2, { color: colors.textSecondary }]}>{'\u2022'}</Text>
                <Text style={[typography.body2, { color: colors.text, marginLeft: spacing.sm, flex: 1 }]}>
                  {risk}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Alternatives */}
        {alternatives.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="repeat" size={18} color={colors.primary} />
              <Text style={[typography.heading3, { color: colors.text, marginLeft: spacing.sm }]}>
                Alternative Exercises
              </Text>
            </View>
            {alternatives.map((alt) => {
              const isAltFavorite = favoriteExerciseIds.has(alt.id);
              return (
                <TouchableOpacity
                  key={alt.id}
                  style={[styles.altRow, { borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.push('ExerciseDetail', { exerciseId: alt.id, exerciseName: alt.name })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                      {alt.name}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                      {alt.difficulty ? humanizeEnum(String(alt.difficulty)) : '—'}
                      {alt.type ? ` • ${humanizeEnum(String(alt.type))}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (!user?.id) {
                        Alert.alert('Login required', 'Please log in to save favorites.');
                        return;
                      }
                      addFavoriteMutation.mutate(alt.id);
                    }}
                    style={styles.iconBtn}
                    hitSlop={10}
                  >
                    <MaterialCommunityIcons
                      name={isAltFavorite ? 'check-circle' : 'plus-circle'}
                      size={22}
                      color={isAltFavorite ? colors.success : colors.primary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md), borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={handleAddToWorkout}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.textInverse} />
          <Text style={[typography.label1, { color: colors.textInverse, marginLeft: spacing.sm }]}>Add to Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.heading3,
    flex: 1,
    marginHorizontal: spacing.sm,
  },

  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  grid2: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  gridCard: {
    flex: 1,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },

  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 52,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});

