import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { spacing, typography, borderRadius, shadows } from '../../theme/spacing';

const getBadgeIconName = (type?: string) => {
  switch (type) {
    case 'weight_loss':
      return 'scale-bathroom';
    case 'days_streak':
      return 'fire';
    case 'workout_count':
      return 'dumbbell';
    case 'milestone':
      return 'trophy-award';
    default:
      return 'medal';
  }
};

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const token = useAuthStore((s) => s.token);
  const { colors } = useThemeStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['badges', user?.id, token],
    enabled: !!user?.id && !!token,
    queryFn: async () => {
      try {
        await apiClient.checkAndAwardBadges(user!.id);
        return apiClient.getBadges(user!.id);
      } catch (err) {
        console.error('Failed to fetch badges:', err);
        throw err;
      }
    },
  });

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.body2, { color: colors.error }]}>Login required.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.body2, { color: colors.error }]}>Failed to load achievements</Text>
      </View>
    );
  }

  const badges = (data as any) || [];
  const earned = badges.filter((b: any) => b.earned);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.heading1, { color: colors.text }]}>Achievements</Text>
      <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        {earned.length}/{badges.length} unlocked
      </Text>
      <FlatList
        data={badges}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing['3xl'] }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: item.earned ? 1 : 0.6,
              },
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: item.earned ? `${colors.primary}1A` : `${colors.border}66`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getBadgeIconName(item.criteria?.type)}
                size={20}
                color={colors.text}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label1, { color: colors.text }]}>{item.name}</Text>
              <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {item.description}
              </Text>
              <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: spacing.xs }]}>
                {item.criteria?.type} • {item.criteria?.value}
              </Text>
            </View>
            <View
              style={[
                styles.statePill,
                { backgroundColor: item.earned ? `${colors.success}20` : `${colors.error}20` },
              ]}
            >
              <Text
                style={[
                  typography.caption2,
                  { color: item.earned ? colors.success : colors.error, fontWeight: '700' },
                ]}
              >
                {item.earned ? 'Unlocked' : 'Locked'}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
