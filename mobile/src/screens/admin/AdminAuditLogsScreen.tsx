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
  const d = new Date(String(input));
  return Number.isNaN(d.getTime()) ? null : d;
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

function stringifyMeta(meta: any): string {
  if (!meta) return '—';
  try {
    const txt = JSON.stringify(meta);
    if (txt.length <= 160) return txt;
    return `${txt.slice(0, 160)}…`;
  } catch {
    return '—';
  }
}

export default function AdminAuditLogsScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const query = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => apiClient.adminAuditLogs(200),
  });

  const logs = useMemo(() => ((query.data as any)?.data?.logs as any[]) || [], [query.data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Audit Logs"
        subtitle="Detailed admin actions."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => query.refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh audit logs"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {query.isLoading ? (
        <LoadingView message="Loading audit logs…" />
      ) : query.error ? (
        <ErrorView message="Failed to load audit logs." />
      ) : logs.length === 0 ? (
        <EmptyView title="No logs" subtitle="No admin actions recorded yet." />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={Boolean(query.isFetching)} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          renderItem={({ item }: any) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                  {String(item?.adminName || item?.adminEmail || 'Admin')} • {String(item?.action || 'action')}
                </Text>
                <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item?.targetType ? String(item.targetType) : '—'}
                  {item?.targetId ? ` • ${String(item.targetId)}` : ''}
                </Text>
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]} numberOfLines={2}>
                  {stringifyMeta(item?.metadata)}
                </Text>
              </View>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>{formatWhen(item?.createdAt)}</Text>
            </View>
          )}
          ListFooterComponent={<View style={{ height: spacing['4xl'] }} />}
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

