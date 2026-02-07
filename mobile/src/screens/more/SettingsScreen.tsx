import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../../components/ScreenHeader';
import { borderRadius, shadows, spacing, typography } from '../../theme/spacing';

export default function SettingsScreen() {
  const { theme, mode, colors, setTheme } = useThemeStore();
  const navigation = useNavigation<any>();
  const [settings, setSettings] = useState({
    theme: (mode === 'system' ? 'auto' : theme),
    notifications: true,
    emailUpdates: false,
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const biometricsEnabled = useAuthStore((s) => s.biometricsEnabled);
  const setBiometrics = useAuthStore((s) => s.setBiometrics);

  useEffect(() => {
    AsyncStorage.getItem('gm-app-settings')
      .then((saved) => {
        if (!saved) return;
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setSettings((current) => ({ ...current, ...parsed }));
          }
        } catch {}
      })
      .catch(() => {});
  }, []);

  const saveSettings = () => {
    // Persist locally for reference; theme is controlled by store.
    AsyncStorage.setItem('gm-app-settings', JSON.stringify(settings)).catch(() => {});
    // Apply theme selection.
    if (settings.theme === 'auto') setTheme('system');
    else setTheme(settings.theme as any);
    Alert.alert('Saved', 'Settings updated');
  };

  const changePassword = async () => {
    if (!passwords.current || !passwords.next || passwords.next !== passwords.confirm) {
      Alert.alert('Error', 'Fill all fields and ensure passwords match');
      return;
    }
    try {
      await apiClient.changePassword(passwords.current, passwords.next);
      Alert.alert('Success', 'Password changed');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to change password');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Settings"
        subtitle="Theme, notifications, and security."
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Display</Text>
          <View style={styles.rowBetween}>
            {['light', 'dark', 'auto'].map((t) => {
              const isActive = settings.theme === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive ? `${colors.primary}15` : colors.surfaceSecondary,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSettings({ ...settings, theme: t })}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, { color: isActive ? colors.primary : colors.text }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Push Notifications</Text>
            <Switch value={settings.notifications} onValueChange={(v) => setSettings({ ...settings, notifications: v })} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Email Updates</Text>
            <Switch value={settings.emailUpdates} onValueChange={(v) => setSettings({ ...settings, emailUpdates: v })} />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Biometric unlock</Text>
            <Switch value={biometricsEnabled} onValueChange={(v) => setBiometrics(v)} />
          </View>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.backgroundSecondary, color: colors.text },
            ]}
            placeholder="Current password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={passwords.current}
            onChangeText={(v) => setPasswords({ ...passwords, current: v })}
          />
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.backgroundSecondary, color: colors.text },
            ]}
            placeholder="New password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={passwords.next}
            onChangeText={(v) => setPasswords({ ...passwords, next: v })}
          />
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.backgroundSecondary, color: colors.text },
            ]}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={passwords.confirm}
            onChangeText={(v) => setPasswords({ ...passwords, confirm: v })}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={changePassword}
            activeOpacity={0.85}
          >
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>Change password</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={saveSettings}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.md,
  },
  sectionTitle: { ...typography.heading3, marginBottom: spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  meta: { ...typography.body2 },
  chip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
  },
  chipText: { ...typography.label2, textTransform: 'capitalize' },
  input: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.md },
  button: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md },
  saveButton: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { ...typography.label1, fontWeight: '700' },
});
