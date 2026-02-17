import React, { useState, useMemo } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getInputClasses, getCardClasses, getTextClasses, getBadgeClasses } from '@/shared/lib/classUtils';
import BottomSheet from './BottomSheet';
import { SearchIcon } from './icons';
import { useDocuments } from '@/features/docs/hooks/useDocuments';

interface UnifiedSearchPanelProps {
  onClose: () => void;
}

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  typename: string;
  author?: string;
  date?: string;
  tags?: string[];
}

type SortOption = 'date-desc' | 'date-asc';

const getFilterButtonClasses = (isActive: boolean, isDark: boolean): string => {
  if (isActive) {
    return isDark
      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-2 border-blue-500 font-semibold'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-2 border-blue-600 font-semibold';
  }
  return isDark
    ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-2 border-transparent'
    : 'bg-black/5 hover:bg-black/10 text-black/70 hover:text-black border-2 border-transparent';
};

const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}> = ({ value, onChange, isDark }) => {
  return (
    <div className="p-4 flex-shrink-0 border-b sticky top-0 z-20" style={{
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      backgroundColor: isDark ? '#0a0a0a' : '#E8E7E3'
    }}>
      <div className="relative">
        <SearchIcon
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${getTextClasses(isDark, '40')}`}
        />
        <input
          type="text"
          placeholder="Поиск по заголовку, описанию, тегам..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          className={`w-full pl-12 pr-4 py-4 rounded-lg border transition-colors outline-none ${getInputClasses(isDark)}`}
        />
      </div>
    </div>
  );
};

const TypenameFilters: React.FC<{
  typenames: string[];
  selectedTypenames: Set<string>;
  onToggle: (typename: string) => void;
  isDark: boolean;
}> = ({ typenames, selectedTypenames, onToggle, isDark }) => {
  if (typenames.length === 0) return null;

  return (
    <div className="p-4 flex-shrink-0 border-b sticky top-[88px] z-10" style={{
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      backgroundColor: isDark ? '#0a0a0a' : '#E8E7E3'
    }}>
      <div className="flex gap-2 flex-wrap">
        {typenames.map(typename => (
          <button
            key={typename}
            onClick={() => onToggle(typename)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              getFilterButtonClasses(selectedTypenames.has(typename), isDark)
            }`}
          >
            {typename}
          </button>
        ))}
      </div>
    </div>
  );
};

const SortFilters: React.FC<{
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  isDark: boolean;
}> = ({ sortBy, onSortChange, isDark }) => {
  const sorts: Array<{ id: SortOption; label: string }> = [
    { id: 'date-desc', label: 'Сначала новые' },
    { id: 'date-asc', label: 'Сначала старые' }
  ];

  return (
    <div>
      <h4 className={`text-xs font-semibold mb-2 ${getTextClasses(isDark, '70')}`}>
        Сортировка
      </h4>
      <div className="flex flex-wrap gap-2">
        {sorts.map(sort => (
          <button
            key={sort.id}
            onClick={() => onSortChange(sort.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              getFilterButtonClasses(sortBy === sort.id, isDark)
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const SearchResultItem: React.FC<{
  result: SearchResult;
  onClick: (result: SearchResult) => void;
  isDark: boolean;
}> = ({ result, onClick, isDark }) => {
  return (
    <button
      onClick={() => onClick(result)}
      className={`w-full text-left p-3 rounded-lg transition-colors border ${getCardClasses(isDark)}`}
    >
      {result.typename && result.typename.trim() !== '' && (
        <div className="flex items-start gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${getBadgeClasses(isDark, 'default')}`}>
            {result.typename}
          </span>
        </div>
      )}
      <h4 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
        {result.title}
      </h4>
      <p className={`text-xs ${getTextClasses(isDark, '50')}`}>
        {result.description.substring(0, 100)}...
      </p>
      {result.tags && result.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {result.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className={`text-xs px-1.5 py-0.5 rounded ${getBadgeClasses(isDark, 'light')}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

const UnifiedSearchPanel: React.FC<UnifiedSearchPanelProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const { manifest: docs } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedTypenames, setSelectedTypenames] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const allTypenames = useMemo(() => {
    const typenames = new Set<string>();
    docs.forEach(doc => {
      if (doc.typename && doc.typename.trim() !== '') {
        typenames.add(doc.typename);
      }
    });
    return Array.from(typenames).sort();
  }, [docs]);

  const filteredResults = useMemo(() => {
    let results = [...docs] as SearchResult[];

    if (selectedTypenames.size > 0) {
      results = results.filter(doc => 
        doc.typename && selectedTypenames.has(doc.typename)
      );
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      results = results.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        (doc.author?.toLowerCase().includes(query) ?? false) ||
        (doc.tags?.some(tag => tag.toLowerCase().includes(query)) ?? false) ||
        (doc.typename?.toLowerCase().includes(query) ?? false)
      );
    }

    if (sortBy === 'date-desc') {
      results.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    } else if (sortBy === 'date-asc') {
      results.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    }

    return results.slice(0, 20);
  }, [docs, selectedTypenames, debouncedSearchQuery, sortBy]);

  const handleTypenameToggle = (typename: string) => {
    const newTypenames = new Set(selectedTypenames);
    if (newTypenames.has(typename)) {
      newTypenames.delete(typename);
    } else {
      newTypenames.add(typename);
    }
    setSelectedTypenames(newTypenames);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTypenames(new Set());
    setSortBy('date-desc');
  };

  const handleResultClick = (doc: SearchResult) => {
    if (doc.type && doc.type.trim() !== '') {
      globalThis.location.href = `/${doc.type}/${doc.slug}`;
    } else {
      globalThis.location.href = `/${doc.slug}`;
    }
  };

  const activeFiltersCount = selectedTypenames.size;

  return (
    <BottomSheet title="Поиск и фильтры" onClose={onClose}>
      <div className="flex flex-col h-full" style={{ maxHeight: '70vh' }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          isDark={isDark}
        />

        <TypenameFilters
          typenames={allTypenames}
          selectedTypenames={selectedTypenames}
          onToggle={handleTypenameToggle}
          isDark={isDark}
        />

        <div className="flex-shrink-0 border-b p-4" style={{
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          backgroundColor: isDark ? '#0a0a0a' : '#E8E7E3'
        }}>
          <SortFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            isDark={isDark}
          />

          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className={`w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500'
                  : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-600'
              }`}
            >
              Сбросить все фильтры
            </button>
          )}
        </div>

        <div 
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ minHeight: '250px', maxHeight: 'calc(70vh - 380px)' }}
        >
          {filteredResults.length > 0 ? (
            <>
              <p className={`text-xs font-semibold mb-3 ${getTextClasses(isDark, '50')}`}>
                Найдено: {filteredResults.length}
              </p>
              <div className="space-y-2">
                {filteredResults.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    onClick={handleResultClick}
                    isDark={isDark}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className={`text-sm ${getTextClasses(isDark, '60')}`}>
                {searchQuery || activeFiltersCount > 0
                  ? 'Ничего не найдено. Попробуйте изменить запрос или фильтры.'
                  : 'Начните вводить запрос или выберите фильтры'}
              </p>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default UnifiedSearchPanel;
