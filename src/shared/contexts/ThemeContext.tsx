import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function useThemeHook() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export { useThemeHook as useTheme };

interface ThemeProviderProps {
  children: ReactNode;
}

const getInitialTheme = (): boolean => {
  if (globalThis.window === undefined) {
    return true;
  }
  
  const savedTheme = globalThis.localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  
  return globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyThemeToDOM = (dark: boolean) => {
  if (globalThis.window === undefined) return;
  
  const html = globalThis.document.documentElement;
  const body = globalThis.document.body;
  
  if (dark) {
    html.classList.add('dark');
    html.style.backgroundColor = '#0a0a0a';
    html.style.color = '#ffffff';
    html.style.colorScheme = 'dark';
    body.style.backgroundColor = '#0a0a0a';
    body.style.color = '#ffffff';
  } else {
    html.classList.remove('dark');
    html.style.backgroundColor = '#E8E7E3';
    html.style.color = '#000000';
    html.style.colorScheme = 'light';
    body.style.backgroundColor = '#E8E7E3';
    body.style.color = '#000000';
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => getInitialTheme());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
  const setTheme = (dark: boolean) => {
    setIsDark(dark);
    globalThis.localStorage.setItem('theme', dark ? 'dark' : 'light');
    applyThemeToDOM(dark);
    globalThis.window.dispatchEvent(new CustomEvent('themechange', { detail: { isDark: dark } }));
  };

  const toggleTheme = () => {
    setTheme(!isDark);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const setSidebarOpen = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newIsDark = e.newValue === 'dark';
        setIsDark(newIsDark);
        applyThemeToDOM(newIsDark);
      }
    };

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>;
      if (customEvent.detail) {
        setIsDark(customEvent.detail.isDark);
        applyThemeToDOM(customEvent.detail.isDark);
      }
    };

    globalThis.window.addEventListener('storage', handleStorageChange);
    globalThis.window.addEventListener('themechange', handleThemeChange);

    return () => {
      globalThis.window.removeEventListener('storage', handleStorageChange);
      globalThis.window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ isDark, toggleTheme, setTheme, isSidebarOpen, toggleSidebar, setSidebarOpen }),
    [isDark, isSidebarOpen]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
