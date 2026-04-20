// ThemeContext.tsx
// Provides the active color palette and a toggle to the whole app.
//
// Usage in any screen:
//   import { useTheme } from '../contexts/ThemeContext';
//   const { colors } = useTheme();
//
// The `colors` object returned is either the dark or light palette
// from theme.ts — identical shape, so no other code changes are needed
// in a screen beyond swapping the import.
//
// The user's preference is persisted to AsyncStorage under
// 'settings:lightMode' — the same key ProfileScreen writes to —
// so changes in Settings take effect immediately on the next render.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, AppColors } from '../constants/theme';

// ── Key must match ProfileScreen's SETTINGS_LIGHT_MODE_KEY ────
const LIGHT_MODE_KEY = 'settings:lightMode';

// ── Context type ──────────────────────────────────────────────
interface ThemeContextType {
  colors:    AppColors;
  lightMode: boolean;
  setLightMode: (value: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [lightMode, setLightModeState] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(LIGHT_MODE_KEY);
        if (saved === 'true') setLightModeState(true);
      } catch {
        // Fall back to dark mode if AsyncStorage is unavailable
      }
    };
    load();
  }, []);

  // Saves to AsyncStorage and updates state immediately
  const setLightMode = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(LIGHT_MODE_KEY, String(value));
    } catch {
      // Persist failure is non-fatal — state still updates in memory
    }
    setLightModeState(value);
  };

  return (
    <ThemeContext.Provider
      value={{
        colors:    lightMode ? lightColors : darkColors,
        lightMode,
        setLightMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be used inside <ThemeProvider>');
  return ctx;
}