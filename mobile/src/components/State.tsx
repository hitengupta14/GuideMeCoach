import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../store/theme';

export function LoadingView({ message = 'Loading...' }: { message?: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.centered}> 
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message = 'Something went wrong' }: { message?: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.centered}> 
      <MaterialCommunityIcons name="alert-circle" size={40} color={colors.error} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

export function EmptyView({ title = 'No data', subtitle }: { title?: string; subtitle?: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.centered}> 
      <MaterialCommunityIcons name="inbox" size={40} color={colors.textTertiary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: colors.textTertiary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 8,
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
  },
});
