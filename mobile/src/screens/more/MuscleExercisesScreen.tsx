import React from 'react';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { LoadingView, ErrorView, EmptyView } from '../../components/State';

export default function MuscleExercisesScreen({ route }: any) {
  const { muscleId, muscleName } = route.params;

  const { data, isLoading, error } = useQuery({
    queryKey: ['muscle-exercises', muscleId],
    queryFn: () => apiClient.getMuscleExercises(muscleId),
  });
  const exercises = React.useMemo(() => {
    const groups = (data as any)?.exercises;
    if (!groups) return [];
    if (Array.isArray(groups)) return groups;
    return Object.values(groups as Record<string, any[]>).flat();
  }, [data]);

  if (isLoading) {
    return <LoadingView message="Loading exercises" />;
  }

  if (error) {
    return <ErrorView message="Failed to load exercises" />;
  }

  if (!exercises.length) {
    return <EmptyView title="No exercises found" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{muscleName}</Text>
      <Text style={styles.subtitle}>{exercises.length} exercises</Text>
      <FlatList
        data={exercises}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>{item.difficulty}</Text></View>
              {item.equipment?.length ? (
                <Text style={styles.meta}>{item.equipment.join(', ').replace(/_/g, ' ')}</Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
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
  badgesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  badge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: { color: '#1F6FEB', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  meta: { color: '#666', fontSize: 12 },
});
