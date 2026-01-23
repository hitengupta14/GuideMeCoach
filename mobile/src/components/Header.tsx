import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography, shadows } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'default' | 'gradient';
  isDark?: boolean;
}

export function Header({
  title,
  subtitle,
  onBackPress,
  rightAction,
  variant = 'default',
  isDark = false,
}: HeaderProps) {
  const colors = isDark ? darkColors : lightColors;

  const headerContent = (
    <View style={[styles.container, { paddingHorizontal: spacing.lg }]}>
      <View style={styles.leftContent}>
        {onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={variant === 'gradient' ? colors.textInverse : colors.text}
            />
          </TouchableOpacity>
        )}
        <View>
          <Text
            style={[
              typography.heading2,
              {
                color: variant === 'gradient' ? colors.textInverse : colors.text,
                marginBottom: subtitle ? spacing.xs : 0,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                typography.body3,
                {
                  color:
                    variant === 'gradient'
                      ? `${colors.textInverse}99`
                      : colors.textSecondary,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightContent}>{rightAction}</View>}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {headerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  gradientHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  rightContent: {
    marginLeft: spacing.md,
  },
});
