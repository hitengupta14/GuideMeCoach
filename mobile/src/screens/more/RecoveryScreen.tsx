import React, { useState } from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { spacing, typography, borderRadius, shadows } from '../../theme/spacing';

export default function RecoveryScreen() {
  const qc = useQueryClient();
  const [soreness, setSoreness] = useState({ chest: 3, back: 2, legs: 4, shoulders: 2 });
  const [notes, setNotes] = useState('');
  const [warmupFocus, setWarmupFocus] = useState('upper_body');
  const [warmupType, setWarmupType] = useState<'warmup' | 'cooldown'>('warmup');
  const { colors } = useThemeStore();

  const { data: scoreData, isLoading } = useQuery({ queryKey: ['recovery-score'], queryFn: () => apiClient.getRecoveryScore() });
  const { data: restData } = useQuery({ queryKey: ['rest-days'], queryFn: () => apiClient.getRestDays() });

  const warmupMutation = useMutation({
    mutationFn: () => apiClient.generateWarmup({ workoutFocus: warmupFocus, type: warmupType, duration: 10 }),
  });

  const sorenessMutation = useMutation({
    mutationFn: () => apiClient.submitSoreness(soreness as any, notes || undefined),
    onSuccess: () => {
      Alert.alert('Saved', 'Soreness recorded');
      qc.invalidateQueries({ queryKey: ['recovery-score'] });
    },
  });

  const renderFactor = (label: string, value?: any) => (
    <View style={styles.factor}>
      <Text style={[typography.label2, { color: colors.text }]}>{label}</Text>
      <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        {value ?? '—'}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.heading1, { color: colors.text }]}>Recovery</Text>
      <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Rest, soreness, and warm-up guidance.
      </Text>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : scoreData ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>Recovery Score</Text>
          <Text style={[styles.score, { color: colors.text }]}>{scoreData.recoveryScore}/100</Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>Status: {scoreData.status}</Text>
          {scoreData.summary && (
            <View style={styles.rowWrap}>
              {renderFactor('Workouts (7d)', scoreData.summary.workoutsThisWeek)}
              {renderFactor('Rest Days', scoreData.summary.restDaysThisWeek)}
              {renderFactor('Avg Duration', `${scoreData.summary.avgSessionDuration} min`)}
              {renderFactor('Avg RPE', scoreData.summary.averageRPE)}
            </View>
          )}
          {scoreData.recommendations?.length ? (
            <View style={{ marginTop: 8 }}>
              {scoreData.recommendations.map((r: string, idx: number) => (
                <Text key={idx} style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>• {r}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {restData && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>Rest Day Advice</Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>Days needed: {restData.restDaysRecommendation?.daysNeeded}</Text>
          {(restData.restDaysRecommendation?.recommendations || []).map((r: string, idx: number) => (
            <Text key={idx} style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>• {r}</Text>
          ))}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>Soreness Check-in</Text>
        {Object.keys(soreness).map((k) => (
          <View key={k} style={styles.sorenessRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{k}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary, color: colors.text }]}
              keyboardType="numeric"
              value={String((soreness as any)[k])}
              onChangeText={(v) => setSoreness({ ...soreness, [k]: Number(v) || 0 })}
            />
          </View>
        ))}
        <TextInput
          style={[
            styles.input,
            { marginTop: 8, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, color: colors.text },
          ]}
          placeholder="Notes (optional)"
          placeholderTextColor={colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => sorenessMutation.mutate()}>
          <Text style={styles.buttonText}>{sorenessMutation.isPending ? 'Saving…' : 'Save soreness'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>Warm-up / Cool-down</Text>
        <View style={styles.rowWrap}>
          {['upper_body', 'lower_body', 'full_body', 'push', 'pull'].map((focus) => (
            <TouchableOpacity
              key={focus}
              style={[
                styles.chip,
                { backgroundColor: colors.surfaceSecondary },
                warmupFocus === focus && { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}55` },
              ]}
              onPress={() => setWarmupFocus(focus)}
            >
              <Text style={[styles.chipText, { color: warmupFocus === focus ? colors.primary : colors.text }]}>
                {focus.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {['warmup', 'cooldown'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.chip,
                { backgroundColor: colors.surfaceSecondary },
                warmupType === t && { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}55` },
              ]}
              onPress={() => setWarmupType(t as any)}
            >
              <Text style={[styles.chipText, { color: warmupType === t ? colors.primary : colors.text }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => warmupMutation.mutate()}>
          <Text style={styles.buttonText}>{warmupMutation.isPending ? 'Generating…' : 'Generate routine'}</Text>
        </TouchableOpacity>
        {warmupMutation.data && (
          <View style={{ marginTop: 8 }}>
            {(warmupMutation.data.routine || []).map((r: any, idx: number) => (
              <Text key={idx} style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                • {r.name}: {r.reps || r.duration}
              </Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  score: { fontSize: 32, fontWeight: '800' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  factor: { width: '48%', marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 999, marginTop: 6, borderWidth: 1, borderColor: 'transparent' },
  chipText: { fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
  sorenessRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaLabel: { width: 90, fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, marginLeft: 8 },
});
