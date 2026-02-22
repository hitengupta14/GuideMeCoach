import React, { useState } from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { spacing, typography, borderRadius, shadows } from '../../theme/spacing';

export default function ProgressV2Screen() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const { colors } = useThemeStore();

  const { data: achievements, isLoading: loadingAch } = useQuery({ queryKey: ['engagement-achievements'], queryFn: () => apiClient.getAchievementsEngagement() });
  const { data: profile } = useQuery({ queryKey: ['profile-completion'], queryFn: () => apiClient.getProfileCompletion() });
  const { data: calendar, isLoading: loadingCal } = useQuery({ queryKey: ['engagement-calendar', month, year], queryFn: () => apiClient.getEngagementCalendar(month, year) });

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else { setMonth(month + 1); }
  };
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else { setMonth(month - 1); }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.heading1, { color: colors.text }]}>Progress</Text>
      <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Achievements, calendar, and profile completion.
      </Text>

      {loadingAch ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : achievements ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>Achievements</Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>Earned: {achievements.stats?.earned}/{achievements.stats?.total}</Text>
          <View style={{ marginTop: 8 }}>
            {(achievements.achievements || []).slice(0, 4).map((a: any) => (
              <Text key={a.id} style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>• {a.name} ({a.progress}%)</Text>
            ))}
          </View>
        </View>
      ) : null}

      {profile && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>Profile Completion</Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>{profile.completion?.percentage}% complete</Text>
          {(profile.completion?.steps || []).slice(0, 3).map((s: any) => (
            <Text key={s.id} style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>• {s.title} {s.completed ? '' : ''}</Text>
          ))}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.sm }]}>Calendar</Text>
        <View style={styles.rowBetween}>
          <Text style={[styles.link, { color: colors.primary }]} onPress={prevMonth}>Prev</Text>
          <Text style={[typography.body3, { color: colors.textSecondary }]}>
            {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={[styles.link, { color: colors.primary }]} onPress={nextMonth}>Next</Text>
        </View>
        {loadingCal ? (
          <View style={styles.center}><ActivityIndicator size="small" color={colors.primary} /></View>
        ) : calendar ? (
          <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Workouts this month: {calendar.totalWorkouts || 0}
          </Text>
        ) : null}
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
  center: { alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  link: { fontWeight: '700' },
});
