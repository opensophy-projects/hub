import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import MobileNavbar from '@/components/MobileNavbar';
import DocBanner from './DocBanner';
import TableModal from './TableModal';
import { parseHtmlToReact, TableContext } from '@/lib/htmlParser';

interface DocContentProps {
  doc: {
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
  };
}

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

const DocContentMain: React.FC<DocContentProps> = ({ doc }) => {
  const { isDark } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fullscreenTableHtml, setFullscreenTableHtml] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const generateTOC = () => {
      if (!contentRef.current) return;
      
      const headings = contentRef.current.querySelectorAll('h2, h3, h4');
      const items: TableOfContentsItem[] = [];

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
  }, [doc]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
      const windowHeight = scrollHeight - clientHeight;
      const progress = windowHeight > 0 ? (scrollTop / windowHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTableClick = (tableHtml: string) => {
    setFullscreenTableHtml(tableHtml);
  };

  // Настраиваем marked для добавления data-language к блокам кода
  marked.setOptions({
    highlight: function(code, lang) {
      return code;
    }
  });

  const renderer = new marked.Renderer();
  
  renderer.code = function(code, language) {
    const lang = language || 'bash';
    return `<pre data-language="${lang}"><code>${code}</code></pre>`;
  };

  marked.setOptions({ renderer });

  const htmlContent = DOMPurify.sanitize(marked(doc.content || ''), {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'a',
      'ul', 'ol', 'li', 'blockquote', 'code',
      'pre', 'img', 'table', 'tr', 'td', 'th',
      'thead', 'tbody', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'data-language'],
    ALLOW_DATA_ATTR: true,
  });

  const contentNodes = parseHtmlToReact(htmlContent);

  const DocIcon = ({ type, className = 'w-10 h-10' }: { type: string; className?: string }) => {
    switch (type) {
      case 'docs':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'blog':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        );
      case 'news':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8z" />
          </svg>
        );
      default:
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        className={`fixed top-0 left-0 h-1 z-50 ${isDark ? 'bg-white' : 'bg-black'}`}
        style={{ width: `${scrollProgress}%` }}
      />

      <main className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
        <header
          className={`hidden md:flex fixed top-0 left-0 right-0 z-40 border-b ${
            isDark
              ? 'bg-[#0a0a0a]/95 border-white/10 backdrop-blur-sm' 
              : 'bg-[#E8E7E3]/95 border-black/10 backdrop-blur-sm'
          }`}
        >
          <div className="flex items-center justify-between px-8 h-16 w-full">
            
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Назад</span>
            </a>

            <h1 className={`text-xl font-bold max-w-2xl text-center ${isDark ? 'text-white' : 'text-black'}`}>
              {doc.title}
            </h1>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
              <span>Наверх</span>
            </button>
          </div>
        </header>

        <div className="flex w-full">
          <article className="flex-1 pt-24 pb-24 px-4 md:pr-80 w-full" data-article-content>
            <div className="container mx-auto max-w-3xl w-full overflow-x-hidden">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <DocIcon type={doc.type} />
                  <span className={`text-sm font-semibold ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {doc.type === 'docs' && 'Документация'}
                    {doc.type === 'blog' && 'Блог'}
                    {doc.type === 'news' && 'Новости'}
                  </span>
                </div>
                <h1
                  className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  {doc.title}
                </h1>
                <p className={`text-lg ${isDark ? 'text-white/70' : 'text-black/70'}`}>{doc.description}</p>
                <div
                  className={`flex items-center gap-4 mt-6 pt-4 border-t flex-wrap ${isDark ? 'border-white/10' : 'border-black/10'}`}
                >
                  {doc.author && (
                    <span className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      Автор: <strong className={isDark ? 'text-white' : 'text-black'}>{doc.author}</strong>
                    </span>
                  )}
                  {doc.date && (
                    <span className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(doc.date).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                  {doc.category && (
                    <span className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      Категория: <strong className={isDark ? 'text-white' : 'text-black'}>{doc.category}</strong>
                    </span>
                  )}
                </div>
              </div>

              <DocBanner
                bannercolor={doc.bannercolor || '#3b82f6'}
                bannertext={doc.bannertext || doc.title}
                isDark={isDark}
                className="mb-8 rounded-lg overflow-hidden border"
                isCard={false}
              />

              <TableContext.Provider value={{ onTableClick: handleTableClick, isDark }}>
                <div
                  ref={contentRef}
                  className="prose max-w-none prose-invert w-full overflow-x-auto"
                >
                  {contentNodes}
                </div>
              </TableContext.Provider>
            </div>
          </article>

          {toc.length > 0 && (
            <aside
              className={`hidden md:block fixed right-8 top-24 w-64 max-h-[calc(100vh-160px)] overflow-y-auto rounded-lg border ${
                isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
              }`}
            >
              <div className="p-6 pb-2">
                <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>На этой странице</h2>
              </div>
              <div className="px-6 pb-6 space-y-1">
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
            </aside>
          )}
        </div>

        <div className="h-20" />
      </main>

      <AnimatePresence>
        {fullscreenTableHtml && (
          <TableModal
            isOpen={!!fullscreenTableHtml}
            tableHtml={fullscreenTableHtml}
            isDark={isDark}
            onClose={() => setFullscreenTableHtml(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const DocContent: React.FC<DocContentProps> = ({ doc }) => {
  return (
    <ThemeProvider>
      <DocContentMain doc={doc} />
      <MobileNavbar />
    </ThemeProvider>
  );
};

export default DocContent;