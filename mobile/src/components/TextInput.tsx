import React from 'react';
import { View, TextInput as RNTextInput, StyleSheet, Text } from 'react-native';
import { spacing, borderRadius, typography } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface TextInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  isDark?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
}

export function TextInput({
  placeholder,
  value,
  onChangeText,
  label,
  error,
  prefix,
  suffix,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  isDark = false,
  keyboardType = 'default',
  secureTextEntry = false,
}: TextInputProps) {
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, typography.label1, { color: colors.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        {prefix && <View style={styles.prefix}>{prefix}</View>}
        <RNTextInput
          style={[
            styles.input,
            typography.body2,
            { color: colors.text },
            disabled && { color: colors.disabledText },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
        />
        {suffix && <View style={styles.suffix}>{suffix}</View>}
      </View>
      {error && (
        <Text style={[styles.error, typography.caption2, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.sm,
  },
  prefix: {
    marginRight: spacing.sm,
  },
  suffix: {
    marginLeft: spacing.sm,
  },
  error: {
    marginTop: spacing.xs,
  },
});
