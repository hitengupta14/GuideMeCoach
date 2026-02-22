import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import ScreenHeader from '../../components/ScreenHeader';
import { TextInput } from '../../components/TextInput';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

const CATEGORY_OPTIONS = ['strength', 'mobility', 'rehab', 'cardio'] as const;
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const;
const LOCATION_OPTIONS = ['home', 'gym', 'both'] as const;
const EQUIPMENT_OPTIONS = [
  'none',
  'dumbbell',
  'barbell',
  'resistance_band',
  'machine',
  'cable',
  'kettlebell',
  'pull_up_bar',
  'bench',
] as const;

type Category = (typeof CATEGORY_OPTIONS)[number];
type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];
type Location = (typeof LOCATION_OPTIONS)[number];
type Equipment = (typeof EQUIPMENT_OPTIONS)[number];

type RouteParams = {
  AdminExerciseEditor: { exerciseId?: string; mode?: 'create' | 'edit' };
};

function normalizeEquipment(value: unknown): Equipment[] {
  if (!Array.isArray(value)) return ['none'];
  const set = new Set<Equipment>();
  for (const v of value) {
    if (typeof v === 'string' && (EQUIPMENT_OPTIONS as readonly string[]).includes(v)) {
      set.add(v as Equipment);
    }
  }
  return set.size > 0 ? Array.from(set) : ['none'];
}

export default function AdminExerciseEditorScreen({ navigation }: any) {
  const { colors, theme } = useThemeStore();
  const route = useRoute<RouteProp<RouteParams, 'AdminExerciseEditor'>>();
  const queryClient = useQueryClient();

  const exerciseId = route.params?.exerciseId;
  const isEdit = Boolean(exerciseId);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('strength');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [location, setLocation] = useState<Location>('both');
  const [equipment, setEquipment] = useState<Equipment[]>(['none']);
  const [description, setDescription] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [demoVideo, setDemoVideo] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'draft' | 'approved'>('draft');
  const [formError, setFormError] = useState<string | null>(null);

  const steps = useMemo(
    () =>
      stepsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    [stepsText]
  );

  const exerciseQuery = useQuery({
    queryKey: ['admin-exercise', exerciseId],
    queryFn: () => apiClient.adminGetExercise(exerciseId as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!exerciseQuery.data) return;
    const exercise = (exerciseQuery.data as any)?.exercise;
    if (!exercise) return;

    setName(String(exercise.name || ''));
    setCategory((exercise.category as Category) || 'strength');
    setDifficulty((exercise.difficulty as Difficulty) || 'beginner');
    setLocation((exercise.location as Location) || 'both');
    setEquipment(normalizeEquipment(exercise.equipment));
    setDescription(String(exercise.description || ''));
    setStepsText(Array.isArray(exercise.stepByStep) ? exercise.stepByStep.join('\n') : '');
    setThumbnailUrl(String(exercise.thumbnailUrl || ''));
    setDemoVideo(String(exercise?.videos?.demoVideo || ''));
    setReviewStatus((exercise.reviewStatus as any) || 'draft');
  }, [exerciseQuery.data]);

  const toggleEquipment = (value: Equipment) => {
    setEquipment((prev) => {
      if (value === 'none') return ['none'];
      const withoutNone = prev.filter((item) => item !== 'none');
      const exists = withoutNone.includes(value);
      const next = exists ? withoutNone.filter((item) => item !== value) : [...withoutNone, value];
      return next.length > 0 ? next : ['none'];
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: name.trim(),
        category,
        difficulty,
        location,
        equipment,
        description: description.trim(),
        stepByStep: steps,
        thumbnailUrl: thumbnailUrl.trim() || null,
        videos: demoVideo.trim() ? { demoVideo: demoVideo.trim() } : null,
      };

      if (isEdit) {
        payload.reviewStatus = reviewStatus;
        return apiClient.adminUpdateExercise(exerciseId as string, payload);
      }

      return apiClient.adminCreateExercise({
        ...payload,
        source: 'manual',
      });
    },
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-exercise'] });

      if (!isEdit) {
        const id = data?.exercise?.id as string | undefined;
        if (id) {
          navigation.replace('AdminExerciseEditor', { exerciseId: id, mode: 'edit' });
          Alert.alert('Created', 'Exercise created as draft.');
          return;
        }
      }

      Alert.alert('Saved', 'Exercise updated successfully.');
    },
    onError: (e: any) => {
      const message = e?.data?.error || e?.message || 'Failed to save exercise.';
      setFormError(message);
    },
  });

  const handleSave = () => {
    setFormError(null);

    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!description.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (steps.length === 0) {
      setFormError('Add at least one step.');
      return;
    }

    saveMutation.mutate();
  };

  if (isEdit && exerciseQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <ScreenHeader title="Edit Exercise" subtitle="Loading details" onBackPress={() => navigation.goBack()} />
        <LoadingView message="Loading exercise…" />
      </View>
    );
  }

  if (isEdit && exerciseQuery.error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <ScreenHeader title="Edit Exercise" subtitle="Admin view" onBackPress={() => navigation.goBack()} />
        <ErrorView message="Failed to load exercise." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScreenHeader
        title={isEdit ? 'Edit Exercise' : 'Add Exercise'}
        subtitle={isEdit ? String(exerciseId || '') : 'Create a new exercise'}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {formError ? (
          <View style={[styles.errorBanner, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}55` }]}> 
            <Text style={[typography.body3, { color: colors.error }]}>{formError}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[typography.label1, { color: colors.text }]}>Basics</Text>
          <View style={styles.fieldStack}>
            <TextInput label="Name" value={name} onChangeText={setName} isDark={theme === 'dark'} />
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              isDark={theme === 'dark'}
            />
            <TextInput
              label="Step-by-step (one per line)"
              value={stepsText}
              onChangeText={setStepsText}
              multiline
              numberOfLines={5}
              isDark={theme === 'dark'}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[typography.label1, { color: colors.text }]}>Classification</Text>

          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.md }]}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.85}
                onPress={() => setCategory(opt)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: category === opt ? `${colors.primary}18` : colors.background,
                    borderColor: category === opt ? `${colors.primary}55` : colors.border,
                  },
                ]}
              >
                <Text style={[typography.caption1, { color: category === opt ? colors.primary : colors.textSecondary }]}> 
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.md }]}>Difficulty</Text>
          <View style={styles.chipRow}>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.85}
                onPress={() => setDifficulty(opt)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: difficulty === opt ? `${colors.primary}18` : colors.background,
                    borderColor: difficulty === opt ? `${colors.primary}55` : colors.border,
                  },
                ]}
              >
                <Text style={[typography.caption1, { color: difficulty === opt ? colors.primary : colors.textSecondary }]}> 
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.md }]}>Location</Text>
          <View style={styles.chipRow}>
            {LOCATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.85}
                onPress={() => setLocation(opt)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: location === opt ? `${colors.primary}18` : colors.background,
                    borderColor: location === opt ? `${colors.primary}55` : colors.border,
                  },
                ]}
              >
                <Text style={[typography.caption1, { color: location === opt ? colors.primary : colors.textSecondary }]}> 
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[typography.label1, { color: colors.text }]}>Equipment</Text>
          <View style={styles.chipRow}>
            {EQUIPMENT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.85}
                onPress={() => toggleEquipment(opt)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: equipment.includes(opt) ? `${colors.primary}18` : colors.background,
                    borderColor: equipment.includes(opt) ? `${colors.primary}55` : colors.border,
                  },
                ]}
              >
                <Text style={[typography.caption1, { color: equipment.includes(opt) ? colors.primary : colors.textSecondary }]}> 
                  {opt.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[typography.label1, { color: colors.text }]}>Media</Text>
          <View style={styles.fieldStack}>
            <TextInput label="Thumbnail URL" value={thumbnailUrl} onChangeText={setThumbnailUrl} isDark={theme === 'dark'} />
            <TextInput label="Demo Video URL" value={demoVideo} onChangeText={setDemoVideo} isDark={theme === 'dark'} />
          </View>
        </View>

        {isEdit ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[typography.label1, { color: colors.text }]}>Review Status</Text>
            <View style={styles.chipRow}>
              {['draft', 'approved'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  activeOpacity={0.85}
                  onPress={() => setReviewStatus(opt as any)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: reviewStatus === opt ? `${colors.primary}18` : colors.background,
                      borderColor: reviewStatus === opt ? `${colors.primary}55` : colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.caption1, { color: reviewStatus === opt ? colors.primary : colors.textSecondary }]}> 
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={saveMutation.isPending}
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saveMutation.isPending ? 0.7 : 1 }]}
        >
          <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.textInverse} />
          <Text style={[typography.label1, { color: colors.textInverse }]}> 
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  fieldStack: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  saveBtn: {
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.md,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});
