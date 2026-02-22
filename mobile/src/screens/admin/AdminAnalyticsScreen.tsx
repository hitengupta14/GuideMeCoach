import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

function sum(nums: any[]): number {
  return (Array.isArray(nums) ? nums : []).reduce((acc, n) => acc + (Number(n) || 0), 0);
}

function last(nums: any[]): number {
  const arr = Array.isArray(nums) ? nums : [];
  return arr.length ? Number(arr[arr.length - 1]) || 0 : 0;
}

export default function AdminAnalyticsScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const aiReq = useQuery({ queryKey: ['admin-analytics-ai'], queryFn: () => apiClient.adminAnalyticsAiRequests() });
  const workouts = useQuery({ queryKey: ['admin-analytics-workouts'], queryFn: () => apiClient.adminAnalyticsWorkouts() });
  const growth = useQuery({ queryKey: ['admin-analytics-growth'], queryFn: () => apiClient.adminAnalyticsUserGrowth() });

  const loading = aiReq.isLoading || workouts.isLoading || growth.isLoading;
  const error = aiReq.error || workouts.error || growth.error;

  const derived = useMemo(() => {
    const aiCounts = (aiReq.data as any)?.counts || [];
    const workoutCounts = (workouts.data as any)?.counts || [];
    const newUsers = (growth.data as any)?.totalUsers || [];
    const activeUsers = (growth.data as any)?.activeUsers || [];

    return {
      aiTotal30d: sum(aiCounts),
      aiLastDay: last(aiCounts),
      workoutsTotal7d: sum(workoutCounts),
      workoutsLastDay: last(workoutCounts),
      newUsersTotal30d: sum(newUsers),
      activeUsersLastDay: last(activeUsers),
    };
  }, [aiReq.data, workouts.data, growth.data]);

  const refetchAll = async () => {
    await Promise.all([aiReq.refetch(), workouts.refetch(), growth.refetch()]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Analytics"
        subtitle="High-level product metrics."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetchAll()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh analytics"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <LoadingView message="Loading analytics…" />
      ) : error ? (
        <ErrorView message="Failed to load analytics." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={aiReq.isFetching || workouts.isFetching || growth.isFetching} onRefresh={refetchAll} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>AI Requests (30d)</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{derived.aiTotal30d}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>Last day: {derived.aiLastDay}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Workouts (7d)</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{derived.workoutsTotal7d}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>Last day: {derived.workoutsLastDay}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>New Users (30d)</Text>
              <Text style={[typography.heading2, { color: colors.text }]}>{derived.newUsersTotal30d}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>Active (last day): {derived.activeUsersLastDay}</Text>
            </View>
          </View>

          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Note: user-growth data is computed as daily counts (not cumulative totals).
          </Text>
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
});

