import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div 
        className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-panel-title"
        className={`relative w-full rounded-t-2xl border-t max-h-[80vh] overflow-y-auto flex flex-col ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 id="search-panel-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Поиск</h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              aria-label="Закрыть поиск"
            >
              <XIcon />
            </button>
          </div>
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
      </div>
    </div>
  );
};

export default SearchPanel;