import React from 'react';
import { TouchableOpacity, StyleSheet, Text, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, typography, shadows } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  isDark?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  isDark = false,
}: ButtonProps) {
  const colors = isDark ? darkColors : lightColors;

  const sizeStyles = {
    sm: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 40,
    },
    md: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 48,
    },
    lg: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing['2xl'],
      minHeight: 56,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      borderWidth: 2,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    danger: {
      backgroundColor: colors.error,
      borderColor: 'transparent',
      borderWidth: 0,
    },
  };

  const textColor = {
    primary: colors.textInverse,
    secondary: colors.textInverse,
    outline: colors.text,
    ghost: colors.primary,
    danger: colors.textInverse,
  };

  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.button,
    sizeStyles[size],
    variantStyles[variant],
    isDisabled && styles.disabled,
    fullWidth && styles.fullWidth,
  ];

  const gradientColors =
    variant === 'primary' ? [colors.primary, colors.primaryDark] : undefined;

  const buttonContent = (
    <View style={styles.content}>
      {icon && !loading && icon}
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            typography.label1,
            { color: isDisabled ? colors.disabledText : textColor[variant] },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );

  if (gradientColors && !isDisabled) {
    return (
      <LinearGradient colors={gradientColors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity
          style={containerStyle}
          onPress={onPress}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          {buttonContent}
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
});
