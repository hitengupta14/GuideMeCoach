import React, { useState } from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiClient } from '../../services/api';
import { useAIQuota } from '../../hooks/useAIQuota';
import UpgradeModal from '../../components/UpgradeModal';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function FormFeedbackScreen() {
  const { colors } = useThemeStore();
  const [exerciseName, setExerciseName] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canAccessFeature, refetch: refetchQuota, loading: quotaLoading } = useAIQuota();

  const handleSubmit = async () => {
    if (!exerciseName || !description) {
      setError('Exercise name and description are required');
      return;
    }

    // Form feedback is billed against the `insights` quota (and requires Premium).
    if (quotaLoading) {
      setError('Checking AI access… please try again in a moment.');
      return;
    }
    if (!canAccessFeature('insights')) {
      setShowUpgradeModal(true);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.getFormFeedback({ exerciseName, description, weight, reps });
      setFeedback(res);
      await refetchQuota();
    } catch (e: any) {
      const msg = e?.message || 'Failed to get feedback';
      setError(msg);
      // Premium/quota errors should route to upgrade.
      if (typeof e?.status === 'number' && e.status === 403) {
        setShowUpgradeModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Form Feedback</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Text-based form consultation.</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Exercise name"
          placeholderTextColor={colors.textTertiary}
          value={exerciseName}
          onChangeText={setExerciseName}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Weight (optional)"
          placeholderTextColor={colors.textTertiary}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
          placeholder="Reps / duration (optional)"
          placeholderTextColor={colors.textTertiary}
          value={reps}
          onChangeText={setReps}
        />
        <TextInput
          style={[
            styles.input,
            { height: 120, textAlignVertical: 'top', borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary },
          ]}
          placeholder="Describe your form, issues, pain points..."
          placeholderTextColor={colors.textTertiary}
          multiline
          value={description}
          onChangeText={setDescription}
        />
        {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Get feedback</Text>
          )}
        </TouchableOpacity>
      </View>

      {feedback && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Results</Text>

          {/* Primary (AI) schema */}
          {feedback.overallAssessment ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{feedback.overallAssessment}</Text>
          ) : null}

          {Array.isArray(feedback.diagnosticQuestions) && feedback.diagnosticQuestions.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.label1, { color: colors.text }]}>Quick questions</Text>
              {feedback.diagnosticQuestions.map((q: string, idx: number) => (
                <Text key={idx} style={[styles.meta, { color: colors.textSecondary }]}>• {q}</Text>
              ))}
            </View>
          ) : null}

          {Array.isArray(feedback.corrections) && feedback.corrections.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.label1, { color: colors.text }]}>Corrections</Text>
              {feedback.corrections.map((c: any, idx: number) => (
                <Text key={idx} style={[styles.meta, { color: colors.textSecondary }]}>
                  • {c.area ? `${c.area}: ` : ''}{c.correction || c.issue || ''}
                </Text>
              ))}
            </View>
          ) : null}

          {Array.isArray(feedback.progressionTips) && feedback.progressionTips.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.label1, { color: colors.text }]}>Next steps</Text>
              {feedback.progressionTips.map((tip: string, idx: number) => (
                <Text key={idx} style={[styles.meta, { color: colors.textSecondary }]}>• {tip}</Text>
              ))}
            </View>
          ) : null}

          {Array.isArray(feedback.warningFlags) && feedback.warningFlags.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.label1, { color: colors.error }]}>Warning flags</Text>
              {feedback.warningFlags.map((flag: string, idx: number) => (
                <Text key={idx} style={[styles.meta, { color: colors.textSecondary }]}>• {flag}</Text>
              ))}
            </View>
          ) : null}

          {/* Fallback (non-AI) schema */}
          {Array.isArray(feedback.commonMistakes) && feedback.commonMistakes.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.label1, { color: colors.text }]}>Common mistakes</Text>
              {feedback.commonMistakes.map((m: string, idx: number) => (
                <Text key={idx} style={[styles.meta, { color: colors.textSecondary }]}>• {m}</Text>
              ))}
            </View>
          ) : null}
        </View>
      )}

      <UpgradeModal
        visible={showUpgradeModal}
        feature="insights"
        onClose={() => setShowUpgradeModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  title: { ...typography.heading1, marginBottom: spacing.xs },
  subtitle: { ...typography.body3, marginBottom: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.md,
  },
  input: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...typography.body2 },
  button: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { ...typography.body3, marginBottom: spacing.sm },
  sectionTitle: { ...typography.heading3, marginBottom: spacing.sm },
  meta: { ...typography.body3, marginTop: spacing.xs },
});
