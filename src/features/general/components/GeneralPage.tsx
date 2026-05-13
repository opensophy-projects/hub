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
  visual?: 'securityAnalysis' | 'knowledgeLayers' | 'securityCheck' | 'secureAccess';
}

const SecurityAnalysisVisual: React.FC = () => (
  <div className="security-analysis-visual" aria-hidden="true">
    <div className="security-analysis-grid" />
    <svg className="security-analysis-chart" viewBox="0 0 560 220" preserveAspectRatio="none">
      <defs>
        <linearGradient id="securityAnalysisLine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--visual-line-transparent)" />
          <stop offset="16%" stopColor="var(--visual-line-soft)" />
          <stop offset="38%" stopColor="var(--visual-line-mid)" />
          <stop offset="62%" stopColor="var(--visual-line-strong)" />
          <stop offset="84%" stopColor="var(--visual-line-soft)" />
          <stop offset="100%" stopColor="var(--visual-line-transparent)" />
        </linearGradient>
        <linearGradient id="securityAnalysisFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--visual-fill-top)" />
          <stop offset="60%" stopColor="var(--visual-fill-mid)" />
          <stop offset="100%" stopColor="var(--visual-fill-bottom)" />
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
    <div className="security-analysis-tooltip">
      <span className="security-analysis-tooltip-dot" />
      обнаружено <strong>76</strong> проблем
    </div>
    <div className="security-analysis-vignette" />
  </div>
);

const KnowledgeLayersVisual: React.FC = () => (
  <div className="knowledge-layers-visual" aria-hidden="true">
    <svg className="knowledge-open-book" viewBox="0 0 220 150">
      <path className="book-page book-page-left" d="M108 118C82 101 56 96 26 101V31C57 25 82 33 108 51Z" />
      <path className="book-page book-page-right" d="M112 118C138 101 164 96 194 101V31C163 25 138 33 112 51Z" />
      <path className="book-spine" d="M110 51V122" />
      <path className="book-line" d="M43 51C62 49 80 53 96 63" />
      <path className="book-line" d="M43 70C63 68 80 72 96 82" />
      <path className="book-line" d="M43 89C63 87 80 91 96 101" />
      <path className="book-line" d="M177 51C158 49 140 53 124 63" />
      <path className="book-line" d="M177 70C157 68 140 72 124 82" />
      <path className="book-line" d="M177 89C157 87 140 91 124 101" />
      <path className="book-shadow" d="M26 101C58 98 83 104 110 122C137 104 162 98 194 101" />
    </svg>
    <div className="knowledge-layers-vignette" />
  </div>
);

const SecurityCheckVisual: React.FC = () => (
  <div className="security-check-visual" aria-hidden="true">
    <div className="security-check-track">
      <div className="security-check-step security-check-step-ok">
        <span className="security-check-indicator">✓</span>
        <span>SCA анализ пройден</span>
      </div>
      <div className="security-check-connector security-check-connector-ok" />
      <div className="security-check-step security-check-step-ok">
        <span className="security-check-indicator">✓</span>
        <span>SAST анализ пройден</span>
      </div>
      <div className="security-check-connector security-check-connector-fail" />
      <div className="security-check-step security-check-step-fail">
        <span className="security-check-indicator">×</span>
        <span>DAST провалил проверку</span>
        <strong>XSS и RCE</strong>
      </div>
    </div>
    <div className="security-check-vignette" />
  </div>
);

const SecureAccessVisual: React.FC = () => (
  <div className="secure-access-visual" aria-hidden="true">
    <svg className="secure-access-network" viewBox="0 0 620 220" preserveAspectRatio="none">
      <path className="access-line access-line-main" d="M120 118 C210 118 258 118 310 118" />
      <path className="access-line access-line-laptop" d="M310 118 C382 76 430 68 510 68" />
      <path className="access-line access-line-phone" d="M310 118 C382 162 430 172 510 172" />
      <path className="access-pulse access-pulse-1" d="M120 118 C210 118 258 118 310 118 C382 76 430 68 510 68" />
      <path className="access-pulse access-pulse-2" d="M510 172 C430 172 382 162 310 118 C258 118 210 118 120 118" />
      <path className="access-pulse access-pulse-3" d="M510 68 C430 68 382 76 310 118 C258 118 210 118 120 118" />
    </svg>
    <div className="access-device access-device-desktop access-device-left"><span /></div>
    <div className="access-device access-device-laptop"><span /></div>
    <div className="access-device access-device-phone"><span /></div>
    <div className="secure-access-tooltip">
      <span className="secure-access-tooltip-dot" />
      подключено через <strong>mTLS</strong>
    </div>
    <div className="secure-access-vignette" />
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ title, text, isNegative, fullWidth, badge, visual }) => {
  const titleC = isNegative ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.88)';
  const textC  = isNegative ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';
  const badgeC = isNegative ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)';
  const badgeBg = isNegative ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const hasVisual = Boolean(visual);
  const visualClass = visual ? `feature-card--${visual}` : '';

  return (
    <LandingCard
      isNegative={isNegative}
      className={hasVisual ? `feature-card feature-card--visual ${visualClass}` : 'feature-card'}
      style={{
        display:       'flex',
        flexDirection: 'column',
        minHeight:     hasVisual ? 356 : 176,
        gridColumn:    fullWidth ? '1 / -1' : undefined,
        ...(hasVisual ? {
          '--visual-card-surface': isNegative ? '#0f0f0f' : '#e3e2de',
          '--visual-line-transparent': isNegative ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)',
          '--visual-line-soft': isNegative ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
          '--visual-line-mid': isNegative ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.18)',
          '--visual-line-strong': isNegative ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.42)',
          '--visual-fill-top': isNegative ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          '--visual-fill-mid': isNegative ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          '--visual-fill-bottom': isNegative ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)',
          '--visual-grid-line': isNegative ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
          '--visual-tooltip-bg': isNegative ? 'rgba(15,15,15,0.72)' : 'rgba(224,223,219,0.78)',
          '--visual-tooltip-text': isNegative ? 'rgba(255,255,255,0.58)' : 'rgba(0,0,0,0.62)',
          '--visual-tooltip-border': isNegative ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          '--visual-layer-line': isNegative ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.13)',
          '--visual-layer-strong': isNegative ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.26)',
          '--visual-success': isNegative ? '#57d97b' : '#168c3a',
          '--visual-danger': isNegative ? '#ff6363' : '#c62828',
          '--visual-access': isNegative ? '#36e0d0' : '#078b80',
        } : {}),
      } as React.CSSProperties}
    >
      {visual === 'securityAnalysis' && <SecurityAnalysisVisual />}
      {visual === 'knowledgeLayers' && <KnowledgeLayersVisual />}
      {visual === 'securityCheck' && <SecurityCheckVisual />}
      {visual === 'secureAccess' && <SecureAccessVisual />}
      <LandingCardHeader className={hasVisual ? 'feature-card-copy--visual' : undefined}>
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
        .feature-card--visual {
          isolation: isolate;
          background: var(--visual-card-surface, rgba(255,255,255,0.02)) !important;
        }
        .feature-card--visual::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 52% 22%, var(--visual-fill-top), transparent 28%);
          pointer-events: none;
          z-index: 0;
        }
        .feature-card-copy--visual {
          padding-top: clamp(11.8rem, 18vw, 13.25rem) !important;
        }
        .security-analysis-visual,
        .knowledge-layers-visual,
        .security-check-visual,
        .secure-access-visual {
          position: absolute;
          inset: 0 0 auto;
          height: clamp(13.4rem, 20vw, 15.5rem);
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle at 51% 39%, var(--visual-fill-top), transparent 20%),
            linear-gradient(180deg, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 4%, transparent), transparent 58%, var(--visual-card-surface, #0f0f0f) 100%);
        }
        .security-analysis-visual::before,
        .security-analysis-visual::after,
        .knowledge-layers-visual::before,
        .knowledge-layers-visual::after,
        .security-check-visual::before,
        .security-check-visual::after,
        .secure-access-visual::before,
        .secure-access-visual::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 34%;
          z-index: 6;
          pointer-events: none;
        }
        .security-analysis-visual::before,
        .knowledge-layers-visual::before,
        .security-check-visual::before,
        .secure-access-visual::before {
          left: 0;
          background: linear-gradient(90deg, var(--visual-card-surface, #0f0f0f), color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 0%, transparent));
        }
        .security-analysis-visual::after,
        .knowledge-layers-visual::after,
        .security-check-visual::after,
        .secure-access-visual::after {
          right: 0;
          background: linear-gradient(270deg, var(--visual-card-surface, #0f0f0f), color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 0%, transparent));
        }
        .security-analysis-vignette,
        .knowledge-layers-vignette,
        .security-check-vignette,
        .secure-access-vignette {
          position: absolute;
          inset: -20% -10% -14%;
          background:
            radial-gradient(circle at 50% 38%, transparent 0 27%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 24%, transparent) 50%, var(--visual-card-surface, #0f0f0f) 100%),
            linear-gradient(180deg, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 10%, transparent), transparent 34%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 66%, transparent) 78%, var(--visual-card-surface, #0f0f0f) 100%);
          z-index: 7;
        }
        .security-analysis-grid {
          position: absolute;
          inset: -2rem -5rem -1rem;
          background-image:
            linear-gradient(var(--visual-grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--visual-grid-line) 1px, transparent 1px);
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
          filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.18));
          z-index: 2;
        }
        .security-analysis-wave {
          opacity: 0.9;
        }
        .security-analysis-area {
          opacity: 0.78;
          transform-origin: center bottom;
        }
        .security-analysis-marker-line {
          position: absolute;
          left: 52%;
          top: 3.55rem;
          width: 1px;
          height: 4.55rem;
          background: repeating-linear-gradient(180deg, var(--visual-line-strong) 0 0.55rem, transparent 0.55rem 1.1rem);
          opacity: 0.74;
          z-index: 8;
        }
        .security-analysis-tooltip {
          position: absolute;
          left: 52%;
          top: 2.35rem;
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
          transform: translateX(-50%);
          padding: 0.44rem 0.78rem;
          color: var(--visual-tooltip-text);
          background: var(--visual-tooltip-bg);
          border: 1px solid var(--visual-tooltip-border);
          box-shadow: 0 10px 34px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border-radius: 999px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.78rem;
          white-space: nowrap;
          z-index: 9;
        }
        .security-analysis-tooltip strong { color: var(--visual-line-strong); }
        .security-analysis-tooltip-dot {
          width: 0.48rem;
          height: 0.48rem;
          flex: 0 0 0.48rem;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 18px rgba(245,158,11,0.6);
        }
        .knowledge-open-book {
          position: absolute;
          left: 50%;
          top: 2.2rem;
          width: min(44%, 15rem);
          min-width: 12rem;
          height: 9.2rem;
          transform: translateX(-50%);
          overflow: visible;
          z-index: 2;
          animation: knowledge-book-float 6.8s ease-in-out infinite;
          filter: drop-shadow(0 1.4rem 2.2rem color-mix(in srgb, var(--visual-layer-strong) 16%, transparent));
        }
        .book-page {
          fill: color-mix(in srgb, var(--visual-layer-strong) 12%, transparent);
          stroke: var(--visual-layer-line);
          stroke-width: 1.4;
        }
        .book-spine,
        .book-line,
        .book-shadow {
          fill: none;
          stroke: var(--visual-layer-line);
          stroke-width: 1.4;
          stroke-linecap: round;
        }
        .book-line { opacity: 0.58; }
        .book-shadow {
          stroke: var(--visual-layer-strong);
          opacity: 0.5;
        }
        .security-check-track {
          position: absolute;
          left: 50%;
          top: 2.55rem;
          display: grid;
          grid-template-columns: minmax(8rem, 1fr) 2.25rem minmax(8rem, 1fr) 2.25rem minmax(9rem, 1.15fr);
          align-items: center;
          width: min(88%, 44rem);
          transform: translateX(-50%);
          z-index: 3;
        }
        .security-check-step {
          min-height: 4.5rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 0.34rem;
          padding: 0.78rem 0.85rem;
          border: 1px solid var(--visual-tooltip-border);
          border-radius: 0.9rem;
          color: var(--visual-tooltip-text);
          background: color-mix(in srgb, var(--visual-tooltip-bg) 78%, transparent);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 1.2rem 2.6rem rgba(0,0,0,0.13);
          backdrop-filter: blur(10px);
          font-family: Inter, system-ui, sans-serif;
          font-size: 0.78rem;
          line-height: 1.25;
        }
        .security-check-step strong {
          color: var(--visual-danger);
          font-size: 0.72rem;
          font-weight: 700;
        }
        .security-check-indicator {
          display: grid;
          place-items: center;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          font-weight: 800;
          line-height: 1;
        }
        .security-check-step-ok .security-check-indicator {
          color: var(--visual-card-surface);
          background: var(--visual-success);
        }
        .security-check-step-fail .security-check-indicator {
          color: var(--visual-card-surface);
          background: var(--visual-danger);
          font-size: 1rem;
        }
        .security-check-connector {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--visual-line-mid), transparent);
        }
        .security-check-connector-ok { box-shadow: 0 0 1rem color-mix(in srgb, var(--visual-success) 35%, transparent); }
        .security-check-connector-fail { box-shadow: 0 0 1rem color-mix(in srgb, var(--visual-danger) 35%, transparent); }
        .secure-access-network {
          position: absolute;
          inset: 1.8rem 7% auto;
          width: 86%;
          height: 10.2rem;
          z-index: 2;
        }
        .access-line,
        .access-pulse {
          fill: none;
          stroke-linecap: round;
          stroke-width: 2;
        }
        .access-line {
          stroke: var(--visual-line-mid);
          opacity: 0.5;
        }
        .access-pulse {
          stroke: var(--visual-access);
          stroke-width: 3;
          stroke-dasharray: 28 210;
          filter: drop-shadow(0 0 0.55rem var(--visual-access));
          opacity: 0;
          animation: access-pulse 5.6s ease-in-out infinite;
        }
        .access-pulse-2 { animation-delay: 1.8s; }
        .access-pulse-3 { animation-delay: 3.6s; }
        .access-device {
          position: absolute;
          display: grid;
          place-items: center;
          border: 1px solid var(--visual-layer-line);
          background: color-mix(in srgb, var(--visual-layer-strong) 10%, transparent);
          box-shadow: 0 1.1rem 2.2rem color-mix(in srgb, var(--visual-layer-strong) 12%, transparent);
          z-index: 3;
        }
        .access-device span {
          display: block;
          width: 62%;
          height: 48%;
          border: 1px solid var(--visual-layer-line);
          border-radius: 0.2rem;
          opacity: 0.74;
        }
        .access-device-desktop {
          left: 12%;
          top: 6.1rem;
          width: 3.6rem;
          height: 2.45rem;
          border-radius: 0.36rem;
        }
        .access-device-desktop::after {
          content: '';
          position: absolute;
          bottom: -0.8rem;
          width: 1.8rem;
          height: 0.55rem;
          border-top: 1px solid var(--visual-layer-line);
          border-bottom: 1px solid var(--visual-layer-line);
        }
        .access-device-laptop {
          right: 12%;
          top: 3.3rem;
          width: 3.9rem;
          height: 2.35rem;
          border-radius: 0.34rem;
        }
        .access-device-laptop::after {
          content: '';
          position: absolute;
          left: -0.28rem;
          right: -0.28rem;
          bottom: -0.42rem;
          height: 0.32rem;
          border-radius: 0 0 0.35rem 0.35rem;
          border: 1px solid var(--visual-layer-line);
        }
        .access-device-phone {
          right: 14%;
          top: 8.6rem;
          width: 1.85rem;
          height: 3.25rem;
          border-radius: 0.48rem;
        }
        .access-device-phone span {
          width: 58%;
          height: 70%;
          border-radius: 0.26rem;
        }
        .secure-access-tooltip {
          position: absolute;
          left: 50%;
          top: 2.05rem;
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
          transform: translateX(-50%);
          padding: 0.44rem 0.78rem;
          color: var(--visual-tooltip-text);
          background: var(--visual-tooltip-bg);
          border: 1px solid var(--visual-tooltip-border);
          box-shadow: 0 10px 34px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border-radius: 999px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          white-space: nowrap;
          z-index: 8;
        }
        .secure-access-tooltip strong { color: var(--visual-access); }
        .secure-access-tooltip-dot {
          width: 0.48rem;
          height: 0.48rem;
          flex: 0 0 0.48rem;
          border-radius: 50%;
          background: var(--visual-success);
          box-shadow: 0 0 18px color-mix(in srgb, var(--visual-success) 60%, transparent);
        }
        @keyframes knowledge-book-float {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-1deg); }
          50% { transform: translateX(-50%) translateY(-0.75rem) rotate(1deg); }
        }
        @keyframes access-pulse {
          0% { stroke-dashoffset: 230; opacity: 0; }
          12% { opacity: 1; }
          58% { opacity: 1; }
          100% { stroke-dashoffset: -230; opacity: 0; }
        }
        @media (max-width: 700px) {
          .feature-card--visual { min-height: 374px !important; }
          .feature-card-copy--visual { padding-top: 12.2rem !important; }
          .security-analysis-visual,
          .knowledge-layers-visual { height: 14.2rem; }
          .security-analysis-chart { width: 47rem; top: 1.6rem; height: 9.9rem; }
          .security-analysis-marker-line { left: 52%; top: 3.75rem; height: 4.5rem; }
          .security-analysis-tooltip { left: 52%; top: 2.65rem; font-size: 0.7rem; padding: 0.4rem 0.62rem; }
          .knowledge-open-book { width: 13rem; top: 2.45rem; }
          .security-check-track { grid-template-columns: 1fr; gap: 0.5rem; top: 1.65rem; width: min(88%, 19rem); }
          .security-check-step { min-height: 2.35rem; flex-direction: row; align-items: center; font-size: 0.7rem; padding: 0.45rem 0.6rem; }
          .security-check-step strong { margin-left: auto; }
          .security-check-connector { display: none; }
          .secure-access-network { inset: 2rem 2% auto; width: 96%; height: 9.4rem; }
          .access-device-desktop { left: 8%; top: 6.1rem; }
          .access-device-laptop { right: 8%; top: 3.5rem; }
          .access-device-phone { right: 10%; top: 8.4rem; }
          .secure-access-tooltip { top: 2.45rem; font-size: 0.66rem; padding: 0.4rem 0.62rem; }
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
            visual="knowledgeLayers"
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
            visual="secureAccess"
            text="Настраиваем и интегрируем защищённый доступ к сервисам и серверам. Подбираем решение под задачу — mTLS, VPN, Zero Trust или другой подход. Доступ получают только те, кому вы это разрешили."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Проверка защищённости"
            badge="услуга"
            visual="securityCheck"
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
