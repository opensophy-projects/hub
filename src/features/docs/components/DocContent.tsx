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
import { Clock, CalendarDays } from 'lucide-react';
import DotWaveBackground from './DotWaveBackground';
import AskAIButton from './AskAIButton';

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

// ─── Read time estimation ─────────────────────────────────────────────────────

function estimateReadTime(content: string): number {
  if (!content) return 1;
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean).length;
  // Average reading speed: 200 words/min (Russian text slightly slower)
  return Math.max(1, Math.round(words / 200));
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

const DocHero: React.FC<{
  doc: DocContentProps['doc'];
  isDark: boolean;
  readTime: number;
  markdownContent?: string;
}> = ({ doc, isDark, readTime, markdownContent }) => {
  const authors = doc.author
    ? doc.author.split(',').map((a) => a.trim()).filter(Boolean)
    : [];

  const formattedDate = doc.date
    ? new Date(doc.date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Solid base color под канвас
  const heroBg = isDark ? '#0a0a0a' : '#E8E7E3';

  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const metaTextColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.75)';
  const metaBadgeBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const metaBadgeBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div
      style={{
        background: heroBg,
        borderBottom: `1px solid ${borderColor}`,
        paddingBottom: '2.5rem',
        paddingTop: '3rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        position: 'relative',
      }}
    >
      {/* Канвас обёрнут чтобы overflow не резал дропдаун */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <DotWaveBackground isDark={isDark} />
      </div>

      {/* Весь контент поверх канваса */}
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Верхняя мета-строка: дата + тема */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        {formattedDate && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: metaTextColor,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <CalendarDays size={13} style={{ opacity: 0.7 }} />
            {formattedDate}
          </span>
        )}

        {doc.typename && doc.typename.trim() !== '' && (
          <>
            {formattedDate && (
              <span style={{ color: metaTextColor, fontSize: '0.7rem' }}>·</span>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: metaTextColor,
                background: metaBadgeBg,
                border: `1px solid ${metaBadgeBorder}`,
                borderRadius: '6px',
                padding: '2px 8px',
              }}
            >
              {doc.typename}
            </span>
          </>
        )}
      </div>

      {/* Заголовок */}
      <h1
        style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: isDark ? '#ffffff' : '#0a0a0a',
          margin: '0 0 1rem 0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          maxWidth: '820px',
        }}
      >
        {doc.title}
      </h1>

      {/* Описание */}
      {doc.description && (
        <p
          style={{
            fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)',
            lineHeight: 1.65,
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.82)',
            margin: '0 0 1.75rem 0',
            maxWidth: '680px',
          }}
        >
          {doc.description}
        </p>
      )}

      {/* Нижняя мета-строка: время чтения + авторы + AskAI */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          paddingTop: '1rem',
        }}
      >
        {/* Время чтения */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            color: metaTextColor,
          }}
        >
          <Clock size={13} style={{ opacity: 0.7 }} />
          {readTime} мин чтения
        </span>

        {/* Авторы */}
        {authors.length > 0 && (
          <>
            <span style={{ color: metaTextColor, fontSize: '0.75rem' }}>·</span>
            <span
              style={{
                fontSize: '0.8rem',
                color: metaTextColor,
              }}
            >
              {authors.length === 1 ? 'Автор' : 'Авторы'}:{' '}
              {authors.map((author, i) => (
                <React.Fragment key={author}>
                  <strong
                    style={{
                      color: isDark ? 'rgba(255,255,255,0.8)' : '#000000',
                      fontWeight: 600,
                    }}
                  >
                    {author}
                  </strong>
                  {i < authors.length - 1 && ', '}
                </React.Fragment>
              ))}
            </span>
          </>
        )}

        {/* Spacer + кнопка Ask AI */}
        <div style={{ marginLeft: 'auto' }}>
          <AskAIButton
            isDark={isDark}
            pageTitle={doc.title}
            pageSlug={doc.slug}
            markdownContent={markdownContent}
          />
        </div>
      </div>
    </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

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

  const readTime = useMemo(() => estimateReadTime(doc.content || htmlContent), [doc.content, htmlContent]);

  const tableContextValue = useMemo(
    () => ({ onTableClick: handleTableClick, isDark }),
    [isDark]
  );

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
            marginLeft: isDesktop ? '20rem' : '0',
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
      {/* Прогресс-бар */}
      <div
        className={`fixed top-0 left-0 h-1 z-50 ${isDark ? 'bg-white' : 'bg-black'}`}
        style={{ width: `${scrollProgress}%` }}
      />

      <TopNavbar />
      <Sidebar />

      {/* TOC справа */}
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
                const distance = index - activeIndex;
                const isActive = distance === 0 && activeId !== '';
                const absDist = Math.abs(distance);
                const accentColor = isDark ? '#ffffff' : '#000000';

                let opacity: number;
                let glowOpacity: number;

                if (activeId === '') {
                  opacity = 0.6;
                  glowOpacity = 0;
                } else if (isActive) {
                  opacity = 1;
                  glowOpacity = 1;
                } else {
                  opacity = Math.max(0.35, 0.8 - absDist * 0.2);
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
          marginLeft: isDesktop ? '20rem' : '0',
          marginRight: toc.length > 0 && isDesktop ? TOC_WIDTH : '0',
          marginTop: isDesktop ? '4rem' : '0',
          marginBottom: isDesktop ? '0' : '3.5rem',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Hero секция */}
        <DocHero doc={doc} isDark={isDark} readTime={readTime} markdownContent={doc.content} />

        {/* Контент */}
        <article
          className="flex-1 pb-12 w-full"
          style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '2rem' }}
        >
          <div className="w-full">
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
