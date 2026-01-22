import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import { apiClient } from '../../services/api';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({ theme: 'light', notifications: true, emailUpdates: false });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    const saved = globalThis.localStorage?.getItem('appSettings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveSettings = () => {
    globalThis.localStorage?.setItem('appSettings', JSON.stringify(settings));
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Theme, notifications, and security.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.rowBetween}>
          {['light', 'dark', 'auto'].map((t) => (
            <TouchableOpacity key={t} style={[styles.chip, settings.theme === t && styles.chipActive]} onPress={() => setSettings({ ...settings, theme: t })}>
              <Text style={[styles.chipText, settings.theme === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.switchRow}>
          <Text style={styles.meta}>Push Notifications</Text>
          <Switch value={settings.notifications} onValueChange={(v) => setSettings({ ...settings, notifications: v })} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.meta}>Email Updates</Text>
          <Switch value={settings.emailUpdates} onValueChange={(v) => setSettings({ ...settings, emailUpdates: v })} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TextInput style={styles.input} placeholder="Current password" secureTextEntry value={passwords.current} onChangeText={(v) => setPasswords({ ...passwords, current: v })} />
        <TextInput style={styles.input} placeholder="New password" secureTextEntry value={passwords.next} onChangeText={(v) => setPasswords({ ...passwords, next: v })} />
        <TextInput style={styles.input} placeholder="Confirm new password" secureTextEntry value={passwords.confirm} onChangeText={(v) => setPasswords({ ...passwords, confirm: v })} />
        <TouchableOpacity style={styles.button} onPress={changePassword}>
          <Text style={styles.buttonText}>Change password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
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
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#e5e7eb', marginRight: 8, flex: 1, alignItems: 'center' },
  chipActive: { backgroundColor: '#DBEAFE' },
  chipText: { fontWeight: '700', color: '#111' },
  chipTextActive: { color: '#1D4ED8' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#fff', marginTop: 8 },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButton: { backgroundColor: '#111827', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 6, marginBottom: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
