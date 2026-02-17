import React from 'react';
import { ChevronDown } from 'lucide-react';
import { getTextClasses, getInputClasses } from '@/shared/lib/classUtils';
import { CheckboxList } from './CheckboxList';
import { getFilterButtonClasses } from './utils';
import { SortOption } from './types';

interface AdvancedFiltersProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  activeFiltersCount: number;
  allTags: string[];
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  tagSearch: string;
  onTagSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
  isDark: boolean;
  borderColor: string;
  backgroundColor: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  showAdvanced,
  onToggleAdvanced,
  activeFiltersCount,
  allTags,
  selectedTags,
  onToggleTag,
  tagSearch,
  onTagSearchChange,
  sortBy,
  onSortChange,
  onReset,
  isDark,
  borderColor,
  backgroundColor
}) => {
  const advancedButtonClass = `w-full px-4 py-3 flex items-center justify-between transition-colors ${
    isDark ? 'text-white hover:bg-white/5' : 'text-black hover:bg-black/5'
  }`;
  const chevronClass = `transition-transform duration-200 ${
    showAdvanced ? 'rotate-180' : ''
  } ${getTextClasses(isDark, '70')}`;

  return (
    <div className="flex-shrink-0 border-b" style={{ borderColor }}>
      <button onClick={onToggleAdvanced} className={advancedButtonClass}>
        <span className="text-sm font-medium">
          Расширенные фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </span>
        <ChevronDown size={18} className={chevronClass} />
      </button>

      {showAdvanced && (
        <div className="px-4 pb-4 space-y-4" style={{ backgroundColor }}>
          {allTags.length > 0 && (
            <div>
              <h4 className={`text-xs font-semibold mb-2 ${getTextClasses(isDark, '70')}`}>
                Теги {selectedTags.size > 0 && `(${selectedTags.size})`}
              </h4>
              <input
                type="text"
                placeholder="Поиск по тегам..."
                value={tagSearch}
                onChange={(e) => onTagSearchChange(e.target.value)}
                className={`w-full px-3 py-2 mb-2 rounded-lg text-xs border outline-none ${getInputClasses(isDark)}`}
              />
              <CheckboxList
                items={allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))}
                selected={selectedTags}
                onToggle={onToggleTag}
                isDark={isDark}
                prefix="#"
              />
            </div>
          )}

          <div>
            <h4 className={`text-xs font-semibold mb-2 ${getTextClasses(isDark, '70')}`}>
              Сортировка
            </h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onSortChange('date-desc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  getFilterButtonClasses(sortBy === 'date-desc', isDark)
                }`}
              >
                Сначала новые
              </button>
              <button
                onClick={() => onSortChange('date-asc')}
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
              onClick={onReset}
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
  );
};