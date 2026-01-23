import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const baseWidth = 375; // iPhone base width

const scale = width / baseWidth;
const normalize = (size: number): number => {
  return Math.round(size * scale);
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const typography = {
  // Display sizes
  display1: {
    fontSize: normalize(32),
    fontWeight: '700' as const,
    lineHeight: normalize(40),
    letterSpacing: -0.5,
  },
  display2: {
    fontSize: normalize(28),
    fontWeight: '700' as const,
    lineHeight: normalize(36),
    letterSpacing: -0.3,
  },

  // Heading sizes
  heading1: {
    fontSize: normalize(24),
    fontWeight: '700' as const,
    lineHeight: normalize(32),
    letterSpacing: 0,
  },
  heading2: {
    fontSize: normalize(20),
    fontWeight: '700' as const,
    lineHeight: normalize(28),
    letterSpacing: 0,
  },
  heading3: {
    fontSize: normalize(18),
    fontWeight: '600' as const,
    lineHeight: normalize(26),
    letterSpacing: 0,
  },

  // Body text
  body1: {
    fontSize: normalize(16),
    fontWeight: '400' as const,
    lineHeight: normalize(24),
    letterSpacing: 0,
  },
  body2: {
    fontSize: normalize(14),
    fontWeight: '400' as const,
    lineHeight: normalize(22),
    letterSpacing: 0,
  },
  body3: {
    fontSize: normalize(13),
    fontWeight: '400' as const,
    lineHeight: normalize(20),
    letterSpacing: 0,
  },

  // Labels and captions
  label1: {
    fontSize: normalize(14),
    fontWeight: '600' as const,
    lineHeight: normalize(20),
    letterSpacing: 0.5,
  },
  label2: {
    fontSize: normalize(12),
    fontWeight: '600' as const,
    lineHeight: normalize(18),
    letterSpacing: 0.5,
  },

  // Caption
  caption1: {
    fontSize: normalize(12),
    fontWeight: '400' as const,
    lineHeight: normalize(18),
    letterSpacing: 0.3,
  },
  caption2: {
    fontSize: normalize(11),
    fontWeight: '400' as const,
    lineHeight: normalize(16),
    letterSpacing: 0.2,
  },
};

export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const dimensions = {
  width,
  height,
  screenPadding: spacing.lg,
  buttonHeight: 48,
  inputHeight: 48,
  bottomTabHeight: 60,
};
