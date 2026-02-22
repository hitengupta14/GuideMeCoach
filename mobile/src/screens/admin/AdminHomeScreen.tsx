import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { useAuthStore } from '../../store/auth';
import { EmptyView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';
import { apiClient } from '../../services/api';
import { getAdminPermissions } from '../../lib/admin-permissions';

type AdminItem = { title: string; subtitle: string; icon: string; route: string };

export default function AdminHomeScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = Boolean(user?.isAdmin);
  const permissions = getAdminPermissions(user?.adminRole);

  const statsQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => apiClient.adminDashboardStats(),
    enabled: isAdmin,
  });

  const stats = (statsQuery.data as any)?.stats || null;

  const adminItems: AdminItem[] = useMemo(() => {
    if (!isAdmin) return [];

    const items: AdminItem[] = [];

    if (permissions.canManageUsers || permissions.canViewAnalytics) {
      items.push({ title: 'Users', subtitle: 'Search and manage users', icon: 'account-group-outline', route: 'AdminUsers' });
    }
    if (permissions.canManageSubscriptions) {
      items.push({ title: 'Subscriptions', subtitle: 'Premium users + cancellations', icon: 'crown-outline', route: 'AdminSubscriptions' });
    }
    if (permissions.canManageSystem) {
      items.push({ title: 'Email Campaigns', subtitle: 'Send announcements to users', icon: 'email-newsletter', route: 'AdminEmailCampaigns' });
    }
    if (permissions.canManageAdmins) {
      items.push({ title: 'Admin Users', subtitle: 'Admin accounts and roles', icon: 'shield-account-outline', route: 'AdminAdminUsers' });
    }

    if (permissions.canManageExercises) {
      items.push({ title: 'Exercises', subtitle: 'Manage catalog and approvals', icon: 'dumbbell', route: 'AdminExerciseApproval' });
    }

    if (permissions.canViewAnalytics) {
      items.push({ title: 'Analytics', subtitle: 'AI requests, workouts, growth', icon: 'chart-line', route: 'AdminAnalytics' });
      items.push({ title: 'AI Monitoring', subtitle: 'Costs, success rate, feature mix', icon: 'cpu-64-bit', route: 'AdminAiMonitoring' });
      items.push({ title: 'AI Logs', subtitle: 'Recent AI requests + failures', icon: 'robot-outline', route: 'AdminAiLogs' });
      items.push({ title: 'Activity Logs', subtitle: 'Recent admin actions', icon: 'timeline-text-outline', route: 'AdminActivityLogs' });
      items.push({ title: 'Audit Logs', subtitle: 'Detailed admin actions + metadata', icon: 'file-document-outline', route: 'AdminAuditLogs' });
      items.push({ title: 'Metrics', subtitle: 'DB-backed counters (UTC)', icon: 'chart-bar', route: 'AdminMetrics' });
    }

    if (permissions.canManageSystem) {
      items.push({ title: 'System Health', subtitle: 'DB, API, AI & email checks', icon: 'heart-pulse', route: 'AdminSystemHealth' });
      items.push({ title: 'Settings', subtitle: 'Global feature toggles', icon: 'cog-outline', route: 'AdminSettings' });
    }

    return items;
  }, [isAdmin, permissions]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Admin"
        subtitle="Tools for system management."
        onBackPress={() => navigation.goBack()}
        rightAction={
          isAdmin ? (
            <TouchableOpacity
              onPress={() => statsQuery.refetch()}
              activeOpacity={0.85}
              style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
              accessibilityRole="button"
              accessibilityLabel="Refresh dashboard"
            >
              <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      {!isAdmin ? (
        <EmptyView title="Admin only" subtitle="You don’t have permission to access admin tools." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(statsQuery.isFetching)}
              onRefresh={() => statsQuery.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.label1, { color: colors.text }]}>Overview</Text>
            <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {statsQuery.isLoading ? 'Loading…' : statsQuery.error ? 'Failed to load stats.' : 'Last updated just now.'}
            </Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statTile, { backgroundColor: `${colors.primary}10` }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Users</Text>
                <Text style={[typography.heading2, { color: colors.text }]}>{stats?.totalUsers ?? '—'}</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: `${colors.success}10` }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Active (30d)</Text>
                <Text style={[typography.heading2, { color: colors.text }]}>{stats?.activeUsers ?? '—'}</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: `${colors.warning}10` }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Premium</Text>
                <Text style={[typography.heading2, { color: colors.text }]}>{stats?.premiumUsers ?? '—'}</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: `${colors.primary}10` }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>AI Today</Text>
                <Text style={[typography.heading2, { color: colors.text }]}>{stats?.aiRequestsToday ?? '—'}</Text>
              </View>
            </View>
          </View>

          {adminItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(item.route)}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}

          {adminItems.length === 0 ? (
            <EmptyView title="No tools available" subtitle="Your admin role may not be configured with permissions." />
          ) : null}
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
  statsCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
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
