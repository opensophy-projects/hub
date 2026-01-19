import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import docs from '@/data/docs.json';
import { useTheme } from '@/contexts/ThemeContext';

interface ToContentsItem {
  id: string;
  text: string;
  level: number;
}

const MobileNavbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [toc, setToc] = useState<ToContentsItem[]>([]);
  const [isArticlePage, setIsArticlePage] = useState(false);

  useEffect(() => {
    setIsArticlePage(/^\/docs\/|^\/blog\/|^\/news\//.test(window.location.pathname));

    if (isArticlePage) {
      const generateTOC = () => {
        const articleContent = document.querySelector('[data-article-content]');
        if (!articleContent) return;

        const headings = articleContent.querySelectorAll('h2, h3, h4');
        const items: ToContentsItem[] = [];

        headings.forEach((heading, index) => {
          const id = `heading-${index}`;
          heading.id = id;
          items.push({
            id,
            text: heading.textContent || '',
            level: parseInt(heading.tagName[1]),
          });
        });

        setToc(items);
      };

      const timer = setTimeout(generateTOC, 100);
      return () => clearTimeout(timer);
    }
  }, [isArticlePage]);

  const types = [
    { id: 'all', name: 'Все' },
    { id: 'docs', name: 'Документация' },
    { id: 'blog', name: 'Блог' },
    { id: 'news', name: 'Новости' },
  ];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return docs
      .filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.description.toLowerCase().includes(query) ||
          (d.author && d.author.toLowerCase().includes(query)) ||
          (d.tags && d.tags.some((tag) => tag.toLowerCase().includes(query)))
      )
      .slice(0, 5);
  }, [searchQuery]);

  const SearchIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
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

  const FolderIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );

  const SunIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );

  const MoonIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );

  const MailIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );

  const BackIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );

  const ArrowUpIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );

  const ListIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );

  const SendIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );

  const GithubIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );

  const HabrIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M7 7h10M7 12h10M7 17h10" />
    </svg>
  );

  const XIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
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

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setIsFiltersOpen(false);
    window.location.href = typeId === 'all' ? '/' : `/?type=${typeId}`;
  };

  const handleSearchResult = (slug: string) => {
    window.location.href = `/docs/${slug}`;
  };

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsTocOpen(false);
  };

  const handleBackClick = () => {
    window.history.back();
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const NavButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive?: boolean;
  }> = ({ icon, label, onClick, isActive = false }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors ${
        isActive
          ? isDark
            ? 'text-white'
            : 'text-black'
          : isDark
          ? 'text-white/60 hover:text-white'
          : 'text-black/60 hover:text-black'
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t transition-all duration-500 ${
          isDark ? 'bg-[#0a0a0a]/95 border-white/10 backdrop-blur-sm' : 'bg-[#E8E7E3]/95 border-black/10 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {isArticlePage ? (
            <>
              <NavButton icon={<BackIcon />} label="Назад" onClick={handleBackClick} />
              <NavButton icon={<ArrowUpIcon />} label="Наверх" onClick={handleScrollTop} />
              <NavButton icon={<ListIcon />} label="Оглавление" onClick={() => setIsTocOpen(!isTocOpen)} />
              <div className={`w-px h-8 ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
              <NavButton icon={isDark ? <SunIcon /> : <MoonIcon />} label="Тема" onClick={toggleTheme} />
              <NavButton icon={<MailIcon />} label="Контакты" onClick={() => setIsContactsOpen(true)} />
            </>
          ) : (
            <>
              <NavButton icon={<FolderIcon />} label="Фильтр" onClick={() => setIsFiltersOpen(true)} />
              <NavButton icon={<SearchIcon />} label="Поиск" onClick={() => setIsSearchOpen(true)} />
              <a href="/" className="flex flex-col items-center justify-center gap-1 px-2 py-2">
                <img src="/favicon.png" alt="Opensophy" className="w-7 h-7 object-contain" />
              </a>
              <NavButton icon={isDark ? <SunIcon /> : <MoonIcon />} label="Тема" onClick={toggleTheme} />
              <NavButton icon={<MailIcon />} label="Контакты" onClick={() => setIsContactsOpen(true)} />
            </>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {isFiltersOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end"
            onClick={() => setIsFiltersOpen(false)}
          >
            <div className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`} />
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${
                isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
              }`}
            >
              <div
                className={`sticky top-0 flex items-center justify-between p-4 border-b backdrop-blur-sm ${
                  isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-[#E8E7E3]/95 border-black/10'
                }`}
              >
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Фильтр по типам</h3>
                <button onClick={() => setIsFiltersOpen(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
                  <XIcon />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-colors text-left ${
                      selectedType === type.id
                        ? isDark
                          ? 'bg-white/10 text-white'
                          : 'bg-black/10 text-black'
                        : isDark
                        ? 'text-white/70 hover:bg-white/5'
                        : 'text-black/70 hover:bg-black/5'
                    }`}
                  >
                    <span className="text-base font-medium">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end"
            onClick={() => setIsSearchOpen(false)}
          >
            <div className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`} />
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full rounded-t-2xl border-t max-h-[80vh] overflow-y-auto flex flex-col ${
                isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
              }`}
            >
              <div className="p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Поиск</h3>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                        onClick={() => handleSearchResult(result.slug)}
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
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTocOpen && toc.length > 0 && (
          <div
            className="fixed inset-0 z-[60] flex items-end"
            onClick={() => setIsTocOpen(false)}
          >
            <div className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`} />
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${
                isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
              }`}
            >
              <div
                className={`sticky top-0 flex items-center justify-between p-4 border-b backdrop-blur-sm ${
                  isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-[#E8E7E3]/95 border-black/10'
                }`}
              >
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>На этой странице</h3>
                <button onClick={() => setIsTocOpen(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
                  <XIcon />
                </button>
              </div>
              <div className="p-4 space-y-1">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTocClick(item.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                      isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                    style={{ paddingLeft: `${12 + (item.level - 2) * 16}px` }}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContactsOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end"
            onClick={() => setIsContactsOpen(false)}
          >
            <div className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`} />
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full rounded-t-2xl border-t ${
                isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Контакты</h3>
                  <button
                    onClick={() => setIsContactsOpen(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                  >
                    <XIcon />
                  </button>
                </div>
                <div className="space-y-2">
                  <a
                    href="mailto:opensophy@gmail.com"
                    className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-colors ${
                      isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    <MailIcon className="w-6 h-6" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm opacity-70">opensophy@gmail.com</div>
                    </div>
                  </a>
                  <a
                    href="https://t.me/veilosophy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-colors ${
                      isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    <SendIcon className="w-6 h-6" />
                    <div>
                      <div className="font-medium">Telegram</div>
                      <div className="text-sm opacity-70">@veilosophy</div>
                    </div>
                  </a>
                  <a
                    href="https://github.com/opensophy-projects"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-colors ${
                      isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    <GithubIcon className="w-6 h-6" />
                    <div>
                      <div className="font-medium">GitHub</div>
                      <div className="text-sm opacity-70">opensophy</div>
                    </div>
                  </a>
                  <a
                    href="https://habr.com/ru/users/opensophy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-colors ${
                      isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    <HabrIcon className="w-6 h-6" />
                    <div>
                      <div className="font-medium">Habr</div>
                      <div className="text-sm opacity-70">opensophy</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavbar;
