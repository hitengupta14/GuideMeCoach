import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { spacing, typography } from '../../theme/spacing';

const LAST_UPDATED = '2026-02-04';

export default function TermsScreen({ navigation }: any) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Terms of Service" subtitle={`Last updated: ${LAST_UPDATED}`} onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.body2, { color: colors.text, lineHeight: 22 }]}>
          These Terms govern your use of GuideMeCoach. This is a starter template and should be reviewed by qualified legal
          counsel before production use.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>1. Use of Service</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          You agree to use the service lawfully and not to abuse, reverse engineer, or disrupt the platform.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>2. Subscriptions</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          Paid plans provide premium access subject to billing and renewal terms displayed at checkout.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>3. Disclaimer</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          The service provides general fitness information and is not a substitute for professional medical advice.
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>4. Limitation of Liability</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          To the maximum extent permitted by law, GuideMeCoach is not liable for indirect or consequential damages arising
          from use of the service.
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

