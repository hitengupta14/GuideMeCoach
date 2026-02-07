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

export default function AdminAiLogsScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-ai-logs'],
    queryFn: () => apiClient.adminAiLogs(100),
  });

  const requests = useMemo(() => (data as any)?.requests || [], [data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="AI Logs"
        subtitle="Recent AI usage."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh AI logs"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingView message="Loading AI logs…" />
      ) : error ? (
        <ErrorView message="Failed to load AI logs." />
      ) : requests.length === 0 ? (
        <EmptyView title="No AI logs yet" subtitle="Requests will show up here." />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
          renderItem={({ item }: any) => {
            const ok = item?.success === true;
            const statusColor = ok ? colors.success : colors.error;
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: `${statusColor}18` }]}>
                  <MaterialCommunityIcons name={ok ? 'check' : 'alert-circle-outline'} size={22} color={statusColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {item?.feature || 'feature'} • {item?.model || 'model'}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                    {typeof item?.tokensUsed === 'number' ? `${item.tokensUsed} tokens` : '—'}
                    {typeof item?.responseTime === 'number' ? ` • ${Math.round(item.responseTime)}ms` : ''}
                  </Text>
                </View>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>{formatWhen(item?.createdAt)}</Text>
              </View>
            );
          }}
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

