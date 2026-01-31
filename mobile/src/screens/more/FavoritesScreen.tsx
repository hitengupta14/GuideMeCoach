import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
// import { useThemeStore } from '../../store/theme' from '../../store/auth';

export default function FavoritesScreen() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['favorites', user?.id],
    enabled: !!user?.id,
    queryFn: () => apiClient.listFavorites(user!.id),
  });

  const removeMutation = useMutation({
    mutationFn: (exerciseId: string) => apiClient.removeFavorite(user!.id, exerciseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', user?.id] }),
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
        <Text style={styles.error}>Failed to load favorites</Text>
      </View>
    );
  }

  const favorites = data || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorites</Text>
      <Text style={styles.subtitle}>{favorites.length} saved exercises</Text>
      {favorites.length === 0 ? (
        <View style={styles.center}> 
          <Text style={styles.meta}>No favorites yet.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name || item.exerciseId}</Text>
              <Text style={styles.meta}>{item.category || 'Exercise'} • {item.difficulty || ''}</Text>
              <TouchableOpacity
                style={styles.remove}
                onPress={() => Alert.alert('Remove', 'Remove from favorites?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(item.exerciseId) },
                ])}
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: {
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  meta: { fontSize: 13, color: '#666', marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#d00' },
  remove: { marginTop: 10, paddingVertical: 8, alignItems: 'center' },
  removeText: { color: '#d00', fontWeight: '700' },
});
