import { Animated, Easing } from 'react-native';

/**
 * Fade In Animation
 * Animates opacity from 0 to 1
 */
export const createFadeInAnimation = (duration = 300) => {
  const fadeAnim = new Animated.Value(0);
  
  const animate = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };
  
  return { fadeAnim, animate };
};

/**
 * Slide In Animation
 * Animates position from left/right/top/bottom
 */
export const createSlideInAnimation = (
  direction: 'left' | 'right' | 'top' | 'bottom' = 'left',
  duration = 400
) => {
  const slideAnim = new Animated.Value(
    direction === 'left' ? -50 : direction === 'right' ? 50 : 0
  );
  
  const animate = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  
  const getStyle = () => {
    if (direction === 'left' || direction === 'right') {
      return { transform: [{ translateX: slideAnim }] };
    }
    return { transform: [{ translateY: slideAnim }] };
  };
  
  return { slideAnim, animate, getStyle };
};

/**
 * Scale Animation
 * Animates scale from 0 to 1
 */
export const createScaleAnimation = (duration = 300) => {
  const scaleAnim = new Animated.Value(0.8);
  
  const animate = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  
  const getStyle = () => ({
    transform: [{ scale: scaleAnim }],
  });
  
  return { scaleAnim, animate, getStyle };
};

/**
 * Bounce Animation
 * Animates scale with bounce effect
 */
export const createBounceAnimation = (duration = 600) => {
  const bounceAnim = new Animated.Value(0.8);
  
  const animate = () => {
    Animated.timing(bounceAnim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.bounce),
      useNativeDriver: true,
    }).start();
  };
  
  const getStyle = () => ({
    transform: [{ scale: bounceAnim }],
  });
  
  return { bounceAnim, animate, getStyle };
};

/**
 * Rotation Animation
 * Animates rotation
 */
export const createRotationAnimation = (duration = 1000) => {
  const rotateAnim = new Animated.Value(0);
  
  const animate = (loop = false) => {
    const anim = Animated.timing(rotateAnim, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    
    if (loop) {
      Animated.loop(anim).start();
    } else {
      anim.start();
    }
  };
  
  const getStyle = () => ({
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  });
  
  return { rotateAnim, animate, getStyle };
};

/**
 * Pulse Animation
 * Animates opacity pulsing effect
 */
export const createPulseAnimation = (duration = 2000) => {
  const pulseAnim = new Animated.Value(1);
  
  const animate = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: duration / 2,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  const getStyle = () => ({
    opacity: pulseAnim,
  });
  
  return { pulseAnim, animate, getStyle };
};

/**
 * Combined Animation
 * Combines fade in and scale
 */
export const createCombinedAnimation = (duration = 400) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  
  const animate = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const getStyle = () => ({
    opacity: fadeAnim,
    transform: [{ scale: scaleAnim }],
  });
  
  return { fadeAnim, scaleAnim, animate, getStyle };
};

/**
 * Staggered Animation
 * Animates multiple items in sequence
 */
export const createStaggeredAnimation = (
  itemCount: number,
  duration = 300,
  delay = 50
) => {
  const animations = Array.from({ length: itemCount }, () => 
    new Animated.Value(0)
  );
  
  const animate = () => {
    Animated.stagger(
      delay,
      animations.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      )
    ).start();
  };
  
  const getStyle = (index: number) => ({
    opacity: animations[index],
    transform: [
      {
        translateY: animations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });
  
  return { animations, animate, getStyle };
};
