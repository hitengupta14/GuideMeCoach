import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { spacing, typography } from '../../theme/spacing';

const LAST_UPDATED = '2026-02-04';

export default function MedicalDisclaimerScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Medical Disclaimer"
        subtitle={`Last updated: ${LAST_UPDATED}`}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.body2, { color: colors.text, lineHeight: 22 }]}>
          GuideMeCoach provides general fitness information and does not provide medical advice. Always consult a qualified
          healthcare professional before starting any new exercise program, especially if you have a medical condition or
          injury.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>Red Flags</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          Stop exercising and seek medical help if you experience chest pain, dizziness, shortness of breath, numbness,
          severe pain, or any concerning symptoms.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>Personal Responsibility</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          You are responsible for your own health decisions and for using safe technique, appropriate loads, and proper
          supervision when needed.
        </Text>
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
  h2: {
    ...typography.heading3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  p: {
    ...typography.body3,
    lineHeight: 20,
  },
});

