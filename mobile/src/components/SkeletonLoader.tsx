import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '../store/theme';

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4, style }: any) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const { colors } = useThemeStore();

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ExerciseCardSkeleton() {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }] }>
      <SkeletonLoader width="70%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="40%" height={14} style={{ marginBottom: 6 }} />
      <SkeletonLoader width="60%" height={12} />
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ExerciseCardSkeleton key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
});
