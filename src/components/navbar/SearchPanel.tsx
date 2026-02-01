import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet from './BottomSheet';
import { SearchIcon } from './icons';

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string;
}

interface SearchPanelProps {
  searchQuery: string;
  searchResults: SearchResult[];
  onSearchChange: (query: string) => void;
  onSearchResult: (slug: string) => void;
  onClose: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  searchQuery,
  searchResults,
  onSearchChange,
  onSearchResult,
  onClose,
}) => {
  const { isDark } = useTheme();

  return (
    <BottomSheet title="Поиск" onClose={onClose}>
      <div className="p-4 flex-shrink-0">
        <div className="relative">
          <SearchIcon
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-white/40' : 'text-black/40'
            }`}
          />
          <input
            type="text"
            placeholder="Поиск статей..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
            className={`w-full pl-12 pr-4 py-4 rounded-lg border transition-colors outline-none ${
              isDark ? 'bg-[#0a0a0a] border-white/10 text-white placeholder-white/40 focus:border-white/20' : 'bg-[#E8E7E3] border-black/10 text-black placeholder-black/40 focus:border-black/20'
            }`}
          />
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Возможно вы ищете:</p>
          <div className="space-y-2">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => onSearchResult(result.slug)}
                className={`w-full text-left p-3 rounded-lg transition-colors border ${
                  isDark ? 'bg-[#0a0a0a] border-white/10 hover:border-white/20' : 'bg-[#E8E7E3] border-black/10 hover:border-black/20'
                }`}
              >
                <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{result.title}</h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>{result.description.substring(0, 80)}...</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </BottomSheet>
  );
};

export default SearchPanel;
