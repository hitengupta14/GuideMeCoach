import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../theme/colors';

export type Theme = 'light' | 'dark';
export type ThemeMode = Theme | 'system';
export type ThemeColors = typeof lightColors;

interface ThemeState {
  // Effective theme ('light' | 'dark') used for rendering.
  theme: Theme;
  // User preference ('light' | 'dark' | 'system').
  mode: ThemeMode;
  systemTheme: ColorSchemeName;
  setTheme: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const THEME_MODE_KEY = 'gm-theme-mode';

function resolveEffectiveTheme(mode: ThemeMode, systemTheme: ColorSchemeName): Theme {
  if (mode === 'system') return systemTheme === 'dark' ? 'dark' : 'light';
  return mode;
}

function resolveColors(theme: Theme): ThemeColors {
  return theme === 'dark' ? darkColors : lightColors;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const systemTheme = Appearance.getColorScheme();
  const initialMode: ThemeMode = 'system';
  const initialTheme = resolveEffectiveTheme(initialMode, systemTheme);

  // Follow system theme changes only when mode === 'system'.
  Appearance.addChangeListener(({ colorScheme }) => {
    const nextSystemTheme = colorScheme;
    const { mode, theme } = get();
    const nextTheme = mode === 'system' ? resolveEffectiveTheme(mode, nextSystemTheme) : theme;
    set({
      systemTheme: nextSystemTheme,
      theme: nextTheme,
      colors: resolveColors(nextTheme),
    });
  });

  // Hydrate theme preference (fire-and-forget).
  AsyncStorage.getItem(THEME_MODE_KEY)
    .then((stored) => {
      const storedMode = stored as ThemeMode | null;
      if (!storedMode || !['light', 'dark', 'system'].includes(storedMode)) return;
      const currentSystem = Appearance.getColorScheme();
      const nextTheme = resolveEffectiveTheme(storedMode, currentSystem);
      set({ mode: storedMode, theme: nextTheme, colors: resolveColors(nextTheme), systemTheme: currentSystem });
    })
    .catch(() => {});

  return {
    theme: initialTheme,
    mode: initialMode,
    systemTheme,
    colors: resolveColors(initialTheme),

    setTheme: (mode: ThemeMode) => {
      const currentSystem = Appearance.getColorScheme();
      const nextTheme = resolveEffectiveTheme(mode, currentSystem);
      set({ mode, theme: nextTheme, colors: resolveColors(nextTheme), systemTheme: currentSystem });
      AsyncStorage.setItem(THEME_MODE_KEY, mode).catch(() => {});
    },
  };
});
