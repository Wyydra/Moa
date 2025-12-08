import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../utils/themes';
import { getThemeMode, setThemeMode as saveThemeMode } from '../data/storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await getThemeMode();
        setThemeModeState(savedMode);
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Resolve effective dark mode state
  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  // Select theme based on resolved dark mode state
  const theme = isDark ? darkTheme : lightTheme;

  // Update theme mode and persist to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await saveThemeMode(mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
      throw error;
    }
  };

  // Don't render children until theme is loaded to avoid flash
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
