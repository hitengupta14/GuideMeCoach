import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/auth';

export default function DashboardScreen() {
  const store = useAuthStore();
  const user = store?.user || { name: 'User' };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.name || 'User'}!</Text>
        <Text style={styles.subtitle}>Your fitness journey continues here</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Workout</Text>
        <Text style={styles.cardValue}>45 min</Text>
        <Text style={styles.cardLabel}>Upper Body Strength</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calories Burned</Text>
        <Text style={styles.cardValue}>450</Text>
        <Text style={styles.cardLabel}>Out of 2000 daily goal</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week</Text>
        <Text style={styles.cardValue}>4/7</Text>
        <Text style={styles.cardLabel}>workouts completed</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#999',
  },
});
