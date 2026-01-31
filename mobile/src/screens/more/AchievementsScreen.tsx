import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
// import { useThemeStore } from '../../store/theme'

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const token = useAuthStore((s) => s.token);

  const { data, isLoading, error } = useQuery({
    queryKey: ['badges', user?.id, token],
    enabled: !!user?.id && !!token,
    queryFn: async () => {
      try {
        await apiClient.checkAndAwardBadges(user!.id);
        return apiClient.getBadges(user!.id);
      } catch (err) {
        console.error('Failed to fetch badges:', err);
        throw err;
      }
    },
  });

  if (!user) {
    return (
      <View style={styles.center}> 
        <Text style={styles.error}>Login required.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Failed to load achievements</Text>
      </View>
    );
  }

  const badges = (data as any) || [];
  const earned = badges.filter((b: any) => b.earned);
  const locked = badges.filter((b: any) => !b.earned);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Achievements</Text>
      <Text style={styles.subtitle}>{earned.length}/{badges.length} unlocked</Text>
      <FlatList
        data={badges}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.earned && styles.locked]}>
            <Text style={styles.icon}>{item.icon || '🏅'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.meta}>{item.description}</Text>
              <Text style={styles.metaSmall}>{item.criteria?.type} • {item.criteria?.value}</Text>
            </View>
            <Text style={[styles.badgeState, item.earned ? styles.badgeEarned : styles.badgeLocked]}>
              {item.earned ? 'Unlocked' : 'Locked'}
            </Text>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locked: { opacity: 0.6 },
  icon: { fontSize: 28, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  meta: { fontSize: 13, color: '#666', marginTop: 2 },
  metaSmall: { fontSize: 11, color: '#999', marginTop: 2 },
  badgeState: { fontSize: 12, fontWeight: '700' },
  badgeEarned: { color: '#16a34a' },
  badgeLocked: { color: '#ef4444' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#d00' },
});
