import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function FavoritesScreen({ navigation }: any) {
  const { colors } = useThemeStore();
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.error }]}>Login required.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.error }]}>Failed to load favorites</Text>
      </View>
    );
  }

  const favorites = data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{favorites.length} saved exercises</Text>
      {favorites.length === 0 ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>No favorites yet.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Exercises', {
                  screen: 'ExerciseDetail',
                  params: {
                    exerciseId: item.exerciseId,
                    exerciseName: item.name,
                  },
                })
              }
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name || item.exerciseId}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {item.category || 'Exercise'} • {item.difficulty || ''}
              </Text>
              <TouchableOpacity
                style={styles.remove}
                onPress={() => Alert.alert('Remove', 'Remove from favorites?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(item.exerciseId) },
                ])}
              >
                <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  title: { ...typography.heading1, marginBottom: spacing.xs },
  subtitle: { ...typography.body3, marginBottom: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  cardTitle: { ...typography.heading3 },
  meta: { ...typography.body3, marginTop: spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  remove: { marginTop: 10, paddingVertical: 8, alignItems: 'center' },
  removeText: { ...typography.label1 },
  error: { ...typography.body2 },
});
