import React from 'react';
import { useThemeStore } from '../../store/theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function SubscriptionScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiClient.getSubscriptionStatus(),
  });

  // API returns { plan: string, status: string }
  const subData = (subscription as any) || {};

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['4xl'] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: `${colors.warning}18` }]}>
          <MaterialCommunityIcons name="crown" size={34} color={colors.warning} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Subscription</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Upgrade to Premium to unlock AI features.
        </Text>
      </View>

      <View style={[styles.currentPlan, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.currentPlanLabel, { color: colors.textSecondary }]}>Current Plan</Text>
        <Text style={[styles.currentPlanName, { color: colors.text }]}>{subData.plan || 'Free'}</Text>
        <Text style={[styles.currentPlanDetails, { color: colors.textSecondary }]}>
          Status: {subData.status || 'Active'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('More', { screen: 'Pricing' })}
      >
        <MaterialCommunityIcons name="star" size={18} color={colors.textInverse} />
        <Text style={[styles.ctaText, { color: colors.textInverse }]}>View Plans</Text>
      </TouchableOpacity>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="information"
          size={16}
          color={colors.primary}
        />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Cancel anytime. No long-term commitment required.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.heading1, marginBottom: spacing.xs },
  subtitle: { ...typography.body3, textAlign: 'center' },
  currentPlan: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    ...shadows.md,
  },
  currentPlanLabel: { ...typography.caption1, marginBottom: spacing.xs },
  currentPlanName: { ...typography.heading2, marginBottom: spacing.xs },
  currentPlanDetails: { ...typography.body3, marginTop: spacing.xs },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginTop: spacing.lg,
    ...shadows.lg,
  },
  ctaText: { ...typography.label1, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  infoText: {
    marginLeft: spacing.sm,
    ...typography.caption1,
  },
});
