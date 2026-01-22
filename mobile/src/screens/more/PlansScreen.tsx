import React from 'react';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export default function PlansScreen() {
  const { data, isLoading, error } = useQuery({ queryKey: ['plans'], queryFn: () => apiClient.getPlans() });
  const plans = (data as any)?.plans || data || [];

  if (isLoading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}><Text style={styles.error}>Failed to load plans</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Plans</Text>
      <Text style={styles.subtitle}>{plans.length} saved plans</Text>
      <FlatList
        data={plans}
        keyExtractor={(item: any) => item.id || item.name}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name || 'Plan'}</Text>
            <Text style={styles.meta}>{item.description || 'Custom plan'}</Text>
            <Text style={styles.meta}>Duration: {item.durationWeeks || item.duration || 0} weeks</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  meta: { fontSize: 13, color: '#444', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#d00' },
});
