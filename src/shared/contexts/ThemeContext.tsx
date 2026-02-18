/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(
    () => localStorage.getItem('theme') !== 'light'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const value = useMemo<ThemeContextType>(
    () => ({
      isDark,
      toggleTheme,
      isSidebarOpen,
      setSidebarOpen: setIsSidebarOpen,
      isSearchOpen,
      setSearchOpen: setIsSearchOpen,
    }),
    [isDark, isSidebarOpen, isSearchOpen]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
