import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { StatItem, ProgressBar, Badge } from '../../components/UI';
import { spacing, typography, shadows } from '../../theme/spacing';
import { lightColors, darkColors } from '../../theme/colors';
import { apiClient } from '../../services/api';

function formatMinutes(input: unknown): string {
  const minutes = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatCompactNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
}

export default function DashboardScreen() {
  const store = useAuthStore();
  const { theme } = useThemeStore();
  const navigation = useNavigation<any>();
  const user = store?.user || { name: 'User' };
  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const token = useAuthStore((s) => s.token);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboard-progress', token],
    enabled: !!token,
    queryFn: async () => apiClient.getProgress('week'),
  });

  const progress: any = data || {};
  const weekly = Array.isArray(progress.weeklyProgress) ? progress.weeklyProgress : [];
  const workoutsThisWeek = weekly.reduce((sum: number, d: any) => sum + (d?.workouts || 0), 0);
  const activeDaysThisWeek = weekly.filter((d: any) => (d?.workouts || 0) > 0).length;
  const totalTimeThisWeek = progress?.stats?.totalTimeTrainedMinutes;
  const avgDurationThisWeek = progress?.stats?.avgWorkoutDurationMinutes;
  const totalSets = Number(progress.totalSetsCompleted || 0) || 0;
  const totalVolume = Number(progress.totalWeightLifted || 0) || 0;
  const streakDays = Number(progress.streakDays || 0) || 0;
  const loading = isLoading || isFetching;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Home"
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
              onPress={() => navigation.navigate('Today')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Open Today"
            >
              <MaterialCommunityIcons name="calendar-today" size={22} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <MaterialCommunityIcons name="account-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={[typography.heading2, { color: colors.textInverse, marginBottom: spacing.xs }]}>
                Welcome back, {user?.name || 'User'}!
              </Text>
              <Text style={[typography.body3, { color: `${colors.textInverse}99` }]}>
                Let&apos;s crush your goals today
              </Text>
            </View>
          </View>
        </LinearGradient>

      {/* Quick Stats Row */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.lg }]}>
          Today's Overview
        </Text>

        <View style={styles.statsGrid}>
          <Card variant="elevated" isDark={isDark} style={styles.statCard}>
            <CardBody>
              <StatItem
                label="Workouts (7d)"
                value={loading ? '—' : workoutsThisWeek}
                icon="dumbbell"
                color={colors.primary}
                isDark={isDark}
              />
            </CardBody>
          </Card>

          <Card variant="elevated" isDark={isDark} style={styles.statCard}>
            <CardBody>
              <StatItem
                label="Training Time"
                value={loading ? '—' : formatMinutes(totalTimeThisWeek)}
                icon="clock-outline"
                color={colors.secondary}
                isDark={isDark}
              />
            </CardBody>
          </Card>
        </View>
      </View>

      {/* Main Stats Card */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <Card variant="elevated" isDark={isDark}>
          <CardHeader
            title="Weekly Activity"
            subtitle={
              loading
                ? 'Loading…'
                : `${activeDaysThisWeek} active days • ${workoutsThisWeek} workouts`
            }
            isDark={isDark}
          />
          <CardBody>
            <ProgressBar
              progress={(activeDaysThisWeek / 7) * 100}
              color={colors.success}
              isDark={isDark}
              showLabel={false}
            />
            <View style={[styles.daysRow, { marginTop: spacing.lg }]}>
              {(weekly.length ? weekly : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({ day: d, workouts: 0 }))).map(
                (day: any, idx: number) => {
                  const didWorkout = (day?.workouts || 0) > 0;
                  return (
                    <View
                      key={`${day?.day || idx}`}
                      style={[
                        styles.dayBadge,
                        { backgroundColor: didWorkout ? colors.success : colors.surfaceSecondary },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption1,
                          {
                            color: didWorkout ? colors.textInverse : colors.textSecondary,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {(day?.day || '').toString().charAt(0) || '—'}
                      </Text>
                    </View>
                  );
                }
              )}
            </View>
          </CardBody>
        </Card>
      </View>

      {/* Training Summary Card */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <Card variant="elevated" isDark={isDark}>
          <CardHeader
            title="Training Summary"
            action={
              loading ? <Badge label="Loading" variant="info" isDark={isDark} /> : <Badge label="Live" variant="success" isDark={isDark} />
            }
            isDark={isDark}
          />
          <CardBody>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Sets</Text>
                <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.xs }]}>
                  {loading ? '—' : totalSets}
                </Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Volume</Text>
                <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.xs }]}>
                  {loading ? '—' : `${formatCompactNumber(totalVolume)} kg·reps`}
                </Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Avg Workout</Text>
                <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.xs }]}>
                  {loading ? '—' : `${Math.round(Number(avgDurationThisWeek || 0)) || 0}m`}
                </Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Streak</Text>
                <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.xs }]}>
                  {loading ? '—' : `${streakDays}d`}
                </Text>
              </View>
            </View>
          </CardBody>
        </Card>
      </View>

      {/* Action Cards */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg, marginBottom: spacing['3xl'] }]}>
        <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.lg }]}>
          Quick Actions
        </Text>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => navigation.navigate('Workouts')}
          >
            <MaterialCommunityIcons name="play-circle" size={32} color={colors.primary} />
            <Text style={[typography.label2, { color: colors.text, marginTop: spacing.md }]}>
              Start Workout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => navigation.navigate('Progress')}
          >
            <MaterialCommunityIcons name="chart-line" size={32} color={colors.success} />
            <Text style={[typography.label2, { color: colors.text, marginTop: spacing.md }]}>
              View Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => navigation.navigate('More', { screen: 'Nutrition' })}
          >
            <MaterialCommunityIcons name="apple" size={32} color={colors.warning} />
            <Text style={[typography.label2, { color: colors.text, marginTop: spacing.md }]}>
              Log Nutrition
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => navigation.navigate('More', { screen: 'Planner' })}
          >
            <MaterialCommunityIcons name="robot" size={32} color={colors.secondary} />
            <Text style={[typography.label2, { color: colors.text, marginTop: spacing.md }]}>
              AI Planner
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerGradient: {
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  section: {
    paddingVertical: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dayBadge: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.lg,
    borderRadius: 12,
  },
});
