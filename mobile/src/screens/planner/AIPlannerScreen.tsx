import React, { useState } from 'react';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAIQuota } from '../../hooks/useAIQuota';
import UpgradeModal from '../../components/UpgradeModal';

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
    Alert.alert('Save Plan', 'Save this plan to your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: async () => {
          try {
            await apiClient.savePlan({
              planData: generatedPlan,
              name: 'AI Generated Plan',
              description: 'Personalized plan generated on mobile',
              durationWeeks: parseInt(formData.durationWeeks),
            });
            Alert.alert('Success', 'Plan saved successfully!');
          } catch (e) {
            Alert.alert('Error', 'Failed to save plan');
          }
        },
      },
    ]);
  };

  if (generatedPlan && !showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowForm(true)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your AI Plan</Text>
          <TouchableOpacity onPress={handleSavePlan}>
            <MaterialCommunityIcons name="download" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

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
              Alert.alert('Success', 'Plan started! Head to Workouts to log your first session.');
            }}
          >
            <MaterialCommunityIcons name="play" size={20} color="#fff" />
            <Text style={styles.startButtonText}>Start Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot" size={28} color="#007AFF" />
        <Text style={styles.headerTitle}>AI Workout Planner</Text>
        <View style={{ width: 28 }} />
      </View>

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
                      color="#fff"
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
                  formData.preferredLocation === 'home' ? '#fff' : '#007AFF'
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
                  formData.preferredLocation === 'gym' ? '#fff' : '#007AFF'
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
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="star-circle" size={20} color="#fff" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
    borderColor: '#e0e0e0',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
  },
  radioButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chipButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '30%',
    alignItems: 'center',
  },
  chipButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
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
    borderColor: '#ccc',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tagActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  tagTextActive: {
    color: '#fff',
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
    borderColor: '#007AFF',
    backgroundColor: '#f0f0f0',
    gap: 8,
  },
  locationButtonActive: {
    backgroundColor: '#007AFF',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  locationTextActive: {
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
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
    color: '#fff',
  },
  // Plan display styles
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  weekCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  dayType: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f0f0f0',
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
    color: '#333',
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 11,
    color: '#999',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
