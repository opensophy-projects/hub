import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
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
  if (typeof window === 'undefined') {
    return true;
  }
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyThemeToDOM = (dark: boolean) => {
  if (typeof window === 'undefined') return;
  
  const html = document.documentElement;
  const body = document.body;
  
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
  const [isDark, setIsDarkState] = useState<boolean>(() => getInitialTheme());
  
  const setTheme = (dark: boolean) => {
    setIsDarkState(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    applyThemeToDOM(dark);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { isDark: dark } }));
  };

  const toggleTheme = () => {
    setTheme(!isDark);
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newIsDark = e.newValue === 'dark';
        setIsDarkState(newIsDark);
        applyThemeToDOM(newIsDark);
      }
    };

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>;
      if (customEvent.detail) {
        setIsDarkState(customEvent.detail.isDark);
        applyThemeToDOM(customEvent.detail.isDark);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themechange', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ isDark, toggleTheme, setTheme }),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
