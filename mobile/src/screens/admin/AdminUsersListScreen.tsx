import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { EmptyView, ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

type UserFilter = 'all' | 'premium' | 'admin' | 'unverified' | 'blocked' | 'deleted';

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
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d.toISOString();
  }
}

function initial(name?: string | null, email?: string | null) {
  const v = (name || email || '').trim();
  return v ? v[0]?.toUpperCase() : 'U';
}

const FILTERS: Array<{ key: UserFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'premium', label: 'Premium' },
  { key: 'admin', label: 'Admins' },
  { key: 'unverified', label: 'Unverified' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'deleted', label: 'Deleted' },
];

export default function AdminUsersListScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const usersQuery = useQuery({
    queryKey: ['admin-users', search, filter, page],
    queryFn: () => apiClient.adminListUsers({ search, filter, page, pageSize }),
  });

  const payload = (usersQuery.data as any)?.data || {};
  const users = (payload?.users as any[]) || [];
  const total = Number(payload?.totalUsers || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onSubmitSearch = () => {
    const next = searchInput.trim();
    setSearch(next);
    setPage(1);
  };

  const filterChips = useMemo(() => {
    return (
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.85}
              onPress={() => {
                setFilter(f.key);
                setPage(1);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? `${colors.primary}18` : colors.card,
                  borderColor: active ? `${colors.primary}55` : colors.border,
                },
              ]}
            >
              <Text style={[typography.caption1, { color: active ? colors.primary : colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [colors, filter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Users"
        subtitle="Search and manage users."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => usersQuery.refetch()}
            activeOpacity={0.85}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh users"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={[styles.searchWrap, { paddingHorizontal: spacing.lg }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search name or email"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={onSubmitSearch}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSubmitSearch}
            style={[styles.searchBtn, { backgroundColor: `${colors.primary}16` }]}
          >
            <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {filterChips}
      </View>

      {usersQuery.isLoading ? (
        <LoadingView message="Loading users…" />
      ) : usersQuery.error ? (
        <ErrorView message="Failed to load users." />
      ) : users.length === 0 ? (
        <EmptyView title="No users found" subtitle="Try changing filters or your search." />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item: any) => String(item?.id)}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={Boolean(usersQuery.isFetching)} onRefresh={() => usersQuery.refetch()} tintColor={colors.primary} />
          }
          renderItem={({ item }: any) => {
            const name = item?.name as string | null;
            const email = item?.email as string | null;
            const status = String(item?.status || '—');
            const isPremium = Boolean(item?.isPremium);
            const isAdmin = Boolean(item?.isAdmin);
            const verified = Boolean(item?.emailVerified);
            const recentWorkouts = Number(item?.recentWorkouts || 0);
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id })}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.avatar, { backgroundColor: `${colors.primary}14` }]}>
                  <Text style={[typography.label1, { color: colors.primary }]}>{initial(name, email)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                    {name || email || 'User'}
                  </Text>
                  <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={1}>
                    {email || '—'}
                  </Text>

                  <View style={styles.badges}>
                    {isPremium ? (
                      <View style={[styles.badge, { backgroundColor: `${colors.warning}18` }]}>
                        <Text style={[typography.caption1, { color: colors.text }]}>Premium</Text>
                      </View>
                    ) : null}
                    {isAdmin ? (
                      <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
                        <Text style={[typography.caption1, { color: colors.text }]}>Admin</Text>
                      </View>
                    ) : null}
                    <View style={[styles.badge, { backgroundColor: `${verified ? colors.success : colors.textTertiary}18` }]}>
                      <Text style={[typography.caption1, { color: colors.text }]}>
                        {verified ? 'Verified' : 'Unverified'}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: `${status === 'blocked' ? colors.error : colors.textTertiary}18` }]}>
                      <Text style={[typography.caption1, { color: colors.text }]}>{status}</Text>
                    </View>
                  </View>

                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                    {recentWorkouts} workouts (30d) • Joined {formatWhen(item?.createdAt)}
                  </Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.footer}>
                <Text style={[typography.body3, { color: colors.textSecondary }]}>
                  Page {page} / {totalPages} • {total} users
                </Text>
                <View style={styles.footerBtns}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={[
                      styles.footerBtn,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: page <= 1 ? 0.5 : 1 },
                    ]}
                  >
                    <Text style={[typography.label2, { color: colors.text }]}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    style={[
                      styles.footerBtn,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: page >= totalPages ? 0.5 : 1 },
                    ]}
                  >
                    <Text style={[typography.label2, { color: colors.text }]}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ height: spacing['3xl'] }} />
            )
          }
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
  searchWrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  searchInput: {
    flex: 1,
    ...typography.body2,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  avatar: {
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
  footer: {
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerBtns: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerBtn: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.md,
  },
});

