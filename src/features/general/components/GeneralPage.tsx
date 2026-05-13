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
      const targetAngle  = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
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
        opacity:             'var(--active)',
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

// ─── Card primitives ───────────────────────────────────────────────────────────

type LandingCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  isNegative: boolean;
};

type LandingCardHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

type LandingCardTitleProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
  as?: React.ElementType;
};

type LandingCardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement> & {
  children: React.ReactNode;
};

type LandingCardContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

const LandingCard = React.forwardRef<HTMLDivElement, LandingCardProps>(({
  children,
  isNegative,
  style,
  ...props
}, ref) => {
  const border = isNegative ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const bg     = isNegative ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  return (
    <div
      ref={ref}
      style={{
        position:     'relative',
        border:       `1px solid ${border}`,
        background:   bg,
        borderRadius: 16,
        overflow:     'hidden',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});
LandingCard.displayName = 'LandingCard';

const LandingCardHeader: React.FC<LandingCardHeaderProps> = ({ children, style, ...props }) => (
  <div
    style={{
      padding:  '1.5rem 1.5rem 0',
      position: 'relative',
      zIndex:   1,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

const LandingCardTitle: React.FC<LandingCardTitleProps> = ({
  children,
  as: Component = 'h3',
  style,
  ...props
}) => React.createElement(
  Component,
  {
    style: {
      fontSize:   'clamp(1.1rem, 1.8vw, 1.4rem)',
      fontWeight: 700,
      lineHeight: 1.25,
      margin:     0,
      fontFamily: 'Inter, system-ui, sans-serif',
      ...style,
    },
    ...props,
  },
  children,
);

const LandingCardDescription: React.FC<LandingCardDescriptionProps> = ({ children, style, ...props }) => (
  <p
    style={{
      margin:     '0.75rem 0 0',
      fontSize:   'clamp(0.95rem, 1.4vw, 1.1rem)',
      lineHeight: 1.65,
      textWrap:   'balance',
      ...style,
    }}
    {...props}
  >
    {children}
  </p>
);

const LandingCardContent: React.FC<LandingCardContentProps> = ({ children, style, ...props }) => (
  <div
    style={{
      padding:    '1rem 1.5rem 1.5rem',
      position:   'relative',
      zIndex:     1,
      fontFamily: 'Inter, system-ui, sans-serif',
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ─── FeatureCard (SecuritySection) ───────────────────────────────────────────

interface FeatureCardProps {
  title: string;
  text: string;
  isNegative: boolean;
  fullWidth?: boolean;
  badge?: string;
  visual?: 'securityAnalysis';
}

const SecurityAnalysisVisual: React.FC = () => (
  <div className="security-analysis-visual" aria-hidden="true">
    <div className="security-analysis-grid" />
    <svg className="security-analysis-chart" viewBox="0 0 560 220" preserveAspectRatio="none">
      <defs>
        <linearGradient id="securityAnalysisLine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--security-line-transparent)" />
          <stop offset="16%" stopColor="var(--security-line-soft)" />
          <stop offset="38%" stopColor="var(--security-line-mid)" />
          <stop offset="62%" stopColor="var(--security-line-strong)" />
          <stop offset="84%" stopColor="var(--security-line-soft)" />
          <stop offset="100%" stopColor="var(--security-line-transparent)" />
        </linearGradient>
        <linearGradient id="securityAnalysisFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--security-fill-top)" />
          <stop offset="60%" stopColor="var(--security-fill-mid)" />
          <stop offset="100%" stopColor="var(--security-fill-bottom)" />
        </linearGradient>
      </defs>
      <path
        className="security-analysis-area"
        d="M-18 122 C42 88 74 52 122 76 C164 98 190 144 236 148 C274 152 288 148 304 138 C332 120 368 96 416 78 C474 56 526 30 578 10 L578 220 L-18 220 Z"
        fill="url(#securityAnalysisFill)"
      />
      <path
        className="security-analysis-wave"
        d="M-18 122 C42 88 74 52 122 76 C164 98 190 144 236 148 C274 152 288 148 304 138 C332 120 368 96 416 78 C474 56 526 30 578 10"
        fill="none"
        stroke="url(#securityAnalysisLine)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>

    <div className="security-analysis-marker-line" />
    <div className="security-analysis-marker" />
    <div className="security-analysis-tooltip">
      <span className="security-analysis-tooltip-dot" />
      обнаружено <strong>76</strong> проблем
    </div>
    <svg className="security-analysis-cursor" viewBox="0 0 28 32">
      <path d="M5 4L23 18.5L14.2 20.2L10 28L5 4Z" fill="var(--security-cursor-fill)" stroke="#2f6bff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
    <div className="security-analysis-vignette" />
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ title, text, isNegative, fullWidth, badge, visual }) => {
  const titleC = isNegative ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.88)';
  const textC  = isNegative ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';
  const badgeC = isNegative ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)';
  const badgeBg = isNegative ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const hasVisual = visual === 'securityAnalysis';

  return (
    <LandingCard
      isNegative={isNegative}
      className={hasVisual ? 'feature-card feature-card--security-analysis' : 'feature-card'}
      style={{
        display:       'flex',
        flexDirection: 'column',
        minHeight:     hasVisual ? 356 : 176,
        gridColumn:    fullWidth ? '1 / -1' : undefined,
        ...(hasVisual ? {
          '--security-card-surface': isNegative ? '#0f0f0f' : '#e3e2de',
          '--security-line-transparent': isNegative ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)',
          '--security-line-soft': isNegative ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
          '--security-line-mid': isNegative ? 'rgba(255,255,255,0.46)' : 'rgba(0,0,0,0.12)',
          '--security-line-strong': isNegative ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.76)',
          '--security-fill-top': isNegative ? 'rgba(47,107,255,0.18)' : 'rgba(47,107,255,0.09)',
          '--security-fill-mid': isNegative ? 'rgba(47,107,255,0.07)' : 'rgba(47,107,255,0.04)',
          '--security-fill-bottom': 'rgba(47,107,255,0)',
          '--security-grid-line': isNegative ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.035)',
          '--security-tooltip-bg': isNegative ? 'rgba(12,13,16,0.58)' : 'rgba(72,76,82,0.78)',
          '--security-tooltip-text': isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.78)',
          '--security-tooltip-border': isNegative ? 'rgba(255,255,255,0.075)' : 'rgba(255,255,255,0.36)',
          '--security-marker-fill': isNegative ? 'rgba(242,247,255,0.72)' : 'rgba(226,232,241,0.84)',
          '--security-marker-border': isNegative ? 'rgba(255,255,255,0.78)' : 'rgba(47,107,255,0.18)',
          '--security-cursor-fill': isNegative ? 'rgba(8,12,22,0.92)' : 'rgba(242,246,255,0.9)',
        } : {}),
      } as React.CSSProperties}
    >
      {hasVisual && <SecurityAnalysisVisual />}
      <LandingCardHeader className={hasVisual ? 'security-analysis-copy' : undefined}>
        {badge && (
          <div style={{
            display:       'inline-flex',
            alignSelf:     'flex-start',
            fontSize:      '0.66rem',
            fontWeight:    700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         badgeC,
            background:    badgeBg,
            borderRadius:  999,
            padding:       '0.18rem 0.55rem',
            marginBottom:  '0.75rem',
            fontFamily:    'ui-monospace, monospace',
          }}>
            {badge}
          </div>
        )}
        <LandingCardTitle style={{ color: titleC }}>{title}</LandingCardTitle>
      </LandingCardHeader>
      <LandingCardContent style={{ flex: 1 }}>
        <LandingCardDescription style={{ color: textC }}>{text}</LandingCardDescription>
      </LandingCardContent>
    </LandingCard>
  );
};

// ─── SecuritySection ──────────────────────────────────────────────────────────

interface SecuritySectionProps {
  isNegative: boolean;
  navOffset?: number;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ isNegative, navOffset = 0 }) => {
  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff' : '#000000';
  const textMut   = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  return (
    <section
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
          display: block;
          padding: clamp(3rem, 6vw, 5rem) clamp(2rem, 6vw, 5rem) 0;
          box-sizing: border-box;
        }
        .sec-text-col  { min-width: 0; }
        @media (max-width: 800px) {
          .sec-top { display: block; }
        }
        .sec-cards-area {
          padding: clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem);
          box-sizing: border-box;
        }
        .sec-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 560px) { .sec-cards { grid-template-columns: 1fr !important; } }
        .feature-card--security-analysis {
          isolation: isolate;
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .feature-card--security-analysis::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 52% 23%, rgba(47, 107, 255, 0.08), transparent 26%);
          pointer-events: none;
          z-index: 0;
        }
        .security-analysis-copy {
          padding-top: clamp(11.8rem, 18vw, 13.25rem) !important;
        }
        .security-analysis-visual {
          position: absolute;
          inset: 0 0 auto;
          height: clamp(13.4rem, 20vw, 15.5rem);
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle at 51% 39%, var(--security-fill-top), transparent 20%),
            linear-gradient(180deg, color-mix(in srgb, var(--security-card-surface, #0f0f0f) 4%, transparent), transparent 58%, var(--security-card-surface, #0f0f0f) 100%);
        }
        .security-analysis-visual::before,
        .security-analysis-visual::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 34%;
          z-index: 6;
          pointer-events: none;
        }
        .security-analysis-visual::before {
          left: 0;
          background: linear-gradient(90deg, var(--security-card-surface, #0f0f0f), color-mix(in srgb, var(--security-card-surface, #0f0f0f) 0%, transparent));
        }
        .security-analysis-visual::after {
          right: 0;
          background: linear-gradient(270deg, var(--security-card-surface, #0f0f0f), color-mix(in srgb, var(--security-card-surface, #0f0f0f) 0%, transparent));
        }
        .security-analysis-vignette {
          position: absolute;
          inset: -20% -10% -14%;
          background:
            radial-gradient(circle at 50% 38%, transparent 0 27%, color-mix(in srgb, var(--security-card-surface, #0f0f0f) 24%, transparent) 50%, var(--security-card-surface, #0f0f0f) 100%),
            linear-gradient(180deg, color-mix(in srgb, var(--security-card-surface, #0f0f0f) 10%, transparent), transparent 34%, color-mix(in srgb, var(--security-card-surface, #0f0f0f) 66%, transparent) 78%, var(--security-card-surface, #0f0f0f) 100%);
          z-index: 7;
        }
        .security-analysis-grid {
          position: absolute;
          inset: -2rem -5rem -1rem;
          background-image:
            linear-gradient(var(--security-grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--security-grid-line) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: radial-gradient(ellipse at 50% 38%, black 0 44%, transparent 74%);
          opacity: 0.62;
        }
        .security-analysis-chart {
          position: absolute;
          left: 50%;
          top: clamp(1.45rem, 2.2vw, 1.9rem);
          width: max(42rem, 128%);
          max-width: none;
          height: clamp(8.8rem, 13vw, 10.6rem);
          overflow: visible;
          transform: translateX(-50%);
          filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.36));
          z-index: 2;
        }
        .security-analysis-wave {
          stroke-dasharray: 760;
          animation: security-wave 5.2s ease-in-out infinite;
        }
        .security-analysis-area {
          transform-origin: center bottom;
          animation: security-area 5.2s ease-in-out infinite;
        }
        .security-analysis-marker-line {
          position: absolute;
          left: 52%;
          top: 4.1rem;
          width: 1px;
          height: 4.25rem;
          background: repeating-linear-gradient(180deg, color-mix(in srgb, var(--security-line-strong) 34%, transparent) 0 0.55rem, transparent 0.55rem 1.1rem);
          opacity: 0.72;
          z-index: 3;
          animation: security-marker 3s ease-in-out infinite;
        }
        .security-analysis-marker {
          position: absolute;
          left: 52%;
          top: 8.1rem;
          width: 1.05rem;
          height: 1.05rem;
          border-radius: 50%;
          background: var(--security-marker-fill);
          border: 2px solid var(--security-marker-border);
          box-shadow: 0 0 0 0.72rem rgba(47,107,255,0.055), 0 0 2rem rgba(47,107,255,0.18);
          transform: translate(-50%, -50%);
          z-index: 4;
        }
        .security-analysis-marker::after {
          content: '';
          position: absolute;
          inset: -0.75rem;
          border: 1px solid rgba(47,107,255,0.42);
          border-radius: inherit;
          animation: security-ring 2.2s ease-out infinite;
        }
        .security-analysis-tooltip {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
          color: var(--security-tooltip-text);
          background: var(--security-tooltip-bg);
          border: 1px solid var(--security-tooltip-border);
          box-shadow: 0 10px 34px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border-radius: 999px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          z-index: 4;
        }
        .security-analysis-tooltip {
          left: 52%;
          top: 2.55rem;
          transform: translateX(-50%);
          padding: 0.44rem 0.78rem;
          font-size: 0.78rem;
          white-space: nowrap;
          animation: security-tooltip 3.4s ease-in-out infinite;
        }
        .security-analysis-tooltip strong { color: rgba(255,255,255,0.9); }
        .security-analysis-tooltip-dot {
          width: 0.48rem;
          height: 0.48rem;
          flex: 0 0 0.48rem;
          border-radius: 50%;
          background: #2f6bff;
          box-shadow: 0 0 18px rgba(47,107,255,0.85);
        }
        .security-analysis-cursor {
          position: absolute;
          left: calc(52% - 0.05rem);
          top: clamp(6.9rem, 9.6vw, 7.75rem);
          width: 1.7rem;
          height: 1.95rem;
          filter: drop-shadow(0 8px 14px rgba(47,107,255,0.36));
          z-index: 5;
          animation: security-cursor 3.4s ease-in-out infinite;
        }
        @keyframes security-wave {
          0% { stroke-dashoffset: 760; opacity: 0.28; }
          34%, 72% { stroke-dashoffset: 0; opacity: 0.9; }
          100% { stroke-dashoffset: -760; opacity: 0.34; }
        }
        @keyframes security-area {
          0%, 100% { opacity: 0.15; transform: scaleY(0.84); }
          45%, 75% { opacity: 0.88; transform: scaleY(1); }
        }
        @keyframes security-marker {
          0%, 100% { opacity: 0.18; }
          50% { opacity: 0.72; }
        }
        @keyframes security-ring {
          0% { opacity: 0.9; transform: scale(0.55); }
          100% { opacity: 0; transform: scale(1.45); }
        }
        @keyframes security-tooltip {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.78; }
          50% { transform: translateX(-50%) translateY(-0.35rem); opacity: 1; }
        }
        @keyframes security-cursor {
          0%, 100% { transform: translate3d(-0.35rem, -0.2rem, 0) rotate(-10deg); }
          50% { transform: translate3d(0.25rem, 0.25rem, 0) rotate(-3deg); }
        }
        @media (max-width: 700px) {
          .feature-card--security-analysis { min-height: 374px !important; }
          .security-analysis-copy { padding-top: 12.2rem !important; }
          .security-analysis-visual { height: 14.2rem; }
          .security-analysis-chart { width: 47rem; top: 1.6rem; height: 9.9rem; }
          .security-analysis-marker-line { left: 52%; top: 4.25rem; height: 4.2rem; }
          .security-analysis-marker { left: 52%; top: 8.25rem; }
          .security-analysis-tooltip { left: 52%; top: 2.8rem; font-size: 0.7rem; padding: 0.4rem 0.62rem; }
          .security-analysis-cursor { top: 7.55rem; left: calc(52% - 0.05rem); }
        }
      `}</style>

      <div className="sec-top">
        <div className="sec-text-col">
          <p style={{ fontSize: '1rem', fontWeight: 600, color: textMut, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 2rem', fontFamily: 'Inter, sans-serif' }}>
            ЧЕМ ЗАНИМАЕТСЯ
          </p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            Помогаем внедрять безопасность, знания и автоматизацию в IT-процессы
          </h2>
          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: 0, color: textMut, fontFamily: 'Inter, sans-serif' }}>
            <ShinyText
              text="От понятных материалов до практической интеграции защитных решений — подбираем подход под вашу команду и инфраструктуру."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>
      </div>

      <div className="sec-cards-area">
        <div className="sec-cards">
          <FeatureCard
            isNegative={isNegative}
            title="Знания каждому!"
            badge="открытые знания"
            text="Пишем понятные статьи и гайды по DevSecOps и не только. Рассказываем как настроить безопасность с нуля и сделать её частью культуры команды."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Интеграция анализа безопасности"
            badge="услуга"
            visual="securityAnalysis"
            text="Интегрируем автоматический анализ кода на уязвимости на каждом этапе разработки. Проверяем исходный код, тестируем работающее приложение и отслеживаем уязвимости в библиотеках — всё автоматически в CI/CD без участия команды."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Настройка безопасного доступа"
            badge="услуга"
            text="Настраиваем и интегрируем защищённый доступ к сервисам и серверам. Подбираем решение под задачу — mTLS, VPN, Zero Trust или другой подход. Доступ получают только те, кому вы это разрешили."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Проверка защищённости"
            badge="услуга"
            text="Этично проверяем сервис или сервер на наличие уязвимостей: открытые точки входа, слабые конфигурации и всё, что может стать проблемой раньше, чем вы об этом узнаете."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Автоматизация"
            badge="услуга"
            text="Автоматизируем рутину — от простого bash-скрипта до сложных решений под индивидуальные требования."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Подбор стека защиты"
            badge="услуга"
            text="Подбираем стек защиты с одной целью — максимальная эффективность при минимальных затратах ресурсов."
          />
        </div>

        <p className="sec-contact" style={{
          color:      textMut,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize:   'clamp(0.98rem, 1.25vw, 1.08rem)',
          lineHeight: 1.7,
          margin:     '1.5rem 0 0',
        }}>
          Чтобы заказать услугу или обсудить сотрудничество, напишите на{' '}
          <a href="mailto:opensophy@gmail.com" style={{ color: textMain, textDecoration: 'none' }}>
            opensophy@gmail.com
          </a>
          . Все карточки с пометкой «услуга» доступны для заказа; «Знания каждому!» — открытая образовательная инициатива.
        </p>
      </div>
    </section>
  );
};


// ─── EcoCard ──────────────────────────────────────────────────────────────────

interface EcoCardProps {
  title:       string;
  description: string;
  link?:       string;
  linkLabel?:  string;
  isNegative:  boolean;
  extraLinks?: Array<{ href: string; label: string }>;
}

const EcoCard: React.FC<EcoCardProps> = ({
  title, description, link, linkLabel, isNegative, extraLinks,
}) => {
  const outerBorder  = isNegative ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const innerBorder  = isNegative ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const innerBg      = isNegative ? '#0a0a0a'                : '#E8E7E3';
  const innerShadow  = isNegative ? '0px 0px 27px 0px rgba(45,45,45,0.3)' : 'none';
  const titleC       = isNegative ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.88)';
  const textC        = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const linkClr      = isNegative ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.38)';
  const linkHov      = isNegative ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';

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

const EcosystemSection: React.FC<EcosystemSectionProps> = ({ isNegative, navOffset = 0 }) => {
  const bg       = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMut  = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
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
        .eco-content {
          display: block;
        }
        .eco-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .eco-content { display: block; }
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
            ЧТО РАЗРАБАТЫВАЕТ
          </p>

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
              text="Развиваем open-source инструменты Opensophy для публикации знаний, сборки интерфейсов и безопасного доступа к инфраструктуре."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        <div className="eco-content">
          {/* Карточки экосистемы */}
          <div className="eco-cards">
            <EcoCard
              isNegative={isNegative}
              title="Opensophy Hub (O.Hub)"
              description="Гибридная open-source платформа для документации и публикации контента. Подходит для технических команд, авторов и всех, кто хочет красиво и структурировано делиться знаниями."
              link="https://github.com/opensophy-projects/hub"
              linkLabel="opensophy-projects/hub"
            />
            <EcoCard
              isNegative={isNegative}
              title="Opensophy mTLS (O.mTLS)"
              description="Инструмент для быстрого создания и управления mTLS-сертификатами. Для тех, кто хочет надёжно закрыть доступ к своим сервисам и серверам без лишней головной боли."
            />
            <EcoCard
              isNegative={isNegative}
              title="Opensophy UI (O.UI)"
              description="Библиотека готовых React-компонентов с живым превью и настройками. Анимации, интерактивные блоки, кастомные элементы и фирменные компоненты Opensophy — для разработчиков и дизайнеров, которые ценят время."
            />
          </div>
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
            text="Opensophy — инициатива открытой философии в IT. Качественные и доступные знания, услуги, инструменты и решения."
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
