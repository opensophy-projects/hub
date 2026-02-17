import React from 'react';
import { getTextClasses, getCardClasses, getBadgeClasses } from '@/shared/lib/classUtils';
import { SearchResult } from './types';

interface SearchResultsProps {
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  searchQuery: string;
  activeFiltersCount: number;
  isDark: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
  searchQuery,
  activeFiltersCount,
  isDark
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={`text-sm ${getTextClasses(isDark, '60')}`}>
          {searchQuery || activeFiltersCount > 0
            ? 'Ничего не найдено. Попробуйте изменить запрос или фильтры.'
            : 'Начните вводить запрос или выберите фильтры'}
        </p>
      </div>
    );
  }

  return (
    <>
      <p className={`text-xs font-semibold mb-3 ${getTextClasses(isDark, '50')}`}>
        Найдено: {results.length}
      </p>
      <div className="space-y-2">
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => onResultClick(result)}
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
  );
};