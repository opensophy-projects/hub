import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, FileText, RefreshCw, Tag } from 'lucide-react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { useTheme } from '@/shared/contexts/useTheme';
import Navigation from '@/features/navigation/components/Navigation';
import LucideIcon from '@/shared/components/LucideIcon';
import { makeTokens } from '@/shared/tokens/theme';

interface CategoryDoc {
  id: string;
  title: string;
  slug: string;
  description: string;
  date?: string;
  updated?: string;
  tags?: string[];
  icon?: string;
  typename?: string;
}

interface CategoryData {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  navSlug?: string;
  navTitle?: string;
  parentTitle?: string;
  docs: CategoryDoc[];
}

interface CategoryContentProps {
  category: CategoryData;
}

function toDocHref(slug: string): string {
  return `/${slug}/`;
}

function formatDate(date?: string): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

const CategoryCard: React.FC<{ doc: CategoryDoc; isDark: boolean }> = ({ doc, isDark }) => {
  const t = makeTokens(isDark);
  const formattedDate = formatDate(doc.date);
  const formattedUpdated = formatDate(doc.updated);

  return (
    <a
      href={toDocHref(doc.slug)}
      className={`category-doc-card ${isDark ? 'category-doc-card-dark' : 'category-doc-card-light'}`}
      style={{
        position: 'relative',
        borderRadius: '12px',
        border: `1px solid ${t.border}`,
        background: isDark ? '#0f0f0f' : t.accentSoft,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        textDecoration: 'none',
        color: t.fg,
        boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isDark ? 'rgba(255,255,255,0.07)' : t.accentSoft,
              border: `1px solid ${t.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: t.accent,
            }}
          >
            {doc.icon ? <LucideIcon name={doc.icon} size={18} /> : <FileText size={18} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, margin: 0, color: t.fg }}>{doc.title}</h2>
            {doc.typename && (
              <div style={{ marginTop: 4, fontSize: '0.8rem', color: t.fgMuted, fontWeight: 600 }}>
                {doc.typename}
              </div>
            )}
          </div>
        </div>

        {doc.description && (
          <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: t.fgMuted, margin: 0 }}>{doc.description}</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem 0.8rem', marginTop: 'auto' }}>
          {formattedDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: t.fgMuted }}>
              <CalendarDays size={12} />{formattedDate}
            </span>
          )}
          {formattedUpdated && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: t.fgMuted }}>
              <RefreshCw size={12} />Обновлено: {formattedUpdated}
            </span>
          )}
        </div>

        {doc.tags && doc.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {doc.tags.map(tag => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', padding: '2px 7px', borderRadius: 999, background: t.accentSoft, border: `1px solid ${t.accentBorder}`, color: t.fgMuted }}>
                <Tag size={10} />{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
};

const CategoryContentMain: React.FC<CategoryContentProps> = ({ category }) => {
  const { isDark } = useTheme();
  const t = makeTokens(isDark);
  const [isDesktop, setIsDesktop] = useState(false);
  const [navLeft, setNavLeft] = useState('0px');
  const [docRight, setDocRight] = useState('0px');
  const [docChromeGap, setDocChromeGap] = useState('0px');
  const [docChromeRadius, setDocChromeRadius] = useState('0px');
  const [docChromeTopGap, setDocChromeTopGap] = useState('0px');
  const [showLeftBorder, setShowLeftBorder] = useState(false);
  const [showRightBorder, setShowRightBorder] = useState(false);
  const sortedDocs = useMemo(() => [...category.docs].sort((a, b) => a.title.localeCompare(b.title)), [category.docs]);

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
    if (!isDesktop) {
      setNavLeft('0px');
      setDocRight('0px');
      setDocChromeGap('0px');
      setDocChromeRadius('0px');
      setDocChromeTopGap('0px');
      setShowLeftBorder(false);
      setShowRightBorder(false);
      return;
    }
    const readVar = () => {
      const css = getComputedStyle(document.documentElement);
      const left = css.getPropertyValue('--nav-left').trim();
      const right = css.getPropertyValue('--doc-right').trim();
      const leftBorder = css.getPropertyValue('--doc-border-left').trim();
      const chromeGap = css.getPropertyValue('--doc-chrome-gap').trim();
      const chromeRadius = css.getPropertyValue('--doc-chrome-radius').trim();
      const chromeTopGap = css.getPropertyValue('--doc-chrome-top-gap').trim();
      const rightBorder = css.getPropertyValue('--doc-border-right').trim();
      setNavLeft(left || '64px');
      setDocRight(right || '0px');
      setDocChromeGap(chromeGap || '0px');
      setDocChromeRadius(chromeRadius || '0px');
      setDocChromeTopGap(chromeTopGap || chromeGap || '0px');
      setShowLeftBorder(leftBorder === '1');
      setShowRightBorder(rightBorder === '1');
    };
    readVar();
    const observer = new MutationObserver(readVar);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [isDesktop]);

  const navChromeBg = isDark ? 'rgba(15,15,15,0.84)' : 'rgba(224,223,219,0.82)';

  return (
    <div style={{ minHeight: '100vh', background: isDesktop ? navChromeBg : t.bgPage, position: 'relative' }}>
      <style>{`
        .category-doc-card { transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; }
        .category-doc-card:hover { transform: translateY(-2px); }
        .category-doc-card-dark:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.5); }
        .category-doc-card-light:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
        @media (max-width: 760px) { .category-doc-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 761px) and (max-width: 1180px) { .category-doc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
      `}</style>
      {isDesktop && <div aria-hidden style={{ position: 'fixed', inset: 0, background: navChromeBg, zIndex: 0, pointerEvents: 'none' }} />}
      <Navigation currentDocSlug={category.slug} toc={[]} activeHeadingId="" />

      <main
        style={{
          background: t.bgPage,
          marginLeft: isDesktop ? navLeft : '0',
          marginRight: isDesktop ? docRight : '0',
          position: 'relative',
          zIndex: 1,
          marginTop: isDesktop ? docChromeTopGap : '0',
          marginBottom: isDesktop ? docChromeGap : '3.5rem',
          minHeight: isDesktop ? `calc(100vh - (${docChromeTopGap} + ${docChromeGap}))` : '100vh',
          border: isDesktop ? `1px solid ${t.border}` : 'none',
          borderRadius: isDesktop ? docChromeRadius : 0,
          overflow: isDesktop ? 'hidden' : 'visible',
          boxShadow: isDesktop ? `0 0 0 1px ${t.border}, inset 0 1px 0 rgba(255,255,255,0.03)` : 'none',
          transition: 'none',
        }}
      >
        <header style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: '3rem 2rem 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem', color: t.fgMuted }}>
            <a href="/" style={{ color: t.fg, textDecoration: 'none', opacity: 0.7 }}>Главная</a>
            {(category.navTitle || category.parentTitle) && <ChevronRight size={14} style={{ opacity: 0.45 }} />}
            {category.navTitle && <span>{category.navTitle}</span>}
            {category.parentTitle && category.parentTitle !== category.navTitle && <ChevronRight size={14} style={{ opacity: 0.45 }} />}
            {category.parentTitle && category.parentTitle !== category.navTitle && <span>{category.parentTitle}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: t.accentSoft, border: `1px solid ${t.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent, flexShrink: 0 }}>
              {category.icon ? <LucideIcon name={category.icon} size={22} /> : <FileText size={22} />}
            </span>
            <div>
              <div style={{ fontSize: '0.75rem', color: t.fgMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Категория</div>
              <h1 style={{ fontSize: 'clamp(1.7rem,4vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, color: t.fg, margin: 0 }}>{category.title}</h1>
            </div>
          </div>
        </header>

        <section style={{
          padding: '2rem 2rem 3rem',
          borderLeft: showLeftBorder ? `1px solid ${t.borderStrong}` : 'none',
          borderRight: showRightBorder ? `1px solid ${t.borderStrong}` : 'none',
        }}>
          <div className="category-doc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
            {sortedDocs.map(doc => <CategoryCard key={doc.id} doc={doc} isDark={isDark} />)}
          </div>
        </section>
      </main>
    </div>
  );
};

const CategoryContent: React.FC<CategoryContentProps> = ({ category }) => (
  <ThemeProvider>
    <CategoryContentMain category={category} />
  </ThemeProvider>
);

export default CategoryContent;
