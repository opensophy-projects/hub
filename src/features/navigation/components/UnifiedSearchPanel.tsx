import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getInputClasses, getCardClasses, getTextClasses, getBadgeClasses } from '@/shared/lib/classUtils';
import { SearchIcon } from './icons';
import { X, ChevronDown } from 'lucide-react';
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
  typename?: string;
  category?: string;
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

const CheckboxList: React.FC<{
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
  isDark: boolean;
  prefix?: string;
}> = ({ items, selected, onToggle, isDark, prefix = '' }) => {
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const emptyTextClass = getTextClasses(isDark, '50');
  
  return (
    <div 
      className="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-2" 
      style={{ borderColor }}
    >
      {items.length === 0 ? (
        <p className={`text-xs text-center py-2 ${emptyTextClass}`}>
          Не найдено
        </p>
      ) : (
        items.map(item => {
          const isSelected = selected.has(item);
          
          // Вычисляем классы отдельно для читаемости
          let itemBgClass: string;
          if (isSelected) {
            itemBgClass = isDark ? 'bg-blue-600/20' : 'bg-blue-100';
          } else {
            itemBgClass = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
          }
          
          let itemTextClass: string;
          if (isSelected) {
            itemTextClass = isDark ? 'text-blue-400 font-semibold' : 'text-blue-700 font-semibold';
          } else {
            itemTextClass = isDark ? 'text-white/70' : 'text-black/70';
          }
          
          return (
            <label
              key={item}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${itemBgClass}`}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => onToggle(item)} 
                className="rounded" 
              />
              <span className={`text-xs ${itemTextClass}`}>
                {prefix}{item}
              </span>
            </label>
          );
        })
      )}
    </div>
  );
};

const UnifiedSearchPanel: React.FC<UnifiedSearchPanelProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const { manifest: docs } = useDocuments();
  
  // Все хуки вызываются безусловно на верхнем уровне
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

  // Уникальные typename из манифеста
  const allTypenames = useMemo(() => {
    const typenames = new Set<string>();
    docs.forEach(doc => {
      const typename = doc.typename?.trim();
      if (typename) {
        typenames.add(typename);
      }
    });
    return Array.from(typenames).sort();
  }, [docs]);

  // Уникальные теги
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    docs.forEach(doc => { 
      doc.tags?.forEach(tag => tags.add(tag)); 
    });
    return Array.from(tags).sort();
  }, [docs]);

  const filteredResults = useMemo(() => {
    let results = [...docs] as SearchResult[];

    if (selectedTypenames.size > 0) {
      results = results.filter(doc => {
        return doc.typename && selectedTypenames.has(doc.typename);
      });
    }
    
    if (selectedTags.size > 0) {
      results = results.filter(doc => {
        return doc.tags?.some(tag => selectedTags.has(tag));
      });
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      results = results.filter(doc => {
        const titleMatch = doc.title.toLowerCase().includes(query);
        const descriptionMatch = doc.description.toLowerCase().includes(query);
        const authorMatch = doc.author?.toLowerCase().includes(query) ?? false;
        const tagMatch = doc.tags?.some(tag => tag.toLowerCase().includes(query)) ?? false;
        const typenameMatch = doc.typename?.toLowerCase().includes(query) ?? false;
        const typeMatch = doc.type?.toLowerCase().includes(query) ?? false;
        
        return titleMatch || descriptionMatch || authorMatch || tagMatch || typenameMatch || typeMatch;
      });
    }

    results.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      const diff = dateB - dateA;
      return sortBy === 'date-desc' ? diff : -diff;
    });

    return results.slice(0, 20);
  }, [docs, selectedTypenames, selectedTags, debouncedSearchQuery, sortBy]);

  const toggleSet = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>, item: string) => {
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTypenames(new Set());
    setSelectedTags(new Set());
    setSortBy('date-desc');
  };

  const getDocUrl = (doc: SearchResult): string => {
    if (doc.slug === 'welcome') return '/';
    return doc.type?.trim() ? `/${doc.type}/${doc.slug}` : `/${doc.slug}`;
  };

  const handleResultClick = (doc: SearchResult) => {
    globalThis.location.href = getDocUrl(doc);
  };

  const activeFiltersCount = selectedTypenames.size + selectedTags.size;
  const bg = isDark ? '#0a0a0a' : '#E8E7E3';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  // Предвычисленные классы для оптимизации
  const searchIconClass = `w-5 h-5 flex-shrink-0 ${getTextClasses(isDark, '40')}`;
  const inputClass = `flex-1 bg-transparent outline-none text-base ${
    isDark ? 'text-white placeholder-white/40' : 'text-black placeholder-black/40'
  }`;
  const closeButtonClass = `flex-shrink-0 p-1.5 rounded-lg transition-colors ${
    isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'
  }`;
  const advancedButtonClass = `w-full px-4 py-3 flex items-center justify-between transition-colors ${
    isDark ? 'text-white hover:bg-white/5' : 'text-black hover:bg-black/5'
  }`;
  const chevronClass = `transition-transform duration-200 ${
    showAdvanced ? 'rotate-180' : ''
  } ${getTextClasses(isDark, '70')}`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: bg }}>

      {/* Шапка с поиском */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: border }}>
        <SearchIcon className={searchIconClass} />
        <input
          type="text"
          placeholder="Поиск по заголовку, описанию, тегам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className={inputClass}
        />
        <button
          onClick={onClose}
          className={closeButtonClass}
        >
          <X size={20} />
        </button>
      </div>

      {/* Быстрый фильтр по typename */}
      {allTypenames.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-b flex gap-2 flex-wrap" style={{ borderColor: border }}>
          {allTypenames.map(t => (
            <button
              key={t}
              onClick={() => toggleSet(setSelectedTypenames, t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                getFilterButtonClasses(selectedTypenames.has(t), isDark)
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Расширенные фильтры — аккордеон */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: border }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={advancedButtonClass}
        >
          <span className="text-sm font-medium">
            Расширенные фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </span>
          <ChevronDown size={18} className={chevronClass} />
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 space-y-4" style={{ backgroundColor: bg }}>

            {/* Теги */}
            {allTags.length > 0 && (
              <div>
                <h4 className={`text-xs font-semibold mb-2 ${getTextClasses(isDark, '70')}`}>
                  Теги {selectedTags.size > 0 && `(${selectedTags.size})`}
                </h4>
                <input
                  type="text"
                  placeholder="Поиск по тегам..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className={`w-full px-3 py-2 mb-2 rounded-lg text-xs border outline-none ${getInputClasses(isDark)}`}
                />
                <CheckboxList
                  items={allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))}
                  selected={selectedTags}
                  onToggle={(item) => toggleSet(setSelectedTags, item)}
                  isDark={isDark}
                  prefix="#"
                />
              </div>
            )}

            {/* Сортировка */}
            <div>
              <h4 className={`text-xs font-semibold mb-2 ${getTextClasses(isDark, '70')}`}>
                Сортировка
              </h4>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSortBy('date-desc')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    getFilterButtonClasses(sortBy === 'date-desc', isDark)
                  }`}
                >
                  Сначала новые
                </button>
                <button
                  onClick={() => setSortBy('date-asc')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    getFilterButtonClasses(sortBy === 'date-asc', isDark)
                  }`}
                >
                  Сначала старые
                </button>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleReset}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500'
                    : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-600'
                }`}
              >
                Сбросить все фильтры
              </button>
            )}
          </div>
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