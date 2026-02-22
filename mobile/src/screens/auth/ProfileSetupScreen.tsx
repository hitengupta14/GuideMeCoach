import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { useAuthStore } from '../../store/auth';
import ScreenHeader from '../../components/ScreenHeader';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { LoadingView } from '../../components/State';
import { apiClient } from '../../services/api';
import { spacing, typography, borderRadius, shadows } from '../../theme/spacing';

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const LOCATION_OPTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'gym', label: 'Gym' },
  { id: 'both', label: 'Both' },
];

const GOAL_OPTIONS = [
  { id: 'fat_loss', label: 'Fat loss' },
  { id: 'muscle_gain', label: 'Muscle gain' },
  { id: 'posture', label: 'Posture' },
  { id: 'rehab', label: 'Rehab' },
  { id: 'sports_performance', label: 'Sports performance' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'dumbbell', label: 'Dumbbells' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'resistance_band', label: 'Bands' },
  { id: 'machine', label: 'Machines' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'pull_up_bar', label: 'Pull-up bar' },
  { id: 'bench', label: 'Bench' },
];

function parseNumber(input: string): number | null {
  const value = Number(input);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseList(input: string): string[] {
  if (!input.trim()) return [];
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? `${colors.primary}18` : colors.surfaceSecondary,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? colors.primary : colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileSetupScreen() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [medicalConditions, setMedicalConditions] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] = useState<string | null>(null);
  const [timeAvailability, setTimeAvailability] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['profile-completion', token],
    enabled: Boolean(token),
    queryFn: () => apiClient.getProfileCompletion(),
  });

  const completion = data?.completion;

  useEffect(() => {
    if (!data?.user || initialized) return;
    const profile = data.user;
    setName(profile.name || user?.name || '');
    setAge(profile.age ? String(profile.age) : '');
    setHeight(profile.height ? String(profile.height) : '');
    setWeight(profile.weight ? String(profile.weight) : '');
    setGender(profile.gender || null);
    setExperienceLevel(profile.experienceLevel || null);
    setGoals(Array.isArray(profile.goals) ? profile.goals : []);
    setMedicalConditions(
      Array.isArray(profile.medicalConditions) ? profile.medicalConditions.join(', ') : ''
    );
    setEquipment(Array.isArray(profile.availableEquipment) ? profile.availableEquipment : []);
    setPreferredLocation(profile.preferredLocation || null);
    setTimeAvailability(profile.timeAvailability ? String(profile.timeAvailability) : '');
    setTargetWeight(profile.targetWeight ? String(profile.targetWeight) : '');
    const hasOptional =
      (Array.isArray(profile.availableEquipment) && profile.availableEquipment.length > 0) ||
      Boolean(profile.preferredLocation) ||
      Boolean(profile.timeAvailability) ||
      Boolean(profile.targetWeight) ||
      (Array.isArray(profile.medicalConditions) && profile.medicalConditions.length > 0);
    setShowOptional(hasOptional);
    setInitialized(true);
  }, [data, initialized, user?.name]);

  const toggleInList = (current: string[], value: string) => {
    if (current.includes(value)) {
      return current.filter((item) => item !== value);
    }
    return [...current, value];
  };

  const toggleEquipment = (current: string[], value: string) => {
    if (value === 'none') {
      return current.includes('none') ? [] : ['none'];
    }
    const next = toggleInList(current, value).filter((item) => item !== 'none');
    return next;
  };

  const validateBasics = () => {
    const missingLabels: string[] = [];
    if (!name.trim()) missingLabels.push('Name');
    if (!parseNumber(age)) missingLabels.push('Age');
    if (!parseNumber(height)) missingLabels.push('Height');
    if (!parseNumber(weight)) missingLabels.push('Weight');
    if (!gender) missingLabels.push('Gender');
    if (!experienceLevel) missingLabels.push('Experience level');

    if (missingLabels.length > 0) {
      Alert.alert(
        'Complete these fields',
        `To unlock the app, please add: ${missingLabels.join(', ')}.`
      );
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateBasics()) return;
    setStep(2);
  };

  const handleSave = async () => {
    if (!validateBasics()) {
      setStep(1);
      return;
    }
    if (!goals.length) {
      Alert.alert('Add your goals', 'Please select at least one fitness goal.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim() || null,
        age: parseNumber(age),
        height: parseNumber(height),
        weight: parseNumber(weight),
        gender: gender || null,
        experienceLevel: experienceLevel || null,
        goals: goals.length ? goals : [],
        medicalConditions: parseList(medicalConditions),
        availableEquipment: equipment.length ? equipment : [],
        preferredLocation: preferredLocation || null,
        timeAvailability: parseNumber(timeAvailability),
        targetWeight: parseNumber(targetWeight),
      };

      await apiClient.updateProfileCompletion(payload);
      await queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
      Alert.alert('Saved', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || isFetching) {
    return <LoadingView message="Preparing your profile…" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Complete Your Profile"
        subtitle="This helps personalize your plan and AI coaching."
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {completion ? (
          <View style={[styles.banner, { backgroundColor: `${colors.primary}12`, borderColor: colors.border }]}>
            <Text style={[typography.label1, { color: colors.text }]}>
              Profile completion: {completion.percentage}%
            </Text>
            <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Finish the required steps to unlock the app.
            </Text>
          </View>
        ) : null}

        <View style={styles.stepHeader}>
          <Text style={[typography.label1, { color: colors.text }]}>Step {step} of 2</Text>
          <View style={styles.stepDots}>
            {[1, 2].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  { backgroundColor: s === step ? colors.primary : colors.border },
                ]}
              />
            ))}
          </View>
        </View>

        {step === 1 ? (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>
              <TextInput label="Full name" value={name} onChangeText={setName} isDark={isDark} />
              <TextInput label="Age" value={age} onChangeText={setAge} keyboardType="numeric" isDark={isDark} />
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Gender</Text>
              <View style={styles.chipRow}>
                {GENDER_OPTIONS.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    selected={gender === option.id}
                    onPress={() => setGender(option.id)}
                  />
                ))}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Physical Stats</Text>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <TextInput label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" isDark={isDark} />
                </View>
                <View style={styles.flex}>
                  <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" isDark={isDark} />
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience</Text>
              <View style={styles.chipRow}>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    selected={experienceLevel === option.id}
                    onPress={() => setExperienceLevel(option.id)}
                  />
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>
              <View style={styles.chipRow}>
                {GOAL_OPTIONS.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    selected={goals.includes(option.id)}
                    onPress={() => setGoals((current) => toggleInList(current, option.id))}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowOptional((current) => !current)}
              activeOpacity={0.85}
              style={[styles.optionalToggle, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Text style={[typography.label1, { color: colors.text }]}>
                {showOptional ? 'Hide optional details' : 'Add optional details'}
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                Equipment, preferences, and medical info can be added later.
              </Text>
            </TouchableOpacity>

            {showOptional ? (
              <>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Equipment (optional)</Text>
                  <View style={styles.chipRow}>
                    {EQUIPMENT_OPTIONS.map((option) => (
                      <Chip
                        key={option.id}
                        label={option.label}
                        selected={equipment.includes(option.id)}
                        onPress={() => setEquipment((current) => toggleEquipment(current, option.id))}
                      />
                    ))}
                  </View>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences (optional)</Text>
                  <TextInput
                    label="Time available per session (minutes)"
                    value={timeAvailability}
                    onChangeText={setTimeAvailability}
                    keyboardType="numeric"
                    isDark={isDark}
                  />
                  <View style={styles.chipRow}>
                    {LOCATION_OPTIONS.map((option) => (
                      <Chip
                        key={option.id}
                        label={option.label}
                        selected={preferredLocation === option.id}
                        onPress={() => setPreferredLocation(option.id)}
                      />
                    ))}
                  </View>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Targets (optional)</Text>
                  <TextInput
                    label="Target weight (kg)"
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    keyboardType="numeric"
                    isDark={isDark}
                  />
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Medical Info (optional)</Text>
                  <TextInput
                    label="Medical conditions (comma separated)"
                    value={medicalConditions}
                    onChangeText={setMedicalConditions}
                    placeholder="e.g. none, knee pain"
                    multiline
                    numberOfLines={3}
                    isDark={isDark}
                  />
                </View>
              </>
            ) : null}
          </>
        )}

        <View style={styles.actionRow}>
          {step === 2 ? (
            <Button label="Back" onPress={() => setStep(1)} variant="outline" isDark={isDark} />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {step === 1 ? (
            <Button label="Next" onPress={handleNext} fullWidth={false} isDark={isDark} />
          ) : (
            <Button
              label={saving ? 'Saving…' : 'Save & Continue'}
              onPress={handleSave}
              loading={saving}
              fullWidth={false}
              isDark={isDark}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  banner: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.caption1,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    ...typography.caption1,
    fontWeight: '600',
  },
  optionalToggle: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
