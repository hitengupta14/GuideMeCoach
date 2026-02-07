import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

type Audience = { segment: 'all' | 'premium' | 'inactive' | 'new_users'; days?: number };

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
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return d.toISOString();
  }
}

function formatAudience(a: Audience): string {
  switch (a.segment) {
    case 'all':
      return 'All users';
    case 'premium':
      return 'Premium users';
    case 'inactive':
      return `Inactive${a.days ? ` (${a.days}d)` : ''}`;
    case 'new_users':
      return `New users${a.days ? ` (${a.days}d)` : ''}`;
  }
}

function badgeColor(status: string, colors: any) {
  if (status === 'sent') return `${colors.success}18`;
  if (status === 'sending') return `${colors.primary}18`;
  if (status === 'failed') return `${colors.error}18`;
  return `${colors.textTertiary}18`;
}

export default function AdminEmailCampaignsScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const query = useQuery({
    queryKey: ['admin-email-campaigns'],
    queryFn: () => apiClient.adminEmailCampaigns(),
  });

  const campaigns = useMemo(() => ((query.data as any)?.campaigns as any[]) || [], [query.data]);

  const stats = useMemo(() => {
    const totalRecipients = campaigns.reduce((sum, c) => sum + (Number(c?.recipientCount) || 0), 0);
    const totalSent = campaigns.reduce((sum, c) => sum + (Number(c?.sentCount) || 0), 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + (Number(c?.failedCount) || 0), 0);
    return { totalRecipients, totalSent, totalFailed };
  }, [campaigns]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Email Campaigns"
        subtitle="Create and send email campaigns."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminCreateEmailCampaign')}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="New campaign"
          >
            <MaterialCommunityIcons name="plus" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {query.isLoading ? (
        <LoadingView message="Loading campaigns…" />
      ) : query.error ? (
        <ErrorView message="Failed to load campaigns." />
      ) : campaigns.length === 0 ? (
        <EmptyView title="No campaigns yet" subtitle="Create your first campaign to engage users." />
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={Boolean(query.isFetching)} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.label1, { color: colors.text }]}>Overview</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statTile, { backgroundColor: `${colors.primary}10` }]}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Campaigns</Text>
                  <Text style={[typography.heading2, { color: colors.text }]}>{campaigns.length}</Text>
                </View>
                <View style={[styles.statTile, { backgroundColor: `${colors.success}10` }]}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Recipients</Text>
                  <Text style={[typography.heading2, { color: colors.text }]}>{stats.totalRecipients}</Text>
                </View>
                <View style={[styles.statTile, { backgroundColor: `${colors.primary}10` }]}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Sent</Text>
                  <Text style={[typography.heading2, { color: colors.text }]}>{stats.totalSent}</Text>
                </View>
                <View style={[styles.statTile, { backgroundColor: `${colors.error}10` }]}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Failed</Text>
                  <Text style={[typography.heading2, { color: colors.text }]}>{stats.totalFailed}</Text>
                </View>
              </View>
            </View>
          }
          renderItem={({ item }: any) => {
            const status = String(item?.status || 'draft');
            const audience = (item?.audience || { segment: 'all' }) as Audience;
            return (
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {String(item?.name || 'Campaign')}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                    {String(item?.subject || '—')}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                    {formatAudience(audience)} • {formatWhen(item?.createdAt)}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badgeColor(status, colors) }]}>
                  <Text style={[typography.caption1, { color: colors.text }]}>{status}</Text>
                </View>
              </View>
            );
          }}
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
  statsCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
  row: {
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

