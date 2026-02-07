import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import ScreenHeader from '../../components/ScreenHeader';
import { LoadingView, ErrorView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function NutritionScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
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
    return <LoadingView message="Loading nutrition guidance" />;
  }

  if (error) {
    return <ErrorView message="Failed to fetch guidance" />;
  }

  const payload: any = data || {};
  const guidance: any = payload.guidance || payload;
  const tdee = guidance.tdeeEstimate || {};
  const macros = guidance.macroRecommendation || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Nutrition Guidance"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.8}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh nutrition guidance"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={[styles.prefButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowPreferences(!showPreferences)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="cog" size={18} color={colors.textInverse} />
          <Text style={styles.prefButtonText}>Edit Preferences</Text>
        </TouchableOpacity>

        {showPreferences && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dietary Preferences</Text>
            <TextInput
              style={[
                styles.preferenceInput,
                { borderColor: colors.border, backgroundColor: colors.backgroundSecondary, color: colors.text },
              ]}
              placeholder="e.g., Vegetarian, Dairy-free, Low-carb"
              placeholderTextColor={colors.textTertiary}
              value={restrictions}
              onChangeText={setRestrictions}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary },
                updateMutation.isPending && styles.saveBtnDisabled,
              ]}
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
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>TDEE Estimate</Text>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>BMR</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{tdee.bmr ? Math.round(tdee.bmr) : '—'} kcal</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TDEE</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{tdee.tdee ? Math.round(tdee.tdee) : '—'} kcal</Text>
          </View>
          {tdee.explanation && <Text style={[styles.noteText, { color: colors.textSecondary }]}>{tdee.explanation}</Text>}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Macros</Text>
          {macros.protein && (
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Protein</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{macros.protein.grams}g ({macros.protein.percentage}%)</Text>
            </View>
          )}
          {macros.carbs && (
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Carbs</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{macros.carbs.grams}g ({macros.carbs.percentage}%)</Text>
            </View>
          )}
          {macros.fats && (
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fats</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{macros.fats.grams}g ({macros.fats.percentage}%)</Text>
            </View>
          )}
        </View>

        {guidance.mealTiming && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Meal Timing</Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>Pre-workout: {guidance.mealTiming.preWorkout}</Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>Post-workout: {guidance.mealTiming.postWorkout}</Text>
            {guidance.mealTiming.tips && (
              <View style={{ marginTop: 8 }}>
                {guidance.mealTiming.tips.map((tip: string, idx: number) => (
                  <Text key={idx} style={[styles.tipText, { color: colors.textSecondary }]}>• {tip}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {guidance.hydrationGuide && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hydration</Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>{guidance.hydrationGuide}</Text>
          </View>
        )}

        {guidance.generalTips && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips</Text>
            {guidance.generalTips.map((tip: string, idx: number) => (
              <Text key={idx} style={[styles.tipText, { color: colors.textSecondary }]}>• {tip}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { flex: 1, padding: spacing.lg },
  section: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, ...shadows.md },
  sectionTitle: { ...typography.heading3, marginBottom: spacing.md },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  statLabel: { ...typography.body3 },
  statValue: { ...typography.heading3 },
  noteText: { ...typography.body3, marginTop: spacing.sm },
  tipText: { ...typography.body3, marginTop: spacing.xs },
  prefButton: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, ...shadows.sm },
  prefButtonText: { marginLeft: 8, color: '#fff', fontWeight: '600' },
  preferenceInput: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.lg, minHeight: 60, marginBottom: spacing.lg, ...typography.body2 },
  saveBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
