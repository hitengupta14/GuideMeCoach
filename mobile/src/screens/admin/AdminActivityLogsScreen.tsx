import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

function toDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  const parsed = new Date(String(input));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWhen(input: unknown): string {
  const d = toDate(input);
  if (!d) return '—';
  try {
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return d.toISOString();
  }
}

export default function AdminActivityLogsScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: () => apiClient.adminActivityLogs(100),
  });

  const activities = useMemo(() => (data as any)?.activities || [], [data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Activity Logs"
        subtitle="Recent admin actions."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh logs"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingView message="Loading logs…" />
      ) : error ? (
        <ErrorView message="Failed to load activity logs." />
      ) : activities.length === 0 ? (
        <EmptyView title="No activity yet" subtitle="Admin actions will show up here." />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
          renderItem={({ item }: any) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                <MaterialCommunityIcons name="shield-account-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                  {item?.adminName || 'Admin'} • {item?.action || 'action'}
                </Text>
                <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item?.targetType ? `${item.targetType}` : '—'}
                  {item?.targetId ? ` • ${item.targetId}` : ''}
                </Text>
              </View>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>{formatWhen(item?.createdAt)}</Text>
            </View>
          )}
        />
      )}
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

