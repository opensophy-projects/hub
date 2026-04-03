import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useMotionValue, useAnimationFrame, useTransform, motion } from 'framer-motion';
import { SingularityShaders } from './SingularityShaders';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';

// ─── ShinyText ────────────────────────────────────────────────────────────────

interface ShinyTextProps {
  text: string;
  speed?: number;
  color?: string;
  shineColor?: string;
  spread?: number;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  speed = 4,
  color = 'rgba(255,255,255,0.55)',
  shineColor = 'rgba(255,255,255,0.95)',
  spread = 110,
}) => {
  const progress   = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastRef    = useRef<number | null>(null);

  useAnimationFrame(time => {
    if (lastRef.current === null) { lastRef.current = time; return; }
    elapsedRef.current += time - lastRef.current;
    lastRef.current = time;
    const p = (elapsedRef.current % (speed * 1000)) / (speed * 1000) * 100;
    progress.set(p);
  });

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

  return (
    <motion.span
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition,
        display: 'inline',
      }}
    >
      {text}
    </motion.span>
  );
};

// ─── GlowingEffect ───────────────────────────────────────────────────────────

const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
  isNegative?: boolean;
}

const GlowingEffect: React.FC<GlowingEffectProps> = memo(({
  blur = 0,
  inactiveZone = 0.7,
  proximity = 0,
  spread = 20,
  glow = false,
  movementDuration = 2,
  borderWidth = 1,
  disabled = true,
  isNegative = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  const animateAngleTransition = useCallback(
    (element: HTMLDivElement, startValue: number, endValue: number, duration: number) => {
      const startTime = performance.now();
      const animateValue = (currentTime: number) => {
        const elapsed  = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value    = startValue + (endValue - startValue) * easeOutQuint(progress);
        element.style.setProperty('--start', String(value));
        if (progress < 1) requestAnimationFrame(animateValue);
      };
      requestAnimationFrame(animateValue);
    },
    []
  );

  const handleMove = useCallback(
    (e?: MouseEvent | { x: number; y: number }) => {
      if (!containerRef.current) return;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        const element = containerRef.current;
        if (!element) return;
        const { left, top, width, height } = element.getBoundingClientRect();
        const mouseX = e?.x ?? lastPosition.current.x;
        const mouseY = e?.y ?? lastPosition.current.y;
        if (e) lastPosition.current = { x: mouseX, y: mouseY };
        const center             = [left + width * 0.5, top + height * 0.5];
        const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
        const inactiveRadius     = 0.5 * Math.min(width, height) * inactiveZone;
        if (distanceFromCenter < inactiveRadius) { element.style.setProperty('--active', '0'); return; }
        const isActive =
          mouseX > left - proximity &&
          mouseX < left + width  + proximity &&
          mouseY > top  - proximity &&
          mouseY < top  + height + proximity;
        element.style.setProperty('--active', isActive ? '1' : '0');
        if (!isActive) return;
        const currentAngle = Number.parseFloat(element.style.getPropertyValue('--start')) || 0;
        let targetAngle    = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
        const angleDiff    = ((targetAngle - currentAngle + 180) % 360) - 180;
        animateAngleTransition(element, currentAngle, currentAngle + angleDiff, movementDuration * 1000);
      });
    },
    [inactiveZone, proximity, movementDuration, animateAngleTransition]
  );

  useEffect(() => {
    if (disabled) return;
    const handleScroll      = () => handleMove();
    const handlePointerMove = (e: PointerEvent) => handleMove(e);
    window.addEventListener('scroll',            handleScroll,      { passive: true });
    document.body.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handleMove, disabled]);

  const gradient = isNegative
    ? `repeating-conic-gradient(from 236.84deg at 50% 50%, #ffffff, #ffffff calc(25% / var(--repeating-conic-gradient-times)))`
    : `repeating-conic-gradient(from 236.84deg at 50% 50%, #000000, #000000 calc(25% / var(--repeating-conic-gradient-times)))`;

  return (
    <>
      <div style={{ position: 'absolute', inset: -1, borderRadius: 'inherit', border: 'none', opacity: 0, pointerEvents: 'none' }} />
      <div
        ref={containerRef}
        style={{
          '--blur':                           `${blur}px`,
          '--spread':                         spread,
          '--start':                          '0',
          '--active':                         '0',
          '--glowingeffect-border-width':     `${borderWidth}px`,
          '--repeating-conic-gradient-times': '5',
          '--gradient':                       gradient,
          position:                           'absolute',
          inset:                              0,
          borderRadius:                       'inherit',
          opacity:                            1,
          pointerEvents:                      'none',
        } as React.CSSProperties}
      >
        <div
          style={{
            borderRadius:        'inherit',
            position:            'absolute',
            inset:               `calc(-1 * var(--glowingeffect-border-width))`,
            border:              `var(--glowingeffect-border-width) solid transparent`,
            background:          'var(--gradient)',
            backgroundAttachment:'fixed',
            opacity:             'var(--active)' as any,
            transition:          'opacity 300ms',
            WebkitMaskImage:     'linear-gradient(#0000,#0000), conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #00000000 0deg, #fff, #00000000 calc(var(--spread) * 2deg))',
            maskImage:           'linear-gradient(#0000,#0000), conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #00000000 0deg, #fff, #00000000 calc(var(--spread) * 2deg))',
            WebkitMaskClip:      'padding-box, border-box',
            maskClip:            'padding-box, border-box',
            WebkitMaskComposite: 'intersect',
            maskComposite:       'intersect',
          } as React.CSSProperties}
        />
      </div>
    </>
  );
});
GlowingEffect.displayName = 'GlowingEffect';

// ─── SVG-иконки ───────────────────────────────────────────────────────────────

const IconScan: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" /><path d="M12 9v-2" /><path d="M12 17v-2" />
    <path d="M9 12H7" /><path d="M17 12h-2" />
  </svg>
);
const IconBook: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="13" y2="11" />
  </svg>
);
const IconCode: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
);

// ─── FeatureCard ──────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  isNegative: boolean;
  fullWidth?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, text, isNegative, fullWidth }) => {
  const border = isNegative ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const bg     = isNegative ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const iconBg = isNegative ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const titleC = isNegative ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.88)';
  const textC  = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';

  return (
    <div style={{
      position:     'relative',
      border:       `1px solid ${border}`,
      background:   bg,
      borderRadius: 16,
      padding:      '1.5rem',
      display:      'flex',
      flexDirection:'column',
      gap:          '0.75rem',
      gridColumn:   fullWidth ? '1 / -1' : undefined,
      overflow:     'hidden',
    }}>
      <GlowingEffect
        spread={40}
        glow
        disabled={false}
        proximity={60}
        inactiveZone={0.01}
        borderWidth={1.5}
        isNegative={isNegative}
      />
      <div style={{
        width:          40,
        height:         40,
        borderRadius:   10,
        background:     iconBg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        position:       'relative',
        zIndex:         1,
      }}>
        {icon}
      </div>
      {/* Заголовок карточки — крупный, как текст секции «О проекте» */}
      <div style={{
        fontSize:   'clamp(1.1rem, 1.8vw, 1.4rem)',
        fontWeight: 700,
        color:      titleC,
        lineHeight: 1.25,
        position:   'relative',
        zIndex:     1,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {title}
      </div>
      {/* Текст карточки — крупный, как в «О проекте» */}
      <div style={{
        fontSize:   'clamp(0.95rem, 1.4vw, 1.1rem)',
        color:      textC,
        lineHeight: 1.65,
        position:   'relative',
        zIndex:     1,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {text}
      </div>
    </div>
  );
};

// ─── CliffChart — крутой спуск "\" ───────────────────────────────────────────
// График начинается высоко слева и резко уходит вниз вправо (экспоненциальный спуск)

interface CliffChartProps {
  isNegative: boolean;
  inView: boolean;
}

const CliffChart: React.FC<CliffChartProps> = ({ isNegative, inView }) => {
  const containerRef  = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 800, h: 260 });
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const upd = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 0) setDim({ w: r.width, h: r.height });
      }
    };
    upd();
    const ro = new ResizeObserver(upd);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const dur = 1800;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p     = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView]);

  const { w, h } = dim;
  const padX = 0;
  const padTop = 8;
  const padBottom = 8;
  const chartW = w - padX * 2;
  const chartH = h - padTop - padBottom;

  // Экспоненциальный крутой спуск: начало вверху-слева, конец внизу-справа
  // Используем степенную функцию с большим показателем для «обрыва»
  const n = 60;
  const cliffPoints = Array.from({ length: n }, (_, i) => {
    const t  = i / (n - 1);
    // Экспонента: медленно падает в начале, очень резко в конце
    // pow(t, 0.35) даёт быстрый старт падения → крутой обрыв слева
    const yN = 1 - Math.pow(t, 0.28);
    return {
      x: padX + t * chartW,
      y: padTop + (1 - yN) * chartH,
    };
  });

  // Smooth bezier path
  const buildPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = pts[i].x + (pts[i + 1].x - (i > 0 ? pts[i - 1].x : pts[i].x)) / 5;
      const cp1y = pts[i].y + (pts[i + 1].y - (i > 0 ? pts[i - 1].y : pts[i].y)) / 5;
      const cp2x = pts[i + 1].x - (i + 2 < pts.length ? pts[i + 2].x - pts[i].x : pts[i + 1].x - pts[i].x) / 5;
      const cp2y = pts[i + 1].y - (i + 2 < pts.length ? pts[i + 2].y - pts[i].y : pts[i + 1].y - pts[i].y) / 5;
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`;
    }
    return d;
  };

  const linePath  = buildPath(cliffPoints);
  const baseY     = padTop + chartH;
  const areaPath  = `${linePath} L ${(padX + chartW).toFixed(2)} ${baseY} L ${padX.toFixed(2)} ${baseY} Z`;
  const clipWidth = Math.max(0, progress * w + 8);
  const clipId    = `cliff-clip-${Math.round(w)}`;
  const gradId    = `cliff-grad-${Math.round(w)}`;

  const lineColor = isNegative ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.6)';
  const areaTop   = isNegative ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.09)';

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={clipWidth} height={h} />
          </clipPath>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={areaTop} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </div>
  );
};

// ─── SecuritySection ──────────────────────────────────────────────────────────

interface SecuritySectionProps {
  isNegative: boolean;
  navOffset?: number;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ isNegative, navOffset = 0 }) => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const bg      = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain = isNegative ? '#ffffff' : '#000000';
  const textMut  = isNegative ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const iconClr  = isNegative ? 'rgba(255,255,255,0.6)'  : 'rgba(0,0,0,0.55)';

  return (
    <section
      ref={sectionRef}
      style={{
        background: bg,
        marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
        width:      '100%',
        boxSizing:  'border-box',
        overflow:   'hidden',
      }}
    >
      <style>{`
        /* ── Зона графика с наложенным текстом (как Supabase) ── */
        .cliff-zone {
          position: relative;
          width: 100%;
          height: clamp(260px, 35vw, 420px);
          padding: clamp(2.5rem, 5vw, 4rem) clamp(2rem, 6vw, 5rem) 0;
          box-sizing: border-box;
        }
        .cliff-text-overlay {
          position: absolute;
          top: clamp(2.5rem, 5vw, 4rem);
          left: clamp(2rem, 6vw, 5rem);
          right: clamp(2rem, 6vw, 5rem);
          z-index: 2;
          pointer-events: none;
          max-width: 520px;
        }
        .cliff-svg-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        /* ── Карточки ── */
        .sec-cards-area {
          padding: 0 clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem);
          box-sizing: border-box;
        }
        .sec-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 2rem;
        }
        @media (max-width: 560px) {
          .sec-cards {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ── Зона графика + текст поверх ── */}
      <div className="cliff-zone">
        {/* Текст поверх графика — крупный, как на Supabase */}
        <div className="cliff-text-overlay">
          <p style={{
            fontSize:      '0.65rem',
            fontWeight:    700,
            color:         textMut,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            margin:        '0 0 0.75rem',
            fontFamily:    'Inter, system-ui, sans-serif',
          }}>
            БЕЗОПАСНОСТЬ
          </p>
          <h2 style={{
            fontSize:   'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            margin:     '0 0 1rem',
            color:      textMain,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            Безопасность<br />прежде всего
          </h2>
          <p style={{
            fontSize:   'clamp(0.95rem, 1.4vw, 1.1rem)',
            lineHeight: 1.65,
            color:      textMut,
            margin:     0,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            Безопасность и качество кода — главный приоритет,
            особенно на фоне интеграции ИИ в разработку
          </p>
        </div>

        {/* График — абсолютно поверх всей зоны */}
        <div className="cliff-svg-wrap">
          <CliffChart isNegative={isNegative} inView={inView} />
        </div>
      </div>

      {/* ── Карточки ── */}
      <div className="sec-cards-area">
        <div className="sec-cards">
          {/* Широкая карточка */}
          <div style={{ gridColumn: '1 / -1' }}>
            <FeatureCard
              isNegative={isNegative}
              icon={<IconScan color={iconClr} />}
              title="Интеграция SAST, DAST, SCA"
              text="Автоматический анализ кода на уязвимости на каждом этапе разработки. SAST проверяет исходный код, DAST тестирует работающее приложение, SCA отслеживает зависимости. Всё это работает автоматически в вашем CI/CD."
              fullWidth
            />
          </div>
          <FeatureCard
            isNegative={isNegative}
            icon={<IconBook color={iconClr} />}
            title="Знания каждому!"
            text="Пишем понятные статьи и гайды по DevSecOps. Рассказываем как настроить безопасность с нуля и сделать её частью культуры команды."
          />
          <FeatureCard
            isNegative={isNegative}
            icon={<IconCode color={iconClr} />}
            title="Open Source"
            text="Рассказываем про open source инструменты безопасности. Делимся опытом бесплатных решений, которые сделают ваш проект безопаснее."
          />
        </div>
      </div>
    </section>
  );
};

// ─── LandingContent ───────────────────────────────────────────────────────────

const LandingContent: React.FC = () => {
  const [isNegative, setIsNegative] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });

  const [navOffset, setNavOffset] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsNegative(e.newValue !== 'light');
    };
    const onCustom = (e: Event) => {
      setIsNegative((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('hub:theme-change', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hub:theme-change', onCustom);
    };
  }, []);

  useEffect(() => {
    const readOffset = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-left').trim();
      setNavOffset(val ? parseInt(val, 10) : 0);
    };
    readOffset();
    const observer = new MutationObserver(readOffset);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    return () => observer.disconnect();
  }, []);

  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff' : '#000000';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      `}</style>

      <Navigation />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{
          position:  'relative',
          minHeight: '100svh',
          overflow:  'hidden',
          marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <SingularityShaders
            speed={0.8} intensity={1.1} size={1.05}
            waveStrength={1} colorShift={1} isNegative={isNegative}
            className="h-full w-full"
          />
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          pointerEvents: 'none',
          background: `linear-gradient(to bottom, transparent, ${bg})`,
        }} />

        <div style={{
          position:  'absolute',
          left:      '50%',
          top:       '50%',
          transform: 'translate(-75%, -50%)',
          zIndex:    10,
          textAlign: 'center',
          padding:   '0 1.5rem',
          maxWidth:  '900px',
          width:     '100%',
        }}>
          <h1 style={{
            fontSize:      'clamp(3.5rem, 14vw, 11rem)',
            fontWeight:    700,
            letterSpacing: '0.08em',
            lineHeight:    1,
            margin:        0,
            fontFamily:    'customfont, sans-serif',
            color:         textMain,
          }}>
            Opensophy
          </h1>
        </div>
      </section>

      {/* ── О проекте ─────────────────────────────────────────────────── */}
      <section
        style={{
          marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
          padding:    'clamp(4rem, 10vw, 8rem) clamp(2rem, 6vw, 5rem)',
          width:      '100%',
          boxSizing:  'border-box',
        }}
      >
        <p style={{
          fontSize:      '1rem',
          fontWeight:    600,
          color:         isNegative ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)',
          marginBottom:  '2rem',
          marginTop:     0,
          fontFamily:    'Inter, sans-serif',
          letterSpacing: '0.14em',
        }}>
          О ПРОЕКТЕ
        </p>

        <p style={{
          fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
          fontWeight: 500,
          lineHeight: 1.55,
          margin:     0,
          maxWidth:   '100%',
          fontFamily: 'Inter, sans-serif',
        }}>
          <ShinyText
            text="Opensophy — open-source проект для IT-специалистов. Инструменты, туториалы и материалы по безопасности, разработке и инфраструктуре — в открытом доступе."
            speed={4}
            color={shinyBase}
            shineColor={shinyGlow}
          />
        </p>
      </section>

      {/* ── Безопасность ──────────────────────────────────────────────── */}
      <SecuritySection isNegative={isNegative} navOffset={navOffset} />
    </div>
  );
};

// ─── GeneralPage ──────────────────────────────────────────────────────────────

const GeneralPage: React.FC = () => (
  <ThemeProvider>
    <LandingContent />
  </ThemeProvider>
);

export default GeneralPage;