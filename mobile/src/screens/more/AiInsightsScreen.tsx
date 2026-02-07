import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAIQuota } from '../../hooks/useAIQuota';
import UpgradeModal from '../../components/UpgradeModal';
import { useThemeStore } from '../../store/theme';
import { spacing, typography, borderRadius, shadows } from '../../theme/spacing';

export default function AiInsightsScreen() {
  const [weeks, setWeeks] = useState(4);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canAccessFeature } = useAIQuota();
  const { colors } = useThemeStore();

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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.heading1, { color: colors.text }]}>AI Insights</Text>
      <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Weekly summaries and plateau detection.
      </Text>

      <View style={styles.row}>
        {[2, 4, 8, 12].map((w) => (
          <TouchableOpacity
            key={w}
            style={[
              styles.chip,
              { backgroundColor: colors.surfaceSecondary },
              weeks === w && { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}55` },
            ]}
            onPress={() => setWeeks(w)}
          >
            <Text
              style={[
                typography.label2,
                { color: colors.text, fontWeight: '700' },
                weeks === w && { color: colors.primary },
              ]}
            >
              Last {w}w
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.refresh, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => refetch()}
          activeOpacity={0.8}
        >
          <Text style={[typography.label2, { color: colors.text }]}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {(isLoading || isFetching) && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && (
        <Text style={[typography.body3, { color: colors.error, marginBottom: spacing.md }]}>
          Failed to load insights
        </Text>
      )}

      {stats && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>
            Key Stats
          </Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>Workouts: {stats.totalWorkouts}</Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>Avg duration: {Math.round(stats.avgDuration || 0)} min</Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>Energy: {Math.round(stats.avgEnergyLevel || 0)}/10</Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>Exercises tracked: {stats.exercisesTracked}</Text>
        </View>
      )}

      {insights && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>
            AI Summary
          </Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>
            {typeof insights === 'string' ? insights : JSON.stringify(insights, null, 2)}
          </Text>
        </View>
      )}

      {plateauData?.plateaus?.length ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>
            Plateau Risks
          </Text>
          {plateauData.plateaus.map((p: any) => (
            <View key={p.exerciseName} style={[styles.plateauItem, { borderTopColor: colors.border }]}>
              <Text style={[typography.label1, { color: colors.text }]}>{p.exerciseName}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                Trend: {p.trend} • Streak: {p.streak}
              </Text>
              <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {p.recommendation}
              </Text>
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
  container: { flex: 1, padding: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  refresh: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1 },
  plateauItem: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1 },
});
