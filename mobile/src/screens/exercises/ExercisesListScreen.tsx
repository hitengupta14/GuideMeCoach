import React, { useState, useMemo, useEffect } from 'react';
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
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { LoadingView, ErrorView, EmptyView } from '../../components/State';
import { Image } from 'expo-image';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { useThemeStore } from '../../store/theme';

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

const PAGE_SIZE = 20;
const PLACEHOLDER_BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

export default function ExercisesListScreen({ onSelectExercise }: ExercisesListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rawSearch, setRawSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const { colors } = useThemeStore();

  // Debounce the search input to reduce query churn
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(rawSearch.trim()), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['exercises', selectedCategory, selectedDifficulty, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);
      params.append('includeMuscles', 'true');
      params.append('limit', String(PAGE_SIZE));
      params.append('offset', String(pageParam));

      const response: any = await apiClient.request(`/exercises?${params.toString()}`);
      return {
        exercises: response?.exercises || [],
        nextOffset: response?.exercises?.length === PAGE_SIZE ? pageParam + PAGE_SIZE : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
  });

  const exercises = useMemo(() => {
    return data?.pages.flatMap((page) => page.exercises) || [];
  }, [data]);

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
      style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onSelectExercise(item)}
    >
      <View style={styles.exerciseContent}>
        {item.thumbnailUrl && (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
            placeholder={PLACEHOLDER_BLURHASH}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
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
              <Text style={[styles.category, { color: colors.textSecondary }]}>{item.category}</Text>
            )}
          </View>
          {item.equipment && item.equipment.length > 0 && (
            <Text style={[styles.equipment, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.equipment.join(', ')}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.primary}
        />
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return <ErrorView message="Failed to load exercises" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }] }>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search exercises..."
          value={rawSearch}
          onChangeText={setRawSearch}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
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
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {isLoading ? 'Loading...' : `${exercises.length} exercises`}
        </Text>
      </View>

      {/* Exercises List */}
      {isLoading && exercises.length === 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ListSkeleton count={8} />
        </View>
      ) : exercises.length === 0 ? (
        <EmptyView title="No exercises found" subtitle="Try different filters or search terms" />
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          removeClippedSubviews
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
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
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
