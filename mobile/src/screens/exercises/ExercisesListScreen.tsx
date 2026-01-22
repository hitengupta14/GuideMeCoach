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
import { LinearGradient } from 'expo-linear-gradient';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { LoadingView, ErrorView, EmptyView } from '../../components/State';
import { Image } from 'expo-image';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { useThemeStore } from '../../store/theme';
import { Card, CardBody } from '../../components/Card';
import { Badge } from '../../components/UI';
import { spacing, borderRadius, typography, shadows } from '../../theme/spacing';
import { lightColors, darkColors } from '../../theme/colors';

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
  const { theme, colors } = useThemeStore();
  const isDark = theme === 'dark';

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
    const colorMap = {
      beginner: colors.success,
      intermediate: colors.warning,
      advanced: colors.error,
    };
    return colorMap[difficulty as keyof typeof colorMap] || colors.primary;
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <Card variant="elevated" isDark={isDark} style={styles.exerciseCard}>
      <TouchableOpacity
        onPress={() => onSelectExercise(item)}
        activeOpacity={0.7}
      >
        <CardBody>
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
            <View style={styles.exerciseInfo}>
              <Text
                style={[typography.heading3, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <View style={[styles.exerciseMeta, { marginTop: spacing.sm }]}>
                <Badge
                  label={item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                  variant={
                    item.difficulty === 'beginner'
                      ? 'success'
                      : item.difficulty === 'intermediate'
                        ? 'warning'
                        : 'error'
                  }
                  isDark={isDark}
                />
                {item.category && (
                  <Text
                    style={[
                      typography.caption1,
                      { color: colors.textSecondary, marginLeft: spacing.md },
                    ]}
                  >
                    {item.category}
                  </Text>
                )}
              </View>
              {item.equipment && item.equipment.length > 0 && (
                <Text
                  style={[
                    typography.caption2,
                    { color: colors.textTertiary, marginTop: spacing.sm },
                  ]}
                  numberOfLines={1}
                >
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
        </CardBody>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={[typography.heading2, { color: colors.textInverse, marginBottom: spacing.sm }]}>
          Exercises
        </Text>
        <Text style={[typography.body3, { color: `${colors.textInverse}99` }]}>
          {exercises.length} exercises available
        </Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={[styles.searchWrapper, { paddingHorizontal: spacing.lg }]}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, typography.body2, { color: colors.text, flex: 1 }]}
            placeholder="Search exercises..."
            value={rawSearch}
            onChangeText={setRawSearch}
            placeholderTextColor={colors.textTertiary}
          />
          {rawSearch ? (
            <TouchableOpacity onPress={() => setRawSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filtersContainer, { paddingHorizontal: spacing.lg }]}
      >
        {/* Category Filters */}
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedCategory === cat ? colors.primary : colors.surfaceSecondary,
              },
            ]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Text
              style={[
                typography.label2,
                {
                  color: selectedCategory === cat ? colors.textInverse : colors.text,
                  fontWeight: '600',
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Difficulty Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filtersContainer, { paddingHorizontal: spacing.lg }]}
      >
        {difficulties.map((diff) => (
          <TouchableOpacity
            key={diff}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedDifficulty === diff ? colors.secondary : colors.surfaceSecondary,
              },
            ]}
            onPress={() =>
              setSelectedDifficulty(selectedDifficulty === diff ? null : diff)
            }
          >
            <Text
              style={[
                typography.label2,
                {
                  color: selectedDifficulty === diff ? colors.textInverse : colors.text,
                  fontWeight: '600',
                },
              ]}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercises List */}
      {isLoading && exercises.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <ListSkeleton count={8} />
        </View>
      ) : exercises.length === 0 ? (
        <EmptyView title="No exercises found" subtitle="Try different filters or search terms" />
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.lg }]}
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
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  searchWrapper: {
    paddingVertical: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    minHeight: 48,
    ...shadows.md,
  },
  searchInput: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  filtersContainer: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  listContent: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  exerciseCard: {
    overflow: 'hidden',
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: '#f0f0f0',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerLoader: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
});
