import React, { useState } from 'react';
import { useThemeStore } from '../../store/theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { useAIQuota } from '../../hooks/useAIQuota';
import UpgradeModal from '../../components/UpgradeModal';
import ScreenHeader from '../../components/ScreenHeader';

interface PlanFormData {
  goal: string;
  durationWeeks: string;
  daysPerWeek: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  availableEquipment: string[];
  focusAreas: string[];
  preferredLocation: 'home' | 'gym';
}

export default function AIPlannerScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PlanFormData>({
    goal: 'muscle_building',
    durationWeeks: '4',
    daysPerWeek: '4',
    experienceLevel: 'intermediate',
    availableEquipment: ['dumbbells', 'barbell'],
    focusAreas: ['chest', 'back'],
    preferredLocation: 'gym',
  });

  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [showForm, setShowForm] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canAccessFeature, refetch: refetchQuota } = useAIQuota();

  const goals = [
    { value: 'muscle_building', label: 'Muscle Building' },
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'strength', label: 'Strength' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'flexibility', label: 'Flexibility' },
  ];

  const equipment = [
    'dumbbells',
    'barbell',
    'kettlebell',
    'resistance_bands',
    'machines',
    'bodyweight',
  ];
  const focusAreas = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  const durations = ['2', '4', '6', '8', '12'];
  const frequencies = ['1', '2', '3', '4', '5', '6'];

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      // Check quota before making API call
      if (!canAccessFeature('planner')) {
        setShowUpgradeModal(true);
        throw new Error('Upgrade required');
      }
      
      return apiClient.request('/planner/ai-generate', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          durationWeeks: parseInt(formData.durationWeeks),
          daysPerWeek: parseInt(formData.daysPerWeek),
        }),
      });
    },
    onSuccess: async (data) => {
      setGeneratedPlan(data);
      setShowForm(false);
      // Refresh quota after successful generation
      await refetchQuota();
    },
    onError: (error: any) => {
      if (error.message !== 'Upgrade required') {
        Alert.alert('Error', 'Failed to generate plan. Please try again.');
      }
    },
  });

  const toggleEquipment = (item: string) => {
    setFormData({
      ...formData,
      availableEquipment: formData.availableEquipment.includes(item)
        ? formData.availableEquipment.filter((e) => e !== item)
        : [...formData.availableEquipment, item],
    });
  };

  const toggleFocusArea = (area: string) => {
    setFormData({
      ...formData,
      focusAreas: formData.focusAreas.includes(area)
        ? formData.focusAreas.filter((a) => a !== area)
        : [...formData.focusAreas, area],
    });
  };

  const handleSavePlan = async () => {
    const planId = generatedPlan?.plan?.id;
    if (!planId) {
      Alert.alert('Not available', 'Could not find the saved plan id.');
      return;
    }
    Alert.alert('Saved', 'This plan is already saved to your library.', [
      { text: 'OK', style: 'cancel' },
      { text: 'View plan', onPress: () => navigation.navigate('PlanDetail', { planId }) },
    ]);
  };

  const headerIconBtnStyle = React.useMemo(
    () => ({
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: `${colors.primary}14`,
    }),
    [colors.primary]
  );

  if (generatedPlan && !showForm) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Your AI Plan"
          onBackPress={() => navigation.goBack()}
          rightAction={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                activeOpacity={0.8}
                style={headerIconBtnStyle}
                accessibilityRole="button"
                accessibilityLabel="Edit plan inputs"
              >
                <MaterialCommunityIcons name="pencil" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePlan}
                activeOpacity={0.8}
                style={headerIconBtnStyle}
                accessibilityRole="button"
                accessibilityLabel="View saved plan"
              >
                <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          }
        />

        <ScrollView style={styles.scrollContent}>
          {/* Plan Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Goal</Text>
              <Text style={styles.summaryValue}>
                {formData.goal.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>
                {formData.durationWeeks} weeks
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frequency</Text>
              <Text style={styles.summaryValue}>
                {formData.daysPerWeek}x/week
              </Text>
            </View>
          </View>

          {/* Weekly Structure */}
          {generatedPlan?.weeklyStructure && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Schedule</Text>
              {generatedPlan.weeklyStructure.map((week: any, idx: number) => (
                <View key={idx} style={styles.weekCard}>
                  <Text style={styles.weekTitle}>Week {idx + 1}</Text>
                  {week.days && week.days.map((day: any, dayIdx: number) => (
                    <View key={dayIdx} style={styles.dayCard}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayName}>{day.dayName}</Text>
                        <Text style={styles.dayType}>{day.type}</Text>
                      </View>
                      {day.exercises && (
                        <View style={styles.exercisesList}>
                          {day.exercises.map((ex: any, exIdx: number) => (
                            <View key={exIdx} style={styles.exerciseItemPlan}>
                              <Text style={styles.exerciseNamePlan}>
                                {ex.name}
                              </Text>
                              <Text style={styles.exerciseDetails}>
                                {ex.sets}x{ex.reps} {ex.weight ? `@ ${ex.weight}` : ''}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Notes */}
          {generatedPlan?.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{generatedPlan.notes}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              const planId = generatedPlan?.plan?.id;
              if (!planId) {
                Alert.alert('Missing plan', 'Could not find the plan id.');
                return;
              }

              Alert.alert('Activate plan?', 'This will make this your active plan and take you to Today.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Activate',
                  onPress: async () => {
                    try {
                      await apiClient.updatePlan(planId, { isActive: true });
                      await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ['plans'] }),
                        queryClient.invalidateQueries({ queryKey: ['today'] }),
                      ]);
                      navigation.navigate('Home', { screen: 'Today' });
                    } catch (e) {
                      Alert.alert('Error', 'Failed to activate plan.');
                    }
                  },
                },
              ]);
            }}
          >
            <MaterialCommunityIcons name="play" size={20} color={colors.textInverse} />
            <Text style={styles.startButtonText}>Start Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="AI Workout Planner"
        subtitle="Generate a plan tailored to you."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="robot" size={22} color={colors.primary} />
          </View>
        }
      />

      <ScrollView style={styles.scrollContent}>
        {/* Goal Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Your Goal?</Text>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.value}
              style={[
                styles.optionButton,
                formData.goal === goal.value && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, goal: goal.value })}
            >
              <View
                style={[
                  styles.radioButton,
                  formData.goal === goal.value && styles.radioButtonActive,
                ]}
              />
              <Text
                style={[
                  styles.optionText,
                  formData.goal === goal.value && styles.optionTextActive,
                ]}
              >
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Duration</Text>
          <View style={styles.optionsGrid}>
            {durations.map((dur) => (
              <TouchableOpacity
                key={dur}
                style={[
                  styles.chipButton,
                  formData.durationWeeks === dur && styles.chipButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, durationWeeks: dur })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.durationWeeks === dur && styles.chipTextActive,
                  ]}
                >
                  {dur}w
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Days Per Week</Text>
          <View style={styles.optionsGrid}>
            {frequencies.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.chipButton,
                  formData.daysPerWeek === freq && styles.chipButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, daysPerWeek: freq })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.daysPerWeek === freq && styles.chipTextActive,
                  ]}
                >
                  {freq}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          {['beginner', 'intermediate', 'advanced'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.optionButton,
                formData.experienceLevel === level && styles.optionButtonActive,
              ]}
              onPress={() =>
                setFormData({
                  ...formData,
                  experienceLevel: level as any,
                })
              }
            >
              <View
                style={[
                  styles.radioButton,
                  formData.experienceLevel === level &&
                    styles.radioButtonActive,
                ]}
              />
              <Text
                style={[
                  styles.optionText,
                  formData.experienceLevel === level &&
                    styles.optionTextActive,
                ]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Equipment</Text>
          <View style={styles.checkboxGrid}>
            {equipment.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.checkboxRow}
                onPress={() => toggleEquipment(item)}
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.availableEquipment.includes(item) &&
                      styles.checkboxChecked,
                  ]}
                >
                  {formData.availableEquipment.includes(item) && (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color={colors.textInverse}
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  {item.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Focus Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Areas (Optional)</Text>
          <View style={styles.tagsContainer}>
            {focusAreas.map((area) => (
              <TouchableOpacity
                key={area}
                style={[
                  styles.tag,
                  formData.focusAreas.includes(area) && styles.tagActive,
                ]}
                onPress={() => toggleFocusArea(area)}
              >
                <Text
                  style={[
                    styles.tagText,
                    formData.focusAreas.includes(area) && styles.tagTextActive,
                  ]}
                >
                  {area}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Location</Text>
          <View style={styles.locationRow}>
            <TouchableOpacity
              style={[
                styles.locationButton,
                formData.preferredLocation === 'home' &&
                  styles.locationButtonActive,
              ]}
              onPress={() =>
                setFormData({ ...formData, preferredLocation: 'home' })
              }
            >
              <MaterialCommunityIcons
                name="home"
                size={20}
                color={
                  formData.preferredLocation === 'home' ? colors.textInverse : colors.primary
                }
              />
              <Text
                style={[
                  styles.locationText,
                  formData.preferredLocation === 'home' &&
                    styles.locationTextActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationButton,
                formData.preferredLocation === 'gym' &&
                  styles.locationButtonActive,
              ]}
              onPress={() =>
                setFormData({ ...formData, preferredLocation: 'gym' })
              }
            >
              <MaterialCommunityIcons
                name="dumbbell"
                size={20}
                color={
                  formData.preferredLocation === 'gym' ? colors.textInverse : colors.primary
                }
              />
              <Text
                style={[
                  styles.locationText,
                  formData.preferredLocation === 'gym' &&
                    styles.locationTextActive,
                ]}
              >
                Gym
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Generate Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            generatePlanMutation.isPending && styles.generateButtonLoading,
          ]}
          onPress={() => generatePlanMutation.mutate()}
          disabled={generatePlanMutation.isPending}
        >
          {generatePlanMutation.isPending ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <MaterialCommunityIcons name="star-circle" size={20} color={colors.textInverse} />
              <Text style={styles.generateButtonText}>Generate Plan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        feature="planner"
        onClose={() => setShowUpgradeModal(false)}
      />
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    scrollContent: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    optionButtonActive: {
      backgroundColor: `${colors.primary}18`,
      borderColor: colors.primary,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 12,
    },
    radioButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    optionText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    optionTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    chipButton: {
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginBottom: 8,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
      width: '30%',
      alignItems: 'center',
    },
    chipButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    chipTextActive: {
      color: colors.textInverse,
    },
    checkboxGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '50%',
      marginBottom: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    checkboxLabel: {
      fontSize: 14,
      color: colors.text,
      textTransform: 'capitalize',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tag: {
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      textTransform: 'capitalize',
    },
    tagTextActive: {
      color: colors.textInverse,
    },
    locationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    locationButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.backgroundTertiary,
      gap: 8,
    },
    locationButtonActive: {
      backgroundColor: colors.primary,
    },
    locationText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    locationTextActive: {
      color: colors.textInverse,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    generateButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    generateButtonLoading: {
      opacity: 0.7,
    },
    generateButtonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textInverse,
    },
    // Plan display styles
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    summaryValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    weekCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    weekTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    dayCard: {
      backgroundColor: colors.card,
      borderRadius: 6,
      padding: 10,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    dayName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    dayType: {
      fontSize: 11,
      color: colors.textSecondary,
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    exercisesList: {
      marginTop: 8,
    },
    exerciseItemPlan: {
      paddingVertical: 6,
    },
    exerciseNamePlan: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    exerciseDetails: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    notesText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    startButton: {
      flexDirection: 'row',
      backgroundColor: colors.success,
      paddingVertical: 14,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    startButtonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textInverse,
    },
  });
}
