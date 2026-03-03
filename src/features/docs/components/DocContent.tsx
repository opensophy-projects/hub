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

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const sidebarVisible = isDesktop && isSidebarOpen;
  // TOC sidebar width on desktop
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
      {/* Scroll progress bar */}
      <div
        className={`fixed top-0 left-0 h-1 z-50 ${isDark ? 'bg-white' : 'bg-black'}`}
        style={{ width: `${scrollProgress}%` }}
      />

      <TopNavbar />
      <Sidebar />

      {/* Desktop TOC — full sidebar on the right */}
      {toc.length > 0 && isDesktop && (
        <aside
          className={`hidden md:flex flex-col fixed right-0 z-40 border-l overflow-hidden ${
            isDark
              ? 'bg-[#0a0a0a] border-white/10'
              : 'bg-[#E8E7E3] border-black/10'
          }`}
          style={{
            top: '4rem',
            width: TOC_WIDTH,
            height: 'calc(100vh - 4rem)',
          }}
        >
          {/* TOC Header */}
          <div
            className={`flex-shrink-0 px-4 py-4 border-b ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}
          >
            <h2 className={`text-sm font-bold uppercase tracking-widest ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}>
              На этой странице
            </h2>
          </div>

          {/* TOC Items */}
          <div className="flex-1 overflow-y-auto py-3">
            <nav className="px-2 space-y-0.5">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToElement(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors leading-snug ${
                    isDark
                      ? 'text-white/60 hover:bg-white/5 hover:text-white'
                      : 'text-black/60 hover:bg-black/5 hover:text-black'
                  }`}
                  style={{ paddingLeft: `${12 + (item.level - 2) * 14}px` }}
                >
                  {item.text}
                </button>
              ))}
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
          transition: 'margin-left 0.3s ease, margin-right 0.3s ease',
        }}
      >
        <article className="flex-1 pt-8 pb-12 px-4 w-full">
          {/* Контейнер контента — максимально широкий, без ограничений по max-w */}
          <div className="mx-auto w-full overflow-x-hidden" style={{ maxWidth: '860px' }}>
            <div className="mb-8">
              {doc.typename && doc.typename.trim() !== '' && (
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-sm font-semibold ${getTextColorClass()}`}>
                    {doc.typename}
                  </span>
                </div>
              )}

              <h1
                className={`text-4xl md:text-5xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {doc.title}
              </h1>

              <p className={`text-lg ${getTextColorClass()}`}>{doc.description}</p>

              <div
                className={`flex items-center gap-4 mt-6 pt-4 border-t flex-wrap ${
                  isDark ? 'border-white/10' : 'border-black/10'
                }`}
              >
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
                className={`prose max-w-none w-full overflow-x-auto ${
                  isDark ? 'text-white' : 'text-black'
                }`}
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