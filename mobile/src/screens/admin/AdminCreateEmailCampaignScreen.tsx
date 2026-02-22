import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

type Segment = 'all' | 'premium' | 'inactive' | 'new_users';

const SEGMENTS: Array<{ key: Segment; label: string; hint: string }> = [
  { key: 'all', label: 'All', hint: 'All active, verified users.' },
  { key: 'premium', label: 'Premium', hint: 'Active premium users.' },
  { key: 'inactive', label: 'Inactive', hint: 'No workouts in last N days.' },
  { key: 'new_users', label: 'New', hint: 'Created in last N days.' },
];

export default function AdminCreateEmailCampaignScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [days, setDays] = useState('30');

  const audience = useMemo(() => {
    if (segment === 'inactive' || segment === 'new_users') {
      const d = Math.max(1, Math.min(365, Math.floor(Number(days) || 30)));
      return { segment, days: d as number };
    }
    return { segment };
  }, [segment, days]);

  const canSend = name.trim().length > 0 && subject.trim().length > 0 && content.trim().length > 0;

  const sendMutation = useMutation({
    mutationFn: async () =>
      apiClient.adminSendEmailCampaign({
        name: name.trim(),
        subject: subject.trim(),
        content: content.trim(),
        audience: audience as any,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-email-campaigns'] });
      Alert.alert('Sent', 'Campaign queued and sent.');
      navigation.goBack();
    },
    onError: (e: any) => {
      const message = e?.data?.error || e?.message || 'Failed to send campaign.';
      Alert.alert('Error', message);
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="New Campaign" subtitle="Send a broadcast email." onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.label1, { color: colors.text }]}>Campaign name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Weekly update"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.label1, { color: colors.text }]}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Email subject"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.label1, { color: colors.text }]}>Audience</Text>
          <View style={styles.segmentRow}>
            {SEGMENTS.map((s) => {
              const active = s.key === segment;
              return (
                <TouchableOpacity
                  key={s.key}
                  activeOpacity={0.85}
                  onPress={() => setSegment(s.key)}
                  style={[
                    styles.segmentChip,
                    {
                      backgroundColor: active ? `${colors.primary}18` : colors.card,
                      borderColor: active ? `${colors.primary}55` : colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.caption1, { color: active ? colors.primary : colors.textSecondary }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            {SEGMENTS.find((s) => s.key === segment)?.hint}
          </Text>

          {(segment === 'inactive' || segment === 'new_users') ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.label2, { color: colors.textSecondary }]}>Days</Text>
              <TextInput
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.label1, { color: colors.text }]}>Content</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write your email…"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.inputMultiline,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
            multiline
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => sendMutation.mutate()}
          disabled={!canSend || sendMutation.isPending}
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: !canSend || sendMutation.isPending ? 0.7 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="send" size={18} color={colors.textInverse} />
          <Text style={[typography.label1, { color: colors.textInverse }]}>
            {sendMutation.isPending ? 'Sending…' : 'Send campaign'}
          </Text>
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
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    ...typography.body2,
  },
  inputMultiline: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    ...typography.body2,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  segmentChip: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryBtn: {
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.md,
  },
});

