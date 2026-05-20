import { useContext } from 'react';
import { ThemeContext } from './themeContextStore';
import type { ThemeContextType } from './themeContextStore';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
