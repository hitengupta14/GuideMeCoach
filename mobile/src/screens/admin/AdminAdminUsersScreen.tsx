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

function formatDate(input: unknown): string {
  const d = toDate(input);
  if (!d) return '—';
  try {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d.toISOString();
  }
}

function roleBadge(role: unknown) {
  const r = String(role || '');
  if (r === 'super_admin') return 'Super Admin';
  if (r === 'content_admin') return 'Content Admin';
  if (r === 'support_admin') return 'Support Admin';
  return r || 'Unknown';
}

export default function AdminAdminUsersScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const query = useQuery({
    queryKey: ['admin-admin-users'],
    queryFn: () => apiClient.adminAdminUsers(),
  });

  const admins = useMemo(() => ((query.data as any)?.data?.admins as any[]) || [], [query.data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Admin Users"
        subtitle="Admin accounts and roles."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => query.refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh admin users"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {query.isLoading ? (
        <LoadingView message="Loading admins…" />
      ) : query.error ? (
        <ErrorView message="Failed to load admin users." />
      ) : admins.length === 0 ? (
        <EmptyView title="No admins" subtitle="No admin accounts found." />
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={Boolean(query.isFetching)} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          renderItem={({ item }: any) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                <MaterialCommunityIcons name="shield-account-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                  {String(item?.name || item?.email || 'Admin')}
                </Text>
                <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={1}>
                  {String(item?.email || '—')}
                </Text>
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  {roleBadge(item?.adminRole)} • Added {formatDate(item?.createdAt)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}12` }]}>
                <Text style={[typography.caption1, { color: colors.text }]}>{roleBadge(item?.adminRole)}</Text>
              </View>
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
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
});

