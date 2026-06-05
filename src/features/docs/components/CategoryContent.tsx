import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, FileText, Tag, User } from 'lucide-react';
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
  author?: string;
  date?: string;
  updated?: string;
  tags?: string[];
  icon?: string;
  typename?: string;
  frontmatter?: Record<string, unknown>;
}

interface CategoryData {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon?: string | null;
  navSlug?: string;
  navTitle?: string;
  navIcon?: string;
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

function stringifyFrontmatterValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(stringifyFrontmatterValue).join(', ');
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getFrontmatterEntries(doc: CategoryDoc): Array<[string, string]> {
  return Object.entries(doc.frontmatter ?? {})
    .map(([key, value]) => [key, stringifyFrontmatterValue(value)] as [string, string])
    .filter(([, value]) => value.trim().length > 0);
}

const CategoryCard: React.FC<{ doc: CategoryDoc; isDark: boolean }> = ({ doc, isDark }) => {
  const t = makeTokens(isDark);
  const frontmatterEntries = getFrontmatterEntries(doc);
  const formattedDate = formatDate(doc.date);
  const accentColor = t.accent;

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
              color: accentColor,
            }}
          >
            {doc.icon ? <LucideIcon name={doc.icon} size={18} /> : <FileText size={18} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, margin: 0, color: t.fg }}>{doc.title}</h2>
            {doc.typename && (
              <div style={{ marginTop: 4, fontSize: '0.72rem', color: t.fgMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {doc.typename}
              </div>
            )}
          </div>
        </div>

        {doc.description && (
          <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: t.fgMuted, margin: 0 }}>{doc.description}</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: 'auto' }}>
          {formattedDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: t.fgMuted }}>
              <CalendarDays size={12} />{formattedDate}
            </span>
          )}
          {doc.author && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: t.fgMuted }}>
              <User size={12} />{doc.author}
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

        {frontmatterEntries.length > 0 && (
          <dl style={{ margin: '0.25rem 0 0', display: 'grid', gap: '0.45rem', paddingTop: '0.75rem', borderTop: `1px solid ${t.border}` }}>
            {frontmatterEntries.map(([key, value]) => (
              <div key={key} style={{ display: 'grid', gridTemplateColumns: 'minmax(72px, max-content) 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                <dt style={{ fontSize: '0.68rem', color: t.fgMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{key}</dt>
                <dd style={{ minWidth: 0, margin: 0, fontSize: '0.75rem', color: t.fg, overflowWrap: 'anywhere' }}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </a>
  );
};

const CategoryContentMain: React.FC<CategoryContentProps> = ({ category }) => {
  const { isDark } = useTheme();
  const t = makeTokens(isDark);
  const [isDesktop, setIsDesktop] = useState(false);
  const sortedDocs = useMemo(() => [...category.docs].sort((a, b) => a.title.localeCompare(b.title)), [category.docs]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 1000);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const navChromeBg = isDark ? 'rgba(15,15,15,0.84)' : 'rgba(224,223,219,0.82)';
  const mainMarginLeft = isDesktop ? '64px' : '0';

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
          minHeight: '100vh',
          background: t.bgPage,
          marginLeft: mainMarginLeft,
          position: 'relative',
          zIndex: 1,
          transition: 'none',
        }}
      >
        <header style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: '3rem 2rem 2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem', color: t.fgMuted }}>
            <a href="/" style={{ color: t.fg, textDecoration: 'none', opacity: 0.7 }}>Главная</a>
            {(category.navTitle || category.parentTitle) && <ChevronRight size={14} style={{ opacity: 0.45 }} />}
            {category.navTitle && <span>{category.navTitle}</span>}
            {category.parentTitle && category.parentTitle !== category.navTitle && <ChevronRight size={14} style={{ opacity: 0.45 }} />}
            {category.parentTitle && category.parentTitle !== category.navTitle && <span>{category.parentTitle}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem' }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: t.accentSoft, border: `1px solid ${t.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent, flexShrink: 0 }}>
              {category.icon ? <LucideIcon name={category.icon} size={22} /> : <FileText size={22} />}
            </span>
            <div>
              <div style={{ fontSize: '0.75rem', color: t.fgMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Категория</div>
              <h1 style={{ fontSize: 'clamp(1.7rem,4vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, color: t.fg, margin: 0 }}>{category.title}</h1>
            </div>
          </div>
          <p style={{ fontSize: 'clamp(0.95rem,1.5vw,1.08rem)', lineHeight: 1.65, color: t.fgMuted, margin: 0, maxWidth: 720 }}>
            {category.description}. Всего статей: {sortedDocs.length}.
          </p>
        </header>

        <section style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>
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
