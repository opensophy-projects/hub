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

interface LiveFM {
  title?: string; description?: string; author?: string;
  date?: string; updated?: string; tags?: string; icon?: string; lang?: string; robots?: string;
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
    // При смене TOC (новая страница) сбрасываем активный заголовок
    setActiveId('');
  }, [toc]);

  useEffect(() => {
    if (!toc.length) return;
    const els = toc
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!els.length) return;

    const obs = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
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

interface DocHeroProps {
  doc: DocContentProps['doc'];
  isDark: boolean;
  readTime: number;
  liveFM?: LiveFM | null;
}

const DocHero: React.FC<DocHeroProps> = ({ doc, isDark, readTime, liveFM }) => {
  const title       = liveFM?.title?.trim()       || doc.title;
  const description = liveFM?.description?.trim() || doc.description;
  const author      = liveFM?.author?.trim()       || doc.author;
  const date        = liveFM?.date?.trim()         || doc.date;
  const updated     = liveFM?.updated?.trim()      || doc.updated;

  const heroBg      = isDark ? '#0a0a0a' : '#E8E7E3';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const metaClr     = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.75)';
  const badgeBg     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const badgeBdr    = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const textPrimary = isDark ? '#ffffff' : '#000000';
  const locale      = 'ru-RU';
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const fmtDate     = date    ? new Date(date).toLocaleDateString(locale, opts)    : null;
  const fmtUpdated  = updated ? new Date(updated).toLocaleDateString(locale, opts) : null;
  const authors     = author  ? author.split(',').map(a => a.trim()).filter(Boolean) : [];

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
          {fmtDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: metaClr }}>
              <CalendarDays size={13} style={{ opacity: 0.7 }} />{fmtDate}
            </span>
          )}
          {fmtUpdated && (
            <>
              <span style={{ color: metaClr, fontSize: '0.7rem' }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: metaClr }}>
                <RefreshCw size={13} style={{ opacity: 0.7 }} />Обновлено: {fmtUpdated}
              </span>
            </>
          )}
          {doc.typename?.trim() && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: metaClr, background: badgeBg, border: `1px solid ${badgeBdr}`, borderRadius: '6px', padding: '2px 8px' }}>
              {doc.typename}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0a0a0a', margin: '0 0 1rem 0', fontFamily: 'system-ui,-apple-system,sans-serif', maxWidth: '820px' }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: 'clamp(0.9rem,1.5vw,1.05rem)', lineHeight: 1.65, color: textPrimary, margin: '0 0 1.75rem 0', maxWidth: '680px' }}>
            {description}
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
            <AskAIButton isDark={isDark} pageTitle={title} pageSlug={doc.slug} markdownContent={doc.content} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DocContent ───────────────────────────────────────────────────────────────

const DocContentMain: React.FC<DocContentProps> = ({ doc }) => {
  const { isDark } = useTheme();
  const [fullscreenTableHtml, setFullscreenTableHtml] = useState<string | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [navLeft, setNavLeft]     = useState('0px');

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

  useEffect(() => {
    if (!isDesktop) { setNavLeft('0px'); return; }
    const readVar = () => {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--nav-left').trim();
      setNavLeft(val || '64px');
    };
    readVar();
    const observer = new MutationObserver(readVar);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [isDesktop]);

  // ── Live preview via BroadcastChannel ────────────────────────────────────
  const [liveHtml, setLiveHtml] = useState<string | null>(null);
  const [liveFM,   setLiveFM]   = useState<LiveFM | null>(null);
  // Версионный счётчик — инкрементируется при каждом live-обновлении контента.
  // Передаётся в useTableOfContents как часть зависимости, чтобы
  // вызвать пересканирование заголовков после ре-рендера.
  const [contentVersion, setContentVersion] = useState(0);

  // Сбрасываем live state при смене страницы
  useEffect(() => {
    setLiveHtml(null);
    setLiveFM(null);
    setContentVersion(v => v + 1); // сигнализируем о смене страницы
  }, [doc.slug]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel('hub-dev-preview');
    ch.onmessage = (e) => {
      if (e.data?.type !== 'preview') return;
      if (e.data.html !== undefined) {
        setLiveHtml(e.data.html);
        // Инкрементируем после установки нового HTML, чтобы useTableOfContents
        // пересканировал заголовки когда React уже отрендерил новый контент
        setContentVersion(v => v + 1);
      }
      if (e.data.fm !== undefined) setLiveFM(e.data.fm);
    };
    return () => ch.close();
  }, []);

  const htmlContent  = liveHtml ?? doc.content ?? '';

  // Объект зависимости для TOC — содержит slug + версию контента.
  // Когда меняется slug ИЛИ приходит live preview — TOC пересканируется.
  const tocDep = useMemo(
    () => ({ id: doc.id, slug: doc.slug, _v: contentVersion }),
    [doc.id, doc.slug, contentVersion]
  );

  const toc      = useTableOfContents(tocDep);
  const activeId = useActiveHeading(toc);

  const progressBarRef = useScrollProgress();

  const contentNodes = useMemo(() => parseHtmlToReact(htmlContent), [htmlContent]);
  const readTime     = useMemo(() => estimateReadTime(doc.content || ''), [doc.content]);
  const tableCtx     = useMemo(
    () => ({ onTableClick: (html: string) => setFullscreenTableHtml(html), isDark }),
    [isDark]
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Progress bar */}
      <div
        ref={progressBarRef}
        style={{ position: 'fixed', top: 0, left: 0, height: '2px', width: '0%', background: isDark ? '#fff' : '#000', zIndex: 999, transition: 'none' }}
      />

      <Navigation currentDocSlug={doc.slug} toc={toc} activeHeadingId={activeId} />

      <main
        className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}
        style={{
          marginLeft:   isDesktop ? navLeft : '0',
          marginRight:  '0',
          marginBottom: isDesktop ? '0' : '3.5rem',
          transition:   'none',
        }}
      >
        <DocHero doc={doc} isDark={isDark} readTime={readTime} liveFM={liveFM} />

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