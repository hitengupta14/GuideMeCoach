import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { spacing, typography } from '../../theme/spacing';

const LAST_UPDATED = '2026-02-04';

export default function PrivacyScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Privacy Policy" subtitle={`Last updated: ${LAST_UPDATED}`} onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.body2, { color: colors.text, lineHeight: 22 }]}>
          This Privacy Policy describes how GuideMeCoach collects, uses, and shares information. This is a starter template
          and should be reviewed by qualified legal counsel before production use.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>1. Information We Collect</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          Account data (email, name), fitness profile data (goals, experience, equipment), and health-related inputs you
          choose to provide (medical conditions, pain areas).
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>2. How We Use Information</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          To provide the service, personalize training guidance, operate subscriptions, prevent abuse, and improve product
          quality.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>3. Sharing</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          We may share data with service providers (payments, email, error monitoring) only as needed to operate the
          service.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>4. Security</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          We use reasonable security measures. No method of transmission or storage is 100% secure.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>5. Your Choices</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          You can request export or deletion of your account data from within the app settings.
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

