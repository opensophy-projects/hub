import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useMotionValue, useAnimationFrame, useTransform, motion } from 'framer-motion';
import { SingularityShaders } from './SingularityShaders';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';
import RotatingText from '@/features/ui-components/rotating-text/rotating-text';
import { TechStackSection } from './TechStackSection';

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

// ─── GlowingEffect (встроенный, для карточек без tailwind) ───────────────────

const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);

interface GlowingEffectInlineProps {
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

const GlowingEffectInline = memo(({
  blur = 0,
  inactiveZone = 0.7,
  proximity = 0,
  spread = 20,
  glow = false,
  movementDuration = 2,
  borderWidth = 1,
  disabled = true,
  isNegative = false,
}: GlowingEffectInlineProps) => {
  const containerRef      = useRef<HTMLDivElement>(null);
  const lastPosition      = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  const animateAngleTransition = useCallback((
    element: HTMLDivElement,
    startValue: number,
    endValue: number,
    duration: number,
  ) => {
    const startTime = performance.now();
    const animateValue = (currentTime: number) => {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value    = startValue + (endValue - startValue) * easeOutQuint(progress);
      element.style.setProperty('--start', String(value));
      if (progress < 1) requestAnimationFrame(animateValue);
    };
    requestAnimationFrame(animateValue);
  }, []);

  const handleMove = useCallback((e?: MouseEvent | { x: number; y: number }) => {
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
        mouseX > left - proximity && mouseX < left + width  + proximity &&
        mouseY > top  - proximity && mouseY < top  + height + proximity;
      element.style.setProperty('--active', isActive ? '1' : '0');
      if (!isActive) return;
      const currentAngle = Number.parseFloat(element.style.getPropertyValue('--start')) || 0;
      let targetAngle    = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
      const angleDiff    = ((targetAngle - currentAngle + 180) % 360) - 180;
      animateAngleTransition(element, currentAngle, currentAngle + angleDiff, movementDuration * 1000);
    });
  }, [inactiveZone, proximity, movementDuration, animateAngleTransition]);

  useEffect(() => {
    if (disabled) return;
    const handleScroll      = () => handleMove();
    const handlePointerMove = (e: PointerEvent) => handleMove(e);
    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      globalThis.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handleMove, disabled]);

  const gradient = isNegative
    ? `repeating-conic-gradient(from 236.84deg at 50% 50%, #ffffff, #ffffff calc(25% / var(--repeating-conic-gradient-times)))`
    : `repeating-conic-gradient(from 236.84deg at 50% 50%, #000000, #000000 calc(25% / var(--repeating-conic-gradient-times)))`;

  if (disabled) return null;

  return (
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
        pointerEvents:                      'none',
      } as React.CSSProperties}
    >
      <div style={{
        position:            'absolute',
        inset:               `calc(-1 * var(--glowingeffect-border-width))`,
        borderRadius:        'inherit',
        border:              `var(--glowingeffect-border-width) solid transparent`,
        background:          gradient,
        backgroundAttachment:'fixed',
        opacity:             'var(--active)' as any,
        transition:          'opacity 300ms',
        WebkitMaskImage:     'linear-gradient(#0000,#0000), conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #00000000 0deg, #fff, #00000000 calc(var(--spread) * 2deg))',
        maskImage:           'linear-gradient(#0000,#0000), conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #00000000 0deg, #fff, #00000000 calc(var(--spread) * 2deg))',
        WebkitMaskClip:      'padding-box, border-box',
        maskClip:            'padding-box, border-box',
        WebkitMaskComposite: 'intersect',
        maskComposite:       'intersect',
      } as React.CSSProperties} />
    </div>
  );
});
GlowingEffectInline.displayName = 'GlowingEffectInline';

// ─── SVG-иконки ───────────────────────────────────────────────────────────────

const IconScan: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" /><path d="M12 9v-2" /><path d="M12 17v-2" />
    <path d="M9 12H7" /><path d="M17 12h-2" />
  </svg>
);

const IconGrid: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconGradCap: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconHub: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconBriefcase: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

// ─── FeatureCard (SecuritySection) ───────────────────────────────────────────

interface FeatureCardProps {
  title: string;
  text: string;
  isNegative: boolean;
  fullWidth?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, text, isNegative, fullWidth }) => {
  const border = isNegative ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const bg     = isNegative ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const titleC = isNegative ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.88)';
  const textC  = isNegative ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';

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
      <GlowingEffectInline
        spread={40} glow disabled={false}
        proximity={60} inactiveZone={0.01}
        borderWidth={1.5} isNegative={isNegative}
      />
      <div style={{
        fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)', fontWeight: 700,
        color: titleC, lineHeight: 1.25, position: 'relative', zIndex: 1,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 'clamp(0.95rem, 1.4vw, 1.1rem)', color: textC,
        lineHeight: 1.65, position: 'relative', zIndex: 1,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {text}
      </div>
    </div>
  );
};

// ─── SmoothDeclineChart ───────────────────────────────────────────────────────

interface SmoothDeclineChartProps {
  isNegative: boolean;
  inView: boolean;
}

const SmoothDeclineChart: React.FC<SmoothDeclineChartProps> = ({ isNegative, inView }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [dim, setDim]     = useState({ w: 800, h: 260 });
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip]   = useState<{ x: number; y: number; value: number } | null>(null);
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
      const p     = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView]);

  const { w, h } = dim;
  const padTop    = 20;
  const padBottom = 16;
  const chartH    = h - padTop - padBottom;
  const n = 80;

  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const sigmoid = 1 / (1 + Math.exp((t - 0.52) * 7));
    const forced  = sigmoid * Math.pow(1 - t, 0.6);
    const noise   = Math.sin(t * 12) * 0.012 * (1 - t) + Math.sin(t * 7.3) * 0.008 * (1 - t);
    const yN      = Math.max(0, Math.min(1, forced + noise));
    return { x: t * w, y: padTop + (1 - yN) * chartH, value: Math.round(yN * 200) };
  });

  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i].x + (points[i + 1].x - (i > 0 ? points[i - 1].x : points[i].x)) / 5;
      const cp1y = points[i].y + (points[i + 1].y - (i > 0 ? points[i - 1].y : points[i].y)) / 5;
      const cp2x = points[i + 1].x - (i + 2 < points.length ? points[i + 2].x - points[i].x : points[i + 1].x - points[i].x) / 5;
      const cp2y = points[i + 1].y - (i + 2 < points.length ? points[i + 2].y - points[i].y : points[i + 1].y - points[i].y) / 5;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${points[i + 1].x.toFixed(1)} ${points[i + 1].y.toFixed(1)}`;
    }
    return d;
  };

  const baseY    = padTop + chartH;
  const linePath = buildPath(pts);
  const areaPath = `${linePath} L ${w.toFixed(1)} ${baseY} L 0 ${baseY} Z`;
  const clipW    = Math.max(0, progress * w + 8);
  const clipId   = `sd-clip-${Math.round(w)}`;
  const gradId   = `sd-grad-${Math.round(w)}`;
  const fadeId   = `sd-fade-${Math.round(w)}`;

  const lineColor = isNegative ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)';
  const areaTop   = isNegative ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.07)';
  const bgColor   = isNegative ? '#0a0a0a' : '#E8E7E3';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect   = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * w;
    const idx    = Math.max(0, Math.min(n - 1, Math.round((mouseX / w) * (n - 1))));
    const pt     = pts[idx];
    const px     = (pt.x / w) * rect.width;
    const py     = (pt.y / h) * rect.height;
    setTooltip({ x: px, y: py, value: pt.value });
  };

  const tooltipBg     = isNegative ? 'rgba(30,30,30,0.95)'   : 'rgba(255,255,255,0.95)';
  const tooltipBorder = isNegative ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const tooltipText   = isNegative ? '#ffffff' : '#000000';
  const tooltipMuted  = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const dotColor      = isNegative ? '#ffffff' : '#000000';

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} width="100%" height="100%"
        viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <clipPath id={clipId}><rect x={0} y={0} width={clipW} height={h} /></clipPath>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={areaTop} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor={bgColor} stopOpacity="1" />
            <stop offset="18%" stopColor={bgColor} stopOpacity="0.7" />
            <stop offset="35%" stopColor={bgColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth={1.8} strokeLinecap="round" clipPath={`url(#${clipId})`} />
        <rect x={0} y={0} width={w} height={h} fill={`url(#${fadeId})`} style={{ pointerEvents: 'none' }} />
        {tooltip && (
          <circle
            cx={(tooltip.x / (svgRef.current?.getBoundingClientRect().width ?? 1)) * w}
            cy={(tooltip.y / (svgRef.current?.getBoundingClientRect().height ?? 1)) * h}
            r={4} fill={dotColor} style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x, top: tooltip.y,
          transform: 'translate(-50%, -110%)',
          background: tooltipBg, border: `1px solid ${tooltipBorder}`,
          borderRadius: 10, padding: '8px 14px', pointerEvents: 'none',
          whiteSpace: 'nowrap', zIndex: 10, backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: tooltipText, lineHeight: 1.2 }}>
            {tooltip.value}
          </div>
          <div style={{ fontSize: '0.72rem', color: tooltipMuted, marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
            уязвимостей и ошибок
          </div>
        </div>
      )}
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

  const bg       = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain = isNegative ? '#ffffff' : '#000000';
  const textMut  = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';

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
        .sec-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: clamp(2rem, 4vw, 4rem);
          padding: clamp(3rem, 6vw, 5rem) clamp(2rem, 6vw, 5rem) 0;
          box-sizing: border-box;
        }
        .sec-chart-col { min-width: 0; height: clamp(200px, 28vw, 340px); }
        .sec-text-col  { min-width: 0; }
        @media (max-width: 800px) {
          .sec-top { grid-template-columns: 1fr; }
          .sec-chart-col { order: 2; height: clamp(180px, 45vw, 280px); }
          .sec-text-col  { order: 1; }
        }
        .sec-cards-area {
          padding: clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem);
          box-sizing: border-box;
        }
        .sec-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 560px) { .sec-cards { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="sec-top">
        <div className="sec-chart-col">
          <SmoothDeclineChart isNegative={isNegative} inView={inView} />
        </div>
        <div className="sec-text-col">
          <p style={{ fontSize: '1rem', fontWeight: 600, color: textMut, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 2rem', fontFamily: 'Inter, sans-serif' }}>
            БЕЗОПАСНОСТЬ
          </p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            Безопасность прежде всего
          </h2>
          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: 0, color: textMut, fontFamily: 'Inter, sans-serif' }}>
            Безопасность и качество кода — главный приоритет, особенно на фоне интеграции ИИ в разработку
          </p>
        </div>
      </div>

      <div className="sec-cards-area">
        <div className="sec-cards">
          <div style={{ gridColumn: '1 / -1' }}>
            <FeatureCard
              isNegative={isNegative}
              title="Интеграция SAST, DAST, SCA"
              text="Интегрируем автоматический анализ кода на уязвимости на каждом этапе разработки. SAST проверяет исходный код, DAST тестирует работающее приложение, SCA отслеживает зависимости. Всё это работает автоматически в вашем CI/CD."
              fullWidth
            />
          </div>
          <FeatureCard
            isNegative={isNegative}
            title="Знания каждому!"
            text="Пишем понятные статьи и гайды по DevSecOps. Рассказываем как настроить безопасность с нуля и сделать её частью культуры команды."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Open Source"
            text="Рассказываем про open source инструменты. Делимся опытом бесплатных решений, которые сделают ваш проект безопаснее и многое другое."
          />
        </div>
      </div>
    </section>
  );
};

// ─── EcoCard ──────────────────────────────────────────────────────────────────

interface EcoCardProps {
  icon:        React.ReactNode;
  iconBg:      string;
  title:       string;
  description: string;
  link?:       string;
  linkLabel?:  string;
  isNegative:  boolean;
  extraLinks?: Array<{ href: string; label: string }>;
}

const EcoCard: React.FC<EcoCardProps> = ({
  icon, iconBg, title, description, link, linkLabel, isNegative, extraLinks,
}) => {
  const outerBorder  = isNegative ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const innerBorder  = isNegative ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const innerBg      = isNegative ? '#0a0a0a'                : '#E8E7E3';
  const innerShadow  = isNegative ? '0px 0px 27px 0px rgba(45,45,45,0.3)' : 'none';
  const titleC       = isNegative ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.88)';
  const textC        = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const linkClr      = isNegative ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.38)';
  const linkHov      = isNegative ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
  const iconBorderC  = isNegative ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.2)';

  return (
    <div style={{
      position:     'relative',
      borderRadius: '1.25rem',
      border:       `0.75px solid ${outerBorder}`,
      padding:      '0.5rem',
    }}>
      <GlowingEffectInline
        spread={40} glow disabled={false}
        proximity={64} inactiveZone={0.01}
        borderWidth={3} isNegative={isNegative}
      />

      <div style={{
        position:      'relative',
        borderRadius:  '0.9rem',
        border:        `0.75px solid ${innerBorder}`,
        background:    innerBg,
        boxShadow:     innerShadow,
        overflow:      'hidden',
        padding:       '1.5rem',
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.6rem',
        minHeight:     '180px',
      }}>
        <div style={{
          width:          42,
          height:         42,
          borderRadius:   10,
          background:     iconBg,
          border:         `0.75px solid ${iconBorderC}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          marginBottom:   '0.25rem',
        }}>
          {icon}
        </div>

        <div style={{
          fontSize:   'clamp(1rem, 1.5vw, 1.15rem)',
          fontWeight: 700,
          color:      titleC,
          lineHeight: 1.25,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {title}
        </div>

        <div style={{
          fontSize:   'clamp(0.9rem, 1.3vw, 1rem)',
          color:      textC,
          lineHeight: 1.65,
          fontFamily: 'Inter, system-ui, sans-serif',
          flex:       1,
        }}>
          {description}
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            4,
              fontSize:       '0.75rem',
              color:          linkClr,
              textDecoration: 'none',
              marginTop:      '0.25rem',
              fontFamily:     'ui-monospace, monospace',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = linkHov; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = linkClr; }}
          >
            {linkLabel} ↗
          </a>
        )}

        {extraLinks && extraLinks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.25rem' }}>
            {extraLinks.map(el => (
              <a
                key={el.href}
                href={el.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            4,
                  fontSize:       '0.75rem',
                  color:          linkClr,
                  textDecoration: 'none',
                  fontFamily:     'ui-monospace, monospace',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = linkHov; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = linkClr; }}
              >
                {el.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── EcosystemSection ─────────────────────────────────────────────────────────

interface EcosystemSectionProps {
  isNegative: boolean;
  navOffset?: number;
}

const ROTATING_WORDS = [
  'студентов',
  'разработчиков',
  'инженеров',
  'лидеров',
];

const EcosystemSection: React.FC<EcosystemSectionProps> = ({ isNegative, navOffset = 0 }) => {
  const bg       = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMut  = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const textMain = isNegative ? '#ffffff' : '#000000';
  const iconClr  = isNegative ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)';
  const iconBg   = isNegative ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  const shinyBase = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  return (
    <section style={{
      background: bg,
      marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
      width:      '100%',
      boxSizing:  'border-box',
      overflow:   'hidden',
    }}>
      <style>{`
        .eco-inner {
          padding: clamp(4rem, 8vw, 7rem) clamp(2rem, 6vw, 5rem);
          box-sizing: border-box;
        }
        .eco-header {
          margin-bottom: clamp(3rem, 5vw, 4.5rem);
        }
        .eco-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .eco-cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .eco-cards { grid-template-columns: 1fr; }
        }
        .eco-rotating-text {
          overflow: visible !important;
        }
        .eco-rotating-text span {
          overflow: visible !important;
        }
        .eco-heading-inline {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          gap: 0.35em;
          flex-wrap: nowrap;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .eco-heading-inline {
            flex-direction: column;
            align-items: flex-start;
            white-space: normal;
            gap: 0.1em;
          }
        }
      `}</style>

      <div className="eco-inner">
        <div className="eco-header">
          <p style={{
            fontSize:      '1rem',
            fontWeight:    600,
            color:         textMut,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            margin:        '0 0 2rem',
            fontFamily:    'Inter, sans-serif',
          }}>
            Экосистема
          </p>

          <div style={{
            fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin:     '0 0 1.5rem',
            fontFamily: 'Inter, sans-serif',
          }}>
            <div className="eco-heading-inline">
              <span style={{ color: textMut }}>
                <ShinyText
                  text="Создаём для"
                  speed={5}
                  color={shinyBase}
                  shineColor={shinyGlow}
                  spread={120}
                />
              </span>
              <span style={{
                display:    'inline-flex',
                minWidth:   '10ch',
                position:   'relative',
                color:      textMain,
              }}>
                <RotatingText
                  texts={ROTATING_WORDS}
                  rotationInterval={2400}
                  splitBy="characters"
                  staggerDuration={0.03}
                  staggerFrom="first"
                  loop
                  auto
                  animatePresenceMode="wait"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-120%', opacity: 0 }}
                  mainClassName="eco-rotating-text justify-center whitespace-nowrap overflow-hidden"
                  elementLevelClassName=""
                />
              </span>
            </div>
          </div>

          <p style={{
            fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin:     0,
            maxWidth:   '100%',
            fontFamily: 'Inter, sans-serif',
            color:      textMut,
          }}>
            <ShinyText
              text="Все инструменты и материалы распространяются под открытыми лицензиями — бесплатно, навсегда."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        {/* Карточки экосистемы */}
        <div className="eco-cards">
          <EcoCard
            isNegative={isNegative}
            icon={<IconGrid color={iconClr} />}
            iconBg={iconBg}
            title="UI библиотека"
            description="Готовые компоненты с живым превью и настройками. Анимации, интерактивные блоки, кастомные элементы."
          />
          <EcoCard
            isNegative={isNegative}
            icon={<IconHub color={iconClr} />}
            iconBg={iconBg}
            title="Hub — платформа"
            description="Open-source платформа для документации и контента."
            link="https://github.com/opensophy-projects/hub"
            linkLabel="opensophy-projects/hub"
          />
          <EcoCard
            isNegative={isNegative}
            icon={<IconGradCap color={iconClr} />}
            iconBg={iconBg}
            title="Образовательный контент"
            description="Практические туториалы по DevSecOps, разработке и open-source. Только то, что можно применить сразу."
          />
          <EcoCard
            isNegative={isNegative}
            icon={<IconBriefcase color={iconClr} />}
            iconBg={iconBg}
            title="Заказные проекты"
            description="Документация, технический контент, аудит безопасности под ваши задачи."
            extraLinks={[
              { href: 'mailto:opensophy@gmail.com', label: 'Связаться по email' },
              { href: 'https://habr.com/ru/users/opensophy/', label: 'Обсудить на Habr' },
            ]}
          />
        </div>
      </div>
    </section>
  );
};

// ─── LandingContent ───────────────────────────────────────────────────────────

const LandingContent: React.FC = () => {
  const [isNegative, setIsNegative] = useState(() => {
    if (globalThis.window === undefined) return true;
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
    globalThis.addEventListener('storage', onStorage);
    globalThis.addEventListener('hub:theme-change', onCustom);
    return () => {
      globalThis.removeEventListener('storage', onStorage);
      globalThis.removeEventListener('hub:theme-change', onCustom);
    };
  }, []);

  useEffect(() => {
    const readOffset = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-left').trim();
      setNavOffset(val ? Number.parseInt(val, 10) : 0);
    };
    readOffset();
    const observer = new MutationObserver(readOffset);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff' : '#000000';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        /* ── Hero title — адаптивный размер без обрезки ── */
        .hero-title-wrap {
          position: absolute;
          /* Центрируем горизонтально относительно видимой области (за вычетом nav) */
          left: 0;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 clamp(1rem, 4vw, 3rem);
          pointer-events: none;
          /* Смещение вправо на ширину навигационной панели задаётся inline-стилем */
        }

        .hero-title {
          font-family: 'customfont', sans-serif;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.06em;
          white-space: nowrap;
          /*
            fluid-размер: минимум 2rem (320px экран),
            максимум 10rem (≥1400px экран).
            vw-коэффициент подобран так, чтобы текст никогда не вылазил за экран.
          */
          font-size: clamp(2rem, 10vw, 10rem);
          color: var(--hero-text-color, currentColor);
        }

        /* На очень маленьких экранах (< 360px) ещё немного уменьшаем */
        @media (max-width: 360px) {
          .hero-title {
            font-size: clamp(1.6rem, 11vw, 3rem);
            letter-spacing: 0.03em;
          }
        }

        /* Планшеты */
        @media (min-width: 361px) and (max-width: 768px) {
          .hero-title {
            font-size: clamp(2.5rem, 10vw, 5.5rem);
            letter-spacing: 0.05em;
          }
        }

        /* Десктоп с навигационной панелью (учитываем смещение) */
        @media (min-width: 1001px) {
          .hero-title {
            font-size: clamp(4rem, 8vw, 10rem);
          }
        }
      `}</style>

      <Navigation />

      {/* Hero */}
      <section style={{
        position:  'relative',
        minHeight: '100svh',
        overflow:  'hidden',
        marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <SingularityShaders
            speed={0.8} intensity={1.1} size={1.05}
            waveStrength={1} colorShift={1} isNegative={isNegative}
            className="h-full w-full"
          />
        </div>

        {/* Нижний градиент — плавный переход к фону */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          pointerEvents: 'none',
          background: `linear-gradient(to bottom, transparent, ${bg})`,
        }} />

        {/* Hero title — центрирован, адаптивный */}
        <div
          className="hero-title-wrap"
          style={{
            /* Дополнительное смещение справа чтобы nav не перекрывал
               (только на десктопе, где navOffset > 0) */
            paddingLeft: navOffset > 0 ? `calc(${navOffset}px + clamp(1rem, 4vw, 3rem))` : undefined,
          }}
        >
          <h1
            className="hero-title"
            style={{ color: textMain }}
          >
            Opensophy
          </h1>
        </div>
      </section>

      {/* О проекте */}
      <section style={{
        marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
        padding:    'clamp(4rem, 10vw, 8rem) clamp(2rem, 6vw, 5rem)',
        width:      '100%',
        boxSizing:  'border-box',
      }}>
        <p style={{
          fontSize:      '1rem',
          fontWeight:    600,
          color:         isNegative ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
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

      {/* Безопасность */}
      <SecuritySection isNegative={isNegative} navOffset={navOffset} />

      {/* Экосистема */}
      <EcosystemSection isNegative={isNegative} navOffset={navOffset} />
      {/* Стек */}
     <TechStackSection isNegative={isNegative} navOffset={navOffset} />
    </div>
  );
};

// ─── GeneralPage ──────────────────────────────────────────────────────────────

const GeneralPage: React.FC = () => (
  <ThemeProvider>
    <LandingContent />
  </ThemeProvider>
);

export { ShinyText, GlowingEffectInline, FeatureCard };
export default GeneralPage;
