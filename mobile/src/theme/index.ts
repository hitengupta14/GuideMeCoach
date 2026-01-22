import { lightColors, darkColors } from './colors';
import { spacing, borderRadius, typography, shadows, dimensions } from './spacing';

export const createTheme = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors;

  return {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
    dimensions,
  };
};

export type Theme = ReturnType<typeof createTheme>;

// Export individual exports
export { lightColors, darkColors } from './colors';
export { spacing, borderRadius, typography, shadows, dimensions } from './spacing';
