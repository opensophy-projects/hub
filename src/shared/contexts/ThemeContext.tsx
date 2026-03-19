/**
 * ARCHITECTURE NOTE:
 * Astro with client:only="react" renders each island in an isolated React tree.
 * There is NO shared React context between TopNavbar, DocContent, SearchWrapper etc.
 *
 * Solution: each island wraps itself in ThemeProvider (as before).
 * Cross-island state sync uses localStorage + manually dispatched StorageEvent
 * so all islands stay in sync without CustomEvent hacks.
 */
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

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_THEME   = 'theme';
const KEY_SIDEBAR = 'hub:sidebar';
const KEY_SEARCH  = 'hub:search';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(KEY_THEME) !== 'light';
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

/**
 * Write to localStorage and fire a synthetic StorageEvent so OTHER islands
 * on the same page pick it up (native storage events don't fire in the
 * originating window).
 */
function broadcastStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    window.dispatchEvent(
      new StorageEvent('storage', { key, newValue: value, storageArea: localStorage })
    );
  } catch {
    // SSR / private browsing — ignore
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [isSidebarOpen, setIsSidebarOpenState] = useState(false);
  const [isSearchOpen,  setIsSearchOpenState]  = useState(false);

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Listen for cross-island changes via StorageEvent
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_THEME && e.newValue !== null) {
        const next = e.newValue !== 'light';
        setIsDark(next);
        applyTheme(next);
      }
      if (e.key === KEY_SIDEBAR && e.newValue !== null) {
        setIsSidebarOpenState(e.newValue === 'true');
      }
      if (e.key === KEY_SEARCH && e.newValue !== null) {
        setIsSearchOpenState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const next = !isDark;
    broadcastStorage(KEY_THEME, next ? 'dark' : 'light');

    // View Transitions API — circular reveal from click point
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

      type DocVT = Document & {
        startViewTransition: (cb: () => void) => { ready: Promise<void> };
      };

      (document as DocVT)
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
          // View Transition failed — just apply
          setIsDark(next);
          applyTheme(next);
        });
    } else {
      setIsDark(next);
      applyTheme(next);
    }
  }, [isDark]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpenState(open);
    broadcastStorage(KEY_SIDEBAR, String(open));
  }, []);

  const setSearchOpen = useCallback((open: boolean) => {
    setIsSearchOpenState(open);
    broadcastStorage(KEY_SEARCH, String(open));
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