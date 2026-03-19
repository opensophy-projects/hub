import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return true;
  // html element already has the class applied by the inline script in <head>
  return document.documentElement.classList.contains('dark');
};

const applyTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync html class whenever isDark changes
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const next = !isDark;
    localStorage.setItem('theme', next ? 'dark' : 'light');

    // View Transitions API with circular reveal from click point
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      event
    ) {
      const x = event.clientX;
      const y = event.clientY;
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      (document as Document & { startViewTransition: (cb: () => void) => { ready: Promise<void> } })
        .startViewTransition(() => {
          setIsDark(next);
          applyTheme(next);
        })
        .ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ];
          document.documentElement.animate(
            { clipPath: next ? clipPath : [...clipPath].reverse() },
            {
              duration: 380,
              easing: 'ease-in-out',
              pseudoElement: next
                ? '::view-transition-new(root)'
                : '::view-transition-old(root)',
            }
          );
        })
        .catch(() => {
          // View transition failed — apply immediately
          setIsDark(next);
          applyTheme(next);
        });
    } else {
      setIsDark(next);
      applyTheme(next);
    }
  }, [isDark]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpen(open);
  }, []);

  const setSearchOpen = useCallback((open: boolean) => {
    setIsSearchOpen(open);
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({
      isDark,
      toggleTheme,
      isSidebarOpen,
      setSidebarOpen,
      isSearchOpen,
      setSearchOpen,
    }),
    [isDark, toggleTheme, isSidebarOpen, setSidebarOpen, isSearchOpen, setSearchOpen]
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