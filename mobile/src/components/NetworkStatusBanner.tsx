import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, typography, shadows } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

export function NetworkStatusBanner() {
  const netInfo = useNetInfo();
  const offline = !netInfo.isConnected || netInfo.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View style={[styles.container, styles.shadow]}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="wifi-off" size={16} color="#fff" />
        <Text style={[styles.text, typography.body3]}>
          Offline mode. Changes will sync when back online.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  shadow: shadows.md,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
});
