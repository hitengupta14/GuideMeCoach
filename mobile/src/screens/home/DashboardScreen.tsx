import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { StatItem, ProgressBar, Badge } from '../../components/UI';
import { spacing, typography, shadows } from '../../theme/spacing';
import { lightColors, darkColors } from '../../theme/colors';

export default function DashboardScreen() {
  const store = useAuthStore();
  const { theme } = useThemeStore();
  const navigation = useNavigation<any>();
  const user = store?.user || { name: 'User' };
  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Mock data
  const stats = {
    workoutToday: 45,
    caloriesBurned: 450,
    caloriesGoal: 2000,
    weekProgress: 4,
    weekGoal: 7,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
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
              Welcome back, {user?.name || 'User'}! 👋
            </Text>
            <Text style={[typography.body3, { color: `${colors.textInverse}99` }]}>
              Let's crush your goals today
            </Text>
          </View>
          <TouchableOpacity style={[styles.profileButton, { backgroundColor: `${colors.textInverse}15` }]}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.textInverse} />
          </TouchableOpacity>
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
                label="Workout"
                value={`${stats.workoutToday} min`}
                icon="dumbbell"
                color={colors.primary}
                isDark={isDark}
              />
            </CardBody>
          </Card>

          <Card variant="elevated" isDark={isDark} style={styles.statCard}>
            <CardBody>
              <StatItem
                label="Calories"
                value={stats.caloriesBurned}
                icon="fire"
                color={colors.secondary}
                trend={{ value: 12, isPositive: true }}
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
            title="Weekly Progress"
            subtitle={`${stats.weekProgress} of ${stats.weekGoal} workouts completed`}
            isDark={isDark}
          />
          <CardBody>
            <ProgressBar
              progress={(stats.weekProgress / stats.weekGoal) * 100}
              color={colors.success}
              isDark={isDark}
              showLabel={false}
            />
            <View style={[styles.daysRow, { marginTop: spacing.lg }]}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <View
                  key={day}
                  style={[
                    styles.dayBadge,
                    {
                      backgroundColor: idx < stats.weekProgress ? colors.success : colors.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption1,
                      {
                        color: idx < stats.weekProgress ? colors.textInverse : colors.textSecondary,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {day.charAt(0)}
                  </Text>
                </View>
              ))}
            </View>
          </CardBody>
        </Card>
      </View>

      {/* Calories Card */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <Card variant="elevated" isDark={isDark}>
          <CardHeader
            title="Calorie Intake"
            action={
              <Badge label="On Track" variant="success" isDark={isDark} />
            }
            isDark={isDark}
          />
          <CardBody>
            <View style={styles.calorieContent}>
              <View style={styles.calorieCircle}>
                <Text style={[typography.display2, { color: colors.primary }]}>
                  {Math.round((stats.caloriesBurned / stats.caloriesGoal) * 100)}%
                </Text>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                  Complete
                </Text>
              </View>
              <View style={styles.calorieDetails}>
                <View style={styles.calorieRow}>
                  <View
                    style={[styles.colorDot, { backgroundColor: colors.primary }]}
                  />
                  <Text style={[typography.body3, { color: colors.text }]}>
                    Burned: <Text style={{ fontWeight: '700' }}>{stats.caloriesBurned} kcal</Text>
                  </Text>
                </View>
                <View style={[styles.calorieRow, { marginTop: spacing.md }]}>
                  <View
                    style={[styles.colorDot, { backgroundColor: colors.secondary }]}
                  />
                  <Text style={[typography.body3, { color: colors.text }]}>
                    Remaining: <Text style={{ fontWeight: '700' }}>{stats.caloriesGoal - stats.caloriesBurned} kcal</Text>
                  </Text>
                </View>
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
            onPress={() => navigation.navigate('Nutrition')}
          >
            <MaterialCommunityIcons name="apple" size={32} color={colors.warning} />
            <Text style={[typography.label2, { color: colors.text, marginTop: spacing.md }]}>
              Log Nutrition
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => Alert.alert('Goals', 'Your fitness goals')}
          >
            <MaterialCommunityIcons name="heart-outline" size={32} color={colors.error} />
            <Text style={[typography.label2, { color: colors.text, marginTop: spacing.md }]}>
              View Goals
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  calorieContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  calorieCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  calorieDetails: {
    flex: 1,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
});
