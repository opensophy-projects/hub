import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from '@/shared/contexts/ThemeContext';
import TopNavbar from '@/features/navigation/components/MobileNavbar';
import Sidebar from '@/features/navigation/components/Sidebar';
import { parseHtmlToReact, TableContext } from '@/shared/lib/htmlParser';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { scrollToElement } from '../utils/scrollUtils';
import { useDocuments } from '../hooks/useDocuments';

const LazyTableModal = lazy(() => import('@/features/table/components/TableModal'));

interface DocContentProps {
  doc: {
    id: string;
    title: string;
    slug: string;
    description: string;
    type?: string;
    typename?: string;
    content?: string;
    author?: string;
    date?: string;
    tags?: string[];
  };
}

const DocContentMain: React.FC<DocContentProps> = ({ doc: initialDoc }) => {
  const { isDark, isSidebarOpen } = useTheme();
  const { loadDocument } = useDocuments();
  const [doc, setDoc] = useState(initialDoc);
  const [loading, setLoading] = useState(!initialDoc.content);
  const [fullscreenTableHtml, setFullscreenTableHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!initialDoc.content) {
      loadDocument(initialDoc.slug).then((fullDoc) => {
        if (fullDoc) {
          setDoc(fullDoc);
          setLoading(false);
        }
      });
    }
  }, [initialDoc.slug, initialDoc.content, loadDocument]);

  const toc = useTableOfContents(doc);
  const scrollProgress = useScrollProgress();
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (toc.length === 0) return;
    const headingEls = toc
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  const handleTableClick = (tableHtml: string) => {
    setFullscreenTableHtml(tableHtml);
  };

  const htmlContent = useMemo(() => {
    if (!doc.content) return '';
    return DOMPurify.sanitize(marked(doc.content));
  }, [doc.content]);

  const contentNodes = useMemo(() => {
    if (!htmlContent) return [];
    return parseHtmlToReact(htmlContent);
  }, [htmlContent]);

  const getTextColorClass = (opacity = '70'): string =>
    isDark ? `text-white/${opacity}` : `text-black/${opacity}`;

  const tableContextValue = useMemo(
    () => ({ onTableClick: handleTableClick, isDark }),
    [isDark]
  );

  const getAuthorDisplay = () => {
    if (!doc.author || doc.author.trim() === '') return null;
    const authors = doc.author.split(',').map((a) => a.trim()).filter(Boolean);
    if (authors.length === 0) return null;
    return (
      <span className={`text-sm ${getTextColorClass('60')}`}>
        {authors.length === 1 ? 'Автор' : 'Авторы'}:{' '}
        <strong className={isDark ? 'text-white' : 'text-black'}>
          {authors.join(', ')}
        </strong>
      </span>
    );
  };

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sidebarVisible = isDesktop;
  const TOC_WIDTH = toc.length > 0 ? '18rem' : '0';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopNavbar />
        <Sidebar />
        <main
          className={`min-h-screen flex items-center justify-center ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'
          }`}
          style={{
            marginLeft: sidebarVisible ? '20rem' : '0',
            marginRight: toc.length > 0 && isDesktop ? TOC_WIDTH : '0',
            marginTop: isDesktop ? '4rem' : '0',
            marginBottom: isDesktop ? '0' : '3.5rem',
          }}
        >
          <p className={`text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Загрузка документа...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        className={`fixed top-0 left-0 h-1 z-50 ${isDark ? 'bg-white' : 'bg-black'}`}
        style={{ width: `${scrollProgress}%` }}
      />

      <TopNavbar />
      <Sidebar />

      {toc.length > 0 && isDesktop && (
        <aside
          className={`hidden md:flex flex-col fixed right-0 z-40 border-l overflow-hidden ${
            isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
          }`}
          style={{ top: '4rem', width: TOC_WIDTH, height: 'calc(100vh - 4rem)' }}
        >
          <div className={`flex-shrink-0 px-4 py-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              На этой странице
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto py-3">
            <nav className="space-y-0.5">
              {toc.map((item, index) => {
                const activeIndex = toc.findIndex((t) => t.id === activeId);
                const distance = index - activeIndex; // negative = above/read, positive = below/unread
                const isActive = distance === 0 && activeId !== '';
                const absDist = Math.abs(distance);
                const accentColor = isDark ? '#ffffff' : '#000000';

                let opacity: number;
                let glowOpacity: number;

                if (activeId === '') {
                  opacity = 0.4;
                  glowOpacity = 0;
                } else if (isActive) {
                  opacity = 1;
                  glowOpacity = 1;
                } else {
                  // Symmetric fade in both directions from active
                  opacity = Math.max(0.1, 0.7 - absDist * 0.2);
                  // Glow in both directions, fading by distance
                  glowOpacity = Math.max(0, 0.55 - absDist * 0.18);
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToElement(item.id)}
                    className="w-full text-left py-2 pr-3 text-sm leading-snug"
                    style={{
                      paddingLeft: `${14 + (item.level - 2) * 14}px`,
                      color: isActive
                        ? (isDark ? '#ffffff' : '#000000')
                        : isDark
                          ? `rgba(255,255,255,${opacity})`
                          : `rgba(0,0,0,${opacity})`,
                      transition: 'color 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease, text-shadow 0.5s ease',
                      borderLeft: '2px solid',
                      borderLeftColor: isActive
                        ? accentColor
                        : glowOpacity > 0
                          ? `${isDark ? `rgba(255,255,255,${glowOpacity})` : `rgba(0,0,0,${glowOpacity})`}`
                          : 'transparent',
                      boxShadow: isActive
                        ? `inset 3px 0 14px -2px ${accentColor}bb`
                        : glowOpacity > 0
                          ? `inset 3px 0 10px -3px ${isDark ? `rgba(255,255,255,${glowOpacity * 0.55})` : `rgba(0,0,0,${glowOpacity * 0.55})`}`
                          : 'none',
                      textShadow: isActive
                        ? `0 0 18px ${accentColor}99`
                        : 'none',
                    }}
                  >
                    {item.text}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
      )}

      <main
        className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}
        style={{
          marginLeft: sidebarVisible ? '20rem' : '0',
          marginRight: toc.length > 0 && isDesktop ? TOC_WIDTH : '0',
          marginTop: isDesktop ? '4rem' : '0',
          marginBottom: isDesktop ? '0' : '3.5rem',
          transition: 'margin-left 0.3s ease',
        }}
      >
        <article className="flex-1 pt-8 pb-12 w-full" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
          <div className="w-full">
            <div className="mb-8">
              {doc.typename && doc.typename.trim() !== '' && (
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-sm font-semibold ${getTextColorClass()}`}>
                    {doc.typename}
                  </span>
                </div>
              )}

              <h1
                className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {doc.title}
              </h1>

              <p className={`text-lg ${getTextColorClass()}`}>{doc.description}</p>

              <div className={`flex items-center gap-4 mt-6 pt-4 border-t flex-wrap ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                {getAuthorDisplay()}
                {doc.date && (
                  <span className={`text-sm ${getTextColorClass('60')}`}>
                    {new Date(doc.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>

            <TableContext.Provider value={tableContextValue}>
              <div
                data-article-content
                className={`prose max-w-none w-full overflow-x-auto ${isDark ? 'text-white' : 'text-black'}`}
              >
                {contentNodes}
              </div>
            </TableContext.Provider>
          </div>
        </article>
      </main>

      <AnimatePresence>
        {fullscreenTableHtml && (
          <Suspense fallback={null}>
            <LazyTableModal
              isOpen={!!fullscreenTableHtml}
              tableHtml={fullscreenTableHtml}
              isDark={isDark}
              onClose={() => setFullscreenTableHtml(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

const DocContent: React.FC<DocContentProps> = ({ doc }) => (
  <ThemeProvider>
    <DocContentMain doc={doc} />
  </ThemeProvider>
);

export default DocContent;
