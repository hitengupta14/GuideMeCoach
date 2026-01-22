import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface ContainerProps {
  children: React.ReactNode;
  isDark?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  paddingTop?: boolean;
  paddingBottom?: boolean;
  style?: ViewStyle;
}

export function Container({
  children,
  isDark = false,
  padding = 'lg',
  paddingTop = false,
  paddingBottom = false,
  style,
}: ContainerProps) {
  const colors = isDark ? darkColors : lightColors;

  const paddingMap = {
    none: 0,
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.lg,
  };

  const padValue = paddingMap[padding];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingHorizontal: padValue,
          paddingTop: paddingTop ? padValue : 0,
          paddingBottom: paddingBottom ? padValue : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface ScreenProps {
  children: React.ReactNode;
  isDark?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, isDark = false, style }: ScreenProps) {
  const colors = isDark ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface SectionProps {
  children: React.ReactNode;
  spacing?: number;
  style?: ViewStyle;
}

export function Section({ children, spacing: gap = 12, style }: SectionProps) {
  return (
    <View style={[styles.section, { gap }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  section: {
    paddingVertical: spacing.lg,
  },
});
