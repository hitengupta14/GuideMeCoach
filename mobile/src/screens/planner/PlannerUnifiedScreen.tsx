import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function PlannerUnifiedScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  const { data: todayData } = useQuery({
    queryKey: ['today'],
    queryFn: () => apiClient.getToday(),
  });

  const today: any = todayData || {};
  const hasActivePlan = Boolean(today?.hasActivePlan);
  const planName = today?.plan?.name || (hasActivePlan ? 'Active Plan' : 'No active plan');
  const nextWorkout = today?.nextWorkout;
  const nextLabel = nextWorkout?.dayName ? String(nextWorkout.dayName) : hasActivePlan ? 'No workout found' : 'Activate a plan to start';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Planner" subtitle="Generate, manage, and follow your plan." onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Home', { screen: 'Today' })}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: `${colors.success}18` }]}>
              <MaterialCommunityIcons name="calendar-check" size={22} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                Today
              </Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                {planName} • {nextLabel}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AIPlanner')}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
              <MaterialCommunityIcons name="robot" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                Generate with AI
              </Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                Create a structured plan in minutes.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Plans')}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: `${colors.warning}18` }]}>
              <MaterialCommunityIcons name="clipboard-text" size={22} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label1, { color: colors.text }]} numberOfLines={1}>
                Plan History
              </Text>
              <Text style={[typography.body3, { color: colors.textSecondary }]} numberOfLines={2}>
                View, activate, or delete saved plans.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

