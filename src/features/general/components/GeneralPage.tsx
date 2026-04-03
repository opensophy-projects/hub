import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion';
import { SingularityShaders } from './SingularityShaders';
import Navigation from '@/features/navigation/components/Navigation';

// ─── ShinyText (встроенный) ───────────────────────────────────────────────────

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  direction?: 'left' | 'right';
  style?: React.CSSProperties;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text = '',
  disabled = false,
  speed = 3,
  className = '',
  color = 'rgba(255,255,255,0.55)',
  shineColor = 'rgba(255,255,255,0.95)',
  spread = 100,
  direction = 'left',
  style,
}) => {
  const progress       = useMotionValue(0);
  const elapsedRef     = useRef(0);
  const lastTimeRef    = useRef<number | null>(null);
  const directionRef   = useRef(direction === 'left' ? 1 : -1);
  const animationDuration = speed * 1000;

  useAnimationFrame(time => {
    if (disabled) { lastTimeRef.current = null; return; }
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += delta;
    const cycleDuration = animationDuration;
    const cycleTime = elapsedRef.current % cycleDuration;
    const p = (cycleTime / cycleDuration) * 100;
    progress.set(directionRef.current === 1 ? p : 100 - p);
  });

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize:       '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip:       'text',
    WebkitTextFillColor:  'transparent',
    ...style,
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ ...gradientStyle, backgroundPosition }}
    >
      {text}
    </motion.span>
  );
};

// ─── GeneralPage ──────────────────────────────────────────────────────────────

const GeneralPage: React.FC = () => {
  const [isNegative, setIsNegative] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsNegative(e.newValue !== 'light');
    };
    const onCustom = (e: Event) => {
      const { isDark } = (e as CustomEvent<{ isDark: boolean }>).detail;
      setIsNegative(isDark);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('hub:theme-change', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hub:theme-change', onCustom);
    };
  }, []);

  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff' : '#000000';
  const textMuted = isNegative ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const border    = isNegative ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  // Цвета ShinyText зависят от темы
  const shinyColor      = isNegative ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)';
  const shinyColorBg    = isNegative ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      {/* Навигация — currentDocSlug не передаём, чтобы ничего не подсвечивалось */}
      <Navigation />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* WebGL-фон */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <SingularityShaders
            speed={0.8}
            intensity={1.1}
            size={1.05}
            waveStrength={1}
            colorShift={1}
            isNegative={isNegative}
            className="h-full w-full"
          />
        </div>

        {/* Градиент снизу */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '35%', pointerEvents: 'none',
          background: `linear-gradient(to bottom, transparent, ${bg})`,
        }} />

        {/* Контент */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 1.5rem', maxWidth: '860px', width: '100%' }}>
          {/* Лейбл */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: textMuted,
              marginBottom: '2rem',
            }}
          >
            Open-source · Security · Dev
          </motion.div>

          {/* Логотип */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              fontSize: 'clamp(3.5rem, 14vw, 11rem)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              lineHeight: 1,
              margin: 0,
              fontFamily: 'customfont, sans-serif',
              color: textMain,
            }}
          >
            Opensophy
          </motion.h1>

          {/* Теги */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '2.5rem',
            }}
          >
            {['Hub', 'Habr', 'GitHub'].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '999px',
                  border: `1px solid ${border}`,
                  color: textMuted,
                  background: isNegative ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Скролл-хинт */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            color: textMuted,
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            style={{
              width: 1,
              height: 28,
              background: `linear-gradient(to bottom, ${textMuted}, transparent)`,
            }}
          />
        </motion.div>
      </section>

      {/* ── О ПРОЕКТЕ ── */}
      <section style={{
        position: 'relative',
        padding: 'clamp(5rem, 12vw, 10rem) clamp(1.5rem, 5vw, 4rem)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Горизонтальная линия сверху */}
        <div style={{
          width: '100%',
          height: '1px',
          background: border,
          marginBottom: 'clamp(3rem, 8vw, 6rem)',
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '3rem',
        }}>
          {/* Метка */}
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: textMuted,
          }}>
            О проекте
          </div>

          {/* Основной текст — ShinyText */}
          <div style={{ maxWidth: '820px' }}>
            <p style={{
              fontSize: 'clamp(1.25rem, 3.5vw, 2.25rem)',
              fontWeight: 500,
              lineHeight: 1.45,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              <ShinyText
                text="Opensophy — open-source проект для IT-специалистов."
                speed={4}
                color={shinyColor}
                shineColor={shinyColorBg}
                spread={110}
              />
              {' '}
              <span style={{ color: textMuted, fontWeight: 400 }}>
                Инструменты, туториалы и материалы по безопасности, разработке и инфраструктуре — в открытом доступе.
              </span>
            </p>
          </div>

          {/* Ссылки */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <a
              href="https://github.com/opensophy-projects"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                border: `1px solid ${isNegative ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}`,
                background: isNegative ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: textMain,
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.02em',
                transition: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = isNegative ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = isNegative ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>

            <a
              href="https://habr.com/ru/users/opensophy/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                border: `1px solid ${border}`,
                color: textMuted,
                fontSize: '0.85rem',
                fontWeight: 500,
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = textMain; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = textMuted; }}
            >
              Habr
            </a>

            <a
              href="/docs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                border: `1px solid ${border}`,
                color: textMuted,
                fontSize: '0.85rem',
                fontWeight: 500,
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = textMain; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = textMuted; }}
            >
              Hub →
            </a>
          </div>
        </div>

        {/* Нижняя линия */}
        <div style={{
          width: '100%',
          height: '1px',
          background: border,
          marginTop: 'clamp(3rem, 8vw, 6rem)',
        }} />
      </section>
    </div>
  );
};

export default GeneralPage;