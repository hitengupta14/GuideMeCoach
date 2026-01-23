import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiClient } from '../../services/api';

export default function FormFeedbackScreen() {
  const [exerciseName, setExerciseName] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!exerciseName || !description) {
      setError('Exercise name and description are required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.getFormFeedback({ exerciseName, description, weight, reps });
      setFeedback(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to get feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Form Feedback</Text>
      <Text style={styles.subtitle}>Text-based form consultation.</Text>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Exercise name" value={exerciseName} onChangeText={setExerciseName} />
        <TextInput style={styles.input} placeholder="Weight (optional)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Reps / duration (optional)" value={reps} onChangeText={setReps} />
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          placeholder="Describe your form, issues, pain points..."
          multiline
          value={description}
          onChangeText={setDescription}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Analyzing...' : 'Get feedback'}</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
      )}

      {feedback && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Results</Text>
          {feedback.overallAssessment && <Text style={styles.meta}>{feedback.overallAssessment}</Text>}
          {(feedback.corrections || []).map((c: any, idx: number) => (
            <Text key={idx} style={styles.meta}>• {c.area}: {c.correction}</Text>
          ))}
          {(feedback.progressionTips || []).map((tip: string, idx: number) => (
            <Text key={idx} style={styles.meta}>• {tip}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: {
    backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#fff', marginBottom: 8 },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#d00', marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  meta: { fontSize: 13, color: '#444', marginTop: 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
