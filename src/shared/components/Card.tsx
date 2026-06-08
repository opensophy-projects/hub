import React, { useContext, useState } from 'react';
import { TableContext } from '../lib/htmlParser';
import LucideIcon from './LucideIcon';
import Overlay from './Overlay';
import { makeTokens } from '@/shared/tokens/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardProps {
  title?: string;
  icon?: string;
  color?: string;
  image?: string;
  children?: React.ReactNode;
  isDark?: boolean;
}

export interface CardGridProps {
  cols?: number;
  children?: React.ReactNode;
}

// ─── Card hover class name ────────────────────────────────────────────────────

const CARD_HOVER_CLASS = 'sophy-card';

// Hover CSS — matches GeneralPage LandingCard / CategoryContent cat-doc-card pattern exactly
const cardHoverStyle = `
  .${CARD_HOVER_CLASS} {
    transition-property: transform, box-shadow, background !important;
    transition-duration: 0.15s !important;
    transition-timing-function: ease !important;
  }
  .${CARD_HOVER_CLASS}:hover {
    transform: translateY(-2px);
  }
  .${CARD_HOVER_CLASS}.card-dark:hover  { box-shadow: 0 6px 24px rgba(0,0,0,0.5) !important; }
  .${CARD_HOVER_CLASS}.card-light:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09) !important; }
`;

// ─── Token helpers ────────────────────────────────────────────────────────────

function getCardBg(isDark: boolean, accentColor: string | undefined): string {
  // Base card background — matches GeneralPage LandingCard exactly
  // Dark: flat near-black; Light: near-transparent off-white
  // When there's an accent color we keep the same base and let the border carry the color
  if (isDark) return '#0f0f0f';
  return 'rgba(0,0,0,0.02)';
}

function getCardBorder(isDark: boolean, hasAccent: boolean, accentColor: string): string {
  // With accent: use accent at low opacity so it's a colored tint, not a bright glow
  if (hasAccent) {
    return `1.5px solid ${accentColor}`;
  }
  // Without accent: same subtle border as GeneralPage LandingCard
  return isDark
    ? '1px solid rgba(255,255,255,0.09)'
    : '1px solid rgba(0,0,0,0.09)';
}

function getCardBoxShadow(isDark: boolean, hasAccent: boolean, accentColor: string): string {
  // GeneralPage cards have no box-shadow by default — flat look
  // With accent we add a very subtle tinted shadow instead of the old bright glow
  if (hasAccent) {
    return isDark
      ? `0 2px 16px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}18`
      : `0 1px 6px rgba(0,0,0,0.07), 0 0 0 1px ${accentColor}14`;
  }
  return 'none';
}

function getIconWrapBg(hasAccent: boolean, accentColor: string, isDark: boolean): string {
  // With accent: very soft tint of the accent color
  // Without accent: same as CategoryCard / GeneralPage FeatureCard
  if (hasAccent) return `${accentColor}22`;
  return isDark ? 'rgba(255,255,255,0.07)' : makeTokens(isDark).accentSoft;
}

function getIconWrapBorder(hasAccent: boolean, accentColor: string, isDark: boolean): string {
  if (hasAccent) return `1px solid ${accentColor}44`;
  return isDark ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${makeTokens(isDark).border}`;
}

function getIconColor(hasAccent: boolean, accentColor: string, isDark: boolean): string {
  if (hasAccent) return accentColor;
  return isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)';
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card: React.FC<CardProps> = ({ title, icon, color, image, children, isDark = false }) => {
  const t = makeTokens(isDark);
  const accentColor = color || '';
  const hasAccent   = !!color;

  const cardBg     = getCardBg(isDark, accentColor || undefined);
  const cardBorder = getCardBorder(isDark, hasAccent, accentColor);
  const cardShadow = getCardBoxShadow(isDark, hasAccent, accentColor);

  const iconWrapBg  = getIconWrapBg(hasAccent, accentColor, isDark);
  const iconWrapBdr = getIconWrapBorder(hasAccent, accentColor, isDark);
  const iconColor   = getIconColor(hasAccent, accentColor, isDark);

  // Text colors — same as GeneralPage FeatureCard
  const titleColor   = isDark ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.88)';
  const contentColor = isDark ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.65)';

  // Image divider
  const imgDivider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <style>{cardHoverStyle}</style>
      <div
        style={{
          position:     'relative',
          borderRadius: '16px',   // GeneralPage uses 16px
          border:       cardBorder,
          background:   cardBg,
          overflow:     'hidden',
          display:      'flex',
          flexDirection:'column',
          boxShadow:    cardShadow,
        }}
        className={`${CARD_HOVER_CLASS} ${isDark ? 'card-dark' : 'card-light'}`}
      >
        {/* ── Card image ─────────────────────────────────────────────────── */}
        {image && (
          <>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Открыть изображение"
              style={{
                padding:    0,
                border:     'none',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                cursor:     'zoom-in',
                width:      '100%',
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow:   'hidden',
                flexShrink: 0,
                minHeight:  '80px',
                maxHeight:  '300px',
              }}
            >
              <img
                src={image}
                alt={title ?? 'card image'}
                style={{
                  display:    'block',
                  width:      '100%',
                  height:     'auto',
                  maxHeight:  '300px',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  padding:    '6px',
                  boxSizing:  'border-box',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLImageElement).style.opacity = '0.88';
                  (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLImageElement).style.opacity = '1';
                  (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
                }}
              />
            </button>
            <div style={{
              height:     '1px',
              background: imgDivider,
              flexShrink: 0,
            }} />
          </>
        )}

        {/* ── Card body ──────────────────────────────────────────────────── */}
        <div style={{
          padding:       '1.25rem',
          flex:           1,
          display:       'flex',
          flexDirection: 'column',
          gap:           '0.5rem',
          fontFamily:    'Inter, system-ui, sans-serif',
        }}>
          {icon && (
            <div style={{
              width:          '36px',
              height:         '36px',
              borderRadius:   '8px',
              background:     iconWrapBg,
              border:         iconWrapBdr,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              marginBottom:   '0.25rem',
              flexShrink:     0,
            }}>
              <LucideIcon name={icon} size={18} color={iconColor} />
            </div>
          )}

          {title && (
            <p style={{
              margin:     '0',
              fontSize:   'clamp(0.95rem, 1.6vw, 1.1rem)',
              fontWeight:  700,
              lineHeight:  1.3,
              color:       titleColor,
            }}>
              {title}
            </p>
          )}

          {children && (
            <div style={{
              fontSize:   'clamp(0.82rem, 1.2vw, 0.9rem)',
              lineHeight:  1.65,
              color:       contentColor,
              margin:      0,
              flex:        1,
            }}>
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && image && (
        <Overlay onClose={() => setLightboxOpen(false)} backdropCursor="zoom-out">
          <div style={{ position: 'relative' }}>
            <img
              src={image}
              alt={title ?? 'card image'}
              style={{
                maxWidth:   '90vw',
                maxHeight:  '90vh',
                objectFit:  'contain',
                borderRadius: '10px',
                boxShadow:  '0 8px 60px rgba(0,0,0,0.8)',
                userSelect: 'none',
                display:    'block',
              }}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Закрыть"
              style={{
                position:   'fixed',
                top:        '1.25rem',
                right:      '1.25rem',
                background: 'rgba(255,255,255,0.12)',
                border:     '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color:      '#fff',
                width:      '36px',
                height:     '36px',
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor:     'pointer',
                fontSize:   '18px',
                lineHeight:  1,
                zIndex:      1,
              }}
            >
              ✕
            </button>
          </div>
        </Overlay>
      )}
    </>
  );
};

// ─── CardGrid ─────────────────────────────────────────────────────────────────

const CardGrid: React.FC<CardGridProps> = ({ cols = 2, children }) => {
  const safeCols = Math.min(3, Math.max(1, cols));

  const gridStyle: React.CSSProperties = {
    display:             'grid',
    gridTemplateColumns: `repeat(${safeCols}, 1fr)`,
    gap:                 '1rem',
    margin:              '1.5rem 0',
    alignItems:          'stretch',
  };

  // Responsive breakpoints — matches GeneralPage sec-cards / CategoryContent grid
  const styleTag = `
    .card-grid-${safeCols} {
      grid-template-columns: repeat(${safeCols}, 1fr);
      align-items: stretch;
    }
    @media (max-width: 560px) {
      .card-grid-${safeCols} { grid-template-columns: 1fr !important; }
    }
    @media (min-width: 561px) and (max-width: 900px) {
      .card-grid-2 { grid-template-columns: repeat(2, 1fr) !important; }
      .card-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
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

export const CardGridWithContext: React.FC<CardGridProps> = (props) => {
  return <CardGrid {...props} />;
};

export { Card, CardGrid };
export default CardWithContext;