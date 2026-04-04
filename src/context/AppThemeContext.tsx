import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import { darkColors, lightColors, type ThemeColors } from "../theme/colors";

const THEME_KEY = "@theme_preference";

export type ThemePreference = "light" | "dark" | "system";

type AppThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: "light" | "dark";
  colors: ThemeColors;
  setPreference: (p: ThemePreference) => void;
  toggleLightDark: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (
        !cancelled &&
        (stored === "light" || stored === "dark" || stored === "system")
      ) {
        setPreferenceState(stored);
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedTheme: "light" | "dark" = useMemo(() => {
    if (preference === "system") {
      const s = systemScheme ?? Appearance.getColorScheme();
      return s === "dark" ? "dark" : "light";
    }
    return preference;
  }, [preference, systemScheme]);

  const colors = resolvedTheme === "dark" ? darkColors : lightColors;

  useEffect(() => {
    if (!hydrated) return;
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background, hydrated]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(THEME_KEY, p).catch(() => {});
  }, []);

  const toggleLightDark = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setPreference(next);
  }, [resolvedTheme, setPreference]);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      colors,
      setPreference,
      toggleLightDark,
    }),
    [colors, preference, resolvedTheme, setPreference, toggleLightDark],
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return ctx;
}
