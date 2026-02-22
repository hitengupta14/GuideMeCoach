import React from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';
import ScreenHeader from '../../components/ScreenHeader';
import { EmptyView } from '../../components/State';

export default function PlansScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['plans'],
    queryFn: () => apiClient.getPlans(),
  });
  const plans: any[] = (data as any)?.plans || (Array.isArray(data) ? (data as any[]) : []);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.error }]}>Failed to load plans</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Plan History"
        subtitle={`${plans.length} saved plan${plans.length === 1 ? '' : 's'}`}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh plans"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={plans}
        keyExtractor={(item: any) => item.id || item.name}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.primary} />
        }
        renderItem={({ item }: any) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PlanDetail', { planId: item.id })}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                <MaterialCommunityIcons name="clipboard-text" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.name || 'Plan'}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.description || 'Custom plan'}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  Duration: {item.durationWeeks || item.duration || '—'} weeks
                </Text>
              </View>

              <View style={styles.cardRight}>
                {item?.isActive ? (
                  <View style={[styles.badge, { backgroundColor: `${colors.success}18` }]}>
                    <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                    <Text style={[typography.caption1, { color: colors.text, fontWeight: '700' }]}>Active</Text>
                  </View>
                ) : null}
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyView
            title="No plans yet"
            subtitle="Generate a plan in Planner to see it here."
          />
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Planner')}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons name="robot" size={18} color={colors.textInverse} />
          <Text style={[typography.label1, { color: colors.textInverse }]}>Go to Planner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  card: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...typography.heading3 },
  meta: { ...typography.body3, marginTop: spacing.xs },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { ...typography.body2 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  primaryBtn: {
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.md,
  },
});
