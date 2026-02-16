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
  category?: string;
  author?: string;
  date?: string;
  tags?: string[];
}

type SortOption = 'date-desc' | 'date-asc';

const getTypePrefix = (type: string): string => {
  if (type === 'blog') return '/blog';
  if (type === 'news') return '/news';
  return '/docs';
};

const getTypeDisplayName = (type: string): string => {
  if (type === 'docs') return 'Документация';
  if (type === 'blog') return 'Блог';
  return 'Новости';
};

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

const TypeFilters: React.FC<{
  selectedType: string;
  onTypeChange: (type: string) => void;
  isDark: boolean;
}> = ({ selectedType, onTypeChange, isDark }) => {
  const types = [
    { id: 'all', label: 'Все' },
    { id: 'docs', label: 'Документация' },
    { id: 'blog', label: 'Блог' },
    { id: 'news', label: 'Новости' }
  ];

  return (
    <div className="p-4 flex-shrink-0 border-b sticky top-[88px] z-10" style={{
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      backgroundColor: isDark ? '#0a0a0a' : '#E8E7E3'
    }}>
      <div className="flex gap-2 flex-wrap">
        {types.map(type => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              getFilterButtonClasses(selectedType === type.id, isDark)
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const CategoryFiltersSelect: React.FC<{
  categories: string[];
  selectedCategories: Set<string>;
  onToggle: (category: string) => void;
  isDark: boolean;
}> = ({ categories, selectedCategories, onToggle, isDark }) => {
  if (categories.length === 0) return null;

  const [searchCat, setSearchCat] = useState('');
  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(searchCat.toLowerCase())
  );

  return (
    <div>
      <h4 className={`text-xs font-semibold mb-2 ${getTextClasses(isDark, '70')}`}>
        Категории ({selectedCategories.size} выбрано)
      </h4>
      
      {categories.length > 5 && (
        <input
          type="text"
          placeholder="Поиск по категориям..."
          value={searchCat}
          onChange={(e) => setSearchCat(e.target.value)}
          className={`w-full px-3 py-2 mb-2 rounded-lg text-xs border transition-colors outline-none ${getInputClasses(isDark)}`}
        />
      )}

      <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2" style={{
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      }}>
        {filteredCategories.length > 0 ? (
          filteredCategories.map(cat => (
            <label 
              key={cat}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                selectedCategories.has(cat)
                  ? isDark ? 'bg-blue-600/20' : 'bg-blue-100'
                  : isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCategories.has(cat)}
                onChange={() => onToggle(cat)}
                className="rounded"
              />
              <span className={`text-xs ${
                selectedCategories.has(cat)
                  ? isDark ? 'text-blue-400 font-semibold' : 'text-blue-700 font-semibold'
                  : isDark ? 'text-white/70' : 'text-black/70'
              }`}>
                {cat}
              </span>
            </label>
          ))
        ) : (
          <p className={`text-xs text-center py-2 ${getTextClasses(isDark, '50')}`}>
            Категории не найдены
          </p>
        )}
      </div>
    </div>
  );
};

const TagFiltersSelect: React.FC<{
  allTags: string[];
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  isDark: boolean;
}> = ({ allTags, selectedTags, onToggleTag, isDark }) => {
  if (allTags.length === 0) return null;

  const [searchTag, setSearchTag] = useState('');
  const filteredTags = allTags.filter(tag => 
    tag.toLowerCase().includes(searchTag.toLowerCase())
  );

  return (
    <div>
      <h4 className={`text-xs font-semibold mb-2 ${getTextClasses(isDark, '70')}`}>
        Теги ({selectedTags.size} выбрано)
      </h4>
      
      <input
        type="text"
        placeholder="Поиск по тегам..."
        value={searchTag}
        onChange={(e) => setSearchTag(e.target.value)}
        className={`w-full px-3 py-2 mb-2 rounded-lg text-xs border transition-colors outline-none ${getInputClasses(isDark)}`}
      />

      <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2" style={{
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      }}>
        {filteredTags.length > 0 ? (
          filteredTags.map(tag => (
            <label 
              key={tag}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                selectedTags.has(tag)
                  ? isDark ? 'bg-blue-600/20' : 'bg-blue-100'
                  : isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedTags.has(tag)}
                onChange={() => onToggleTag(tag)}
                className="rounded"
              />
              <span className={`text-xs ${
                selectedTags.has(tag)
                  ? isDark ? 'text-blue-400 font-semibold' : 'text-blue-700 font-semibold'
                  : isDark ? 'text-white/70' : 'text-black/70'
              }`}>
                #{tag}
              </span>
            </label>
          ))
        ) : (
          <p className={`text-xs text-center py-2 ${getTextClasses(isDark, '50')}`}>
            Теги не найдены
          </p>
        )}
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
      <div className="flex items-start gap-2 mb-1">
        <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${getBadgeClasses(isDark, 'default')}`}>
          {getTypeDisplayName(result.type)}
        </span>
        {result.category && (
          <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${getBadgeClasses(isDark, 'light')}`}>
            {result.category}
          </span>
        )}
      </div>
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
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    docs.forEach(doc => {
      if (doc.category) cats.add(doc.category);
    });
    return Array.from(cats).sort();
  }, [docs]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    docs.forEach(doc => {
      doc.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [docs]);

  const filteredResults = useMemo(() => {
    let results = [...docs] as SearchResult[];

    if (selectedType !== 'all') {
      results = results.filter(doc => doc.type === selectedType);
    }

    if (selectedCategories.size > 0) {
      results = results.filter(doc => 
        doc.category && selectedCategories.has(doc.category)
      );
    }

    if (selectedTags.size > 0) {
      results = results.filter(doc =>
        doc.tags?.some(tag => selectedTags.has(tag))
      );
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      results = results.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        (doc.author?.toLowerCase().includes(query) ?? false) ||
        (doc.tags?.some(tag => tag.toLowerCase().includes(query)) ?? false) ||
        (doc.category?.toLowerCase().includes(query) ?? false)
      );
    }

    if (sortBy === 'date-desc') {
      results.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    } else if (sortBy === 'date-asc') {
      results.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    }

    return results.slice(0, 20);
  }, [docs, selectedType, selectedCategories, selectedTags, debouncedSearchQuery, sortBy]);

  const handleCategoryToggle = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategories(new Set());
    setSelectedTags(new Set());
    setSortBy('date-desc');
  };

  const handleResultClick = (doc: SearchResult) => {
    const typePrefix = getTypePrefix(doc.type);
    globalThis.location.href = `${typePrefix}/${doc.slug}`;
  };

  const activeFiltersCount = 
    (selectedType === 'all' ? 0 : 1) +
    selectedCategories.size +
    selectedTags.size;

  return (
    <BottomSheet title="Поиск и фильтры" onClose={onClose}>
      <div className="flex flex-col h-full" style={{ maxHeight: '70vh' }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          isDark={isDark}
        />

        <TypeFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          isDark={isDark}
        />

        <div className="flex-shrink-0 border-b sticky top-[176px] z-10" style={{
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          backgroundColor: isDark ? '#0a0a0a' : '#E8E7E3'
        }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
              isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-black/70 hover:text-black hover:bg-black/5'
            }`}
          >
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              Расширенные фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''} ${getTextClasses(isDark, '70')}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showAdvanced && (
            <div className={`p-4 space-y-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
              <CategoryFiltersSelect
                categories={categories}
                selectedCategories={selectedCategories}
                onToggle={handleCategoryToggle}
                isDark={isDark}
              />

              <TagFiltersSelect
                allTags={allTags}
                selectedTags={selectedTags}
                onToggleTag={handleTagToggle}
                isDark={isDark}
              />

              <SortFilters
                sortBy={sortBy}
                onSortChange={setSortBy}
                isDark={isDark}
              />

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
