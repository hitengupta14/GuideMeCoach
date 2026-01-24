import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../store/theme';

type SyncIndicatorProps = {
  pendingCount: number;
  isSyncing?: boolean;
  onPress?: () => void;
};

/**
 * Phase 3: Sync Pending Indicator
 * Shows user when workouts/media are queued for upload
 * Builds trust by making offline state transparent
 */
export function SyncIndicator({ pendingCount, isSyncing = false, onPress }: SyncIndicatorProps) {
  const { colors } = useThemeStore();

  // Don't show if nothing pending
  if (pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.warning + '15' }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.content}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.warning} />
        ) : (
          <MaterialCommunityIcons
            name="cloud-upload-outline"
            size={18}
            color={colors.warning}
          />
        )}
        
        <Text style={[styles.text, { color: colors.warning }]}>
          {isSyncing
            ? 'Syncing...'
            : `${pendingCount} pending upload${pendingCount > 1 ? 's' : ''}`}
        </Text>

        {!isSyncing && onPress && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.warning}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
