import React, { useMemo } from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, typography, borderRadius, shadows } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth';

const baseSections = [
  {
    title: 'AI Coach',
    items: [
      { title: 'AI Coach Chat', icon: 'message-text', route: 'ChatConversations' },
      { title: 'Planner', icon: 'robot', route: 'Planner' },
      { title: 'Form Analysis', icon: 'video', route: 'FormAnalysis' },
      { title: 'Form Feedback', icon: 'comment-text', route: 'FormFeedback' },
      { title: 'AI Insights', icon: 'brain', route: 'AiInsights' },
      { title: 'AI Hub', icon: 'sparkles', route: 'AIHub' },
    ],
  },
  {
    title: 'Health',
    items: [
      { title: 'Nutrition Guidance', icon: 'food-apple', route: 'Nutrition' },
      { title: 'Wearables', icon: 'watch-variant', route: 'Wearables' },
      { title: 'Recovery', icon: 'heart-pulse', route: 'Recovery' },
    ],
  },
  {
    title: 'Library',
    items: [
      { title: 'Plan History', icon: 'clipboard-text', route: 'Plans' },
      { title: 'Body Map', icon: 'human-male', route: 'BodyMap' },
      { title: 'Favorites', icon: 'heart', route: 'Favorites' },
      { title: 'Achievements', icon: 'trophy', route: 'Achievements' },
      { title: 'Progress V2', icon: 'chart-areaspline', route: 'ProgressV2' },
    ],
  },
  {
    title: 'Account',
    items: [
      { title: 'Subscription', icon: 'crown', route: 'SubscriptionManagement' },
      { title: 'Pricing', icon: 'tag-outline', route: 'Pricing' },
      { title: 'Settings', icon: 'cog', route: 'Settings' },
      { title: 'Tools', icon: 'calculator-variant', route: 'Tools' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { title: 'Privacy Policy', icon: 'shield-lock-outline', route: 'Privacy' },
      { title: 'Terms of Service', icon: 'file-document-outline', route: 'Terms' },
      { title: 'Medical Disclaimer', icon: 'alert-circle-outline', route: 'MedicalDisclaimer' },
    ],
  },
] as const;

export default function MoreMenuScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const isAdmin = useAuthStore((s) => Boolean(s.user?.isAdmin));

  const sections = useMemo(() => {
    const next: Array<{ title: string; items: Array<{ title: string; icon: string; route: string }> }> = [
      ...baseSections.map((s) => ({ title: s.title, items: [...s.items] })),
    ];

    if (isAdmin) {
      next.push({
        title: 'Admin',
        items: [{ title: 'Admin Dashboard', icon: 'shield-account-outline', route: 'AdminHome' }],
      });
    }

    return next;
  }, [isAdmin]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="More" subtitle="Explore more tools and features." />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={[typography.label1, styles.label, { color: colors.text }]}>{item.title}</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  section: { marginTop: spacing.lg },
  sectionTitle: { ...typography.label2, textTransform: 'uppercase', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  label: { flex: 1 },
});
