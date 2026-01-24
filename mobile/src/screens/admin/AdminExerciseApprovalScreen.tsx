import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
import { apiClient } from '../../services/api';
import ExerciseSourceBadge from '../../components/ExerciseSourceBadge';

type ReviewStatus = 'draft' | 'approved';
type ExerciseSource = 'manual' | 'ai_generated' | 'curated';

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  source: ExerciseSource;
  reviewStatus: ReviewStatus;
  confidenceScore?: number;
  createdAt: string;
  thumbnailUrl?: string;
}

interface FilterOption {
  label: string;
  value: ReviewStatus | 'all';
}

const STATUS_FILTERS: FilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'draft' },
  { label: 'Approved', value: 'approved' },
];

export default function AdminExerciseApprovalScreen() {
  const { theme } = useThemeStore();
  const colors = theme === 'dark' ? darkColors : lightColors;
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('draft');

  // Fetch exercises for admin review
  const { data: exercises = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-exercises', statusFilter],
    queryFn: async () => {
      const response: any = await apiClient.request('/api/admin/exercises', {
        method: 'GET',
      });
      
      const allExercises = response?.exercises || [];
      
      // Filter by status
      if (statusFilter === 'all') return allExercises;
      return allExercises.filter((ex: Exercise) => ex.reviewStatus === statusFilter);
    },
  });

  // Update exercise status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      exerciseId, 
      status 
    }: { 
      exerciseId: string; 
      status: ReviewStatus 
    }) => {
      return apiClient.request(`/api/admin/exercises/${exerciseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      Alert.alert('Success', 'Exercise status updated successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update exercise status');
    },
  });

  const handleApprove = (exerciseId: string) => {
    Alert.alert(
      'Approve Exercise',
      'This exercise will become visible to all users. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => updateStatusMutation.mutate({ exerciseId, status: 'approved' }),
        },
      ]
    );
  };

  const handleReject = (exerciseId: string) => {
    Alert.alert(
      'Set to Draft',
      'This exercise will be hidden from regular users. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set to Draft',
          style: 'destructive',
          onPress: () => updateStatusMutation.mutate({ exerciseId, status: 'draft' }),
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    filterContainer: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    scrollContent: {
      padding: 16,
    },
    exerciseCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exerciseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    exerciseInfo: {
      flex: 1,
      marginRight: 12,
    },
    exerciseName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    exerciseMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    metaBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    metaBadgeText: {
      fontSize: 11,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusBadgeDraft: {
      backgroundColor: '#FEF3C7',
    },
    statusBadgeApproved: {
      backgroundColor: '#D1FAE5',
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statusBadgeTextDraft: {
      color: '#92400E',
    },
    statusBadgeTextApproved: {
      color: '#065F46',
    },
    confidenceScore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    confidenceScoreText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    confidenceScoreValue: {
      fontSize: 13,
      fontWeight: '600',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    approveButton: {
      backgroundColor: '#10B981',
    },
    rejectButton: {
      backgroundColor: '#EF4444',
    },
    draftButton: {
      backgroundColor: '#F59E0B',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
    statsContainer: {
      padding: 16,
      backgroundColor: colors.card,
      marginBottom: 8,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  const getConfidenceColor = (score?: number): string => {
    if (!score) return colors.textSecondary;
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const stats = {
    total: exercises.length,
    draft: exercises.filter((ex: Exercise) => ex.reviewStatus === 'draft').length,
    approved: exercises.filter((ex: Exercise) => ex.reviewStatus === 'approved').length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exercise Management</Text>
        <Text style={styles.headerSubtitle}>
          Review and approve exercises before they appear to users
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.draft}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              statusFilter === filter.value && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === filter.value && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exercise List */}
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.primary]} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="checkbox-marked-circle-outline"
              size={64}
              color={colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {statusFilter === 'draft'
                ? 'No exercises pending approval'
                : statusFilter === 'approved'
                ? 'No approved exercises yet'
                : 'No exercises found'}
            </Text>
          </View>
        ) : (
          exercises.map((exercise: Exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  
                  <View style={styles.exerciseMeta}>
                    <ExerciseSourceBadge source={exercise.source} size="small" />
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>{exercise.category}</Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>{exercise.difficulty}</Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    exercise.reviewStatus === 'draft'
                      ? styles.statusBadgeDraft
                      : styles.statusBadgeApproved,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      exercise.reviewStatus === 'draft'
                        ? styles.statusBadgeTextDraft
                        : styles.statusBadgeTextApproved,
                    ]}
                  >
                    {exercise.reviewStatus === 'draft' ? 'Draft' : 'Approved'}
                  </Text>
                </View>
              </View>

              {exercise.confidenceScore !== undefined && (
                <View style={styles.confidenceScore}>
                  <MaterialCommunityIcons
                    name="chart-line"
                    size={16}
                    color={getConfidenceColor(exercise.confidenceScore)}
                  />
                  <Text style={styles.confidenceScoreText}>
                    Confidence Score:
                  </Text>
                  <Text
                    style={[
                      styles.confidenceScoreValue,
                      { color: getConfidenceColor(exercise.confidenceScore) },
                    ]}
                  >
                    {exercise.confidenceScore}/100
                  </Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                {exercise.reviewStatus === 'draft' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(exercise.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.draftButton]}
                      onPress={() => handleReject(exercise.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Set to Draft</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
