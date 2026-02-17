import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getInputClasses, getCardClasses, getTextClasses, getBadgeClasses } from '@/shared/lib/classUtils';
import { SearchIcon } from './icons';
import { X } from 'lucide-react';
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

const UnifiedSearchPanel: React.FC<UnifiedSearchPanelProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const { manifest: docs } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedTypenames, setSelectedTypenames] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Закрытие по Escape
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
      if ((doc as any).typename?.trim()) typenames.add((doc as any).typename);
    });
    return Array.from(typenames).sort();
  }, [docs]);

  const filteredResults = useMemo(() => {
    let results = [...docs] as SearchResult[];

    if (selectedTypenames.size > 0) {
      results = results.filter(doc => doc.typename && selectedTypenames.has(doc.typename));
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

    results.sort((a, b) => {
      const diff = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      return sortBy === 'date-desc' ? diff : -diff;
    });

    return results.slice(0, 20);
  }, [docs, selectedTypenames, debouncedSearchQuery, sortBy]);

  const handleTypenameToggle = (typename: string) => {
    setSelectedTypenames(prev => {
      const next = new Set(prev);
      next.has(typename) ? next.delete(typename) : next.add(typename);
      return next;
    });
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTypenames(new Set());
    setSortBy('date-desc');
  };

  const handleResultClick = (doc: SearchResult) => {
    globalThis.location.href = doc.type?.trim() ? `/${doc.type}/${doc.slug}` : `/${doc.slug}`;
  };

  const activeFiltersCount = selectedTypenames.size;
  const bg = isDark ? '#0a0a0a' : '#E8E7E3';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: bg }}>

      {/* Шапка с поиском */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: border }}>
        <SearchIcon className={`w-5 h-5 flex-shrink-0 ${getTextClasses(isDark, '40')}`} />
        <input
          type="text"
          placeholder="Поиск по заголовку, описанию, тегам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className={`flex-1 bg-transparent outline-none text-base ${isDark ? 'text-white placeholder-white/40' : 'text-black placeholder-black/40'}`}
        />
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'}`}
        >
          <X size={20} />
        </button>
      </div>

      {/* Фильтры по типу */}
      {allTypenames.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-b flex gap-2 flex-wrap" style={{ borderColor: border }}>
          {allTypenames.map(typename => (
            <button
              key={typename}
              onClick={() => handleTypenameToggle(typename)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${getFilterButtonClasses(selectedTypenames.has(typename), isDark)}`}
            >
              {typename}
            </button>
          ))}
        </div>
      )}

      {/* Сортировка */}
      <div className="flex-shrink-0 px-4 py-3 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: border }}>
        <span className={`text-xs font-semibold ${getTextClasses(isDark, '50')}`}>Сортировка:</span>
        {(['date-desc', 'date-asc'] as SortOption[]).map((id) => (
          <button
            key={id}
            onClick={() => setSortBy(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${getFilterButtonClasses(sortBy === id, isDark)}`}
          >
            {id === 'date-desc' ? 'Сначала новые' : 'Сначала старые'}
          </button>
        ))}
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500'
                : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-600'
            }`}
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Результаты */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {filteredResults.length > 0 ? (
          <>
            <p className={`text-xs font-semibold mb-3 ${getTextClasses(isDark, '50')}`}>
              Найдено: {filteredResults.length}
            </p>
            <div className="space-y-2">
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${getCardClasses(isDark)}`}
                >
                  {result.typename?.trim() && (
                    <div className="mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${getBadgeClasses(isDark, 'default')}`}>
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
                        <span key={tag} className={`text-xs px-1.5 py-0.5 rounded ${getBadgeClasses(isDark, 'light')}`}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className={`text-sm ${getTextClasses(isDark, '60')}`}>
              {searchQuery || activeFiltersCount > 0
                ? 'Ничего не найдено. Попробуйте изменить запрос или фильтры.'
                : 'Начните вводить запрос или выберите фильтры'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedSearchPanel;