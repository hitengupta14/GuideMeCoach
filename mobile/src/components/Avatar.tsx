import React from 'react';
import { View, StyleSheet, Text, Image as RNImage } from 'react-native';
import { borderRadius } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface AvatarProps {
  source?: string | number;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  isDark?: boolean;
}

export function Avatar({
  source,
  initials,
  size = 'md',
  backgroundColor,
  isDark = false,
}: AvatarProps) {
  const colors = isDark ? darkColors : lightColors;

  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const avatarSize = sizeMap[size];
  const bgColor = backgroundColor || colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      {source ? (
        <RNImage
          source={typeof source === 'string' ? { uri: source } : source}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: avatarSize / 2.5,
              color: colors.textInverse,
            },
          ]}
        >
          {initials || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '700',
  },
});
