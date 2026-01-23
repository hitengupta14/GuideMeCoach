import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export default function BodyMapScreen({ navigation }: any) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['muscle-groups'],
    queryFn: () => apiClient.listMuscleGroups(),
  });

  const muscles = (data as any)?.muscleGroups || [];

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
        <Text style={styles.error}>Failed to load muscles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Body Map</Text>
      <Text style={styles.subtitle}>Browse exercises by muscle group.</Text>
      <FlatList
        data={muscles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('MuscleExercises', { muscleId: item.id, muscleName: item.displayName })}
          >
            <Text style={styles.cardTitle}>{item.displayName}</Text>
            <Text style={styles.cardMeta}>{item.description || 'View exercises'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 14 },
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
  cardMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#d00' },
});
