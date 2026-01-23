import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';

export default function NutritionScreen() {
  const user = useAuthStore((s) => s.user);
  const [showPreferences, setShowPreferences] = useState(false);
  const [restrictions, setRestrictions] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['nutrition-guidance'],
    queryFn: () => apiClient.getNutritionGuidance(),
  });

  // Fetch user profile to populate dietary restrictions on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await apiClient.request<any>('/users/profile');
        if (profile?.dietaryRestrictions) {
          const restrictionsStr = Array.isArray(profile.dietaryRestrictions)
            ? profile.dietaryRestrictions.join(', ')
            : profile.dietaryRestrictions;
          setRestrictions(restrictionsStr);
        }
      } catch (err) {
        console.log('Could not fetch user profile', err);
      }
    };
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => apiClient.updateUserProfile(updates),
    onSuccess: () => {
      Alert.alert('Success', 'Preferences saved!');
      setShowPreferences(false);
      refetch();
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="food-apple" size={28} color="#FF3B30" />
          <Text style={styles.headerTitle}>Nutrition Guidance</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error</Text>
          <Text style={styles.errorText}>Failed to fetch guidance.</Text>
        </View>
      </View>
    );
  }

  const guidance: any = data || {};
  const tdee = guidance.tdeeEstimate || {};
  const macros = guidance.macroRecommendation || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="food-apple" size={28} color="#34C759" />
        <Text style={styles.headerTitle}>Nutrition Guidance</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollContent}>
        <TouchableOpacity style={styles.prefButton} onPress={() => setShowPreferences(!showPreferences)}>
          <MaterialCommunityIcons name="cog" size={18} color="#fff" />
          <Text style={styles.prefButtonText}>Edit Preferences</Text>
        </TouchableOpacity>

        {showPreferences && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
            <TextInput
              style={styles.preferenceInput}
              placeholder="e.g., Vegetarian, Dairy-free, Low-carb"
              value={restrictions}
              onChangeText={setRestrictions}
              multiline
            />
            <TouchableOpacity
              style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
              onPress={() => {
                Keyboard.dismiss();
                updateMutation.mutate({
                  dietaryRestrictions: restrictions
                    .split(',')
                    .map(r => r.trim())
                    .filter(r => r.length > 0),
                });
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TDEE Estimate</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>BMR</Text>
            <Text style={styles.statValue}>{tdee.bmr ? Math.round(tdee.bmr) : '—'} kcal</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>TDEE</Text>
            <Text style={styles.statValue}>{tdee.tdee ? Math.round(tdee.tdee) : '—'} kcal</Text>
          </View>
          {tdee.explanation && <Text style={styles.noteText}>{tdee.explanation}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macros</Text>
          {macros.protein && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Protein</Text>
              <Text style={styles.statValue}>{macros.protein.grams}g ({macros.protein.percentage}%)</Text>
            </View>
          )}
          {macros.carbs && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Carbs</Text>
              <Text style={styles.statValue}>{macros.carbs.grams}g ({macros.carbs.percentage}%)</Text>
            </View>
          )}
          {macros.fats && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Fats</Text>
              <Text style={styles.statValue}>{macros.fats.grams}g ({macros.fats.percentage}%)</Text>
            </View>
          )}
        </View>

        {guidance.mealTiming && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Timing</Text>
            <Text style={styles.noteText}>Pre-workout: {guidance.mealTiming.preWorkout}</Text>
            <Text style={styles.noteText}>Post-workout: {guidance.mealTiming.postWorkout}</Text>
            {guidance.mealTiming.tips && (
              <View style={{ marginTop: 8 }}>
                {guidance.mealTiming.tips.map((tip: string, idx: number) => (
                  <Text key={idx} style={styles.tipText}>• {tip}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {guidance.hydrationGuide && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hydration</Text>
            <Text style={styles.noteText}>{guidance.hydrationGuide}</Text>
          </View>
        )}

        {guidance.generalTips && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tips</Text>
            {guidance.generalTips.map((tip: string, idx: number) => (
              <Text key={idx} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000', flex: 1, textAlign: 'center' },
  scrollContent: { flex: 1, padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  statLabel: { fontSize: 14, color: '#666' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#000' },
  noteText: { fontSize: 13, color: '#666', marginTop: 6 },
  tipText: { fontSize: 13, color: '#333', marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 14, color: '#FF3B30' },
  prefButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', marginHorizontal: 16, marginTop: 16, padding: 12, borderRadius: 8 },
  prefButtonText: { marginLeft: 8, color: '#fff', fontWeight: '600' },
  preferenceInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, minHeight: 60, marginBottom: 12, fontSize: 14 },
  saveBtn: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#007AFF', opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
