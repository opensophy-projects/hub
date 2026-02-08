import React, { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet from './BottomSheet';
import { SearchIcon, XIcon } from './icons';
import docs from '@/data/docs.json';

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

const UnifiedSearchPanel: React.FC<UnifiedSearchPanelProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'relevance' | 'date-desc' | 'date-asc'>('relevance');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Получаем уникальные категории
  const categories = useMemo(() => {
    const cats = new Set<string>();
    docs.forEach(doc => {
      if (doc.category) cats.add(doc.category);
    });
    return Array.from(cats).sort();
  }, []);

  // Получаем уникальные теги
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    docs.forEach(doc => {
      if (doc.tags) {
        doc.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, []);

  // Фильтрация и поиск
  const filteredResults = useMemo(() => {
    let results = [...docs] as SearchResult[];

    // Фильтр по типу
    if (selectedType !== 'all') {
      results = results.filter(doc => doc.type === selectedType);
    }

    // Фильтр по категориям
    if (selectedCategories.size > 0) {
      results = results.filter(doc => 
        doc.category && selectedCategories.has(doc.category)
      );
    }

    // Фильтр по тегам
    if (selectedTags.size > 0) {
      results = results.filter(doc =>
        doc.tags && doc.tags.some(tag => selectedTags.has(tag))
      );
    }

    // Поиск по тексту
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.author?.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        doc.category?.toLowerCase().includes(query)
      );
    }

    // Сортировка
    if (sortBy === 'date-desc') {
      results.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    } else if (sortBy === 'date-asc') {
      results.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    }

    return results.slice(0, 20); // Ограничиваем 20 результатами
  }, [docs, selectedType, selectedCategories, selectedTags, searchQuery, sortBy]);

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
    setSortBy('relevance');
  };

  const handleResultClick = (doc: SearchResult) => {
    const typePrefix = doc.type === 'blog' ? '/blog' : doc.type === 'news' ? '/news' : '/docs';
    globalThis.location.href = `${typePrefix}/${doc.slug}`;
  };

  const activeFiltersCount = 
    (selectedType !== 'all' ? 1 : 0) +
    selectedCategories.size +
    selectedTags.size;

  return (
    <BottomSheet title="Поиск и фильтры" onClose={onClose}>
      <div className="flex flex-col h-full max-h-[70vh]">
        {/* Поле поиска */}
        <div className="p-4 flex-shrink-0 border-b" style={{
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <div className="relative">
            <SearchIcon
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`}
            />
            <input
              type="text"
              placeholder="Поиск по заголовку, описанию, тегам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className={`w-full pl-12 pr-4 py-4 rounded-lg border transition-colors outline-none ${
                isDark 
                  ? 'bg-[#0a0a0a] border-white/10 text-white placeholder-white/40 focus:border-white/20' 
                  : 'bg-[#E8E7E3] border-black/10 text-black placeholder-black/40 focus:border-black/20'
              }`}
            />
          </div>
        </div>

        {/* Быстрые фильтры по типу */}
        <div className="p-4 flex-shrink-0 border-b" style={{
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'Все' },
              { id: 'docs', label: 'Документация' },
              { id: 'blog', label: 'Блог' },
              { id: 'news', label: 'Новости' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type.id
                    ? isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
                    : isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-black/5 text-black/70 hover:bg-black/10'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Расширенные фильтры */}
        <div className="flex-shrink-0 border-b" style={{
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
            }`}
          >
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              Расширенные фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''} ${
                isDark ? 'text-white/70' : 'text-black/70'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showAdvanced && (
            <div className={`p-4 space-y-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              {/* Категории */}
              {categories.length > 0 && (
                <div>
                  <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Категории
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedCategories.has(cat)
                            ? isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
                            : isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Теги */}
              {allTags.length > 0 && (
                <div>
                  <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Теги (показаны популярные)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 12).map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedTags.has(tag)
                            ? isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
                            : isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Сортировка */}
              <div>
                <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                  Сортировка
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'relevance', label: 'По релевантности' },
                    { id: 'date-desc', label: 'Сначала новые' },
                    { id: 'date-asc', label: 'Сначала старые' }
                  ].map(sort => (
                    <button
                      key={sort.id}
                      onClick={() => setSortBy(sort.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        sortBy === sort.id
                          ? isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
                          : isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10'
                      }`}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Кнопка сброса */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleReset}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'
                  }`}
                >
                  Сбросить все фильтры
                </button>
              )}
            </div>
          )}
        </div>

        {/* Результаты */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filteredResults.length > 0 ? (
            <>
              <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                Найдено: {filteredResults.length}
              </p>
              <div className="space-y-2">
                {filteredResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border ${
                      isDark ? 'bg-[#0a0a0a] border-white/10 hover:border-white/20' : 'bg-[#E8E7E3] border-black/10 hover:border-black/20'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
                      }`}>
                        {result.type === 'docs' ? 'Документация' : result.type === 'blog' ? 'Блог' : 'Новости'}
                      </span>
                      {result.category && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isDark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-black/60'
                        }`}>
                          {result.category}
                        </span>
                      )}
                    </div>
                    <h4 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                      {result.title}
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {result.description.substring(0, 100)}...
                    </p>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'
                            }`}
                          >
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
            <div className="text-center py-8">
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
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
