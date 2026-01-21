import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  slug: string;
  thumbnailUrl?: string;
}

interface ExercisesListScreenProps {
  onSelectExercise: (exercise: Exercise) => void;
}

export default function ExercisesListScreen({ onSelectExercise }: ExercisesListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const { data: exercisesData, isLoading, error } = useQuery({
    queryKey: ['exercises', selectedCategory, selectedDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      params.append('includeMuscles', 'true');

      return apiClient.request(`/exercises?${params.toString()}`);
    },
  });

  const exercises = (exercisesData as any)?.exercises || [];

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex: Exercise) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [exercises, searchQuery]);

  const categories = ['Strength', 'Cardio', 'Flexibility', 'Mobility', 'Core'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#34C759';
      case 'intermediate':
        return '#FF9500';
      case 'advanced':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={() => onSelectExercise(item)}
    >
      <View style={styles.exerciseContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.exerciseMeta}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(item.difficulty) },
              ]}
            >
              <Text style={styles.difficultyText}>{item.difficulty}</Text>
            </View>
            {item.category && (
              <Text style={styles.category}>{item.category}</Text>
            )}
          </View>
          {item.equipment && item.equipment.length > 0 && (
            <Text style={styles.equipment} numberOfLines={1}>
              {item.equipment.join(', ')}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#007AFF"
        />
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color="#FF3B30"
          />
          <Text style={styles.errorText}>Failed to load exercises</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#ccc"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Difficulty Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {difficulties.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.filterChip,
                selectedDifficulty === diff && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedDifficulty(
                  selectedDifficulty === diff ? null : diff
                )
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedDifficulty === diff && styles.filterChipTextActive,
                ]}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsCount}>
          {isLoading ? 'Loading...' : `${filteredExercises.length} exercises`}
        </Text>
      </View>

      {/* Exercises List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="dumbbell"
            size={48}
            color="#ccc"
          />
          <Text style={styles.emptyText}>No exercises found</Text>
          <Text style={styles.emptySubtext}>Try different filters or search terms</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#000',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterRow: {
    marginVertical: 8,
  },
  filterRowContent: {
    paddingRight: 16,
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  category: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  equipment: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
