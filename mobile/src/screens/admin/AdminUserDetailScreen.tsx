import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';
import { getAdminPermissions } from '../../lib/admin-permissions';

type RouteParams = {
  AdminUserDetail: { userId: string };
};

type ActionKind =
  | 'block'
  | 'unblock'
  | 'cancel_sub'
  | 'delete_soft'
  | 'delete_hard'
  | 'verify_email'
  | 'grant_monthly'
  | 'grant_yearly';

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

function formatMoney(amountCents: unknown, currency: unknown): string {
  const amount = typeof amountCents === 'number' ? amountCents : Number(amountCents);
  const curr = typeof currency === 'string' ? currency : 'INR';
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: curr === 'INR' ? 0 : 2,
      minimumFractionDigits: curr === 'INR' ? 0 : 2,
    }).format(amount / 100);
  } catch {
    return `${curr} ${(amount / 100).toFixed(curr === 'INR' ? 0 : 2)}`;
  }
}

export default function AdminUserDetailScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const route = useRoute<RouteProp<RouteParams, 'AdminUserDetail'>>();
  const queryClient = useQueryClient();
  const adminRole = useAuthStore((s) => s.user?.adminRole as string | null);
  const permissions = getAdminPermissions(adminRole as any);

  const userId = route.params?.userId;

  const userQuery = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => apiClient.adminGetUser(userId),
    enabled: Boolean(userId),
  });

  const user = (userQuery.data as any)?.user || null;
  const recentWorkoutCount = Number(user?.recentWorkoutCount || 0);
  const subHistory: any[] = (user?.subscriptionHistory as any[]) || [];

  const [action, setAction] = useState<ActionKind | null>(null);
  const [reason, setReason] = useState('');

  const closeModal = () => {
    setAction(null);
    setReason('');
  };

  const perform = useMutation({
    mutationFn: async () => {
      if (!action) return;
      if (action === 'block') return apiClient.adminBlockUser(userId, reason || undefined);
      if (action === 'unblock') return apiClient.adminUnblockUser(userId, reason || undefined);
      if (action === 'cancel_sub') return apiClient.adminCancelUserSubscription(userId, reason || undefined);
      if (action === 'delete_soft') return apiClient.adminDeleteUser(userId, { reason: reason || undefined, type: 'soft' });
      if (action === 'delete_hard') return apiClient.adminDeleteUser(userId, { reason: reason || undefined, type: 'hard' });
      if (action === 'verify_email') return apiClient.adminVerifyUserEmail(userId, { verified: true, reason: reason || undefined });
      if (action === 'grant_monthly') return apiClient.adminGrantUserSubscription(userId, { planType: 'premium', reason: reason || undefined });
      if (action === 'grant_yearly') return apiClient.adminGrantUserSubscription(userId, { planType: 'premium-yearly', reason: reason || undefined });
      return;
    },
    onSuccess: async () => {
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      Alert.alert('Done', 'Action completed successfully.');
    },
    onError: (e: any) => {
      const message = e?.data?.error || e?.message || 'Failed to perform action.';
      Alert.alert('Error', message);
    },
  });

  const actionLabel = useMemo(() => {
    switch (action) {
      case 'block':
        return 'Block user';
      case 'unblock':
        return 'Unblock user';
      case 'cancel_sub':
        return 'Cancel subscription';
      case 'delete_soft':
        return 'Soft delete user';
      case 'delete_hard':
        return 'Hard delete user';
      case 'verify_email':
        return 'Verify email';
      case 'grant_monthly':
        return 'Grant monthly subscription';
      case 'grant_yearly':
        return 'Grant yearly subscription';
      default:
        return '';
    }
  }, [action]);

  const showHardDelete = adminRole === 'super_admin' && permissions.canManageUsers;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="User Details"
        subtitle={user?.email ? String(user.email) : 'Admin view'}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => userQuery.refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh user"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {userQuery.isLoading ? (
        <LoadingView message="Loading user…" />
      ) : userQuery.error ? (
        <ErrorView message="Failed to load user." />
      ) : !user ? (
        <EmptyView title="User not found" subtitle="This user may have been deleted." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={Boolean(userQuery.isFetching)} onRefresh={() => userQuery.refetch()} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.heading3, { color: colors.text }]}>
              {user?.name ? String(user.name) : '—'}
            </Text>
            <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>{String(user.email || '—')}</Text>

            <View style={styles.metaRow}>
              <View style={[styles.metaChip, { backgroundColor: `${colors.primary}12` }]}>
                <MaterialCommunityIcons name="identifier" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption1, { color: colors.textSecondary }]} numberOfLines={1}>
                  {String(user.id)}
                </Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: `${colors.textTertiary}12` }]}>
                <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                  Joined {formatWhen(user.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.label1, { color: colors.text }]}>Account</Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>Status: {String(user.status || '—')}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>
                Email verified: {user.emailVerified ? 'Yes' : 'No'}
              </Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>
                Admin: {user.isAdmin ? String(user.adminRole || 'Yes') : 'No'}
              </Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>
                Recent workouts (30d): {recentWorkoutCount}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.label1, { color: colors.text }]}>Subscription</Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>
                Premium: {user.isPremium ? 'Yes' : 'No'}
              </Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]}>
                Ends at: {formatWhen(user.subscriptionEndsAt)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            {permissions.canManageUsers ? (
              String(user.status) === 'blocked' ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setAction('unblock');
                  }}
                  style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons name="lock-open-outline" size={18} color={colors.success} />
                  <Text style={[typography.label2, { color: colors.text }]}>Unblock</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setAction('block')}
                  style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons name="lock-outline" size={18} color={colors.warning} />
                  <Text style={[typography.label2, { color: colors.text }]}>Block</Text>
                </TouchableOpacity>
              )
            ) : null}

            {permissions.canManageUsers && !user.emailVerified ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAction('verify_email')}
                style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="email-check-outline" size={18} color={colors.success} />
                <Text style={[typography.label2, { color: colors.text }]}>Verify email</Text>
              </TouchableOpacity>
            ) : null}

            {permissions.canManageSubscriptions && Boolean(user.isPremium) ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAction('cancel_sub')}
                style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.error} />
                <Text style={[typography.label2, { color: colors.text }]}>Cancel sub</Text>
              </TouchableOpacity>
            ) : null}

            {permissions.canManageSubscriptions ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAction('grant_monthly')}
                style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="crown-outline" size={18} color={colors.primary} />
                <Text style={[typography.label2, { color: colors.text }]}>Grant month</Text>
              </TouchableOpacity>
            ) : null}

            {permissions.canManageSubscriptions ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAction('grant_yearly')}
                style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="crown" size={18} color={colors.primary} />
                <Text style={[typography.label2, { color: colors.text }]}>Grant year</Text>
              </TouchableOpacity>
            ) : null}

            {permissions.canManageUsers ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAction('delete_soft')}
                style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                <Text style={[typography.label2, { color: colors.text }]}>Delete</Text>
              </TouchableOpacity>
            ) : null}

            {showHardDelete ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAction('delete_hard')}
                style={[styles.actionBtn, { backgroundColor: `${colors.error}10`, borderColor: `${colors.error}35` }]}
              >
                <MaterialCommunityIcons name="alert-octagon-outline" size={18} color={colors.error} />
                <Text style={[typography.label2, { color: colors.text }]}>Hard delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
            Subscription history
          </Text>

          {subHistory.length === 0 ? (
            <EmptyView title="No subscription history" subtitle="No billing events recorded for this user." />
          ) : (
            subHistory.slice(0, 100).map((row: any) => (
              <View key={String(row?.id)} style={[styles.historyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.historyIcon, { backgroundColor: `${colors.primary}14` }]}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {String(row?.planName || row?.action || 'event')}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                    {String(row?.action || 'event')} • {formatWhen(row?.createdAt)}
                  </Text>
                </View>
                <Text style={[typography.label2, { color: colors.text }]}>{formatMoney(row?.amount, row?.currency)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={Boolean(action)} animationType="fade" transparent onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.heading3, { color: colors.text }]}>{actionLabel}</Text>
            <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Optional: add a reason (helps audits).
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
                onPress={() => {
                  if (action === 'delete_hard') {
                    Alert.alert(
                      'Hard delete user?',
                      'This is permanent and will cascade-delete data. Continue?',
                      [
                        { text: 'No', style: 'cancel' },
                        { text: 'Yes, delete', style: 'destructive', onPress: () => perform.mutate() },
                      ]
                    );
                    return;
                  }
                  perform.mutate();
                }}
                disabled={perform.isPending}
                style={[
                  styles.modalBtnPrimary,
                  { backgroundColor: colors.primary, opacity: perform.isPending ? 0.8 : 1 },
                ]}
              >
                <Text style={[typography.label1, { color: colors.textInverse }]}>
                  {perform.isPending ? 'Working…' : 'Confirm'}
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
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  metaRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flexGrow: 1,
    flexBasis: '47%',
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
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
