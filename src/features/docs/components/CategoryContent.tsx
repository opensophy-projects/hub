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

// ─── Токены карточки ──────────────────────────────────────────────────────────

interface CardTokens {
  cardBorder: string;
  cardBg: string;
  cardBgHov: string;
  iconWrapBg: string;
  iconWrapBdr: string;
  iconColor: string;
  titleColor: string;
  textColor: string;
  metaColor: string;
  badgeColor: string;
  tagBg: string;
  tagBdr: string;
  tagClr: string;
  shadowHov: string;
}

function getCardTokens(isDark: boolean, t: ReturnType<typeof makeTokens>): CardTokens {
  return isDark
    ? {
        cardBorder:  'rgba(255,255,255,0.09)',
        cardBg:      '#0f0f0f',
        cardBgHov:   '#141414',
        iconWrapBg:  'rgba(255,255,255,0.07)',
        iconWrapBdr: 'rgba(255,255,255,0.1)',
        iconColor:   'rgba(255,255,255,0.7)',
        titleColor:  'rgba(255,255,255,0.9)',
        textColor:   'rgba(255,255,255,0.7)',
        metaColor:   'rgba(255,255,255,0.32)',
        badgeColor:  'rgba(255,255,255,0.42)',
        tagBg:       'rgba(255,255,255,0.07)',
        tagBdr:      'rgba(255,255,255,0.1)',
        tagClr:      'rgba(255,255,255,0.45)',
        shadowHov:   '0 6px 24px rgba(0,0,0,0.5)',
      }
    : {
        cardBorder:  'rgba(0,0,0,0.09)',
        cardBg:      'rgba(0,0,0,0.02)',
        cardBgHov:   'rgba(0,0,0,0.04)',
        iconWrapBg:  t.accentSoft,
        iconWrapBdr: t.border,
        iconColor:   'rgba(0,0,0,0.55)',
        titleColor:  'rgba(0,0,0,0.88)',
        textColor:   'rgba(0,0,0,0.65)',
        metaColor:   'rgba(0,0,0,0.32)',
        badgeColor:  'rgba(0,0,0,0.42)',
        tagBg:       'rgba(0,0,0,0.06)',
        tagBdr:      'rgba(0,0,0,0.1)',
        tagClr:      'rgba(0,0,0,0.45)',
        shadowHov:   '0 4px 16px rgba(0,0,0,0.09)',
      };
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────

const CategoryCard: React.FC<{ doc: CategoryDoc; isDark: boolean }> = ({ doc, isDark }) => {
  const t  = makeTokens(isDark);
  const tk = getCardTokens(isDark, t);

  const formattedDate    = formatDate(doc.date);
  const formattedUpdated = formatDate(doc.updated);

  return (
    <a
      href={toDocHref(doc.slug)}
      className="cat-doc-card"
      style={{
        position: 'relative',
        borderRadius: '16px',
        border: `1px solid ${tk.cardBorder}`,
        background: tk.cardBg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        textDecoration: 'none',
        color: t.fg,
        boxShadow: 'none',
        ['--card-bg-hov' as string]: tk.cardBgHov,
        ['--shadow-hov'  as string]: tk.shadowHov,
      }}
    >
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

        {/* Иконка + тип */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
            background: tk.iconWrapBg,
            border: `1px solid ${tk.iconWrapBdr}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tk.iconColor,
          }}>
            {doc.icon ? <LucideIcon name={doc.icon} size={18} /> : <FileText size={18} />}
          </div>

          {doc.typename && (
            <span style={{
              fontSize: '0.64rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: tk.badgeColor,
              fontFamily: 'ui-monospace, monospace',
              marginTop: '4px',
            }}>
              {doc.typename}
            </span>
          )}
        </div>

        {/* Заголовок */}
        <h2 style={{
          fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)',
          fontWeight: 700,
          lineHeight: 1.3,
          margin: 0,
          color: tk.titleColor,
        }}>
          {doc.title}
        </h2>

        {/* Описание */}
        {doc.description && (
          <p style={{
            fontSize: 'clamp(0.82rem, 1.2vw, 0.9rem)',
            lineHeight: 1.6,
            color: tk.textColor,
            margin: 0,
            flex: 1,
          }}>
            {doc.description}
          </p>
        )}

        {/* Теги */}
        {doc.tags && doc.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto', paddingTop: '0.25rem' }}>
            {doc.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: '0.65rem', padding: '2px 7px',
                borderRadius: '999px',
                background: tk.tagBg,
                border: `1px solid ${tk.tagBdr}`,
                color: tk.tagClr,
                fontFamily: 'ui-monospace, monospace',
              }}>
                <Tag size={9} />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Даты */}
        {(formattedDate || formattedUpdated) && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.75rem',
            marginTop: doc.tags?.length ? '0.35rem' : 'auto',
            paddingTop: '0.25rem',
          }}>
            {formattedDate && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '0.68rem', color: tk.metaColor,
              }}>
                <CalendarDays size={11} />{formattedDate}
              </span>
            )}
            {formattedUpdated && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '0.68rem', color: tk.metaColor,
              }}>
                <RefreshCw size={11} />Обновлено: {formattedUpdated}
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  );
};

// ─── Хук для CSS-переменных лейаута ──────────────────────────────────────────

interface DocChromeLayout {
  navLeft: string;
  docRight: string;
  docChromeGap: string;
  docChromeRadius: string;
  docChromeTopGap: string;
  showLeftBorder: boolean;
  showRightBorder: boolean;
}

const LAYOUT_DEFAULTS: DocChromeLayout = {
  navLeft:         '0px',
  docRight:        '0px',
  docChromeGap:    '0px',
  docChromeRadius: '0px',
  docChromeTopGap: '0px',
  showLeftBorder:  false,
  showRightBorder: false,
};

const LAYOUT_DESKTOP_FALLBACKS: DocChromeLayout = {
  navLeft:         '64px',
  docRight:        '0px',
  docChromeGap:    '0px',
  docChromeRadius: '0px',
  docChromeTopGap: '0px',
  showLeftBorder:  false,
  showRightBorder: false,
};

function readDocChromeLayout(): DocChromeLayout {
  const css        = getComputedStyle(document.documentElement);
  const get        = (v: string) => css.getPropertyValue(v).trim();
  const navLeft    = get('--nav-left')           || LAYOUT_DESKTOP_FALLBACKS.navLeft;
  const docRight   = get('--doc-right')          || LAYOUT_DESKTOP_FALLBACKS.docRight;
  const chromeGap  = get('--doc-chrome-gap')     || LAYOUT_DESKTOP_FALLBACKS.docChromeGap;
  const chromeTop  = get('--doc-chrome-top-gap') || chromeGap;
  return {
    navLeft,
    docRight,
    docChromeGap:    chromeGap,
    docChromeRadius: get('--doc-chrome-radius') || LAYOUT_DESKTOP_FALLBACKS.docChromeRadius,
    docChromeTopGap: chromeTop,
    showLeftBorder:  get('--doc-border-left')  === '1',
    showRightBorder: get('--doc-border-right') === '1',
  };
}

function useDocChromeLayout(isDesktop: boolean): DocChromeLayout {
  const [layout, setLayout] = useState<DocChromeLayout>(LAYOUT_DEFAULTS);

  useEffect(() => {
    if (!isDesktop) {
      setLayout(LAYOUT_DEFAULTS);
      return;
    }
    setLayout(readDocChromeLayout());
    const observer = new MutationObserver(() => setLayout(readDocChromeLayout()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [isDesktop]);

  return layout;
}

// ─── CategoryContentMain ──────────────────────────────────────────────────────

const CategoryContentMain: React.FC<CategoryContentProps> = ({ category }) => {
  const { isDark } = useTheme();
  const t = makeTokens(isDark);

  const [isDesktop, setIsDesktop] = useState(false);

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

  const {
    navLeft, docRight,
    docChromeGap, docChromeRadius, docChromeTopGap,
    showLeftBorder, showRightBorder,
  } = useDocChromeLayout(isDesktop);

  const sortedDocs = useMemo(
    () => [...category.docs].sort((a, b) => a.title.localeCompare(b.title)),
    [category.docs],
  );

  const navChromeBg  = isDark ? 'rgba(15,15,15,0.84)'   : 'rgba(224,223,219,0.82)';
  const headerBg     = isDark ? '#0a0a0a'                : '#E8E7E3';
  const headerBdr    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const iconWrapBg   = isDark ? 'rgba(255,255,255,0.07)' : t.accentSoft;
  const iconWrapBdr  = isDark ? 'rgba(255,255,255,0.12)' : t.accentBorder;
  const iconColor    = isDark ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.55)';
  const titleColor   = isDark ? '#ffffff'                : '#000000';
  const mutedColor   = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';

  return (
    <div style={{ minHeight: '100vh', background: isDesktop ? navChromeBg : t.bgPage, position: 'relative' }}>
      <style>{`
        .cat-doc-card {
          transition-property: transform, box-shadow, background !important;
          transition-duration: 0.15s !important;
          transition-timing-function: ease !important;
        }
        .cat-doc-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-hov) !important;
          background: var(--card-bg-hov) !important;
        }
        .category-doc-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          align-items: stretch;
        }
        @media (min-width: 900px) {
          .category-doc-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) {
          .category-doc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {isDesktop && (
        <div aria-hidden style={{
          position: 'fixed', inset: 0,
          background: navChromeBg, zIndex: 0, pointerEvents: 'none',
        }} />
      )}

      <Navigation currentDocSlug={category.slug} toc={[]} activeHeadingId="" />

      <main
        style={{
          background:   t.bgPage,
          marginLeft:   isDesktop ? navLeft         : '0',
          marginRight:  isDesktop ? docRight        : '0',
          position:     'relative',
          zIndex:       1,
          marginTop:    isDesktop ? docChromeTopGap : '0',
          marginBottom: isDesktop ? docChromeGap    : '3.5rem',
          minHeight:    isDesktop
            ? `calc(100vh - (${docChromeTopGap} + ${docChromeGap}))`
            : '100vh',
          border:       isDesktop ? `1px solid ${t.border}` : 'none',
          borderRadius: isDesktop ? docChromeRadius          : 0,
          overflow:     isDesktop ? 'hidden'                 : 'visible',
          boxShadow:    isDesktop
            ? `0 0 0 1px ${t.border}, inset 0 1px 0 rgba(255,255,255,0.03)`
            : 'none',
          transition:   'none',
        }}
      >
        {/* Шапка */}
        <header style={{
          background: headerBg,
          borderBottom: `1px solid ${headerBdr}`,
          padding: 'clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)',
        }}>
          {/* Хлебные крошки */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1.5rem', flexWrap: 'wrap',
            fontSize: '0.78rem', color: mutedColor,
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.02em',
          }}>
            <a href="/" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', textDecoration: 'none' }}>
              Главная
            </a>
            {(category.navTitle || category.parentTitle) && (
              <ChevronRight size={12} style={{ opacity: 0.4 }} />
            )}
            {category.navTitle && (
              <span style={{ color: mutedColor }}>{category.navTitle}</span>
            )}
            {category.parentTitle && category.parentTitle !== category.navTitle && (
              <>
                <ChevronRight size={12} style={{ opacity: 0.4 }} />
                <span style={{ color: mutedColor }}>{category.parentTitle}</span>
              </>
            )}
          </div>

          {/* Иконка + заголовок */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <span style={{
              width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
              background: iconWrapBg,
              border: `1px solid ${iconWrapBdr}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: iconColor,
            }}>
              {category.icon ? <LucideIcon name={category.icon} size={22} /> : <FileText size={22} />}
            </span>
            <div>
              <div style={{
                fontSize: '0.64rem', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: mutedColor,
                fontFamily: 'ui-monospace, monospace',
                marginBottom: '0.35rem',
              }}>
                Категория
              </div>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.4rem)',
                fontWeight: 700, lineHeight: 1.15,
                color: titleColor, margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                {category.title}
              </h1>
            </div>
          </div>
        </header>

        {/* Сетка карточек */}
        <section style={{
          padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1.5rem, 4vw, 2.5rem) clamp(2.5rem, 5vw, 4rem)',
          background: isDark ? '#0a0a0a' : '#E8E7E3',
          borderLeft:  showLeftBorder  ? `1px solid ${t.borderStrong}` : 'none',
          borderRight: showRightBorder ? `1px solid ${t.borderStrong}` : 'none',
        }}>
          <div className="category-doc-grid">
            {sortedDocs.map(doc => (
              <CategoryCard key={doc.id} doc={doc} isDark={isDark} />
            ))}
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