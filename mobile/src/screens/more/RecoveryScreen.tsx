import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export default function RecoveryScreen() {
  const qc = useQueryClient();
  const [soreness, setSoreness] = useState({ chest: 3, back: 2, legs: 4, shoulders: 2 });
  const [notes, setNotes] = useState('');
  const [warmupFocus, setWarmupFocus] = useState('upper_body');
  const [warmupType, setWarmupType] = useState<'warmup' | 'cooldown'>('warmup');

  const { data: scoreData, isLoading } = useQuery({ queryKey: ['recovery-score'], queryFn: () => apiClient.getRecoveryScore() });
  const { data: restData } = useQuery({ queryKey: ['rest-days'], queryFn: () => apiClient.getRestDays() });

  const warmupMutation = useMutation({
    mutationFn: () => apiClient.generateWarmup({ workoutFocus: warmupFocus, type: warmupType, duration: 10 }),
  });

  const sorenessMutation = useMutation({
    mutationFn: () => apiClient.submitSoreness(soreness as any, notes || undefined),
    onSuccess: () => {
      Alert.alert('Saved', 'Soreness recorded');
      qc.invalidateQueries(['recovery-score']);
    },
  });

  const renderFactor = (label: string, value?: any) => (
    <View style={styles.factor}>
      <Text style={styles.factorLabel}>{label}</Text>
      <Text style={styles.meta}>{value ?? '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Recovery</Text>
      <Text style={styles.subtitle}>Rest, soreness, and warm-up guidance.</Text>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
      ) : scoreData ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recovery Score</Text>
          <Text style={styles.score}>{scoreData.recoveryScore}/100</Text>
          <Text style={styles.meta}>Status: {scoreData.status}</Text>
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
                <Text key={idx} style={styles.meta}>• {r}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {restData && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rest Day Advice</Text>
          <Text style={styles.meta}>Days needed: {restData.restDaysRecommendation?.daysNeeded}</Text>
          {(restData.restDaysRecommendation?.recommendations || []).map((r: string, idx: number) => (
            <Text key={idx} style={styles.meta}>• {r}</Text>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Soreness Check-in</Text>
        {Object.keys(soreness).map((k) => (
          <View key={k} style={styles.sorenessRow}>
            <Text style={styles.metaLabel}>{k}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String((soreness as any)[k])}
              onChangeText={(v) => setSoreness({ ...soreness, [k]: Number(v) || 0 })}
            />
          </View>
        ))}
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          placeholder="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.button} onPress={() => sorenessMutation.mutate()}>
          <Text style={styles.buttonText}>{sorenessMutation.isLoading ? 'Saving...' : 'Save soreness'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Warm-up / Cool-down</Text>
        <View style={styles.rowWrap}>
          {['upper_body', 'lower_body', 'full_body', 'push', 'pull'].map((focus) => (
            <TouchableOpacity
              key={focus}
              style={[styles.chip, warmupFocus === focus && styles.chipActive]}
              onPress={() => setWarmupFocus(focus)}
            >
              <Text style={[styles.chipText, warmupFocus === focus && styles.chipTextActive]}>{focus.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {['warmup', 'cooldown'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, warmupType === t && styles.chipActive]}
              onPress={() => setWarmupType(t as any)}
            >
              <Text style={[styles.chipText, warmupType === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={() => warmupMutation.mutate()}>
          <Text style={styles.buttonText}>{warmupMutation.isLoading ? 'Generating...' : 'Generate routine'}</Text>
        </TouchableOpacity>
        {warmupMutation.data && (
          <View style={{ marginTop: 8 }}>
            {(warmupMutation.data.routine || []).map((r: any, idx: number) => (
              <Text key={idx} style={styles.meta}>• {r.name}: {r.reps || r.duration}</Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  meta: { fontSize: 13, color: '#444', marginTop: 2 },
  score: { fontSize: 32, fontWeight: '800', color: '#111' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  factor: { width: '48%', marginTop: 8 },
  factorLabel: { fontWeight: '700', color: '#111' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e5e7eb', marginRight: 8, marginTop: 6 },
  chipActive: { backgroundColor: '#DBEAFE' },
  chipText: { color: '#111', fontWeight: '600' },
  chipTextActive: { color: '#1D4ED8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#d00' },
  sorenessRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaLabel: { width: 90, color: '#444', fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, backgroundColor: '#fff', marginLeft: 8 },
});
