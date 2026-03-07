import React, { useContext } from 'react';
import { TableContext } from '../lib/htmlParser';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardProps {
  title?: string;
  icon?: string;
  color?: string;
  children?: React.ReactNode;
  isDark?: boolean;
}

export interface CardGridProps {
  cols?: number;
  children?: React.ReactNode;
  isDark?: boolean;
}

// ─── Icon loader (lazy lucide) ────────────────────────────────────────────────

const iconCache = new Map<string, React.FC<{ size?: number; color?: string }>>();

const LucideIcon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 20, color }) => {
  const [Icon, setIcon] = React.useState<React.FC<{ size?: number; color?: string }> | null>(
    () => iconCache.get(name) ?? null
  );

  React.useEffect(() => {
    if (!name || iconCache.has(name)) return;
    const pascal = name.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    import('lucide-react').then((mod) => {
      const ic = (mod as Record<string, unknown>)[pascal] as React.FC<{ size?: number; color?: string }> | undefined;
      if (ic) {
        iconCache.set(name, ic);
        setIcon(() => ic);
      }
    });
  }, [name]);

  if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  return <Icon size={size} color={color} />;
};

// ─── Card ─────────────────────────────────────────────────────────────────────

// Unique class suffix to avoid collisions between multiple Card instances
const CARD_HOVER_CLASS = 'sophy-card';

const cardHoverStyle = `
  .${CARD_HOVER_CLASS} { transition: transform 0.15s, box-shadow 0.15s; }
  .${CARD_HOVER_CLASS}:hover { transform: translateY(-2px); }
  .${CARD_HOVER_CLASS}.card-dark:hover  { box-shadow: 0 6px 24px rgba(0,0,0,0.5); }
  .${CARD_HOVER_CLASS}.card-light:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
`;

const Card: React.FC<CardProps> = ({ title, icon, color, children, isDark = false }) => {
  const accentColor = color || (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
  const hasAccent = !!color;

  // FIX S3358: extract nested ternary for iconWrap background into a named variable
  const iconWrapBg = hasAccent
    ? `${accentColor}22`
    : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  // FIX S3358: extract nested ternary for icon color into a named variable
  const iconColor = hasAccent
    ? accentColor
    : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)';

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    borderRadius: '12px',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    background: isDark ? '#0f0f0f' : 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.05)',
  };

  const accentBarStyle: React.CSSProperties = hasAccent ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: accentColor,
    borderRadius: '12px 12px 0 0',
  } : {};

  const bodyStyle: React.CSSProperties = {
    padding: '1.25rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingTop: hasAccent ? '1.4rem' : '1.25rem',
  };

  const iconWrapStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: iconWrapBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.4rem',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: isDark ? '#fff' : '#0a0a0a',
    margin: 0,
    lineHeight: 1.3,
  };

  const contentStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    lineHeight: 1.6,
    margin: 0,
  };

  return (
    // FIX S6848: replace onMouseEnter/onMouseLeave JS handlers with CSS hover classes
    <>
      <style>{cardHoverStyle}</style>
      <div
        style={cardStyle}
        className={`${CARD_HOVER_CLASS} ${isDark ? 'card-dark' : 'card-light'}`}
      >
        {hasAccent && <div style={accentBarStyle} />}
        <div style={bodyStyle}>
          {icon && (
            <div style={iconWrapStyle}>
              <LucideIcon name={icon} size={18} color={iconColor} />
            </div>
          )}
          {title && <p style={titleStyle}>{title}</p>}
          {children && <div style={contentStyle}>{children}</div>}
        </div>
      </div>
    </>
  );
};

// ─── CardGrid ─────────────────────────────────────────────────────────────────

const CardGrid: React.FC<CardGridProps> = ({ cols = 2, children, isDark = false }) => {
  const safeCols = Math.min(3, Math.max(1, cols));

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${safeCols}, 1fr)`,
    gap: '1rem',
    margin: '1.5rem 0',
  };

  const styleTag = `
    .card-grid-${safeCols} {
      grid-template-columns: repeat(${safeCols}, 1fr);
    }
    @media (max-width: 640px) {
      .card-grid-${safeCols} { grid-template-columns: 1fr !important; }
    }
    @media (min-width: 641px) and (max-width: 900px) {
      .card-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
    }
  `;

  return (
    <>
      <style>{styleTag}</style>
      <div className={`card-grid-${safeCols}`} style={gridStyle}>
        {children}
      </div>
    </>
  );
};

// ─── Context-aware exports ────────────────────────────────────────────────────

export const CardWithContext: React.FC<Omit<CardProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <Card {...props} isDark={isDark} />;
};

export const CardGridWithContext: React.FC<Omit<CardGridProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <CardGrid {...props} isDark={isDark} />;
};

export { Card, CardGrid };
export default CardWithContext;