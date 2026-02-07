import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/theme';
import { spacing, typography, shadows } from '../theme/spacing';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'solid' | 'transparent';
  style?: ViewStyle;
};

export default function ScreenHeader({
  title,
  subtitle,
  onBackPress,
  rightAction,
  variant = 'solid',
  style,
}: ScreenHeaderProps) {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + spacing.md,
          backgroundColor: variant === 'transparent' ? 'transparent' : colors.card,
          borderBottomColor: variant === 'transparent' ? 'transparent' : colors.border,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.side}>
          {onBackPress ? (
            <TouchableOpacity
              onPress={onBackPress}
              activeOpacity={0.8}
              style={[styles.iconButton, { backgroundColor: `${colors.primary}14` }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.sidePlaceholder} />
          )}
        </View>

        <View pointerEvents="none" style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.side, { alignItems: 'flex-end' }]}>
          {rightAction ? rightAction : <View style={styles.sidePlaceholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    ...shadows.sm,
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  side: {
    minWidth: 52,
    height: 44,
    justifyContent: 'center',
  },
  sidePlaceholder: { width: 44, height: 44 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 88,
  },
  title: {
    ...typography.heading3,
  },
  subtitle: {
    ...typography.caption1,
    marginTop: 2,
    textAlign: 'center',
  },
});

