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
  const { isDark } = useTheme();
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

    // Fix S7770: use Boolean directly instead of arrow function wrapper
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopNavbar />
        <Sidebar />
        <main
          className={`min-h-screen flex items-center justify-center ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'
          }`}
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
      {/* Прогресс-бар */}
      <div
        className={`fixed top-0 left-0 h-1 z-50 ${isDark ? 'bg-white' : 'bg-black'}`}
        style={{ width: `${scrollProgress}%` }}
      />

      <TopNavbar />
      <Sidebar />

      <main className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
        {/* На десктопе отступ справа под панель TOC */}
        <article
          className={`flex-1 pt-20 pb-24 px-4 w-full ${toc.length > 0 ? 'md:pr-96' : ''}`}
        >
          <div className="container mx-auto max-w-3xl w-full overflow-x-hidden">
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
              {/* data-article-content нужен для генерации TOC */}
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

        {/* Десктопная панель TOC справа */}
        {toc.length > 0 && (
          <aside
            className={`hidden md:block fixed right-4 top-24 w-80 max-h-[calc(100vh-160px)] overflow-y-auto rounded-lg border ${
              isDark
                ? 'bg-[#0a0a0a] border-white/10'
                : 'bg-[#E8E7E3] border-black/10'
            }`}
          >
            <div
              className="p-4 pb-2 sticky top-0"
              style={{
                backgroundColor: isDark
                  ? 'rgba(10,10,10,0.95)'
                  : 'rgba(232,231,227,0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                На этой странице
              </h2>
            </div>
            <div className="px-4 pb-4 space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToElement(item.id)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                    isDark
                      ? 'text-white/60 hover:bg-white/5 hover:text-white'
                      : 'text-black/60 hover:bg-black/5 hover:text-black'
                  }`}
                  style={{ paddingLeft: `${12 + (item.level - 2) * 12}px` }}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="h-20" />
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
