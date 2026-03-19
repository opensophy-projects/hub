import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import UnifiedSearchPanel from './UnifiedSearchPanel';
import { AnimatePresence } from 'framer-motion';

/**
 * SearchWrapper no longer wraps itself in ThemeProvider.
 * Uses useTheme() directly — context is provided by Layout.astro.
 */
const SearchWrapper: React.FC = () => {
  const { isSearchOpen, setSearchOpen } = useTheme();
  return (
    <AnimatePresence>
      {isSearchOpen && (
        <UnifiedSearchPanel onClose={() => setSearchOpen(false)} />
      )}
    </AnimatePresence>
  );
};

export default SearchWrapper;