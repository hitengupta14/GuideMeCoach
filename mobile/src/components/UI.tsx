import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface StatItemProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isDark?: boolean;
}

export function StatItem({
  label,
  value,
  icon,
  color,
  trend,
  isDark = false,
}: StatItemProps) {
  const colors = isDark ? darkColors : lightColors;
  const displayColor = color || colors.primary;

  return (
    <View style={styles.container}>
      {icon && (
        <View
          style={[styles.iconContainer, { backgroundColor: `${displayColor}15` }]}
        >
          <MaterialCommunityIcons name={icon as any} size={24} color={displayColor} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[typography.body3, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={[typography.heading2, { color: colors.text }]}>{value}</Text>
          {trend && (
            <View
              style={[
                styles.trendBadge,
                {
                  backgroundColor: trend.isPositive
                    ? `${colors.success}20`
                    : `${colors.error}20`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={trend.isPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={trend.isPositive ? colors.success : colors.error}
              />
              <Text
                style={[
                  typography.caption2,
                  {
                    color: trend.isPositive ? colors.success : colors.error,
                    marginLeft: spacing.xs,
                  },
                ]}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  isDark?: boolean;
  onClose?: () => void;
}

export function Badge({ label, variant = 'default', isDark = false, onClose }: BadgeProps) {
  const colors = isDark ? darkColors : lightColors;

  const variantColors = {
    default: { bg: colors.surfaceSecondary, text: colors.text },
    success: { bg: `${colors.success}20`, text: colors.success },
    warning: { bg: `${colors.warning}20`, text: colors.warning },
    error: { bg: `${colors.error}20`, text: colors.error },
    info: { bg: `${colors.primary}20`, text: colors.primary },
  };

  const colors_variant = variantColors[variant];

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        { backgroundColor: colors_variant.bg },
      ]}
      onPress={onClose}
      disabled={!onClose}
    >
      <Text
        style={[
          typography.caption1,
          {
            color: colors_variant.text,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
      {onClose && (
        <MaterialCommunityIcons
          name="close"
          size={14}
          color={colors_variant.text}
          style={{ marginLeft: spacing.xs }}
        />
      )}
    </TouchableOpacity>
  );
}

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  isDark?: boolean;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  height = 6,
  color,
  isDark = false,
  showLabel = false,
}: ProgressBarProps) {
  const colors = isDark ? darkColors : lightColors;
  const displayColor = color || colors.primary;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View>
      {showLabel && (
        <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
          {clampedProgress}%
        </Text>
      )}
      <View
        style={[
          styles.progressBar,
          { height, backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: displayColor,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: borderRadius.full,
  },
});
