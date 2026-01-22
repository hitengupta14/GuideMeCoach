import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface DividerProps {
  isDark?: boolean;
  vertical?: boolean;
  spacing?: number;
  color?: string;
}

export function Divider({ isDark = false, vertical = false, spacing: gap = 16, color }: DividerProps) {
  const colors = isDark ? darkColors : lightColors;
  const dividerColor = color || colors.border;

  if (vertical) {
    return (
      <View
        style={[
          styles.verticalDivider,
          {
            backgroundColor: dividerColor,
            marginHorizontal: gap,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontalDivider,
        {
          backgroundColor: dividerColor,
          marginVertical: gap,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontalDivider: {
    height: 1,
    width: '100%',
  },
  verticalDivider: {
    width: 1,
    height: 24,
  },
});
