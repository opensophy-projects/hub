import React from 'react';
import { ThemeProvider, useTheme } from '@/shared/contexts/ThemeContext';
import UnifiedSearchPanel from './UnifiedSearchPanel';
import { AnimatePresence } from 'framer-motion';

const SearchWrapperInner: React.FC = () => {
  const { isSearchOpen, setSearchOpen } = useTheme();
  return (
    <AnimatePresence>
      {isSearchOpen && (
        <UnifiedSearchPanel onClose={() => setSearchOpen(false)} />
      )}
    </AnimatePresence>
  );
};

const SearchWrapper: React.FC = () => (
  <ThemeProvider>
    <SearchWrapperInner />
  </ThemeProvider>
);

export default SearchWrapper;
