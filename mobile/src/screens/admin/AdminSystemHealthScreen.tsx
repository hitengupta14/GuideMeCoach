import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

type HealthStatus = 'healthy' | 'warning' | 'error';

function statusColor(status: HealthStatus, colors: any) {
  if (status === 'healthy') return colors.success;
  if (status === 'warning') return colors.warning;
  return colors.error;
}

export default function AdminSystemHealthScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => apiClient.adminSystemHealth(),
  });

  const items = useMemo(() => {
    const d: any = data || {};
    return [
      { key: 'database', label: 'Database', icon: 'database', status: d?.database?.status, message: d?.database?.message },
      { key: 'api', label: 'API', icon: 'server', status: d?.api?.status, message: d?.api?.message },
      { key: 'ai', label: 'AI', icon: 'robot', status: d?.ai?.status, message: d?.ai?.message },
      { key: 'email', label: 'Email', icon: 'email-outline', status: d?.email?.status, message: d?.email?.message },
    ] as Array<{ key: string; label: string; icon: string; status: HealthStatus; message: string }>;
  }, [data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="System Health"
        subtitle="Quick checks across services."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh health"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingView message="Checking health…" />
      ) : error ? (
        <ErrorView message="Failed to load system health." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => {
            const c = statusColor(item.status, colors);
            return (
              <View key={item.key} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: `${c}18` }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={c} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.message || '—'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: `${c}18` }]}>
                  <Text style={[typography.caption1, { color: colors.text, fontWeight: '700' }]}>{item.status}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
});

