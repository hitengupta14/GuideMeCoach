import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { ErrorView, LoadingView, EmptyView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

type AiMonitoringStats = {
  requests?: { total?: number; today?: number; last7Days?: number; last30Days?: number };
  success?: { successful?: number; failed?: number; rate?: number };
  costs?: { totalCents?: number; todayCents?: number; last7DaysCents?: number; last30DaysCents?: number };
  tokens?: { total?: number };
  performance?: { avgResponseTimeMs?: number };
  byFeature?: Array<{ feature?: string; count?: number; costCents?: number }>;
};

function toNumber(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function formatMoneyCents(value: unknown, currency: string = 'USD') {
  const cents = toNumber(value);
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatPercent(value: unknown) {
  const rate = toNumber(value);
  return `${rate.toFixed(1)}%`;
}

export default function AdminAiMonitoringScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const query = useQuery({
    queryKey: ['admin-ai-monitoring'],
    queryFn: () => apiClient.adminAiMonitoringStats(),
  });

  const stats: AiMonitoringStats = (query.data as any)?.data || (query.data as any) || {};

  const byFeature = useMemo(() => stats.byFeature || [], [stats.byFeature]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScreenHeader
        title="AI Monitoring"
        subtitle="Costs, success rate, and performance."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => query.refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh AI monitoring"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {query.isLoading ? (
        <LoadingView message="Loading AI monitoring…" />
      ) : query.error ? (
        <ErrorView message="Failed to load AI monitoring." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={Boolean(query.isFetching)} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Requests (Total)</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{toNumber(stats.requests?.total)}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>Today: {toNumber(stats.requests?.today)}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Requests (7d)</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{toNumber(stats.requests?.last7Days)}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>30d: {toNumber(stats.requests?.last30Days)}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Success Rate</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{formatPercent(stats.success?.rate)}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>Failed: {toNumber(stats.success?.failed)}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Avg Response</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{toNumber(stats.performance?.avgResponseTimeMs)} ms</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>Tokens: {toNumber(stats.tokens?.total)}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Cost (Total)</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{formatMoneyCents(stats.costs?.totalCents)}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>Today: {formatMoneyCents(stats.costs?.todayCents)}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Cost (7d / 30d)</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{formatMoneyCents(stats.costs?.last7DaysCents)}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>{formatMoneyCents(stats.costs?.last30DaysCents)}</Text>
            </View>
          </View>

          <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>By feature</Text>

          {byFeature.length === 0 ? (
            <EmptyView title="No feature usage" subtitle="No AI usage recorded yet." />
          ) : (
            byFeature.map((row, idx) => (
              <View
                key={`${row.feature || 'feature'}-${idx}`}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}> 
                  <MaterialCommunityIcons name="robot-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]}>{String(row.feature || 'Unknown')}</Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]}>Requests: {toNumber(row.count)}</Text>
                </View>
                <Text style={[typography.label2, { color: colors.text }]}>{formatMoneyCents(row.costCents)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  grid: {
    gap: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
