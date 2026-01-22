import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export default function ProgressV2Screen() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Progress V2</Text>
      <Text style={styles.subtitle}>Achievements, calendar, and profile completion.</Text>

      {loadingAch ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
      ) : achievements ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.meta}>Earned: {achievements.stats?.earned}/{achievements.stats?.total}</Text>
          <View style={{ marginTop: 8 }}>
            {(achievements.achievements || []).slice(0, 4).map((a: any) => (
              <Text key={a.id} style={styles.meta}>• {a.name} ({a.progress}%)</Text>
            ))}
          </View>
        </View>
      ) : null}

      {profile && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Completion</Text>
          <Text style={styles.meta}>{profile.completion?.percentage}% complete</Text>
          {(profile.completion?.steps || []).slice(0, 3).map((s: any) => (
            <Text key={s.id} style={styles.meta}>• {s.title} {s.completed ? '✓' : ''}</Text>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Calendar</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.link} onPress={prevMonth}>Prev</Text>
          <Text style={styles.meta}>{new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          <Text style={styles.link} onPress={nextMonth}>Next</Text>
        </View>
        {loadingCal ? (
          <View style={styles.center}><ActivityIndicator size="small" color="#007AFF" /></View>
        ) : calendar ? (
          <Text style={[styles.meta, { marginTop: 6 }]}>Workouts this month: {calendar.totalWorkouts || 0}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  meta: { fontSize: 13, color: '#444', marginTop: 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  link: { color: '#1D4ED8', fontWeight: '700' },
});
