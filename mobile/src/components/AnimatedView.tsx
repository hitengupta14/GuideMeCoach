import React, { useEffect } from 'react';
import { Animated, View } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

export function FadeInView({ children, duration = 300, delay = 0 }: FadeInViewProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
      }}
    >
      {children}
    </Animated.View>
  );
}

interface SlideInViewProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: number;
  delay?: number;
}

export function SlideInView({
  children,
  direction = 'left',
  distance = 50,
  duration = 400,
  delay = 0,
}: SlideInViewProps) {
  const slideAnim = React.useRef(
    new Animated.Value(
      direction === 'left' ? -distance : direction === 'right' ? distance : 0
    )
  ).current;
  const translateAnim = React.useRef(
    new Animated.Value(
      direction === 'up' ? distance : direction === 'down' ? -distance : 0
    )
  ).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (direction === 'left' || direction === 'right') {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }).start();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [slideAnim, translateAnim, direction, duration, delay]);

  const transform =
    direction === 'left' || direction === 'right'
      ? [{ translateX: slideAnim }]
      : [{ translateY: translateAnim }];

  return (
    <Animated.View
      style={{
        transform,
      }}
    >
      {children}
    </Animated.View>
  );
}

interface ScaleViewProps {
  children: React.ReactNode;
  from?: number;
  duration?: number;
  delay?: number;
}

export function ScaleView({
  children,
  from = 0.8,
  duration = 300,
  delay = 0,
}: ScaleViewProps) {
  const scaleAnim = React.useRef(new Animated.Value(from)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [scaleAnim, duration, delay]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}

interface PulseViewProps {
  children: React.ReactNode;
  duration?: number;
}

export function PulseView({ children, duration = 2000 }: PulseViewProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, duration]);

  return (
    <Animated.View
      style={{
        opacity: pulseAnim,
      }}
    >
      {children}
    </Animated.View>
  );
}
