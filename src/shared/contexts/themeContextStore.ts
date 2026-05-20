import { createContext } from 'react';

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
