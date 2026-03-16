import React, { useState, useMemo, Suspense, lazy, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from '@/shared/contexts/ThemeContext';
import TopNavbar from '@/features/navigation/components/MobileNavbar';
import Sidebar from '@/features/navigation/components/Sidebar';
import { parseHtmlToReact, TableContext } from '@/shared/lib/htmlParser';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { scrollToElement } from '../utils/scrollUtils';
import { Clock, CalendarDays, ArrowUp, ChevronRight, RefreshCw } from 'lucide-react';
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
    updated?: string;
    tags?: string[];
    navSlug?: string;
    navTitle?: string;
  };
}

const SANITIZE_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 'a',
  'ul', 'ol', 'li', 'blockquote', 'code',
  'pre', 'img', 'table', 'tr', 'td', 'th',
  'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption',
  'del', 'input', 'sub', 'sup', 'details', 'summary', 'mark',
];

const SANITIZE_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'data-language', 'data-lang', 'data-alert-type',
  'data-cols', 'data-layout', 'data-status', 'data-title',
  'data-color', 'data-icon', 'data-code',
  'data-border-color',
  'type', 'checked', 'disabled', 'open', 'style', 'align',
];

function stripHtmlTags(html: string): string {
  return html
    .split('<')
    .map((chunk, i) => (i === 0 ? chunk : chunk.slice(chunk.indexOf('>') + 1)))
    .join(' ');
}

function estimateReadTime(content: string): number {
  if (!content) return 1;
  const text  = stripHtmlTags(content).replaceAll(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);
  return isDesktop;
}

function useActiveHeading(toc: ReturnType<typeof useTableOfContents>): string {
  const [activeId, setActiveId] = useState('');
  useEffect(() => {
    if (toc.length === 0) return;
    const headingEls = toc
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);
  return activeId;
}

// ─── TOC helpers ─────────────────────────────────────────────────────────────

function getTocItemVisuals(isActive: boolean, absDist: number, hasActive: boolean) {
  if (!hasActive) return { opacity: 0.6, glowOpacity: 0 };
  if (isActive)   return { opacity: 1,   glowOpacity: 1 };
  return {
    opacity:     Math.max(0.35, 0.8  - absDist * 0.2),
    glowOpacity: Math.max(0,    0.55 - absDist * 0.18),
  };
}

function getTocItemColor(isActive: boolean, isDark: boolean, opacity: number): string {
  if (isActive) return isDark ? '#ffffff' : '#000000';
  return isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
}

function getTocBorderColor(isActive: boolean, isDark: boolean, glowOpacity: number, accentColor: string): string {
  if (isActive) return accentColor;
  if (glowOpacity > 0) return isDark ? `rgba(255,255,255,${glowOpacity})` : `rgba(0,0,0,${glowOpacity})`;
  return 'transparent';
}

function getTocBoxShadow(isActive: boolean, isDark: boolean, glowOpacity: number, accentColor: string): string {
  if (isActive) return `inset 3px 0 10px -2px ${accentColor}88`;
  if (glowOpacity > 0) {
    const innerGlow = isDark
      ? `rgba(255,255,255,${glowOpacity * 0.4})`
      : `rgba(0,0,0,${glowOpacity * 0.4})`;
    return `inset 3px 0 7px -3px ${innerGlow}`;
  }
  return 'none';
}

// ─── Hero colors ──────────────────────────────────────────────────────────────

function useHeroColors(isDark: boolean) {
  return {
    heroBg:          isDark ? '#0a0a0a' : '#E8E7E3',
    borderColor:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    metaTextColor:   isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.75)',
    metaBadgeBg:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    metaBadgeBorder: isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)',
    textPrimary:     isDark ? '#ffffff' : '#000000',
  };
}

// ─── Hero sub-components ──────────────────────────────────────────────────────

const HeroBreadcrumbs: React.FC<{ typename?: string; textPrimary: string }> = ({ typename, textPrimary }) => {
  if (!typename?.trim()) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
      <a href="/" style={{ color: textPrimary, textDecoration: 'none', opacity: 0.7 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>
        Главная
      </a>
      <ChevronRight size={14} style={{ opacity: 0.4, color: textPrimary }} />
      <span style={{ color: textPrimary, fontWeight: 600 }}>{typename}</span>
      <ChevronRight size={14} style={{ opacity: 0.4, color: textPrimary }} />
    </div>
  );
};

const HeroMeta: React.FC<{
  date?: string; updated?: string; typename?: string;
  metaTextColor: string; metaBadgeBg: string; metaBadgeBorder: string;
}> = ({ date, updated, typename, metaTextColor, metaBadgeBg, metaBadgeBorder }) => {
  const locale = 'ru-RU';
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate    = date    ? new Date(date).toLocaleDateString(locale, opts)    : null;
  const formattedUpdated = updated ? new Date(updated).toLocaleDateString(locale, opts) : null;
  const dot = <span style={{ color: metaTextColor, fontSize: '0.7rem' }}>·</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
      {formattedDate && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: metaTextColor }}>
          <CalendarDays size={13} style={{ opacity: 0.7 }} />{formattedDate}
        </span>
      )}
      {formattedUpdated && (
        <>{formattedDate && dot}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: metaTextColor }}>
            <RefreshCw size={13} style={{ opacity: 0.7 }} />Обновлено: {formattedUpdated}
          </span>
        </>
      )}
      {typename?.trim() && (
        <>{(formattedDate || formattedUpdated) && dot}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: metaTextColor, background: metaBadgeBg, border: `1px solid ${metaBadgeBorder}`, borderRadius: '6px', padding: '2px 8px' }}>
            {typename}
          </span>
        </>
      )}
    </div>
  );
};

const HeroAuthors: React.FC<{ author?: string; metaTextColor: string; textPrimary: string }> = ({ author, metaTextColor, textPrimary }) => {
  const authors = author ? author.split(',').map(a => a.trim()).filter(Boolean) : [];
  if (authors.length === 0) return null;
  return (
    <>
      <span style={{ color: metaTextColor, fontSize: '0.75rem' }}>·</span>
      <span style={{ fontSize: '0.8rem', color: metaTextColor }}>
        {authors.length === 1 ? 'Автор' : 'Авторы'}:{' '}
        {authors.map((a, i) => (
          <React.Fragment key={a}>
            <strong style={{ color: textPrimary, fontWeight: 600 }}>{a}</strong>
            {i < authors.length - 1 && ', '}
          </React.Fragment>
        ))}
      </span>
    </>
  );
};

const DocHero: React.FC<{
  doc: DocContentProps['doc'];
  isDark: boolean;
  readTime: number;
  markdownContent?: string;
}> = ({ doc, isDark, readTime, markdownContent }) => {
  const colors = useHeroColors(isDark);
  return (
    <div style={{ background: colors.heroBg, borderBottom: `1px solid ${colors.borderColor}`, padding: '3rem 2rem 2.5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <DotWaveBackground isDark={isDark} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroBreadcrumbs typename={doc.typename} textPrimary={colors.textPrimary} />
        <HeroMeta date={doc.date} updated={doc.updated} typename={doc.typename}
          metaTextColor={colors.metaTextColor} metaBadgeBg={colors.metaBadgeBg} metaBadgeBorder={colors.metaBadgeBorder} />
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0a0a0a', margin: '0 0 1rem 0', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '820px' }}>
          {doc.title}
        </h1>
        {doc.description && (
          <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)', lineHeight: 1.65, color: colors.textPrimary, margin: '0 0 1.75rem 0', maxWidth: '680px' }}>
            {doc.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: colors.metaTextColor }}>
            <Clock size={13} style={{ opacity: 0.7 }} />{readTime} мин чтения
          </span>
          <HeroAuthors author={doc.author} metaTextColor={colors.metaTextColor} textPrimary={colors.textPrimary} />
          <div style={{ marginLeft: 'auto' }}>
            <AskAIButton isDark={isDark} pageTitle={doc.title} pageSlug={doc.slug} markdownContent={markdownContent} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────

function getMainMargins(isDesktop: boolean, hasToc: boolean, tocWidth: string) {
  return {
    marginLeft:   isDesktop ? '20rem' : '0',
    marginRight:  hasToc && isDesktop ? tocWidth : '0',
    marginBottom: isDesktop ? '0' : '3.5rem',
  };
}

// ─── DocContentMain ───────────────────────────────────────────────────────────

const DocContentMain: React.FC<DocContentProps> = ({ doc }) => {
  const { isDark } = useTheme();
  const [fullscreenTableHtml, setFullscreenTableHtml] = useState<string | null>(null);

  // FIX [🔴-01]: content comes via Astro props at build time — no runtime fetch needed.

  const toc            = useTableOfContents(doc);
  const scrollProgress = useScrollProgress();
  const activeId       = useActiveHeading(toc);
  const isDesktop      = useIsDesktop();

  const htmlContent = useMemo(() => {
    if (!doc.content) return '';
    return DOMPurify.sanitize(doc.content, {
      ALLOWED_TAGS: SANITIZE_TAGS,
      ALLOWED_ATTR: SANITIZE_ATTR,
      ALLOW_DATA_ATTR: true,
    });
  }, [doc.content]);

  const contentNodes = useMemo(() => {
    if (!htmlContent) return [];
    return parseHtmlToReact(htmlContent);
  }, [htmlContent]);

  const readTime = useMemo(
    () => estimateReadTime(doc.content || htmlContent),
    [doc.content, htmlContent]
  );

  const tableContextValue = useMemo(
    () => ({ onTableClick: (html: string) => setFullscreenTableHtml(html), isDark }),
    [isDark]
  );

  const TOC_WIDTH = toc.length > 0 ? '18rem' : '0';
  const hasToc    = toc.length > 0;

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        className={`fixed top-0 left-0 h-1 ${isDark ? 'bg-white' : 'bg-black'}`}
        style={{ width: `${scrollProgress}%`, zIndex: 999 }}
      />

      <TopNavbar />
      <Sidebar currentDocSlug={doc.slug} />

      {hasToc && isDesktop && (
        <aside
          className={`hidden md:flex flex-col fixed right-0 z-40 border-l overflow-hidden ${isDark ? 'bg-[#0F0F0F] border-white/10' : 'bg-[#E1E0DC] border-black/10'}`}
          style={{ top: 0, width: TOC_WIDTH, height: '100vh' }}
        >
          <div className={`flex-shrink-0 px-4 py-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                На этой странице
              </h2>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors ${isDark ? 'text-white/60 hover:bg-white/5 hover:text-white border-white/10' : 'text-black/60 hover:bg-black/5 hover:text-black border-black/10'}`}
                title="Наверх"
              >
                <ArrowUp size={15} />
                <span className="text-[9px] font-medium leading-none">Наверх</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <nav className="space-y-0.5">
              {toc.map((item, index) => {
                const activeIndex  = toc.findIndex(t => t.id === activeId);
                const distance     = index - activeIndex;
                const isActive     = distance === 0 && activeId !== '';
                const absDist      = Math.abs(distance);
                const accentColor  = isDark ? '#ffffff' : '#000000';
                const hasActive    = activeId !== '';
                const { opacity, glowOpacity } = getTocItemVisuals(isActive, absDist, hasActive);
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToElement(item.id)}
                    className="w-full text-left py-2 pr-3 text-sm leading-snug"
                    style={{
                      paddingLeft: `${14 + (item.level - 2) * 14}px`,
                      color:           getTocItemColor(isActive, isDark, opacity),
                      transition:      'color 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease',
                      borderLeft:      '2px solid',
                      borderLeftColor: getTocBorderColor(isActive, isDark, glowOpacity, accentColor),
                      boxShadow:       getTocBoxShadow(isActive, isDark, glowOpacity, accentColor),
                      textShadow:      isActive ? `0 0 12px ${accentColor}66` : 'none',
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
        style={{ ...getMainMargins(isDesktop, hasToc, TOC_WIDTH), transition: 'margin-left 0.3s ease' }}
      >
        <DocHero doc={doc} isDark={isDark} readTime={readTime} markdownContent={doc.content} />
        <article className="flex-1 pb-12 w-full" style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '2rem' }}>
          <TableContext.Provider value={tableContextValue}>
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

// ─── Export ───────────────────────────────────────────────────────────────────

const DocContent: React.FC<DocContentProps> = ({ doc }) => (
  <ThemeProvider>
    <DocContentMain doc={doc} />
  </ThemeProvider>
);

export default DocContent;