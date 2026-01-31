import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, shadows } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'flat';
  isDark?: boolean;
  style?: any;
}

export function Card({ children, onPress, variant = 'default', isDark = false, style }: CardProps) {
  const colors = isDark ? darkColors : lightColors;

  const variantStyles = {
    default: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowOpacity: 0.08,
    },
    elevated: {
      backgroundColor: colors.card,
      borderWidth: 0,
      ...shadows.lg,
    },
    flat: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 0,
    },
  };

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variantStyles[variant].backgroundColor,
          borderColor: 'borderColor' in variantStyles[variant] ? (variantStyles[variant] as any).borderColor : undefined,
          borderWidth: 'borderWidth' in variantStyles[variant] ? (variantStyles[variant] as any).borderWidth : 0,
        },
        'shadowOpacity' in variantStyles[variant] && (variantStyles[variant] as any).shadowOpacity > 0 ? shadows.md : {},
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  isDark?: boolean;
}

export function CardHeader({ title, subtitle, action, isDark = false }: CardHeaderProps) {
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={[styles.title, typography.heading3, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, typography.body3, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
}

export function CardBody({ children }: CardBodyProps) {
  return <View style={styles.body}>{children}</View>;
}

interface CardFooterProps {
  children: React.ReactNode;
  isDark?: boolean;
}

export function CardFooter({ children, isDark = false }: CardFooterProps) {
  const colors = isDark ? darkColors : lightColors;

  return (
    <View
      style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  action: {
    marginLeft: spacing.md,
  },
  body: {
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});
