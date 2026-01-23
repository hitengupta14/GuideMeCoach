import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput } from './TextInput';
import { spacing, borderRadius } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  isDark?: boolean;
}

export function SearchInput({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  isDark = false,
}: SearchInputProps) {
  const colors = isDark ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={colors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        isDark={isDark}
      />
      {value && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearButton}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
