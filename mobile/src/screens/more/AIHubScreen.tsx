import React from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { spacing, typography, borderRadius, shadows } from '../../theme/spacing';

const features = [
  { title: 'Progress Insights', desc: 'AI summaries of your progress', route: 'AiInsights' },
  { title: 'Form Feedback', desc: 'Text consultation for your lifts', route: 'FormFeedback' },
  { title: 'Recovery Coach', desc: 'Rest day guidance and routines', route: 'Recovery' },
  { title: 'Adaptive Planner', desc: 'AI-generated workout plans', route: 'Planner' },
];

export default function AIHubScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.heading1, { color: colors.text }]}>AI Features</Text>
      <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Overview of AI capabilities.
      </Text>
      <FlatList
        data={features}
        keyExtractor={(item) => item.title}
        contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.heading3, { color: colors.text }]}>{item.title}</Text>
            <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.xs }]}>{item.desc}</Text>
            <Text style={[styles.link, { color: colors.primary }]} onPress={() => navigation.navigate(item.route)}>
              Open →
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.md,
  },
  link: { marginTop: spacing.md, fontWeight: '700' },
});
