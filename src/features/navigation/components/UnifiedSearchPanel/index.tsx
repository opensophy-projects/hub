import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useDocuments } from '@/features/docs/hooks/useDocuments';
import { SearchHeader } from './SearchHeader';
import { TypenameFilters } from './TypenameFilters';
import { AdvancedFilters } from './AdvancedFilters';
import { SearchResults } from './SearchResults';
import { matchesSearchQuery, buildDocUrl, navigateToUrl } from './utils';
import { UnifiedSearchPanelProps, SearchResult, SortOption } from './types';

const UnifiedSearchPanel: React.FC<UnifiedSearchPanelProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const { manifest: docs } = useDocuments();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypenames, setSelectedTypenames] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') onClose(); 
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const allTypenames = useMemo(() => {
    const typenames = new Set<string>();
    docs.forEach(doc => {
      const typename = doc.typename?.trim();
      if (typename) typenames.add(typename);
    });
    return Array.from(typenames).sort();
  }, [docs]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    docs.forEach(doc => doc.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [docs]);

  const filteredResults = useMemo(() => {
    let results = [...docs] as SearchResult[];

    if (selectedTypenames.size > 0) {
      results = results.filter(doc => doc.typename && selectedTypenames.has(doc.typename));
    }
    
    if (selectedTags.size > 0) {
      results = results.filter(doc => doc.tags?.some(tag => selectedTags.has(tag)));
    }

    if (debouncedSearchQuery.trim()) {
      results = results.filter(doc => matchesSearchQuery(doc, debouncedSearchQuery));
    }

    results.sort((a, b) => {
      const diff = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      return sortBy === 'date-desc' ? diff : -diff;
    });

    return results.slice(0, 20);
  }, [docs, selectedTypenames, selectedTags, debouncedSearchQuery, sortBy]);

  const toggleSet = useCallback((setFn: React.Dispatch<React.SetStateAction<Set<string>>>, item: string) => {
    setFn(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setSelectedTypenames(new Set());
    setSelectedTags(new Set());
    setSortBy('date-desc');
  }, []);

  const handleResultClick = useCallback((doc: SearchResult) => {
    navigateToUrl(buildDocUrl(doc));
  }, []);

  const activeFiltersCount = selectedTypenames.size + selectedTags.size;
  const bg = isDark ? '#0a0a0a' : '#E8E7E3';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: bg }}>
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClose={onClose}
        isDark={isDark}
        borderColor={border}
      />

      <TypenameFilters
        allTypenames={allTypenames}
        selectedTypenames={selectedTypenames}
        onToggle={(t) => toggleSet(setSelectedTypenames, t)}
        isDark={isDark}
        borderColor={border}
      />

      <AdvancedFilters
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        activeFiltersCount={activeFiltersCount}
        allTags={allTags}
        selectedTags={selectedTags}
        onToggleTag={(t) => toggleSet(setSelectedTags, t)}
        tagSearch={tagSearch}
        onTagSearchChange={setTagSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleReset}
        isDark={isDark}
        borderColor={border}
        backgroundColor={bg}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <SearchResults
          results={filteredResults}
          onResultClick={handleResultClick}
          searchQuery={searchQuery}
          activeFiltersCount={activeFiltersCount}
          isDark={isDark}
        />
      </div>
    </div>
  );
};

export default UnifiedSearchPanel;