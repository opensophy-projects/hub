import React, { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import MobileNavbar from '@/components/MobileNavbar';
import DocBanner from '@/components/DocBanner';
import DocContent from '@/components/DocContent';
import { Home, Calendar, User, Tag, ArrowLeft } from 'lucide-react';

interface Doc {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: 'docs' | 'blog' | 'news';
  category?: string;
  content?: string;
  bannercolor?: string;
  bannertext?: string;
  author?: string;
  date?: string;
  tags?: string[];
}

interface DocPageProps {
  doc: Doc;
}

const DocPageContent: React.FC<DocPageProps> = ({ doc }) => {
  const { isDark } = useTheme();
  const [toc, setToc] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('[data-article-content] h2, [data-article-content] h3, [data-article-content] h4');
      const items: Array<{ id: string; text: string; level: number }> = [];

      headings.forEach((heading, index) => {
        const id = heading.id || `heading-${index}`;
        heading.id = id;
        items.push({
          id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName[1]),
        });
      });

      setToc(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [doc.content]);

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('[data-article-content] h2, [data-article-content] h3, [data-article-content] h4');
      let current = '';

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          current = heading.id;
        }
      });

      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: isDark ? '#0a0a0a' : '#E8E7E3', minHeight: '100vh' }}>
      {/* Баннер */}
      <DocBanner
        bannercolor={doc.bannercolor || '#3b82f6'}
        bannertext={doc.bannertext || doc.title}
        isDark={isDark}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Боковая панель слева (Desktop) */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <a
                href="/"
                className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-black'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">На главную</span>
              </a>

              <button
                onClick={scrollToTop}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg mb-6 transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-black'
                }`}
              >
                <ArrowLeft className="w-5 h-5 rotate-90" />
                <span className="font-medium">Наверх</span>
              </button>

              {toc.length > 0 && (
                <div>
                  <h3 className={`text-sm font-bold mb-3 px-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    На этой странице
                  </h3>
                  <nav className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                          activeId === item.id
                            ? isDark
                              ? 'bg-white/10 text-white font-medium'
                              : 'bg-black/10 text-black font-medium'
                            : isDark
                            ? 'text-white/60 hover:bg-white/5 hover:text-white'
                            : 'text-black/60 hover:bg-black/5 hover:text-black'
                        }`}
                        style={{ paddingLeft: `${12 + (item.level - 2) * 12}px` }}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </div>
          </aside>

          {/* Основной контент */}
          <main className="flex-1 min-w-0">
            <article className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {/* Метаданные */}
              <div className={`mb-8 pb-6 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                  {doc.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm">
                  {doc.author && (
                    <div className={`flex items-center gap-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      <User className="w-4 h-4" />
                      <span>{doc.author}</span>
                    </div>
                  )}

                  {doc.date && (
                    <div className={`flex items-center gap-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(doc.date).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  {doc.category && (
                    <div className={`flex items-center gap-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      <Tag className="w-4 h-4" />
                      <span>{doc.category}</span>
                    </div>
                  )}
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {doc.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-black/80'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Контент статьи */}
              <div data-article-content>
                {doc.content ? (
                  <DocContent content={doc.content} isDark={isDark} />
                ) : (
                  <p className={isDark ? 'text-white/60' : 'text-black/60'}>
                    Контент статьи не найден.
                  </p>
                )}
              </div>
            </article>
          </main>
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
};

const DocPage: React.FC<DocPageProps> = ({ doc }) => {
  return (
    <ThemeProvider>
      <DocPageContent doc={doc} />
      <MobileNavbar />
    </ThemeProvider>
  );
};

export default DocPage;
