import React, { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from '@/shared/contexts/ThemeContext';
import TopNavbar from '@/features/navigation/components/MobileNavbar';
import Sidebar from '@/features/navigation/components/Sidebar';
import DocBanner from './DocBanner';
import TableModal from '@/features/table/components/TableModal';
import DocIcon from './DocIcon';
import { parseHtmlToReact, TableContext } from '@/shared/lib/htmlParser';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { scrollToElement } from '../utils/scrollUtils';
import { useDocuments } from '../hooks/useDocuments';

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

const DocContentMain: React.FC<DocContentProps> = ({ doc: initialDoc }) => {
  const { isDark } = useTheme();
  const { loadDocument } = useDocuments();
  const [doc, setDoc] = useState(initialDoc);
  const [loading, setLoading] = useState(!initialDoc.content);
  const [fullscreenTableHtml, setFullscreenTableHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!initialDoc.content) {
      loadDocument(initialDoc.slug).then(fullDoc => {
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

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      docs: 'Документация',
      blog: 'Блог',
      news: 'Новости',
    };
    return labels[type] || 'Контент';
  };

  const getTextColorClass = (isDark: boolean, opacity = '70'): string => {
    return isDark ? `text-white/${opacity}` : `text-black/${opacity}`;
  };

  const tableContextValue = useMemo(
    () => ({ onTableClick: handleTableClick, isDark }),
    [isDark]
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopNavbar />
        <Sidebar />
        <main className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
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

      <main className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
        <article className="flex-1 pt-24 pb-24 px-4 md:pr-80 w-full" data-article-content>
          <div className="container mx-auto max-w-3xl w-full overflow-x-hidden">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <DocIcon type={doc.type} />
                <span className={`text-sm font-semibold ${getTextColorClass(isDark)}`}>{getTypeLabel(doc.type)}</span>
              </div>
              <h1
                className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {doc.title}
              </h1>
              <p className={`text-lg ${getTextColorClass(isDark)}`}>{doc.description}</p>
              <div className={`flex items-center gap-4 mt-6 pt-4 border-t flex-wrap ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                {doc.author && (
                  <span className={`text-sm ${getTextColorClass(isDark, '60')}`}>
                    Автор: <strong className={isDark ? 'text-white' : 'text-black'}>{doc.author}</strong>
                  </span>
                )}
                {doc.date && (
                  <span className={`text-sm ${getTextColorClass(isDark, '60')}`}>
                    {new Date(doc.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {doc.category && (
                  <span className={`text-sm ${getTextColorClass(isDark, '60')}`}>
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

            <TableContext.Provider value={tableContextValue}>
              <div className="prose max-w-none prose-invert w-full overflow-x-auto">
                {contentNodes}
              </div>
            </TableContext.Provider>
          </div>
        </article>

        {toc.length > 0 && (
          <aside className={`hidden md:block fixed right-8 top-24 w-64 max-h-[calc(100vh-160px)] overflow-y-auto rounded-lg border ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'}`}>
            <div className="p-6 pb-2">
              <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>На этой странице</h2>
            </div>
            <div className="px-6 pb-6 space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToElement(item.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`}
                  style={{ paddingLeft: `${12 + (item.level - 2) * 16}px` }}
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
    </ThemeProvider>
  );
};

export default DocContent;
