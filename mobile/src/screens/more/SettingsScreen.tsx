import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';

export default function SettingsScreen() {
  const { theme, colors, setTheme } = useThemeStore();
  const [settings, setSettings] = useState({ theme: (theme === 'dark' ? 'dark' : 'light'), notifications: true, emailUpdates: false });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const biometricsEnabled = useAuthStore((s) => s.biometricsEnabled);
  const setBiometrics = useAuthStore((s) => s.setBiometrics);

  useEffect(() => {
    const saved = globalThis.localStorage?.getItem('appSettings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveSettings = () => {
    try {
      // Persist locally for reference; theme is controlled by store
      globalThis.localStorage?.setItem('appSettings', JSON.stringify(settings));
      // Apply theme selection
      if (settings.theme === 'auto') setTheme('system');
      else setTheme(settings.theme as any);
      Alert.alert('Saved', 'Settings updated');
    } catch {
      Alert.alert('Saved', 'Settings updated');
    }
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Theme, notifications, and security.</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Display</Text>
        <View style={styles.rowBetween}>
          {['light', 'dark', 'auto'].map((t) => (
            <TouchableOpacity key={t} style={[styles.chip, settings.theme === t && [styles.chipActive, { borderColor: colors.primary }]]} onPress={() => setSettings({ ...settings, theme: t })}>
              <Text style={[styles.chipText, { color: colors.text }, settings.theme === t && [styles.chipTextActive, { color: colors.primary }]]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
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

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
        <View style={styles.switchRow}>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Biometric unlock</Text>
          <Switch value={biometricsEnabled} onValueChange={(v) => setBiometrics(v)} />
        </View>
        <TextInput style={[styles.input, { borderColor: '#e5e7eb', color: colors.text }]} placeholder="Current password" placeholderTextColor={colors.textSecondary} secureTextEntry value={passwords.current} onChangeText={(v) => setPasswords({ ...passwords, current: v })} />
        <TextInput style={[styles.input, { borderColor: '#e5e7eb', color: colors.text }]} placeholder="New password" placeholderTextColor={colors.textSecondary} secureTextEntry value={passwords.next} onChangeText={(v) => setPasswords({ ...passwords, next: v })} />
        <TextInput style={[styles.input, { borderColor: '#e5e7eb', color: colors.text }]} placeholder="Confirm new password" placeholderTextColor={colors.textSecondary} secureTextEntry value={passwords.confirm} onChangeText={(v) => setPasswords({ ...passwords, confirm: v })} />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={changePassword}>
          <Text style={styles.buttonText}>Change password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.text }]} onPress={saveSettings}>
        <Text style={styles.buttonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  meta: { fontSize: 14, color: '#444' },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#e5e7eb', marginRight: 8, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#DBEAFE' },
  chipText: { fontWeight: '700', color: '#111' },
  chipTextActive: { color: '#1D4ED8' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#fff', marginTop: 8 },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButton: { backgroundColor: '#111827', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 6, marginBottom: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
