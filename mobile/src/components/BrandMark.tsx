import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/theme';

interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 64 }: BrandMarkProps) {
  const { colors } = useThemeStore();

  const ringWidth = Math.max(4, Math.round(size * 0.1));
  const lineHeight = Math.max(3, Math.round(size * 0.08));
  const lineWidth = Math.round(size * 0.35);
  const arrowSize = Math.round(size * 0.16);
  const dotSize = Math.max(5, Math.round(size * 0.1));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ringWidth,
            borderColor: colors.primary,
          },
        ]}
      />
      <View
        style={[
          styles.line,
          {
            width: lineWidth,
            height: lineHeight,
            backgroundColor: colors.primary,
            top: size / 2 - lineHeight / 2,
            left: size / 2,
            borderRadius: lineHeight / 2,
          },
        ]}
      />
      <View
        style={[
          styles.arrow,
          {
            top: size / 2 - arrowSize / 2,
            left: size / 2 + lineWidth - 2,
            borderTopWidth: arrowSize / 2,
            borderBottomWidth: arrowSize / 2,
            borderLeftWidth: arrowSize,
            borderLeftColor: colors.secondary,
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: colors.text,
            top: size / 2 - dotSize / 2,
            left: size / 2 - dotSize / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  line: { position: 'absolute' },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  dot: { position: 'absolute' },
});
