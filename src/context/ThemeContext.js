import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  dark: {
    bg: '#05090f',
    card: '#0c1929',
    card2: '#1e293b',
    border: '#162840',
    border2: '#334155',
    text: '#dde8f5',
    textSub: '#94a3b8',
    textMuted: '#64748b',
    accent: '#3b9eff',
    accentDark: '#1a7fe8',
    danger: '#f87171',
    success: '#22c55e',
    tabBar: '#0c1929',
    tabBorder: '#162840',
    statusBar: 'light',
  },
  light: {
    bg: '#f1f5f9',
    card: '#ffffff',
    card2: '#f8fafc',
    border: '#e2e8f0',
    border2: '#cbd5e1',
    text: '#0f172a',
    textSub: '#475569',
    textMuted: '#94a3b8',
    accent: '#2563eb',
    accentDark: '#1d4ed8',
    danger: '#ef4444',
    success: '#16a34a',
    tabBar: '#ffffff',
    tabBorder: '#e2e8f0',
    statusBar: 'dark',
  },
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? THEMES.dark : THEMES.light;
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}