import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeStore } from '../../store/theme';
import { apiClient } from '../../services/api';
import { ErrorView, LoadingView } from '../../components/State';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function AdminSettingsScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => apiClient.adminGetSettings(),
  });

  const settings = (settingsQuery.data as any)?.settings || null;

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [enableSocialAuth, setEnableSocialAuth] = useState(true);
  const [apiRateLimit, setApiRateLimit] = useState('1000');
  const [maxUploadSize, setMaxUploadSize] = useState('200');

  useEffect(() => {
    if (!settings) return;
    setMaintenanceMode(Boolean(settings.maintenanceMode));
    setEnableRegistration(Boolean(settings.enableRegistration));
    setEnableSocialAuth(Boolean(settings.enableSocialAuth));
    setApiRateLimit(String(settings.apiRateLimit ?? '1000'));
    setMaxUploadSize(String(settings.maxUploadSize ?? '200'));
  }, [settings]);

  const payload = useMemo(() => {
    const rate = Number(apiRateLimit);
    const maxUpload = Number(maxUploadSize);
    return {
      maintenanceMode,
      enableRegistration,
      enableSocialAuth,
      apiRateLimit: Number.isFinite(rate) ? rate : undefined,
      maxUploadSize: Number.isFinite(maxUpload) ? maxUpload : undefined,
    };
  }, [maintenanceMode, enableRegistration, enableSocialAuth, apiRateLimit, maxUploadSize]);

  const updateMutation = useMutation({
    mutationFn: async () => apiClient.adminUpdateSettings(payload as any),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      Alert.alert('Saved', 'Settings updated successfully.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update settings.');
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Settings"
        subtitle="Global app toggles."
        onBackPress={() => navigation.goBack()}
      />

      {settingsQuery.isLoading ? (
        <LoadingView message="Loading settings…" />
      ) : settingsQuery.error ? (
        <ErrorView message="Failed to load settings." />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[typography.label1, { color: colors.text }]}>Maintenance mode</Text>
              <Switch value={maintenanceMode} onValueChange={setMaintenanceMode} />
            </View>
            <Text style={[typography.body3, { color: colors.textSecondary }]}>
              When enabled, non-admin users may be blocked from using the app.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[typography.label1, { color: colors.text }]}>Enable registration</Text>
              <Switch value={enableRegistration} onValueChange={setEnableRegistration} />
            </View>
            <Text style={[typography.body3, { color: colors.textSecondary }]}>
              Toggle sign-up availability.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[typography.label1, { color: colors.text }]}>Enable social login</Text>
              <Switch value={enableSocialAuth} onValueChange={setEnableSocialAuth} />
            </View>
            <Text style={[typography.body3, { color: colors.textSecondary }]}>
              Toggle Google sign-in availability.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.label1, { color: colors.text, marginBottom: spacing.sm }]}>API rate limit</Text>
            <TextInput
              value={apiRateLimit}
              onChangeText={setApiRateLimit}
              keyboardType="number-pad"
              placeholder="e.g. 1000"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              Requests per window (server-configured).
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.label1, { color: colors.text, marginBottom: spacing.sm }]}>Max upload size (MB)</Text>
            <TextInput
              value={maxUploadSize}
              onChangeText={setMaxUploadSize}
              keyboardType="number-pad"
              placeholder="e.g. 200"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <Text style={[typography.body3, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              Used for video uploads and file validation.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: updateMutation.isPending ? 0.8 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="content-save" size={18} color={colors.textInverse} />
            <Text style={[typography.label1, { color: colors.textInverse }]}>
              {updateMutation.isPending ? 'Saving…' : 'Save settings'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
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

