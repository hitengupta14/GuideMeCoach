import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  systemTheme: ColorSchemeName;
  setTheme: (theme: Theme | 'system') => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
  };
}

const lightColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#000000',
  textSecondary: '#666666',
  border: '#e0e0e0',
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
};

const darkColors = {
  background: '#000000',
  card: '#1c1c1e',
  text: '#ffffff',
  textSecondary: '#98989d',
  border: '#38383a',
  primary: '#0A84FF',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const systemTheme = Appearance.getColorScheme();
  const initialTheme = systemTheme === 'dark' ? 'dark' : 'light';

  Appearance.addChangeListener(({ colorScheme }) => {
    const current = get();
    set({
      systemTheme: colorScheme,
      colors: colorScheme === 'dark' ? darkColors : lightColors,
    });
  });

  return {
    theme: initialTheme,
    systemTheme,
    colors: initialTheme === 'dark' ? darkColors : lightColors,

    setTheme: (theme: Theme | 'system') => {
      if (theme === 'system') {
        const systemTheme = Appearance.getColorScheme();
        const actualTheme = systemTheme === 'dark' ? 'dark' : 'light';
        set({
          theme: actualTheme,
          colors: actualTheme === 'dark' ? darkColors : lightColors,
        });
      } else {
        set({
          theme,
          colors: theme === 'dark' ? darkColors : lightColors,
        });
      }
    },
  };
});
