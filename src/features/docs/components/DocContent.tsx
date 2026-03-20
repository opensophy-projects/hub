import React, { useState, useMemo, Suspense, lazy, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';
import { parseHtmlToReact, TableContext } from '@/shared/lib/htmlParser';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { Clock, CalendarDays, ChevronRight, RefreshCw } from 'lucide-react';
import DotWaveBackground from './DotWaveBackground';
import AskAIButton from './AskAIButton';

const LazyTableModal = lazy(() => import('@/features/table/components/TableModal'));

interface DocContentProps {
  doc: {
    id: string; title: string; slug: string; description: string;
    type?: string; typename?: string; content?: string;
    author?: string; date?: string; updated?: string;
    tags?: string[]; navSlug?: string; navTitle?: string;
  };
}

function stripHtmlTags(html: string): string {
  return html.split('<').map((c, i) => i === 0 ? c : c.slice(c.indexOf('>') + 1)).join(' ');
}

function estimateReadTime(content: string): number {
  if (!content) return 1;
  const words = stripHtmlTags(content).replaceAll(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function useActiveHeading(toc: { id: string; text: string; level: number }[]): string {
  const [activeId, setActiveId] = useState('');
  useEffect(() => {
    if (!toc.length) return;
    const els = toc.map(({ id }) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [toc]);
  return activeId;
}

// ─── DocHero ──────────────────────────────────────────────────────────────────

const DocHero: React.FC<{ doc: DocContentProps['doc']; isDark: boolean; readTime: number }> = ({ doc, isDark, readTime }) => {
  const heroBg      = isDark ? '#0a0a0a' : '#E8E7E3';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const metaClr     = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.75)';
  const badgeBg     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const badgeBdr    = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const textPrimary = isDark ? '#ffffff' : '#000000';
  const locale      = 'ru-RU';
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const fmtDate     = doc.date    ? new Date(doc.date).toLocaleDateString(locale, opts)    : null;
  const fmtUpdated  = doc.updated ? new Date(doc.updated).toLocaleDateString(locale, opts) : null;
  const authors     = doc.author  ? doc.author.split(',').map(a => a.trim()).filter(Boolean) : [];

  return (
    <div style={{ background: heroBg, borderBottom: `1px solid ${borderColor}`, padding: '3rem 2rem 2.5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', contain: 'strict' }}>
        <DotWaveBackground isDark={isDark} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {doc.typename?.trim() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <a href="/" style={{ color: textPrimary, textDecoration: 'none', opacity: 0.7 }}>Главная</a>
            <ChevronRight size={14} style={{ opacity: 0.4, color: textPrimary }} />
            <span style={{ color: textPrimary, fontWeight: 600 }}>{doc.typename}</span>
            <ChevronRight size={14} style={{ opacity: 0.4, color: textPrimary }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {fmtDate && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: metaClr }}><CalendarDays size={13} style={{ opacity: 0.7 }} />{fmtDate}</span>}
          {fmtUpdated && <><span style={{ color: metaClr, fontSize: '0.7rem' }}>·</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: metaClr }}><RefreshCw size={13} style={{ opacity: 0.7 }} />Обновлено: {fmtUpdated}</span></>}
          {doc.typename?.trim() && <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: metaClr, background: badgeBg, border: `1px solid ${badgeBdr}`, borderRadius: '6px', padding: '2px 8px' }}>{doc.typename}</span>}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0a0a0a', margin: '0 0 1rem 0', fontFamily: 'system-ui,-apple-system,sans-serif', maxWidth: '820px' }}>
          {doc.title}
        </h1>
        {doc.description && (
          <p style={{ fontSize: 'clamp(0.9rem,1.5vw,1.05rem)', lineHeight: 1.65, color: textPrimary, margin: '0 0 1.75rem 0', maxWidth: '680px' }}>
            {doc.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: metaClr }}>
            <Clock size={13} style={{ opacity: 0.7 }} />{readTime} мин чтения
          </span>
          {authors.length > 0 && (
            <>
              <span style={{ color: metaClr, fontSize: '0.75rem' }}>·</span>
              <span style={{ fontSize: '0.8rem', color: metaClr }}>
                {authors.length === 1 ? 'Автор' : 'Авторы'}:{' '}
                {authors.map((a, i) => (
                  <React.Fragment key={a}>
                    <strong style={{ color: textPrimary, fontWeight: 600 }}>{a}</strong>
                    {i < authors.length - 1 && ', '}
                  </React.Fragment>
                ))}
              </span>
            </>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <AskAIButton isDark={isDark} pageTitle={doc.title} pageSlug={doc.slug} markdownContent={doc.content} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DocContentMain ───────────────────────────────────────────────────────────

const DocContentMain: React.FC<DocContentProps> = ({ doc }) => {
  const { isDark } = useTheme();
  const [fullscreenTableHtml, setFullscreenTableHtml] = useState<string | null>(null);

  const toc            = useTableOfContents(doc);
  const progressBarRef = useScrollProgress();
  const activeId       = useActiveHeading(toc);

  // Следим за шириной навигации через CSS-переменную --nav-left,
  // которую выставляет DesktopNav при изменении состояния панели/рейла.
  const [isDesktop, setIsDesktop] = useState(false);
  const [navLeft, setNavLeft] = useState('0px');

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 1000);
    check();
    window.addEventListener('resize', check, { passive: true });
    document.addEventListener('astro:after-swap', check);
    document.addEventListener('astro:page-load', check);
    return () => {
      window.removeEventListener('resize', check);
      document.removeEventListener('astro:after-swap', check);
      document.removeEventListener('astro:page-load', check);
    };
  }, []);

  // Читаем --nav-left из :root и обновляем при любых изменениях.
  // Navigation.tsx выставляет её через style.setProperty каждый раз,
  // когда меняется ширина рейла или панели (в т.ч. при ресайзе drag-handle).
  useEffect(() => {
    if (!isDesktop) { setNavLeft('0px'); return; }

    const readVar = () => {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--nav-left').trim();
      setNavLeft(val || '64px');
    };

    // Начальное чтение
    readVar();

    // MutationObserver на style-атрибут <html> — срабатывает при каждом setProperty
    const observer = new MutationObserver(readVar);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    return () => observer.disconnect();
  }, [isDesktop]);

  const htmlContent  = useMemo(() => doc.content || '', [doc.content]);
  const contentNodes = useMemo(() => parseHtmlToReact(htmlContent), [htmlContent]);
  const readTime     = useMemo(() => estimateReadTime(doc.content || htmlContent), [doc.content, htmlContent]);
  const tableCtx     = useMemo(() => ({ onTableClick: (html: string) => setFullscreenTableHtml(html), isDark }), [isDark]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Progress bar */}
      <div
        ref={progressBarRef}
        style={{ position: 'fixed', top: 0, left: 0, height: '2px', width: '0%', background: isDark ? '#fff' : '#000', zIndex: 999, transition: 'none' }}
      />

      {/* Навигация — управляет --nav-left */}
      <Navigation currentDocSlug={doc.slug} toc={toc} activeHeadingId={activeId} />

      {/* Контент — marginLeft следует за --nav-left без жёсткого хардкода */}
      <main
        className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}
        style={{
          marginLeft:   isDesktop ? navLeft : '0',
          marginRight:  '0',
          marginBottom: isDesktop ? '0' : '3.5rem',
          transition:   'none',
        }}
      >
        <DocHero doc={doc} isDark={isDark} readTime={readTime} />
        <article style={{ padding: '2rem 2rem 3rem' }}>
          <TableContext.Provider value={tableCtx}>
            <div
              data-article-content
              className={`prose max-w-none w-full overflow-x-auto ${isDark ? 'text-white' : 'text-black'}`}
            >
              {contentNodes}
            </div>
          </TableContext.Provider>
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