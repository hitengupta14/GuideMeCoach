import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import ExerciseSourceBadge from '../../components/ExerciseSourceBadge';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'approved', label: 'Approved' },
] as const;

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Strength' },
  { key: 'mobility', label: 'Mobility' },
  { key: 'rehab', label: 'Rehab' },
  { key: 'cardio', label: 'Cardio' },
] as const;

const DIFFICULTY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
] as const;

type ReviewStatus = (typeof STATUS_FILTERS)[number]['key'];

function formatDate(input: unknown): string {
  if (!input) return '—';
  const d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d.toISOString();
  }
}

export default function AdminExerciseApprovalScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const query = useQuery({
    queryKey: ['admin-exercises', search, statusFilter, categoryFilter, difficultyFilter, page],
    queryFn: () =>
      apiClient.adminListExercises({
        reviewStatus: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        page,
        pageSize,
      }),
  });

  const exercises: any[] = (query.data as any)?.exercises || [];
  const total = Number((query.data as any)?.total ?? exercises.length);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: { exerciseId: string; reviewStatus: 'draft' | 'approved' }) => {
      return apiClient.adminSetExerciseReviewStatus(payload.exerciseId, payload.reviewStatus);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
    },
    onError: (e: any) => {
      const message = e?.data?.error || e?.message || 'Failed to update status.';
      Alert.alert('Error', message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (exerciseId: string) => apiClient.adminDeleteExercise(exerciseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      Alert.alert('Deleted', 'Exercise deleted successfully.');
    },
    onError: (e: any) => {
      const message = e?.data?.error || e?.message || 'Failed to delete exercise.';
      Alert.alert('Error', message);
    },
  });

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const filterChip = (
    key: string,
    label: string,
    active: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={key}
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? `${colors.primary}18` : colors.card,
          borderColor: active ? `${colors.primary}55` : colors.border,
        },
      ]}
    >
      <Text style={[typography.caption1, { color: active ? colors.primary : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScreenHeader
        title="Exercises"
        subtitle="Manage exercise catalog and approvals."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => query.refetch()}
              activeOpacity={0.85}
              style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
              accessibilityRole="button"
              accessibilityLabel="Refresh exercises"
            >
              <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminExerciseEditor', { mode: 'create' })}
              activeOpacity={0.85}
              style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
              accessibilityRole="button"
              accessibilityLabel="Add exercise"
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={[styles.searchWrap, { paddingHorizontal: spacing.lg }]}> 
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search exercises"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={applySearch}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={applySearch}
            style={[styles.searchBtn, { backgroundColor: `${colors.primary}16` }]}
          >
            <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterBlock}>
          <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Status</Text>
          <View style={styles.filterRow}>
            {STATUS_FILTERS.map((f) =>
              filterChip(f.key, f.label, statusFilter === f.key, () => {
                setStatusFilter(f.key);
                setPage(1);
              })
            )}
          </View>
        </View>

        <View style={styles.filterBlock}>
          <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Category</Text>
          <View style={styles.filterRow}>
            {CATEGORY_FILTERS.map((f) =>
              filterChip(f.key, f.label, categoryFilter === f.key, () => {
                setCategoryFilter(f.key);
                setPage(1);
              })
            )}
          </View>
        </View>

        <View style={styles.filterBlock}>
          <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Difficulty</Text>
          <View style={styles.filterRow}>
            {DIFFICULTY_FILTERS.map((f) =>
              filterChip(f.key, f.label, difficultyFilter === f.key, () => {
                setDifficultyFilter(f.key);
                setPage(1);
              })
            )}
          </View>
        </View>
      </View>

      {query.isLoading ? (
        <LoadingView message="Loading exercises…" />
      ) : query.error ? (
        <ErrorView message="Failed to load exercises." />
      ) : exercises.length === 0 ? (
        <EmptyView title="No exercises found" subtitle="Try adjusting your filters." />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={Boolean(query.isFetching)} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          renderItem={({ item }: any) => {
            const reviewStatus = String(item?.reviewStatus || 'draft');
            const source = String(item?.source || 'manual');
            const isApproved = reviewStatus === 'approved';

            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={styles.cardRow}>
                  {item?.thumbnailUrl ? (
                    <Image source={{ uri: String(item.thumbnailUrl) }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: `${colors.primary}12` }]}> 
                      <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                      {String(item?.name || 'Exercise')}
                    </Text>
                    <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                      {String(item?.description || 'No description')}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={[styles.metaBadge, { backgroundColor: `${colors.primary}12` }]}> 
                        <Text style={[typography.caption1, { color: colors.text }]}>{String(item?.category || '—')}</Text>
                      </View>
                      <View style={[styles.metaBadge, { backgroundColor: `${colors.warning}18` }]}> 
                        <Text style={[typography.caption1, { color: colors.text }]}>{String(item?.difficulty || '—')}</Text>
                      </View>
                      <View style={[styles.metaBadge, { backgroundColor: `${isApproved ? colors.success : colors.textTertiary}18` }]}> 
                        <Text style={[typography.caption1, { color: colors.text }]}>{isApproved ? 'Approved' : 'Draft'}</Text>
                      </View>
                    </View>

                    <View style={styles.subRow}>
                      <ExerciseSourceBadge source={source as any} size="small" />
                      <Text style={[typography.caption1, { color: colors.textSecondary }]}>Created {formatDate(item?.createdAt)}</Text>
                      {source === 'ai_generated' && item?.confidenceScore !== null && item?.confidenceScore !== undefined ? (
                        <Text style={[typography.caption1, { color: colors.textSecondary }]}>Confidence {item.confidenceScore}%</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      updateStatusMutation.mutate({
                        exerciseId: String(item?.id),
                        reviewStatus: isApproved ? 'draft' : 'approved',
                      })
                    }
                    style={[styles.actionBtn, { backgroundColor: `${colors.primary}12` }]}
                  >
                    <MaterialCommunityIcons name={isApproved ? 'close-circle-outline' : 'check-circle-outline'} size={18} color={colors.primary} />
                    <Text style={[typography.caption1, { color: colors.text }]}>{isApproved ? 'Draft' : 'Approve'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('AdminExerciseEditor', { exerciseId: item.id })}
                    style={[styles.actionBtn, { backgroundColor: `${colors.warning}18` }]}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.warning} />
                    <Text style={[typography.caption1, { color: colors.text }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      Alert.alert('Delete exercise?', 'This cannot be undone.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(String(item?.id)) },
                      ]);
                    }}
                    style={[styles.actionBtn, { backgroundColor: `${colors.error}12` }]}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                    <Text style={[typography.caption1, { color: colors.text }]}>{deleteMutation.isPending ? '...' : 'Delete'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={[styles.footer, { borderColor: colors.border }]}> 
                <Text style={[typography.body3, { color: colors.textSecondary }]}>
                  Page {page} / {totalPages} • {total} exercises
                </Text>
                <View style={styles.footerBtns}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={[
                      styles.footerBtn,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: page <= 1 ? 0.5 : 1 },
                    ]}
                  >
                    <Text style={[typography.label2, { color: colors.text }]}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    style={[
                      styles.footerBtn,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: page >= totalPages ? 0.5 : 1 },
                    ]}
                  >
                    <Text style={[typography.label2, { color: colors.text }]}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ height: spacing['4xl'] }} />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  searchWrap: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body2,
  },
  searchBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  filterBlock: {
    gap: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  footerBtns: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
