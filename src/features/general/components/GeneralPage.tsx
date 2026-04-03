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

// ─── GlowingEffect (адаптирован из ui/GlowingEffect.tsx) ─────────────────────

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
        const center           = [left + width * 0.5, top + height * 0.5];
        const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
        const inactiveRadius   = 0.5 * Math.min(width, height) * inactiveZone;
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
    const handleScroll       = () => handleMove();
    const handlePointerMove  = (e: PointerEvent) => handleMove(e);
    window.addEventListener('scroll',       handleScroll,      { passive: true });
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
      <div
        style={{
          position: 'absolute', inset: -1,
          borderRadius: 'inherit',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        ref={containerRef}
        style={{
          '--blur':                              `${blur}px`,
          '--spread':                            spread,
          '--start':                             '0',
          '--active':                            '0',
          '--glowingeffect-border-width':        `${borderWidth}px`,
          '--repeating-conic-gradient-times':    '5',
          '--gradient':                          gradient,
          position:                              'absolute',
          inset:                                 0,
          borderRadius:                          'inherit',
          opacity:                               1,
          pointerEvents:                         'none',
        } as React.CSSProperties}
      >
        <div
          style={{
            borderRadius: 'inherit',
            position:     'absolute',
            inset:        `calc(-1 * var(--glowingeffect-border-width))`,
            border:       `var(--glowingeffect-border-width) solid transparent`,
            background:   'var(--gradient)',
            backgroundAttachment: 'fixed',
            opacity:      'var(--active)' as any,
            transition:   'opacity 300ms',
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

// ─── SecuritySection ──────────────────────────────────────────────────────────

interface SecuritySectionProps {
  isNegative: boolean;
  navOffset?: number;
}

// SVG-иконки
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

// Карточка с GlowingEffect
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
  const textC  = isNegative ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.48)';

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
      {/* GlowingEffect */}
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
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: titleC, lineHeight: 1.3, position: 'relative', zIndex: 1 }}>
        {title}
      </div>
      <div style={{ fontSize: '0.85rem', color: textC, lineHeight: 1.65, position: 'relative', zIndex: 1 }}>
        {text}
      </div>
    </div>
  );
};

// График — гора (вверх и вниз), без осей, подписей, разделителей
interface MountainChartProps {
  isNegative: boolean;
  inView: boolean;
}

const MountainChart: React.FC<MountainChartProps> = ({ isNegative, inView }) => {
  const containerRef  = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 800, h: 180 });
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
    const dur = 2000;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView]);

  const { w, h } = dim;
  const padX = 0;
  const padY = 16;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  // Гора: начинается снизу, поднимается до пика в центре, опускается обратно
  const n = 24;
  const mountainPoints = Array.from({ length: n }, (_, i) => {
    const t  = i / (n - 1);
    // Параболическая форма: sin(π * t) даёт гору
    const yN = Math.sin(Math.PI * t);
    return {
      x: padX + t * chartW,
      y: padY + (1 - yN) * chartH,
    };
  });

  // Плавная кривая
  const smoothPath = (pts: { x: number; y: number }[]) => {
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

  const linePath = smoothPath(mountainPoints);
  const baseY    = padY + chartH;
  const areaPath = `${linePath} L ${(padX + chartW).toFixed(2)} ${baseY} L ${padX.toFixed(2)} ${baseY} Z`;

  const lineColor = isNegative ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.55)';
  const areaStart = isNegative ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const clipId    = `mnt-clip-${w}`;

  // Clip по прогрессу — рисуем слева направо
  const clipWidth = Math.max(0, progress * w + 8);

  return (
    <div ref={containerRef} style={{ width: '100%', height: 180, position: 'relative' }}>
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
          <linearGradient id={`mnt-grad-${w}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={areaStart} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        {/* Площадь под горой */}
        <path
          d={areaPath}
          fill={`url(#mnt-grad-${w})`}
          clipPath={`url(#${clipId})`}
        />

        {/* Линия горы */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.8}
          strokeLinecap="round"
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </div>
  );
};

const SecuritySection: React.FC<SecuritySectionProps> = ({ isNegative, navOffset = 0 }) => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const bg       = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain = isNegative ? '#ffffff' : '#000000';
  const textMut  = isNegative ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const iconClr  = isNegative ? 'rgba(255,255,255,0.6)'  : 'rgba(0,0,0,0.55)';

  return (
    <section
      ref={sectionRef}
      style={{
        background: bg,
        padding:    'clamp(4rem, 10vw, 8rem) clamp(2rem, 6vw, 5rem)',
        marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
        width:      '100%',
        boxSizing:  'border-box',
      }}
    >
      <style>{`
        .sec-layout {
          display: flex;
          flex-direction: row;
          gap: clamp(2rem, 5vw, 5rem);
          align-items: flex-start;
        }
        .sec-left {
          flex: 1 1 55%;
          min-width: 0;
        }
        .sec-right {
          flex: 0 0 clamp(240px, 30%, 340px);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 0.25rem;
        }
        .sec-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 2.5rem;
        }
        .sec-card-wide {
          grid-column: 1 / -1;
        }
        @media (max-width: 900px) {
          .sec-layout {
            flex-direction: column-reverse;
          }
          .sec-right {
            flex: none;
            width: 100%;
          }
        }
        @media (max-width: 560px) {
          .sec-cards {
            grid-template-columns: 1fr !important;
          }
          .sec-card-wide {
            grid-column: 1 !important;
          }
        }
      `}</style>

      <div className="sec-layout">
        {/* ── Левая: график + карточки ─────────────────────────────────── */}
        <div className="sec-left">
          <MountainChart isNegative={isNegative} inView={inView} />

          {/* Сетка карточек */}
          <div className="sec-cards">
            <div className="sec-card-wide">
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

        {/* ── Правая: заголовок ────────────────────────────────────────── */}
        <div className="sec-right">
          <p style={{
            fontSize:      '0.65rem',
            fontWeight:    700,
            color:         textMut,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin:        0,
            fontFamily:    'system-ui, sans-serif',
          }}>
            БЕЗОПАСНОСТЬ
          </p>
          <h2 style={{
            fontSize:   'clamp(1.5rem, 2.8vw, 2.2rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            margin:     '0.5rem 0 1rem',
            color:      textMain,
            fontFamily: 'system-ui, sans-serif',
          }}>
            Безопасность прежде всего
          </h2>
          <p style={{
            fontSize:   'clamp(0.85rem, 1.3vw, 0.95rem)',
            lineHeight: 1.65,
            color:      textMut,
            margin:     0,
            fontFamily: 'system-ui, sans-serif',
          }}>
            Безопасность и качество кода — главный приоритет, особенно на фоне интеграции ИИ в разработку
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── Stats (WaveChart без горизонтальных линий, исправленный) ─────────────────

interface StatsProps {
  isNegative: boolean;
}

function generateWaveData(count: number, seed: number, smoothness: number = 1, spike = false) {
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const wave1    = Math.sin(i * 0.18 * smoothness + seed) * 0.28;
    const wave2    = Math.sin(i * 0.37 * smoothness + seed * 1.7) * 0.16;
    const wave3    = Math.sin(i * 0.6  * smoothness + seed * 0.9) * 0.09;
    const wave4    = Math.sin(i * 1.1  * smoothness + seed * 2.3) * 0.05;
    const trend    = progress * 0.22;
    const base     = 0.32 + trend;
    const spikePeak = spike ? Math.exp(-Math.pow((progress - 0.84) / 0.065, 2)) * 0.65 : 0;
    points.push(Math.min(0.97, Math.max(0.04, base + wave1 + wave2 + wave3 + wave4 + spikePeak)));
  }
  return points;
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cp1x = pts[i].x   + (pts[i + 1].x - (i > 0 ? pts[i - 1].x : pts[i].x)) / 6;
    const cp1y = pts[i].y   + (pts[i + 1].y - (i > 0 ? pts[i - 1].y : pts[i].y)) / 6;
    const cp2x = pts[i + 1].x - (i + 2 < pts.length ? pts[i + 2].x - pts[i].x : pts[i + 1].x - pts[i].x) / 6;
    const cp2y = pts[i + 1].y - (i + 2 < pts.length ? pts[i + 2].y - pts[i].y : pts[i + 1].y - pts[i].y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
}

const AnimatedNumber: React.FC<{ target: string; inView: boolean; delay?: number; isNegative: boolean }> = ({
  target, inView, delay = 0, isNegative,
}) => {
  const [display, setDisplay] = useState('0');
  const numericTarget = parseInt(target.replace(/\D/g, ''), 10);
  const suffix        = target.replace(/[\d\s]/g, '');

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const duration = 1400;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const value    = Math.round(eased * numericTarget);
      const formatted = value.toLocaleString('ru-RU').replace(',', ' ');
      setDisplay(progress >= 1 ? formatted + suffix : formatted);
      if (progress < 1) requestAnimationFrame(step);
    };
    const timer = setTimeout(() => requestAnimationFrame(step), delay);
    return () => clearTimeout(timer);
  }, [inView, numericTarget, suffix, delay]);

  return (
    <span className={`tabular-nums ${isNegative ? 'text-white' : 'text-black'}`}>
      {display}
    </span>
  );
};

// WaveChart — без горизонтальных линий в SVG
const WaveChart: React.FC<{ isNegative: boolean; inView: boolean }> = ({ isNegative, inView }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim]           = useState({ width: 800, height: 220 });
  const [animProgress, setAnim] = useState(0);
  const rafRef                  = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 0) setDim({ width: r.width, height: r.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const anim = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2200, 1);
      setAnim(p);
      if (p < 1) rafRef.current = requestAnimationFrame(anim);
    };
    rafRef.current = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView]);

  const COUNT  = 80;
  const { width, height } = dim;
  const padY   = 10;
  const chartH = height - padY * 2;

  const mainData = generateWaveData(COUNT, 1.2, 1, true);
  const secData  = generateWaveData(COUNT, 2.8, 0.7).map(v => v * 0.55 + 0.02);

  const toPoints = (data: number[]) =>
    data.map((v, i) => ({ x: (i / (COUNT - 1)) * width, y: padY + (1 - v) * chartH }));

  const mainPts = toPoints(mainData);
  const secPts  = toPoints(secData);
  const mainLine = smoothPath(mainPts);
  const secLine  = smoothPath(secPts);
  const areaPath = (pts: { x: number; y: number }[], line: string) =>
    `${line} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  const uid = `wave-${isNegative ? 'd' : 'l'}`;

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${uid}-mg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={isNegative ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <linearGradient id={`${uid}-sg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={isNegative ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-10%" y="-80%" width="120%" height="260%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id={`${uid}-clip`}>
            <rect x="0" y="0" width={width * animProgress} height={height} />
          </clipPath>
        </defs>

        {/* Нет горизонтальных линий сетки */}

        <g clipPath={`url(#${uid}-clip)`} style={{ opacity: 0.7 }}>
          <path d={areaPath(secPts, secLine)} fill={`url(#${uid}-sg)`} />
          <path d={secLine} fill="none" stroke={isNegative ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)'} strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <g clipPath={`url(#${uid}-clip)`}>
          <path d={areaPath(mainPts, mainLine)} fill={`url(#${uid}-mg)`} />
          <path d={mainLine} fill="none" stroke={isNegative ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'} strokeWidth="1.8" strokeLinecap="round" filter={`url(#${uid}-glow)`} />
        </g>
      </svg>
    </div>
  );
};

export const Stats: React.FC<StatsProps> = ({ isNegative }) => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const bg          = isNegative ? 'bg-[#0a0a0a]'   : 'bg-[#E8E7E3]';
  const textMuted   = isNegative ? 'text-white/50'   : 'text-black/40';
  const textSub     = isNegative ? 'text-white/65'   : 'text-black/55';
  const borderColor = isNegative ? 'border-white/10' : 'border-black/10';

  return (
    <section ref={sectionRef} className={`relative overflow-visible py-12 sm:py-16 md:py-20 lg:py-28 ${bg}`}>
      <div className="lg:container lg:mx-auto lg:px-4 xl:px-8">
        <div className="lg:max-w-7xl lg:mx-auto px-4 sm:px-6 md:px-8">

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="mb-12 sm:mb-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <h2
                className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.0] ${isNegative ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'customfont, sans-serif' }}
              >
                Наши статьи
              </h2>
              <p className={`text-base sm:text-lg leading-relaxed max-w-sm md:text-right ${textSub}`}>
                IT-материалы для студентов, специалистов и всех, кто хочет разобраться в теме
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}
            className={`py-8 mb-12 sm:mb-16 border-y ${borderColor}`}
          >
            <p className={`text-5xl sm:text-6xl font-bold mb-2 tabular-nums ${isNegative ? 'text-white' : 'text-black'}`}>
              <AnimatedNumber target="10000+" inView={inView} delay={200} isNegative={isNegative} />
            </p>
            <p className={`text-sm sm:text-base ${textMuted}`}>просмотров в среднем на статью</p>
          </motion.div>

          {/* Волновой график без горизонтальных линий */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }}
            className="relative"
          >
            <div className="h-44 sm:h-56 md:h-64 w-full relative">
              {inView && <WaveChart isNegative={isNegative} inView={inView} />}
              <div className="absolute inset-y-0 left-0 w-20 sm:w-28 pointer-events-none"
                style={{ background: `linear-gradient(to right, ${isNegative ? '#0a0a0a' : '#E8E7E3'}, transparent)` }} />
              <div className="absolute inset-y-0 right-0 w-20 sm:w-28 pointer-events-none"
                style={{ background: `linear-gradient(to left, ${isNegative ? '#0a0a0a' : '#E8E7E3'}, transparent)` }} />
            </div>
            <p className={`text-center mt-4 text-xs sm:text-sm italic ${textMuted}`}>
              Охват растёт с каждой новой публикацией
            </p>
          </motion.div>

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');
      `}</style>

      <Navigation />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100svh',
          overflow: 'hidden',
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
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-75%, -50%)',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 1.5rem',
          maxWidth: '900px',
          width: '100%',
        }}>
          <h1 style={{
            fontSize: 'clamp(3.5rem, 14vw, 11rem)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            lineHeight: 1,
            margin: 0,
            fontFamily: 'customfont, sans-serif',
            color: textMain,
          }}>
            Opensophy
          </h1>
        </div>
      </section>

      {/* ── О проекте ─────────────────────────────────────────────────── */}
      <section
        style={{
          marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
          padding: 'clamp(4rem, 10vw, 8rem) clamp(2rem, 6vw, 5rem)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: isNegative ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)',
            marginBottom: '2rem',
            marginTop: 0,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.14em',
          }}
        >
          О ПРОЕКТЕ
        </p>

        <p
          style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin: 0,
            maxWidth: '100%',
            fontFamily: 'Inter, sans-serif',
          }}
        >
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

      {/* ── Статьи (Stats) ────────────────────────────────────────────── */}
      <div style={{ marginLeft: navOffset > 0 ? `${navOffset}px` : 0 }}>
        <Stats isNegative={isNegative} />
      </div>
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