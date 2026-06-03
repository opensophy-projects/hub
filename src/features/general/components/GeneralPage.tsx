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

// ─── GlowingEffectInline ──────────────────────────────────────────────────────

const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);

interface GlowingEffectInlineProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
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

type VisualType = 'securityAnalysis' | 'knowledgeLayers' | 'securityCheck' | 'secureAccess' | 'automationList' | 'protectionStack';

interface FeatureCardProps {
  title: string;
  text: string;
  isNegative: boolean;
  fullWidth?: boolean;
  badge?: string;
  visual?: VisualType;
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
      {' '}обнаружено <strong>76</strong> проблем
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
  </div>
);

const SecureAccessVisual: React.FC = () => (
  <div className="secure-access-visual" aria-hidden="true">
    <svg className="secure-access-network" viewBox="0 0 620 220" preserveAspectRatio="none">
      <path className="access-line access-line-main" d="M120 118 C210 118 258 118 310 118" />
      <path className="access-line access-line-laptop" d="M310 118 C382 76 430 68 510 68" />
      <path className="access-line access-line-phone" d="M310 118 C382 162 430 172 510 172" />
      <path className="access-pulse access-pulse-1" d="M120 118 C210 118 258 118 310 118 C382 76 430 68 510 68" />
      <path className="access-pulse access-pulse-2" d="M120 118 C210 118 258 118 310 118 C382 162 430 172 510 172" />
      <path className="access-pulse access-pulse-3" d="M510 68 C430 68 382 76 310 118 C258 118 210 118 120 118" />
      <path className="access-pulse access-pulse-4" d="M510 172 C430 172 382 162 310 118 C258 118 210 118 120 118" />
    </svg>
    <div className="access-device access-device-desktop access-device-left"><span /></div>
    <div className="access-device access-device-laptop"><span /></div>
    <div className="access-device access-device-phone"><span /></div>
    <div className="secure-access-tooltip">
      <span className="secure-access-tooltip-dot" />
      {' '}подключено через <strong>mTLS</strong>
    </div>
  </div>
);

const AutomationListVisual: React.FC = () => (
  <div className="automation-list-visual" aria-hidden="true">
    <div className="automation-panel">
      <div className="automation-item automation-item-active">
        <span className="automation-check">✓</span>
        <span>ежедневный локальный бэкап логов</span>
      </div>
      <div className="automation-item automation-item-active">
        <span className="automation-check">✓</span>
        <span>управление mTLS сертификатами</span>
      </div>
      <div className="automation-item automation-item-muted-blue">
        <span className="automation-check">✓</span>
        <span>еженедельный отчёт по безопасности сервиса</span>
      </div>
      <div className="automation-hidden-list">
        <div className="automation-item automation-item-muted"><span className="automation-check">✓</span><span>ротация ключей доступа</span></div>
        <div className="automation-item automation-item-muted"><span className="automation-check">✓</span><span>контроль статуса сервисов</span></div>
      </div>
    </div>
    <div className="automation-list-vignette" />
  </div>
);

const ProtectionStackVisual: React.FC = () => (
  <div className="protection-stack-visual" aria-hidden="true">
    <div className="protection-orbit protection-orbit-outer" />
    <div className="protection-orbit protection-orbit-inner" />
    <div className="protection-shield">
      <svg viewBox="0 0 92 104">
        <path d="M46 8L78 20V45C78 67 66 84 46 96C26 84 14 67 14 45V20L46 8Z" />
        <path d="M31 52L42 63L63 37" />
      </svg>
    </div>
    <div className="protection-chip protection-chip-1">WAF</div>
    <div className="protection-chip protection-chip-2">SCA</div>
    <div className="protection-chip protection-chip-3">mTLS</div>
    <div className="protection-chip protection-chip-4">DAST</div>
    <div className="protection-stack-vignette" />
  </div>
);

const VISUAL_COMPONENTS: Record<VisualType, React.FC> = {
  securityAnalysis: SecurityAnalysisVisual,
  knowledgeLayers:  KnowledgeLayersVisual,
  securityCheck:    SecurityCheckVisual,
  secureAccess:     SecureAccessVisual,
  automationList:   AutomationListVisual,
  protectionStack:  ProtectionStackVisual,
};

// Токены для визуальных карточек в тёмной и светлой темах
const VISUAL_VARS_DARK: React.CSSProperties = {
  '--visual-card-surface':     '#0f0f0f',
  '--visual-line-transparent': 'rgba(255,255,255,0)',
  '--visual-line-soft':        'rgba(255,255,255,0.16)',
  '--visual-line-mid':         'rgba(255,255,255,0.4)',
  '--visual-line-strong':      'rgba(255,255,255,0.68)',
  '--visual-fill-top':         'rgba(255,255,255,0.08)',
  '--visual-fill-mid':         'rgba(255,255,255,0.03)',
  '--visual-fill-bottom':      'rgba(255,255,255,0)',
  '--visual-grid-line':        'rgba(255,255,255,0.07)',
  '--visual-tooltip-bg':       'rgba(15,15,15,0.72)',
  '--visual-tooltip-text':     'rgba(255,255,255,0.58)',
  '--visual-tooltip-border':   'rgba(255,255,255,0.1)',
  '--visual-layer-line':       'rgba(255,255,255,0.22)',
  '--visual-layer-strong':     'rgba(255,255,255,0.52)',
  '--visual-success':          '#57d97b',
  '--visual-danger':           '#ff6363',
  '--visual-access':           '#36e0d0',
} as React.CSSProperties;

const VISUAL_VARS_LIGHT: React.CSSProperties = {
  '--visual-card-surface':     '#e3e2de',
  '--visual-line-transparent': 'rgba(0,0,0,0)',
  '--visual-line-soft':        'rgba(0,0,0,0.16)',
  '--visual-line-mid':         'rgba(0,0,0,0.28)',
  '--visual-line-strong':      'rgba(0,0,0,0.58)',
  '--visual-fill-top':         'rgba(0,0,0,0.04)',
  '--visual-fill-mid':         'rgba(0,0,0,0.02)',
  '--visual-fill-bottom':      'rgba(0,0,0,0)',
  '--visual-grid-line':        'rgba(0,0,0,0.075)',
  '--visual-tooltip-bg':       'rgba(224,223,219,0.78)',
  '--visual-tooltip-text':     'rgba(0,0,0,0.62)',
  '--visual-tooltip-border':   'rgba(0,0,0,0.1)',
  '--visual-layer-line':       'rgba(0,0,0,0.24)',
  '--visual-layer-strong':     'rgba(0,0,0,0.4)',
  '--visual-success':          '#168c3a',
  '--visual-danger':           '#c62828',
  '--visual-access':           '#078b80',
} as React.CSSProperties;

function buildVisualVars(isNegative: boolean): React.CSSProperties {
  return isNegative ? VISUAL_VARS_DARK : VISUAL_VARS_LIGHT;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, text, isNegative, fullWidth, badge, visual }) => {
  const titleC    = isNegative ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.88)';
  const textC     = isNegative ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.65)';
  const badgeC    = isNegative ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)';
  const hasVisual = Boolean(visual);

  const VisualComponent = visual ? VISUAL_COMPONENTS[visual] : null;

  const cardStyle: React.CSSProperties = {
    display:       'flex',
    flexDirection: 'column',
    minHeight:     hasVisual ? 356 : 176,
    gridColumn:    fullWidth ? '1 / -1' : undefined,
    ...(hasVisual ? buildVisualVars(isNegative) : {}),
  };

  return (
    <LandingCard
      isNegative={isNegative}
      className={hasVisual ? `feature-card feature-card--visual feature-card--${visual}` : 'feature-card'}
      style={cardStyle}
    >
      {VisualComponent && <VisualComponent />}
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
        .feature-card--visual::before { display: none; }
        .feature-card-copy--visual {
          padding-top: clamp(11.8rem, 18vw, 13.25rem) !important;
        }
        .security-analysis-visual,
        .knowledge-layers-visual,
        .security-check-visual,
        .secure-access-visual,
        .automation-list-visual,
        .protection-stack-visual {
          position: absolute;
          inset: 0 0 auto;
          height: clamp(13.4rem, 20vw, 15.5rem);
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 4%, transparent), transparent 58%, var(--visual-card-surface, #0f0f0f) 100%);
        }
        .security-analysis-visual::before,
        .security-analysis-visual::after,
        .knowledge-layers-visual::before,
        .knowledge-layers-visual::after,
        .security-check-visual::before,
        .security-check-visual::after,
        .secure-access-visual::before,
        .secure-access-visual::after,
        .automation-list-visual::before,
        .automation-list-visual::after,
        .protection-stack-visual::before,
        .protection-stack-visual::after {
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
        .secure-access-visual::before,
        .automation-list-visual::before,
        .protection-stack-visual::before {
          left: 0;
          background: linear-gradient(90deg, var(--visual-card-surface, #0f0f0f), color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 0%, transparent));
        }
        .security-analysis-visual::after,
        .knowledge-layers-visual::after,
        .security-check-visual::after,
        .secure-access-visual::after,
        .automation-list-visual::after,
        .protection-stack-visual::after {
          right: 0;
          background: linear-gradient(270deg, var(--visual-card-surface, #0f0f0f), color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 0%, transparent));
        }
        .security-analysis-vignette,
        .knowledge-layers-vignette,
        .security-check-vignette,
        .secure-access-vignette,
        .automation-list-vignette,
        .protection-stack-vignette {
          position: absolute;
          inset: -20% -10% -14%;
          background:
            radial-gradient(circle at 50% 38%, transparent 0 27%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 24%, transparent) 50%, var(--visual-card-surface, #0f0f0f) 100%),
            linear-gradient(180deg, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 10%, transparent), transparent 34%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 66%, transparent) 78%, var(--visual-card-surface, #0f0f0f) 100%);
          z-index: 7;
        }
        .secure-access-vignette {
          background:
            radial-gradient(circle at 50% 42%, transparent 0 38%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 12%, transparent) 68%, var(--visual-card-surface, #0f0f0f) 100%),
            linear-gradient(180deg, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 4%, transparent), transparent 48%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 38%, transparent) 86%, var(--visual-card-surface, #0f0f0f) 100%);
        }
        .security-check-vignette {
          background:
            radial-gradient(circle at 50% 34%, transparent 0 42%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 10%, transparent) 70%, var(--visual-card-surface, #0f0f0f) 100%),
            linear-gradient(180deg, transparent, transparent 58%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 42%, transparent) 88%, var(--visual-card-surface, #0f0f0f) 100%);
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
          top: 1.65rem;
          width: min(58%, 18.5rem);
          min-width: 15rem;
          height: 11.5rem;
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
          box-shadow: none;
          backdrop-filter: blur(6px);
          opacity: 0.82;
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
        .security-check-connector-ok,
        .security-check-connector-fail { box-shadow: none; opacity: 0.62; }
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
        .access-pulse-4 { animation-delay: 5.4s; }
        .access-device {
          position: absolute;
          display: grid;
          place-items: center;
          border: 1px solid var(--visual-layer-line);
          background: color-mix(in srgb, var(--visual-layer-strong) 10%, transparent);
          box-shadow: 0 1.1rem 2.2rem color-mix(in srgb, var(--visual-layer-strong) 18%, transparent);
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
        .automation-panel {
          position: absolute;
          left: 50%;
          top: 2.15rem;
          width: min(82%, 31rem);
          transform: translateX(-50%);
          z-index: 3;
        }
        .automation-item {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          min-height: 2.1rem;
          margin-bottom: 0.54rem;
          padding: 0.46rem 0.7rem;
          border-radius: 999px;
          border: 1px solid var(--visual-tooltip-border);
          color: var(--visual-tooltip-text);
          background: var(--visual-tooltip-bg);
          box-shadow: 0 0.9rem 2rem rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          white-space: nowrap;
        }
        .automation-check {
          display: grid;
          place-items: center;
          flex: 0 0 1rem;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          color: #ffffff;
          background: #2f6bff;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .automation-item-muted-blue { opacity: 0.78; }
        .automation-item-muted-blue .automation-check {
          background: color-mix(in srgb, #2f6bff 42%, var(--visual-layer-line));
        }
        .automation-hidden-list {
          position: relative;
          margin-top: 0.25rem;
          opacity: 0.44;
          mask-image: linear-gradient(180deg, black 0 35%, transparent 100%);
        }
        .automation-item-muted {
          background: color-mix(in srgb, var(--visual-tooltip-bg) 62%, transparent);
        }
        .automation-item-muted .automation-check {
          color: var(--visual-tooltip-text);
          background: color-mix(in srgb, var(--visual-layer-line) 62%, transparent);
        }
        .protection-orbit {
          position: absolute;
          left: 50%;
          top: 6.45rem;
          border: 1px solid var(--visual-layer-line);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.8;
          z-index: 2;
        }
        .protection-orbit-outer { width: 18rem; height: 7.8rem; }
        .protection-orbit-inner { width: 11rem; height: 4.9rem; opacity: 0.58; }
        .protection-shield {
          position: absolute;
          left: 50%;
          top: 6.45rem;
          width: 5.1rem;
          height: 5.8rem;
          transform: translate(-50%, -50%);
          z-index: 4;
          filter: drop-shadow(0 1rem 2rem color-mix(in srgb, var(--visual-layer-strong) 18%, transparent));
        }
        .protection-shield path:first-child {
          fill: color-mix(in srgb, var(--visual-layer-strong) 10%, transparent);
          stroke: var(--visual-layer-strong);
          stroke-width: 2;
        }
        .protection-shield path:last-child {
          fill: none;
          stroke: var(--visual-success);
          stroke-width: 6;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .protection-chip {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 3.4rem;
          height: 1.9rem;
          padding: 0 0.7rem;
          border-radius: 999px;
          border: 1px solid var(--visual-tooltip-border);
          color: var(--visual-tooltip-text);
          background: var(--visual-tooltip-bg);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          z-index: 5;
        }
        .protection-chip-1 { left: calc(50% - 11rem); top: 3.4rem; }
        .protection-chip-2 { left: calc(50% + 7.6rem); top: 3.8rem; }
        .protection-chip-3 { left: calc(50% - 9.2rem); top: 8.8rem; }
        .protection-chip-4 { left: calc(50% + 6.6rem); top: 8.5rem; }
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
          .knowledge-layers-visual,
          .security-check-visual,
          .secure-access-visual,
          .automation-list-visual,
          .protection-stack-visual { height: 14.2rem; }
          .security-analysis-chart { width: 47rem; top: 1.6rem; height: 9.9rem; }
          .security-analysis-marker-line { left: 52%; top: 3.75rem; height: 4.5rem; }
          .security-analysis-tooltip { left: 52%; top: 2.65rem; font-size: 0.7rem; padding: 0.4rem 0.62rem; }
          .knowledge-open-book { width: 16rem; min-width: 16rem; top: 2rem; }
          .security-check-track { grid-template-columns: 1fr; gap: 0.5rem; top: 1.65rem; width: min(88%, 19rem); }
          .security-check-step { min-height: 2.35rem; flex-direction: row; align-items: center; font-size: 0.7rem; padding: 0.45rem 0.6rem; }
          .security-check-step strong { margin-left: auto; }
          .security-check-connector { display: none; }
          .secure-access-network { inset: 2rem 2% auto; width: 96%; height: 9.4rem; }
          .access-device-desktop { left: 8%; top: 6.1rem; }
          .access-device-laptop { right: 8%; top: 3.5rem; }
          .access-device-phone { right: 10%; top: 8.4rem; }
          .secure-access-tooltip { top: 2.45rem; font-size: 0.66rem; padding: 0.4rem 0.62rem; }
          .automation-panel { top: 1.65rem; width: min(88%, 20rem); }
          .automation-item { font-size: 0.64rem; min-height: 1.9rem; padding: 0.38rem 0.55rem; }
          .protection-orbit-outer { width: 14rem; height: 6.2rem; }
          .protection-orbit-inner { width: 8.5rem; height: 3.8rem; }
          .protection-shield { width: 4.2rem; height: 4.8rem; }
          .protection-chip { min-width: 2.8rem; height: 1.6rem; font-size: 0.62rem; padding: 0 0.5rem; }
          .protection-chip-1 { left: calc(50% - 8.2rem); top: 3.8rem; }
          .protection-chip-2 { left: calc(50% + 5.4rem); top: 4rem; }
          .protection-chip-3 { left: calc(50% - 7.2rem); top: 8.6rem; }
          .protection-chip-4 { left: calc(50% + 4.8rem); top: 8.5rem; }
        }
      `}</style>

      <div className="sec-top">
        <div className="sec-text-col">
          <p style={{ fontSize: '1rem', fontWeight: 600, color: textMut, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 2rem', fontFamily: 'Inter, sans-serif' }}>
            ЧЕМ ЗАНИМАЕТСЯ
          </p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            Учим безопасности, настраиваем защиту, автоматизируем рутину.
          </h2>
          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: 0, color: textMut, fontFamily: 'Inter, sans-serif' }}>
            <ShinyText
              text="От образовательных материалов до внедрения DevSecOps и Zero Trust в реальную инфраструктуру."
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
            visual="automationList"
            text="Автоматизируем рутину — от простого bash-скрипта до сложных решений под индивидуальные требования."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Подбор стека защиты"
            badge="услуга"
            visual="protectionStack"
            text="Подбираем стек защиты с одной целью — максимальная эффективность при минимальных затратах ресурсов."
          />
        </div>

        <p
          className="sec-contact"
          style={{
            color:      textMut,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize:   'clamp(0.98rem, 1.25vw, 1.08rem)',
            lineHeight: 1.7,
            margin:     '1.5rem 0 0',
          }}
        >
          {'Чтобы заказать услугу или обсудить сотрудничество, напишите на '}
          <a href="mailto:opensophy@gmail.com" style={{ color: textMain, textDecoration: 'none' }}>
            opensophy@gmail.com
          </a>
          {'. Все карточки с пометкой «услуга» доступны для заказа; «Знания каждому!» — открытая образовательная инициатива.'}
        </p>
      </div>
    </section>
  );
};


// ─── EcosystemSection ─────────────────────────────────────────────────────────

interface EcosystemSectionProps {
  isNegative: boolean;
  navOffset?: number;
}

const EcosystemSection: React.FC<EcosystemSectionProps> = ({ isNegative, navOffset = 0 }) => {
  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMut   = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
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
        @media (max-width: 1200px) { .eco-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .eco-heading-inline {
            flex-direction: column;
            align-items: flex-start;
            white-space: normal;
            gap: 0.1em;
          }
          .eco-cards { grid-template-columns: 1fr; }
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
              text="Создаём open-source инструменты для безопасной инфраструктуры и современных IT-команд."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        <div className="eco-cards">
          <FeatureCard
            isNegative={isNegative}
            title="Opensophy Hub (O.Hub)"
            badge="веб-проект"
            text="Гибридная open-source платформа для документации и публикации контента. Подходит для технических команд, авторов и всех, кто хочет красиво и структурировано делиться знаниями."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Opensophy mTLS (O.mTLS)"
            badge="скрипт"
            text="Инструмент для быстрого создания и управления mTLS-сертификатами. Для тех, кто хочет надёжно закрыть доступ к своим сервисам и серверам без лишней головной боли."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Opensophy UI (O.UI)"
            badge="веб-проект"
            text="Библиотека готовых React-компонентов с живым превью и настройками. Анимации, интерактивные блоки, кастомные элементы и фирменные компоненты Opensophy — для разработчиков и дизайнеров."
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

        .hero-title-wrap {
          position: absolute;
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
        }

        .hero-title {
          font-family: 'customfont', sans-serif;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.06em;
          white-space: nowrap;
          font-size: clamp(2rem, 10vw, 10rem);
          color: var(--hero-text-color, currentColor);
        }

        @media (max-width: 360px) {
          .hero-title {
            font-size: clamp(1.6rem, 11vw, 3rem);
            letter-spacing: 0.03em;
          }
        }

        @media (min-width: 361px) and (max-width: 768px) {
          .hero-title {
            font-size: clamp(2.5rem, 10vw, 5.5rem);
            letter-spacing: 0.05em;
          }
        }

        @media (min-width: 1001px) {
          .hero-title {
            font-size: clamp(4rem, 8vw, 10rem);
          }
        }
      `}</style>

      <Navigation floatingChrome />

      {/* Герой */}
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

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          pointerEvents: 'none',
          background: `linear-gradient(to bottom, transparent, ${bg})`,
        }} />

        <div
          className="hero-title-wrap"
          style={{
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

const GeneralPage: React.FC = () => {
  useEffect(() => {
    document.getElementById('landing-static-shell')?.remove();
  }, []);

  return (
    <ThemeProvider>
      <LandingContent />
    </ThemeProvider>
  );
};

export { ShinyText, GlowingEffectInline, FeatureCard };
export default GeneralPage;