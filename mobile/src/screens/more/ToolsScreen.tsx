import React, { useState } from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

function bmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return 0;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function tdee(weightKg: number, heightCm: number, age: number, sex: 'm' | 'f', activity: number) {
  if (!weightKg || !heightCm || !age) return 0;
  const bmr = sex === 'm' ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5 : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return Math.round(bmr * activity);
}

function oneRm(weight: number, reps: number) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

export default function ToolsScreen() {
  const { colors } = useThemeStore();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [activity, setActivity] = useState('1.55');
  const [liftWeight, setLiftWeight] = useState('');
  const [liftReps, setLiftReps] = useState('');

  const bmiVal = bmi(Number(weight), Number(height));
  const tdeeVal = tdee(Number(weight), Number(height), Number(age), sex, Number(activity));
  const oneRmVal = oneRm(Number(liftWeight), Number(liftReps));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Tools</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Quick fitness calculators.</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>BMI</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Weight (kg)"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Height (cm)"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
        <Text style={[styles.result, { color: colors.text }]}>BMI: {bmiVal ? bmiVal.toFixed(1) : '—'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>TDEE</Text>
        <View style={styles.row}>
          {['m', 'f'].map((s) => (
            <Text
              key={s}
              style={[
                styles.chip,
                { backgroundColor: colors.backgroundTertiary, color: colors.text, borderColor: colors.border },
                sex === s && [styles.chipActive, { backgroundColor: `${colors.primary}18`, color: colors.primary, borderColor: `${colors.primary}55` }],
              ]}
              onPress={() => setSex(s as any)}
            >
              {s === 'm' ? 'Male' : 'Female'}
            </Text>
          ))}
        </View>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Age"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Weight (kg)"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Height (cm)"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Activity (1.2 sedentary - 1.9 very active)"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={activity}
          onChangeText={setActivity}
        />
        <Text style={[styles.result, { color: colors.text }]}>TDEE: {tdeeVal ? `${tdeeVal} kcal` : '—'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>1RM (Epley)</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Weight lifted"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={liftWeight}
          onChangeText={setLiftWeight}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Reps"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={liftReps}
          onChangeText={setLiftReps}
        />
        <Text style={[styles.result, { color: colors.text }]}>Estimated 1RM: {oneRmVal ? `${oneRmVal} units` : '—'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  title: { ...typography.heading1, marginBottom: spacing.xs },
  subtitle: { ...typography.body3, marginBottom: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.md,
  },
  sectionTitle: { ...typography.heading3, marginBottom: spacing.md },
  input: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...typography.body2 },
  result: { ...typography.heading3 },
  row: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    fontWeight: '700',
    borderWidth: 1,
    overflow: 'hidden',
  },
  chipActive: {},
});
