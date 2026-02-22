import React from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import ScreenHeader from '../../components/ScreenHeader';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function BodyMapScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['muscle-groups'],
    queryFn: () => apiClient.listMuscleGroups(),
  });

  const muscles = ((data as any)?.muscleGroups || []) as any[];

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Body Map" onBackPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Body Map" onBackPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.error }]}>Failed to load muscles</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Body Map"
        subtitle="Browse exercises by muscle group."
        onBackPress={() => navigation.goBack()}
      />
      <FlatList
        data={muscles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['4xl'] }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('MuscleExercises', { muscleId: item.id, muscleName: item.displayName })}
            activeOpacity={0.85}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.displayName}</Text>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description || 'View exercises'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  cardTitle: { ...typography.heading3 },
  cardMeta: { ...typography.body3, marginTop: spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { ...typography.body2 },
});
