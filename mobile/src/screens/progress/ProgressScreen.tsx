import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../services/api";
import { useAuthStore } from "../../store/auth";
import { useThemeStore } from "../../store/theme";
import ScreenHeader from "../../components/ScreenHeader";

interface ProgressData {
  totalWorkouts: number;
  totalSetsCompleted: number;
  totalWeightLifted: number;
  streakDays: number;
  personalRecords: Array<{ exercise: string; weight: number; date: string }>;
  weeklyProgress: Array<{ day: string; workouts: number }>;
  stats?: {
    totalTimeTrainedMinutes?: number;
    avgWorkoutDurationMinutes?: number;
    favoriteExercise?: string | null;
    mostTrainedMuscle?: string | null;
    lastWorkoutAt?: string | null;
  };
}

function formatMinutes(input: unknown): string {
  const minutes = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m} mins`;
  if (m === 0) return `${h} hrs`;
  return `${h}h ${m}m`;
}

export default function ProgressScreen() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { colors } = useThemeStore();

  const { data: progressData, isLoading, error: progressError, refetch: refetchProgress } = useQuery({
    queryKey: ["progress", timeRange, token],
    enabled: !!token, // Only enable query when token is available
    queryFn: () => apiClient.request(`/analytics/progress?range=${timeRange}`),
  });

  const { data: badges, error: badgesError, refetch: refetchBadges } = useQuery({
    queryKey: ["badges", user?.id, token],
    enabled: !!user?.id && !!token, // Only enable query when both user and token are available
    queryFn: async () => {
      try {
        // First, check and award any new badges
        await apiClient.checkAndAwardBadges(user!.id);
        // Then fetch badge list with earned flags
        const res: any = await apiClient.getBadges(user!.id);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        console.error('Failed to fetch badges:', error);
        return [];
      }
    },
  });

  const progress = (progressData as any) || {
    totalWorkouts: 0,
    totalSetsCompleted: 0,
    totalWeightLifted: 0,
    streakDays: 0,
    personalRecords: [],
    weeklyProgress: [],
    stats: {},
  };

  const stats = progress?.stats || {};
  const avgDurationLabel =
    typeof stats.avgWorkoutDurationMinutes === 'number'
      ? `${Math.round(stats.avgWorkoutDurationMinutes)} mins`
      : '—';
  const mostTrainedMuscleLabel = stats.mostTrainedMuscle || '—';
  const favoriteExerciseLabel = stats.favoriteExercise || '—';
  const totalTimeLabel = formatMinutes(stats.totalTimeTrainedMinutes);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.textSecondary }}>
            Loading progress...
          </Text>
        </View>
      </View>
    );
  }

  if (progressError || !token) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Progress"
          rightAction={
            <TouchableOpacity
              onPress={() => {
                refetchProgress();
                refetchBadges();
              }}
              activeOpacity={0.8}
              style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
              accessibilityRole="button"
              accessibilityLabel="Refresh progress"
            >
              <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={{ marginTop: 10, color: colors.error, fontWeight: "bold" }}>
            Unable to load progress
          </Text>
          <Text
            style={{
              marginTop: 5,
              color: colors.textSecondary,
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            {!token
              ? "Please log in first"
              : "Network error - check your connection and try again"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Progress"
        rightAction={
          <TouchableOpacity
            onPress={() => {
              refetchProgress();
              refetchBadges();
            }}
            activeOpacity={0.8}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh progress"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* Time Range Selector */}
      <View
        style={[
          styles.timeRangeSelector,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {(["week", "month", "year"] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              {
                backgroundColor:
                  timeRange === range ? colors.primary : colors.surfaceSecondary,
              },
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text
              style={[
                styles.timeRangeText,
                { color: timeRange === range ? colors.textInverse : colors.textSecondary },
              ]}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <View style={[styles.metricIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{progress.totalWorkouts}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Workouts</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.metricIconContainer,
                { backgroundColor: `${colors.success}20` },
              ]}
            >
              <MaterialCommunityIcons name="fire" size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{progress.streakDays}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.metricIconContainer,
                { backgroundColor: `${colors.warning}20` },
              ]}
            >
              <MaterialCommunityIcons name="weight" size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {Math.round(progress.totalWeightLifted / 1000)}K
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Weight</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.metricIconContainer,
                { backgroundColor: `${colors.error}20` },
              ]}
            >
              <MaterialCommunityIcons name="repeat" size={24} color={colors.error} />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {progress.totalSetsCompleted}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Sets</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        {progress.weeklyProgress && progress.weeklyProgress.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Weekly Activity
            </Text>
            <View style={styles.weeklyChartContainer}>
              {progress.weeklyProgress.map((day: any, idx: number) => (
                <View key={idx} style={styles.dayBar}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.min(day.workouts * 20, 100)}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                  <Text style={[styles.dayLabel, { color: colors.textTertiary }]}>
                    {day.day.substring(0, 1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Personal Records */}
        {progress.personalRecords && progress.personalRecords.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="medal" size={20} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Personal Records
              </Text>
            </View>
            {progress.personalRecords.map((record: any, idx: number) => (
              <View key={idx} style={[styles.prCard, { borderBottomColor: colors.borderLight || colors.border }]}>
                <View>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{record.exercise}</Text>
                  <Text style={[styles.prDate, { color: colors.textTertiary }]}>
                    {new Date(record.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.prWeight, { color: colors.warning }]}>
                  {record.weight} lbs
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Achievements (Dynamic from API) */}
        {badges && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="trophy" size={20} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
            </View>
            <View style={styles.achievementsGrid}>
              {badges.map((badge: any) => (
                <View key={badge.id} style={styles.achievementItem}>
                  <View
                    style={[
                      styles.achievementIcon,
                      {
                        backgroundColor: badge.earned
                          ? `${colors.warning}20`
                          : colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={badge.earned ? "trophy" : "lock"}
                      size={24}
                      color={badge.earned ? colors.warning : colors.textTertiary}
                    />
                  </View>
                  <Text style={[styles.achievementLabel, { color: colors.textSecondary }]}>
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stats Summary */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
          <View style={[styles.statRow, { borderBottomColor: colors.borderLight || colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average Workout Duration</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{avgDurationLabel}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomColor: colors.borderLight || colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Most Trained Muscle</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{mostTrainedMuscleLabel}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomColor: colors.borderLight || colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favorite Exercise</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{favoriteExerciseLabel}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomColor: colors.borderLight || colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Time Trained</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalTimeLabel}</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timeRangeSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  weeklyChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 120,
  },
  dayBar: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "60%",
    borderRadius: 4,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  prCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
  },
  prDate: {
    fontSize: 12,
    marginTop: 2,
  },
  prWeight: {
    fontSize: 16,
    fontWeight: "700",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  achievementLabel: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
