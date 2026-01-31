import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAIQuota } from '../../hooks/useAIQuota';
import UpgradeModal from '../../components/UpgradeModal';

export default function AiInsightsScreen() {
  const [weeks, setWeeks] = useState(4);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canAccessFeature } = useAIQuota();

  useEffect(() => {
    // Check access on mount
    if (!canAccessFeature('insights')) {
      setShowUpgradeModal(true);
    }
  }, [canAccessFeature]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['ai-insights', weeks],
    queryFn: () => apiClient.getAiInsights(weeks),
  });

  const { data: plateauData } = useQuery({
    queryKey: ['plateau', weeks],
    queryFn: () => apiClient.getPlateauAnalysis(weeks, 5),
  });

  const insights = (data as any)?.insights;
  const stats = (data as any)?.stats;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>AI Insights</Text>
      <Text style={styles.subtitle}>Weekly summaries and plateau detection.</Text>

      <View style={styles.row}>
        {[2, 4, 8, 12].map((w) => (
          <TouchableOpacity
            key={w}
            style={[styles.chip, weeks === w && styles.chipActive]}
            onPress={() => setWeeks(w)}
          >
            <Text style={[styles.chipText, weeks === w && styles.chipTextActive]}>Last {w}w</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.refresh} onPress={() => refetch()}>
          <Text style={styles.refreshText}>{isFetching ? 'Refreshing...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {(isLoading || isFetching) && (
        <View style={styles.center}> <ActivityIndicator size="large" color="#007AFF" /> </View>
      )}

      {error && <Text style={styles.error}>Failed to load insights</Text>}

      {stats && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Key Stats</Text>
          <Text style={styles.meta}>Workouts: {stats.totalWorkouts}</Text>
          <Text style={styles.meta}>Avg duration: {Math.round(stats.avgDuration || 0)} min</Text>
          <Text style={styles.meta}>Energy: {Math.round(stats.avgEnergyLevel || 0)}/10</Text>
          <Text style={styles.meta}>Exercises tracked: {stats.exercisesTracked}</Text>
        </View>
      )}

      {insights && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>AI Summary</Text>
          <Text style={styles.meta}>{typeof insights === 'string' ? insights : JSON.stringify(insights, null, 2)}</Text>
        </View>
      )}

      {plateauData?.plateaus?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Plateau Risks</Text>
          {plateauData.plateaus.map((p: any) => (
            <View key={p.exerciseName} style={styles.plateauItem}>
              <Text style={styles.cardTitle}>{p.exerciseName}</Text>
              <Text style={styles.meta}>Trend: {p.trend} • Streak: {p.streak}</Text>
              <Text style={styles.meta}>{p.recommendation}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        feature="insights"
        onClose={() => setShowUpgradeModal(false)}
      />
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
  meta: { fontSize: 13, color: '#444', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  plateauItem: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#eee' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#d00', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e5e7eb', marginRight: 8, marginBottom: 6 },
  chipActive: { backgroundColor: '#DBEAFE' },
  chipText: { color: '#111', fontWeight: '600' },
  chipTextActive: { color: '#1D4ED8' },
  refresh: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  refreshText: { color: '#111', fontWeight: '600' },
});
