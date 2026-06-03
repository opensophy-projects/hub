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

// ─── Card styles ──────────────────────────────────────────────────────────────

const CARD_HOVER_CLASS = 'sophy-card';

const cardHoverStyle = `
  .${CARD_HOVER_CLASS} { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
  .${CARD_HOVER_CLASS}:hover { transform: translateY(-2px); }
  .${CARD_HOVER_CLASS}.card-dark:hover  { border-color: rgba(255,255,255,0.16); box-shadow: 0 18px 42px rgba(0,0,0,0.38); }
  .${CARD_HOVER_CLASS}.card-light:hover { border-color: rgba(0,0,0,0.13); box-shadow: 0 16px 34px rgba(0,0,0,0.08); }
`;

function getIconWrapBg(isDark: boolean): string {
  return isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.045)';
}

function getIconColor(isDark: boolean): string {
  return isDark ? 'rgba(255,255,255,0.76)' : 'rgba(0,0,0,0.6)';
}

function getCardStyles(isDark: boolean, hasAccent: boolean, accentColor: string) {
  const t = makeTokens(isDark);
  const accentWash = hasAccent
    ? `radial-gradient(circle at 26px 24px, ${accentColor}24 0, transparent 42px), `
    : '';
  const card: React.CSSProperties = {
    position: 'relative',
    borderRadius: '14px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.105)' : t.border}`,
    background: `${accentWash}${isDark ? 'linear-gradient(145deg, #111 0%, #0d0d0d 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f7f6f2 100%)'}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.28)' : '0 8px 24px rgba(0,0,0,0.055)',
  };

  const accentBar: React.CSSProperties = {};

  const body: React.CSSProperties = {
    padding: '1.4rem', flex: 1,
    display: 'flex', flexDirection: 'column', gap: '0.55rem',
  };

  const iconWrap: React.CSSProperties = {
    width: '40px', height: '40px', borderRadius: '11px',
    background: getIconWrapBg(isDark),
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '0.45rem', flexShrink: 0,
    boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.75)',
  };

  const title: React.CSSProperties = {
    fontSize: '0.95rem', fontWeight: 700,
    color: isDark ? '#fff' : '#0a0a0a',
    margin: 0, lineHeight: 1.3,
  };

  const content: React.CSSProperties = {
    fontSize: '0.85rem',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    lineHeight: 1.6, margin: 0,
  };

  return { card, accentBar, body, iconWrap, title, content };
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card: React.FC<CardProps> = ({ title, icon, color, image, children, isDark = false }) => {
  const accentColor = color || (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
  const hasAccent   = !!color;
  const iconColor   = getIconColor(isDark);
  const s           = getCardStyles(isDark, hasAccent, accentColor);

  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <style>{cardHoverStyle}</style>
      <div style={s.card} className={`${CARD_HOVER_CLASS} ${isDark ? 'card-dark' : 'card-light'}`}>
        {/* ── Изображение карточки — адаптивное, сохраняет пропорции ──────── */}
        {image && (
          <>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Открыть изображение"
              style={{
                padding: 0,
                border: 'none',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                cursor: 'zoom-in',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                // Минимальная высота пока картинка грузится
                minHeight: '80px',
                // Максимум — чтобы очень высокие картинки не разрывали сетку
                maxHeight: '300px',
              }}
            >
              <img
                src={image}
                alt={title ?? 'card image'}
                style={{
                  display: 'block',
                  width: '100%',
                  // Высота авто — картинка сохраняет свои пропорции
                  height: 'auto',
                  // Но не выше 300px
                  maxHeight: '300px',
                  // contain — не обрезаем, показываем целиком с letterbox если нужно
                  objectFit: 'contain',
                  objectPosition: 'center',
                  // Небольшой padding чтобы не прилипало к краям карточки
                  padding: '6px',
                  boxSizing: 'border-box',
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

            {/* Разделитель между изображением и телом карточки */}
            <div style={{
              height: '1px',
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              flexShrink: 0,
            }} />
          </>
        )}

        <div style={s.body}>
          {icon && (
            <div style={s.iconWrap}>
              <LucideIcon name={icon} size={18} color={iconColor} />
            </div>
          )}
          {title    && <p   style={s.title}  >{title}   </p>}
          {children && <div style={s.content}>{children}</div>}
        </div>
      </div>

      {/* Лайтбокс для изображения карточки */}
      {lightboxOpen && image && (
        <Overlay onClose={() => setLightboxOpen(false)} backdropCursor="zoom-out">
          <div style={{ position: 'relative' }}>
            <img
              src={image}
              alt={title ?? 'card image'}
              style={{
                maxWidth: '90vw', maxHeight: '90vh',
                objectFit: 'contain', borderRadius: '10px',
                boxShadow: '0 8px 60px rgba(0,0,0,0.8)',
                userSelect: 'none', display: 'block',
              }}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Закрыть"
              style={{
                position: 'fixed', top: '1.25rem', right: '1.25rem',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px', color: '#fff',
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '18px', lineHeight: 1, zIndex: 1,
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
    display: 'grid',
    gridTemplateColumns: `repeat(${safeCols}, 1fr)`,
    gap: '1rem',
    margin: '1.5rem 0',
    // align-items: stretch — все карточки в строке одной высоты
    alignItems: 'stretch',
  };

  const styleTag = `
    .card-grid-${safeCols} { grid-template-columns: repeat(${safeCols}, 1fr); align-items: stretch; }
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

export const CardGridWithContext: React.FC<CardGridProps> = (props) => {
  return <CardGrid {...props} />;
};

export { Card, CardGrid };
export default CardWithContext;
