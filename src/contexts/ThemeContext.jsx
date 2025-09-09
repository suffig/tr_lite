import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Team-specific color schemes
export const TEAM_THEMES = {
  aek: {
    name: 'AEK Athen',
    primary: '#004C8C',     // AEK Blue
    secondary: '#FFD700',   // Gold
    accent: '#1E40AF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  real: {
    name: 'Real Madrid',
    primary: '#FFFFFF',     // Real White
    secondary: '#FFD700',   // Gold
    accent: '#1E40AF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  barcelona: {
    name: 'FC Barcelona',
    primary: '#A50044',     // Barcelona Red
    secondary: '#004C8C',   // Barcelona Blue
    accent: '#FFD700',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  bayern: {
    name: 'Bayern München',
    primary: '#DC143C',     // Bayern Red
    secondary: '#FFFFFF',   // White
    accent: '#1E40AF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  default: {
    name: 'Standard',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#3B82F6',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  }
};

// Dark mode variants
export const DARK_THEMES = {
  aek: {
    ...TEAM_THEMES.aek,
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
  },
  real: {
    ...TEAM_THEMES.real,
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
  },
  barcelona: {
    ...TEAM_THEMES.barcelona,
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
  },
  bayern: {
    ...TEAM_THEMES.bayern,
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
  },
  default: {
    ...TEAM_THEMES.default,
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
  }
};

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('default');
  const [autoMode, setAutoMode] = useState(true);
  const [customColors, setCustomColors] = useState(null);
  const [animatedBackground, setAnimatedBackground] = useState(true);
  const [teamPerformance, setTeamPerformance] = useState('neutral'); // good, neutral, bad

  // Load theme preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('fifa-tracker-theme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        setSelectedTeam(theme.team || 'default');
        setIsDarkMode(theme.darkMode || false);
        setAutoMode(theme.autoMode !== false);
        setCustomColors(theme.customColors || null);
        setAnimatedBackground(theme.animatedBackground !== false);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    }
  }, []);

  // Auto dark mode detection
  useEffect(() => {
    if (!autoMode) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    
    setIsDarkMode(mediaQuery.matches);
    mediaQuery.addListener(handleChange);
    
    return () => mediaQuery.removeListener(handleChange);
  }, [autoMode]);

  // Save theme preferences
  useEffect(() => {
    const themeData = {
      team: selectedTeam,
      darkMode: isDarkMode,
      autoMode,
      customColors,
      animatedBackground,
    };
    localStorage.setItem('fifa-tracker-theme', JSON.stringify(themeData));
  }, [selectedTeam, isDarkMode, autoMode, customColors, animatedBackground]);

  // Apply theme to document
  useEffect(() => {
    const currentTheme = getCurrentTheme();
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(currentTheme).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
      }
    });

    // Add theme classes to body
    document.body.className = [
      isDarkMode ? 'dark' : 'light',
      `theme-${selectedTeam}`,
      animatedBackground ? 'animated-bg' : '',
      `performance-${teamPerformance}`
    ].filter(Boolean).join(' ');
  }, [isDarkMode, selectedTeam, animatedBackground, teamPerformance]);

  const getCurrentTheme = () => {
    let baseTheme = isDarkMode ? DARK_THEMES[selectedTeam] : TEAM_THEMES[selectedTeam];
    
    // Apply custom colors if set
    if (customColors) {
      baseTheme = { ...baseTheme, ...customColors };
    }
    
    return baseTheme;
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    setAutoMode(false);
  };

  const changeTeamTheme = (teamKey) => {
    setSelectedTeam(teamKey);
  };

  const setCustomColorScheme = (colors) => {
    setCustomColors(colors);
  };

  const resetToDefault = () => {
    setSelectedTeam('default');
    setIsDarkMode(false);
    setAutoMode(true);
    setCustomColors(null);
    setAnimatedBackground(true);
  };

  const updateTeamPerformance = (performance) => {
    setTeamPerformance(performance);
  };

  const value = {
    // Current state
    isDarkMode,
    selectedTeam,
    autoMode,
    customColors,
    animatedBackground,
    teamPerformance,
    
    // Current theme
    theme: getCurrentTheme(),
    
    // Available themes
    teamThemes: TEAM_THEMES,
    darkThemes: DARK_THEMES,
    
    // Actions
    toggleDarkMode,
    changeTeamTheme,
    setAutoMode,
    setCustomColorScheme,
    setAnimatedBackground,
    updateTeamPerformance,
    resetToDefault,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;