import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';
import { config } from '../../config/api';

type AccessInfo = {
  hasAccess?: boolean;
  isPremium?: boolean;
  planType?: 'premium' | 'premium-yearly' | 'none' | string;
  subscriptionEndsAt?: string | null;
  daysRemaining?: number;
  isExpired?: boolean;
  message?: string;
  pendingPlanType?: string | null;
  pendingPlanStartsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: string | null;
  willRenew?: boolean;
};

function formatPlan(planType: unknown): string {
  const p = String(planType || 'none');
  if (p === 'premium-yearly') return 'Premium Yearly';
  if (p === 'premium') return 'Premium Monthly';
  return 'Free';
}

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

export default function SubscriptionManagementScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => apiClient.getSubscriptionStatus(),
  });

  const historyQuery = useQuery({
    queryKey: ['subscription-history'],
    queryFn: () => apiClient.getSubscriptionHistory(25),
  });

  const paymentsQuery = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: () => apiClient.getSubscriptionPayments(25),
  });

  const access: AccessInfo = (statusQuery.data as any) || {};
  const history: any[] = (historyQuery.data as any)?.history || [];
  const payments: any[] = (paymentsQuery.data as any)?.payments || [];

  const cancelMutation = useMutation({
    mutationFn: async () => apiClient.cancelSubscription(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription-history'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription-payments'] }),
      ]);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => apiClient.resumeSubscription(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription-history'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription-payments'] }),
      ]);
    },
  });

  const refetchAll = async () => {
    await Promise.all([statusQuery.refetch(), historyQuery.refetch(), paymentsQuery.refetch()]);
  };

  const isPremium = Boolean(access?.isPremium);
  const planLabel = formatPlan(access?.planType);
  const endsAtLabel = access?.subscriptionEndsAt ? formatDate(access.subscriptionEndsAt) : '—';
  const showResume = Boolean(access?.cancelAtPeriodEnd && access?.isPremium);

  const pendingLabel = useMemo(() => {
    if (!access?.pendingPlanType) return null;
    const when = access?.pendingPlanStartsAt ? formatDate(access.pendingPlanStartsAt) : '—';
    return `${formatPlan(access.pendingPlanType)} starting ${when}`;
  }, [access?.pendingPlanType, access?.pendingPlanStartsAt]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Subscription" subtitle="Manage billing and access." onBackPress={() => navigation.goBack()} />

      {statusQuery.isLoading ? (
        <LoadingView message="Loading subscription…" />
      ) : statusQuery.error ? (
        <ErrorView message="Failed to load subscription." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(statusQuery.isFetching || historyQuery.isFetching)}
              onRefresh={refetchAll}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.warning}18` }]}>
                <MaterialCommunityIcons name="crown" size={22} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                  {planLabel}
                </Text>
                <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                  {access?.message || (isPremium ? 'Premium active' : 'Free plan')}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.metaChip, { backgroundColor: `${colors.primary}14` }]}>
                <MaterialCommunityIcons name="calendar" size={14} color={colors.primary} />
                <Text style={[typography.caption1, { color: colors.text, fontWeight: '700' }]}>Renews/Ends: {endsAtLabel}</Text>
              </View>
              {pendingLabel ? (
                <View style={[styles.metaChip, { backgroundColor: `${colors.warning}18` }]}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={colors.warning} />
                  <Text style={[typography.caption1, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
                    {pendingLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Pricing')}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="tag-outline" size={18} color={colors.textInverse} />
              <Text style={[typography.label1, { color: colors.textInverse }]}>
                {isPremium ? 'Change plan' : 'Upgrade'}
              </Text>
            </TouchableOpacity>

            {isPremium ? (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={cancelMutation.isPending}
                onPress={() => {
                  Alert.alert(
                    'Cancel subscription?',
                    'You’ll keep premium access until your current period ends.',
                    [
                      { text: 'Keep', style: 'cancel' },
                      {
                        text: cancelMutation.isPending ? 'Cancelling…' : 'Cancel',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await cancelMutation.mutateAsync();
                            Alert.alert('Requested', 'Cancellation requested successfully.');
                          } catch {
                            Alert.alert('Error', 'Failed to cancel subscription.');
                          }
                        },
                      },
                    ]
                  );
                }}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: cancelMutation.isPending ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.error} />
                <Text style={[typography.label1, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            ) : null}

            {showResume ? (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={resumeMutation.isPending}
                onPress={async () => {
                  try {
                    await resumeMutation.mutateAsync();
                    Alert.alert('Resumed', 'Your subscription will continue renewing automatically.');
                  } catch {
                    Alert.alert('Error', 'Failed to resume subscription.');
                  }
                }}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: resumeMutation.isPending ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name="autorenew" size={18} color={colors.primary} />
                <Text style={[typography.label1, { color: colors.text }]}>Resume</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
            Billing history
          </Text>

          {historyQuery.isLoading ? (
            <LoadingView message="Loading history…" />
          ) : historyQuery.error ? (
            <ErrorView message="Failed to load billing history." />
          ) : history.length === 0 ? (
            <EmptyView title="No billing history yet" subtitle="Your subscription events will appear here." />
          ) : (
            history.slice(0, 25).map((row: any) => (
              <View
                key={String(row?.id)}
                style={[styles.historyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.historyIcon, { backgroundColor: `${colors.primary}14` }]}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {(row?.planName || planLabel) as string}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                    {String(row?.action || 'event')} • {formatDate(row?.createdAt)}
                  </Text>
                </View>
                <Text style={[typography.label2, { color: colors.text }]}>
                  {formatMoney(row?.amount, row?.currency)}
                </Text>
              </View>
            ))
          )}

          <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Invoices</Text>

          {paymentsQuery.isLoading ? (
            <LoadingView message="Loading invoices…" />
          ) : paymentsQuery.error ? (
            <ErrorView message="Failed to load invoices." />
          ) : payments.length === 0 ? (
            <EmptyView title="No invoices yet" subtitle="Invoices appear after a successful payment." />
          ) : (
            payments.slice(0, 25).map((row: any) => (
              <View
                key={String(row?.id)}
                style={[styles.historyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.historyIcon, { backgroundColor: `${colors.primary}14` }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {String(row?.provider || 'Payment')}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                    {String(row?.status || 'paid')} • {formatDate(row?.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={async () => {
                    const paymentId = String(row?.id || '');
                    if (!paymentId) {
                      Alert.alert('Error', 'Invoice not available.');
                      return;
                    }

                    try {
                      const url = `${apiClient.baseURL}/v1/subscription/invoices/${encodeURIComponent(paymentId)}`;
                      const fileUri = `${FileSystem.documentDirectory}guidemecoach-invoice-${paymentId}.pdf`;
                      const { uri } = await FileSystem.downloadAsync(url, fileUri, {
                        headers: {
                          ...(config.headers as any),
                        },
                      });

                      if (Platform.OS === 'android') {
                        const contentUri = await FileSystem.getContentUriAsync(uri);
                        await Linking.openURL(contentUri);
                      } else {
                        await Linking.openURL(uri);
                      }
                    } catch {
                      Alert.alert('Error', 'Failed to open invoice PDF.');
                    }
                  }}
                  style={[styles.invoiceBtn, { backgroundColor: `${colors.primary}14` }]}
                >
                  <MaterialCommunityIcons name="open-in-new" size={16} color={colors.primary} />
                  <Text style={[typography.caption1, { color: colors.primary }]}>View</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Privacy')}
            style={[styles.linkRow, { borderColor: colors.border }]}
          >
            <Text style={[typography.body3, { color: colors.textSecondary }]}>
              By subscribing you agree to our Terms and Privacy.
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  ctaRow: {
    marginTop: spacing.md,
    gap: spacing.md,
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
  secondaryBtn: {
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    ...shadows.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  linkRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

