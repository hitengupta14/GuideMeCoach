import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';

interface ProgressData {
  totalWorkouts: number;
  totalSetsCompleted: number;
  totalWeightLifted: number;
  streakDays: number;
  personalRecords: Array<{ exercise: string; weight: number; date: string }>;
  weeklyProgress: Array<{ day: string; workouts: number }>;
}

export default function ProgressScreen() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['progress', timeRange],
    queryFn: () =>
      apiClient.request(`/analytics/progress?range=${timeRange}`),
  });

  const user = useAuthStore((s) => s.user);
  const { data: badges } = useQuery({
    queryKey: ['badges', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // First, check and award any new badges
      await apiClient.checkAndAwardBadges(user!.id);
      // Then fetch badge list with earned flags
      const res: any = await apiClient.getBadges(user!.id);
      return Array.isArray(res) ? res : [];
    },
  });

  const progress = (progressData as any) || {
    totalWorkouts: 0,
    totalSetsCompleted: 0,
    totalWeightLifted: 0,
    streakDays: 0,
    personalRecords: [],
    weeklyProgress: [],
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="chart-line" size={28} color="#007AFF" />
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        {(['week', 'month', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive,
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive,
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
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#007AFF" />
            </View>
            <Text style={styles.metricValue}>{progress.totalWorkouts}</Text>
            <Text style={styles.metricLabel}>Workouts</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#34C75920' }]}>
              <MaterialCommunityIcons name="fire" size={24} color="#34C759" />
            </View>
            <Text style={styles.metricValue}>{progress.streakDays}</Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FF950020' }]}>
              <MaterialCommunityIcons name="weight" size={24} color="#FF9500" />
            </View>
            <Text style={styles.metricValue}>{Math.round(progress.totalWeightLifted / 1000)}K</Text>
            <Text style={styles.metricLabel}>Total Weight</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FF3B3020' }]}>
              <MaterialCommunityIcons name="repeat" size={24} color="#FF3B30" />
            </View>
            <Text style={styles.metricValue}>{progress.totalSetsCompleted}</Text>
            <Text style={styles.metricLabel}>Sets</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        {progress.weeklyProgress && progress.weeklyProgress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Activity</Text>
            <View style={styles.weeklyChartContainer}>
              {progress.weeklyProgress.map((day: any, idx: number) => (
                <View key={idx} style={styles.dayBar}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.min(day.workouts * 20, 100)}%`,
                      },
                    ]}
                  />
                  <Text style={styles.dayLabel}>{day.day.substring(0, 1)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Personal Records */}
        {progress.personalRecords && progress.personalRecords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="medal" size={20} color="#FFB800" />
              <Text style={styles.sectionTitle}>Personal Records</Text>
            </View>
            {progress.personalRecords.map((record: any, idx: number) => (
              <View key={idx} style={styles.prCard}>
                <View>
                  <Text style={styles.exerciseName}>{record.exercise}</Text>
                  <Text style={styles.prDate}>
                    {new Date(record.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.prWeight}>{record.weight} lbs</Text>
              </View>
            ))}
          </View>
        )}

        {/* Achievements (Dynamic from API) */}
        {badges && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="trophy" size={20} color="#FFB800" />
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>
            <View style={styles.achievementsGrid}>
              {badges.map((badge: any) => (
                <View key={badge.id} style={styles.achievementItem}>
                  <View
                    style={[
                      styles.achievementIcon,
                      !badge.earned && styles.achievementIconLocked,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={badge.earned ? 'trophy' : 'lock'}
                      size={24}
                      color={badge.earned ? '#FFB800' : '#ccc'}
                    />
                  </View>
                  <Text style={styles.achievementLabel}>{badge.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stats Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Average Workout Duration</Text>
            <Text style={styles.statValue}>45 mins</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Most Trained Muscle</Text>
            <Text style={styles.statValue}>Chest</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Favorite Exercise</Text>
            <Text style={styles.statValue}>Bench Press</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Time Trained</Text>
            <Text style={styles.statValue}>120 hours</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  weeklyChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
  },
  dayBar: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '60%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  prCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  prDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  prWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFB80020',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIconLocked: {
    backgroundColor: '#f0f0f0',
  },
  achievementLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
