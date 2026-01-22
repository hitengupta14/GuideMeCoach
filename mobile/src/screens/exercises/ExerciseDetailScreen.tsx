import React, { useState, useEffect } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
// import { useThemeStore } from '../../store/theme' from '../../store/auth';

interface ExerciseDetailScreenProps {
  exerciseId: string;
  exerciseName: string;
  onBack: () => void;
}

interface MuscleGroup {
  id: string;
  name: string;
  displayName: string;
  role: 'primary' | 'secondary' | 'stabilizer';
}

interface ExerciseDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  equipment: string[];
  instructions: string[];
  benefits: string[];
  commonMistakes: string[];
  injuryRisks: string[];
  tips: string[];
}

export default function ExerciseDetailScreen({
  exerciseId,
  exerciseName,
  onBack,
}: ExerciseDetailScreenProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: exerciseDetail, isLoading } = useQuery({
    queryKey: ['exerciseDetail', exerciseId],
    queryFn: () => apiClient.request(`/exercises/${exerciseId}`),
  });

  const { data: favoriteList } = useQuery({
    queryKey: ['favorites', user?.id],
    enabled: !!user?.id,
    queryFn: () => apiClient.listFavorites(user!.id),
  });

  useEffect(() => {
    if (!favoriteList || !Array.isArray(favoriteList)) return;
    const found = favoriteList.some((f: any) => f.exerciseId === exerciseId);
    setIsFavorite(found);
  }, [favoriteList, exerciseId]);

  const addFav = useMutation({
    mutationFn: () => apiClient.addFavorite(user!.id, exerciseId),
    onSuccess: () => {
      qc.invalidateQueries(['favorites', user?.id]);
      setIsFavorite(true);
    },
  });

  const removeFav = useMutation({
    mutationFn: () => apiClient.removeFavorite(user!.id, exerciseId),
    onSuccess: () => {
      qc.invalidateQueries(['favorites', user?.id]);
      setIsFavorite(false);
    },
  });

  const toggleFavorite = () => {
    if (!user?.id) {
      Alert.alert('Login required', 'Please log in to save favorites.');
      return;
    }
    if (isFavorite) {
      removeFav.mutate();
    } else {
      addFav.mutate();
    }
  };

  const exercise = (exerciseDetail as any)?.exercise || {};
  const muscles = ((exerciseDetail as any)?.muscles || []) as MuscleGroup[];
  const alternatives = (exerciseDetail as any)?.alternatives || [];

  const handleAddToWorkout = () => {
    Alert.alert('Success', `${exercise.name} added to today's workout!`);
  };

  const handleSaveAlternative = () => {
    Alert.alert('Success', 'Alternative exercise saved to favorites');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exerciseName}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
        <TouchableOpacity onPress={toggleFavorite}>
          <MaterialCommunityIcons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF3B30' : '#999'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <View style={styles.basicInfo}>
          <View style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeLabel}>Difficulty</Text>
              <Text
                style={[
                  styles.infoBadgeValue,
                  exercise.difficulty === 'beginner' && { color: '#34C759' },
                  exercise.difficulty === 'intermediate' && { color: '#FF9500' },
                  exercise.difficulty === 'advanced' && { color: '#FF3B30' },
                ]}
              >
                {exercise.difficulty?.charAt(0).toUpperCase() +
                  exercise.difficulty?.slice(1)}
              </Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeLabel}>Category</Text>
              <Text style={styles.infoBadgeValue}>{exercise.category}</Text>
            </View>
          </View>
        </View>

        {/* Equipment */}
        {exercise.equipment && exercise.equipment.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="toolbox" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Equipment</Text>
            </View>
            <View style={styles.equipmentList}>
              {exercise.equipment.map((eq: string, idx: number) => (
                <View key={idx} style={styles.equipmentTag}>
                  <Text style={styles.equipmentText}>{eq}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {exercise.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color="#007AFF"
              />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.descriptionText}>{exercise.description}</Text>
          </View>
        )}

        {/* Muscle Groups */}
        {muscles && muscles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="dumbbell" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Muscles Worked</Text>
            </View>
            {muscles.map((muscle: MuscleGroup) => (
              <View key={muscle.id} style={styles.muscleRow}>
                <View
                  style={[
                    styles.muscleRoleBadge,
                    muscle.role === 'primary' && styles.muscleRolePrimary,
                    muscle.role === 'secondary' && styles.muscleRoleSecondary,
                    muscle.role === 'stabilizer' && styles.muscleRoleStabilizer,
                  ]}
                >
                  <Text style={styles.muscleRoleText}>{muscle.role}</Text>
                </View>
                <Text style={styles.muscleName}>{muscle.displayName}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="format-list-numbered" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>How To Perform</Text>
            </View>
            {exercise.instructions.map((instruction: string, idx: number) => (
              <View key={idx} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{idx + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        {exercise.tips && exercise.tips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb" size={20} color="#FF9500" />
              <Text style={styles.sectionTitle}>Pro Tips</Text>
            </View>
            {exercise.tips.map((tip: string, idx: number) => (
              <View key={idx} style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#34C759" />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Benefits */}
        {exercise.benefits && exercise.benefits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="star" size={20} color="#FFB800" />
              <Text style={styles.sectionTitle}>Benefits</Text>
            </View>
            {exercise.benefits.map((benefit: string, idx: number) => (
              <View key={idx} style={styles.benefitItem}>
                <MaterialCommunityIcons name="check" size={16} color="#34C759" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Common Mistakes */}
        {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#FF9500" />
              <Text style={styles.sectionTitle}>Common Mistakes</Text>
            </View>
            {exercise.commonMistakes.map((mistake: string, idx: number) => (
              <View key={idx} style={styles.mistakeItem}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#FF9500" />
                <Text style={styles.mistakeText}>{mistake}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Injury Risks */}
        {exercise.injuryRisks && exercise.injuryRisks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="hospital-box" size={20} color="#FF3B30" />
              <Text style={styles.sectionTitle}>Injury Risks</Text>
            </View>
            {exercise.injuryRisks.map((risk: string, idx: number) => (
              <View key={idx} style={styles.riskItem}>
                <MaterialCommunityIcons name="alert" size={16} color="#FF3B30" />
                <Text style={styles.riskText}>{risk}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Alternatives */}
        {alternatives && alternatives.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="repeat" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Alternative Exercises</Text>
            </View>
            {alternatives.map((alt: any, idx: number) => (
              <View key={idx} style={styles.alternativeCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alternativeName}>{alt.name}</Text>
                  <Text style={styles.alternativeDifficulty}>{alt.difficulty}</Text>
                </View>
                <TouchableOpacity
                  style={styles.alternativeButton}
                  onPress={handleSaveAlternative}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add to Workout Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToWorkout}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add to Workout</Text>
        </TouchableOpacity>
      </View>
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
    marginHorizontal: 12,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  basicInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBadge: {
    flex: 1,
    alignItems: 'center',
  },
  infoBadgeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoBadgeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  equipmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  equipmentTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  equipmentText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  muscleRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  muscleRolePrimary: {
    backgroundColor: '#34C75920',
  },
  muscleRoleSecondary: {
    backgroundColor: '#FF950020',
  },
  muscleRoleStabilizer: {
    backgroundColor: '#007AFF20',
  },
  muscleRoleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  muscleName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  benefitText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  mistakeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  riskText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  alternativeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  alternativeDifficulty: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  alternativeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
