import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

function daysUntil(input: unknown): number | null {
  const d = toDate(input);
  if (!d) return null;
  const now = Date.now();
  return Math.ceil((d.getTime() - now) / (1000 * 60 * 60 * 24));
}

export default function AdminSubscriptionsScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => apiClient.adminSubscriptions(),
  });

  const payload = (query.data as any)?.data || {};
  const stats = payload?.stats || null;
  const filtered = useMemo(() => {
    const users = (payload?.users as any[]) || [];
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = String(u?.email || '').toLowerCase();
      const name = String(u?.name || '').toLowerCase();
      return email.includes(q) || name.includes(q);
    });
  }, [payload?.users, search]);

  const users = useMemo(() => (payload?.users as any[]) || [], [payload?.users]);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      return apiClient.adminCancelUserSubscription(selectedUserId, reason || undefined);
    },
    onSuccess: async () => {
      setSelectedUserId(null);
      setReason('');
      await queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      Alert.alert('Done', 'Subscription cancelled.');
    },
    onError: (e: any) => {
      const message = e?.data?.error || e?.message || 'Failed to cancel subscription.';
      Alert.alert('Error', message);
    },
  });

  const closeModal = () => {
    setSelectedUserId(null);
    setReason('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Subscriptions"
        subtitle="Manage premium access."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => query.refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh subscriptions"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {query.isLoading ? (
        <LoadingView message="Loading subscriptions…" />
      ) : query.error ? (
        <ErrorView message="Failed to load subscriptions." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={Boolean(query.isFetching)} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View>
              <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[typography.label1, { color: colors.text }]}>Overview</Text>
                <View style={styles.statsGrid}>
                  <View style={[styles.statTile, { backgroundColor: `${colors.primary}10` }]}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>Total</Text>
                    <Text style={[typography.heading2, { color: colors.text }]}>{stats?.totalPremiumUsers ?? users.length}</Text>
                  </View>
                  <View style={[styles.statTile, { backgroundColor: `${colors.success}10` }]}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>Active</Text>
                    <Text style={[typography.heading2, { color: colors.text }]}>{stats?.activeSubscriptions ?? '—'}</Text>
                  </View>
                  <View style={[styles.statTile, { backgroundColor: `${colors.error}10` }]}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>Expired</Text>
                    <Text style={[typography.heading2, { color: colors.text }]}>{stats?.expiredSubscriptions ?? '—'}</Text>
                  </View>
                  <View style={[styles.statTile, { backgroundColor: `${colors.warning}10` }]}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>Blocked</Text>
                    <Text style={[typography.heading2, { color: colors.text }]}>{stats?.blockedPremiumUsers ?? '—'}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by name or email"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.searchInput, { color: colors.text }]}
                  autoCapitalize="none"
                />
              </View>

              {filtered.length === 0 ? (
                <EmptyView title="No premium users" subtitle="No users match this filter." />
              ) : (
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  Showing {filtered.length} premium user{filtered.length === 1 ? '' : 's'}
                </Text>
              )}
            </View>
          }
          renderItem={({ item }: any) => {
            const email = String(item?.email || '—');
            const name = String(item?.name || '—');
            const endsAt = item?.subscriptionEndsAt;
            const d = toDate(endsAt);
            const now = new Date();
            const expired = d ? d.getTime() <= now.getTime() : false;
            const days = daysUntil(endsAt);
            const blocked = String(item?.status) === 'blocked';

            return (
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: `${colors.warning}14` }]}>
                  <MaterialCommunityIcons name="crown" size={20} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={1}>
                    {email}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                    Expires: {formatDate(endsAt)}{days !== null && days > 0 ? ` • ${days}d left` : ''}
                  </Text>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: `${expired ? colors.error : colors.success}18` }]}>
                      <Text style={[typography.caption1, { color: colors.text }]}>{expired ? 'Expired' : 'Active'}</Text>
                    </View>
                    {blocked ? (
                      <View style={[styles.badge, { backgroundColor: `${colors.warning}18` }]}>
                        <Text style={[typography.caption1, { color: colors.text }]}>Blocked</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedUserId(String(item?.id));
                  }}
                  style={[styles.actionIconBtn, { backgroundColor: `${colors.error}10` }]}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel subscription"
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
          ListFooterComponent={<View style={{ height: spacing['4xl'] }} />}
        />
      )}

      <Modal visible={Boolean(selectedUserId)} animationType="fade" transparent onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.heading3, { color: colors.text }]}>Cancel subscription</Text>
            <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              This immediately cancels premium for the user.
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              multiline
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={closeModal}
                style={[styles.modalBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[typography.label1, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                style={[
                  styles.modalBtnPrimary,
                  { backgroundColor: colors.error, opacity: cancelMutation.isPending ? 0.8 : 1 },
                ]}
              >
                <Text style={[typography.label1, { color: colors.textInverse }]}>
                  {cancelMutation.isPending ? 'Working…' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    height: 52,
    marginTop: spacing.lg,
  },
  searchInput: {
    flex: 1,
    ...typography.body2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginTop: spacing.md,
    ...shadows.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    ...typography.body2,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

