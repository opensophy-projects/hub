import React, { useEffect, useRef, memo } from 'react';
import { useMotionValue, useAnimationFrame, useTransform, motion } from 'framer-motion';

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
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  inactiveZone?: number;
  movementDuration?: number;
  borderWidth?: number;
  isNegative?: boolean;
}

const GlowingEffectInline = memo(({
  spread = 20,
  glow = false,
  movementDuration = 2,
  borderWidth = 1,
  disabled = true,
  proximity = 0,
  inactiveZone = 0.7,
  isNegative = false,
}: GlowingEffectInlineProps) => {
  const containerRef      = useRef<HTMLDivElement>(null);
  const lastPosition      = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  const animateAngleTransition = React.useCallback((
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

  const handleMove = React.useCallback((e?: MouseEvent | { x: number; y: number }) => {
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
        '--blur':                           '0px',
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
        opacity:             'var(--active)' as unknown as number,
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

// ─── FeatureCard (точная копия из GeneralPage / SecuritySection) ──────────────

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
  const textC  = isNegative ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.65)';

  return (
    <div style={{
      position:      'relative',
      border:        `1px solid ${border}`,
      background:    bg,
      borderRadius:  16,
      padding:       '1.5rem',
      display:       'flex',
      flexDirection: 'column',
      gap:           '0.75rem',
      gridColumn:    fullWidth ? '1 / -1' : undefined,
      overflow:      'hidden',
      // Растягиваемся на всю высоту grid-ячейки
      height:        '100%',
      boxSizing:     'border-box',
    }}>
      <GlowingEffectInline
        spread={40} glow disabled={false}
        proximity={60} inactiveZone={0.01}
        borderWidth={1.5} isNegative={isNegative}
      />
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

// ─── IsometricPillars — без mouse-анимации ────────────────────────────────────

interface IsometricPillarsProps {
  isNegative: boolean;
}

const IsometricPillars: React.FC<IsometricPillarsProps> = ({ isNegative }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const COLS  = 5;
    const ROWS  = 5;
    const SPEED = 0.55;
    const BG    = isNegative ? '#0a0a0a' : '#E8E7E3';

    let TW: number, TH: number, MAX_H: number, MIN_H: number;
    let width: number, height: number, cx: number, cy: number;

    const c = canvas.getContext('2d');
    if (!c) return;
    const ctx = c;

    const resize = () => {
      width  = canvas.width  = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      const twByWidth  = (width  * 0.82) / ((COLS + ROWS) / 2);
      const twByHeight = (height * 0.62) / (2.0 + (COLS + ROWS) / 8);
      TW    = Math.min(twByWidth, twByHeight, 120);
      TH    = TW / 2;
      MAX_H = TW * 2.0;
      MIN_H = TW * 0.14;
      cx    = width  / 2;
      cy    = height * 0.65 + (COLS + ROWS - 2) * TH / 12;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const gCtrY   = (COLS - 1 + ROWS - 1) / 2;
    const screenX = (col: number, row: number) => cx + (col - row) * TW / 2;
    const screenY = (col: number, row: number) => cy - gCtrY * TH / 2 + (col + row) * TH / 2;
    const isRing  = (col: number, row: number) =>
      col === 0 || col === COLS - 1 || row === 0 || row === ROWS - 1;

    const drawPillar = (col: number, row: number, h: number) => {
      const bx = screenX(col, row);
      const by = screenY(col, row);
      const ty = by - h;
      const hw = TW / 2;
      const hh = TH / 2;

      if (isNegative) {
        const tg = ctx.createLinearGradient(bx - hw, ty, bx + hw, ty + hh);
        tg.addColorStop(0, 'rgba(255,255,255,0.97)');
        tg.addColorStop(1, 'rgba(208,208,214,0.93)');
        ctx.beginPath();
        ctx.moveTo(bx, ty - hh); ctx.lineTo(bx + hw, ty);
        ctx.lineTo(bx, ty + hh); ctx.lineTo(bx - hw, ty);
        ctx.closePath(); ctx.fillStyle = tg; ctx.fill();

        const lg = ctx.createLinearGradient(0, ty, 0, by + hh);
        lg.addColorStop(0, 'rgba(180,180,186,0.93)');
        lg.addColorStop(1, 'rgba(72,72,76,0.88)');
        ctx.beginPath();
        ctx.moveTo(bx - hw, ty); ctx.lineTo(bx, ty + hh);
        ctx.lineTo(bx, by + hh); ctx.lineTo(bx - hw, by);
        ctx.closePath(); ctx.fillStyle = lg; ctx.fill();

        const rg = ctx.createLinearGradient(0, ty, 0, by + hh);
        rg.addColorStop(0, 'rgba(105,105,110,0.91)');
        rg.addColorStop(1, 'rgba(38,38,42,0.87)');
        ctx.beginPath();
        ctx.moveTo(bx + hw, ty); ctx.lineTo(bx, ty + hh);
        ctx.lineTo(bx, by + hh); ctx.lineTo(bx + hw, by);
        ctx.closePath(); ctx.fillStyle = rg; ctx.fill();
      } else {
        const tg = ctx.createLinearGradient(bx - hw, ty, bx + hw, ty + hh);
        tg.addColorStop(0, 'rgba(0,0,0,0.75)');
        tg.addColorStop(1, 'rgba(60,60,60,0.65)');
        ctx.beginPath();
        ctx.moveTo(bx, ty - hh); ctx.lineTo(bx + hw, ty);
        ctx.lineTo(bx, ty + hh); ctx.lineTo(bx - hw, ty);
        ctx.closePath(); ctx.fillStyle = tg; ctx.fill();

        const lg = ctx.createLinearGradient(0, ty, 0, by + hh);
        lg.addColorStop(0, 'rgba(100,100,100,0.55)');
        lg.addColorStop(1, 'rgba(200,200,200,0.35)');
        ctx.beginPath();
        ctx.moveTo(bx - hw, ty); ctx.lineTo(bx, ty + hh);
        ctx.lineTo(bx, by + hh); ctx.lineTo(bx - hw, by);
        ctx.closePath(); ctx.fillStyle = lg; ctx.fill();

        const rg = ctx.createLinearGradient(0, ty, 0, by + hh);
        rg.addColorStop(0, 'rgba(160,160,160,0.45)');
        rg.addColorStop(1, 'rgba(210,210,210,0.25)');
        ctx.beginPath();
        ctx.moveTo(bx + hw, ty); ctx.lineTo(bx, ty + hh);
        ctx.lineTo(bx, by + hh); ctx.lineTo(bx + hw, by);
        ctx.closePath(); ctx.fillStyle = rg; ctx.fill();
      }
    };

    const getHeight = (col: number, row: number, t: number) => {
      const phase = (col + row) * 0.9;
      return MIN_H + (MAX_H - MIN_H) * (Math.sin(t * SPEED - phase) * 0.5 + 0.5);
    };

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const t = Date.now() / 1000;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);
      for (let sum = 0; sum <= COLS + ROWS - 2; sum++) {
        for (let col = 0; col <= sum; col++) {
          const row = sum - col;
          if (col >= COLS || row < 0 || row >= ROWS) continue;
          if (!isRing(col, row)) continue;
          drawPillar(col, row, getHeight(col, row, t));
        }
      }
      const grd = ctx.createRadialGradient(cx, cy - MAX_H * 0.35, 0, cx, cy - MAX_H * 0.35, Math.min(width, height) * 0.5);
      grd.addColorStop(0, isNegative ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [isNegative]);

  return (
    <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
  );
};

// ─── Данные стека ─────────────────────────────────────────────────────────────

interface StackItem {
  name: string;
  description: string;
  badge?: string;
}

interface StackCategory {
  label: string; // подпись категории внутри карточки (маленький текст)
  items: StackItem[];
}

const STACK_LEFT: StackCategory[] = [
  {
    label: 'Контейнеризация',
    items: [
      { name: 'Docker',           description: 'Изоляция и упаковка приложений. Одинаковое поведение в dev, staging и prod.' },
      { name: 'Dokploy',          description: 'Управление деплоем и контейнерами на сервере. Упрощает запуск и обновление.' },
      { name: 'K3s / Kubernetes', description: 'Оркестрация: масштабирование, отказоустойчивость, распределённые системы.', badge: 'soon' },
    ],
  },
  {
    label: 'Автоматизация',
    items: [
      { name: 'Bash / shell', description: 'Автоматизация рутины: деплой, настройка окружения, обслуживание инфраструктуры.' },
      { name: 'n8n',          description: 'Автоматизированные процессы и интеграции, включая сценарии с AI и внешними сервисами.' },
    ],
  },
];

const STACK_RIGHT: StackCategory[] = [
  {
    label: 'Мониторинг',
    items: [
      { name: 'Beszel',  description: 'Минималистичный мониторинг серверов с упором на простоту и контроль ресурсов.' },
      { name: 'OSSEC',   description: 'Лёгкий мониторинг безопасности и логов. Для небольших и средних инфраструктур.' },
      { name: 'Wazuh',   description: 'SIEM-платформа для анализа событий и обнаружения угроз в масштабируемых системах.' },
      { name: 'Netdata', description: 'Мониторинг в реальном времени с детализацией метрик и визуализацией состояния.' },
    ],
  },
  {
    label: 'Безопасность и качество кода',
    items: [
      { name: 'SonarQube', description: 'Анализ качества кода, поиск багов и уязвимостей на этапе разработки.' },
      { name: 'Semgrep',   description: 'Гибкий SAST с возможностью создания собственных правил безопасности.' },
      { name: 'OWASP ZAP', description: 'Динамическое тестирование (DAST): уязвимости в работающем приложении.' },
      { name: 'Trivy',     description: 'Сканирование зависимостей, контейнеров и образов на известные уязвимости.' },
    ],
  },
];

// ─── StackItemCard — FeatureCard-стиль с внутренним списком инструментов ──────
// Это FeatureCard из GeneralPage, расширенная списком items

interface StackItemCardProps {
  category: StackCategory;
  isNegative: boolean;
}

const StackItemCard: React.FC<StackItemCardProps> = ({ category, isNegative }) => {
  const border  = isNegative ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const bg      = isNegative ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const labelC  = isNegative ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const nameC   = isNegative ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.88)';
  const descC   = isNegative ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.65)';
  const divC    = isNegative ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const badgeBg = isNegative ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const badgeC  = isNegative ? 'rgba(255,255,255,0.4)'  : 'rgba(0,0,0,0.4)';

  return (
    <div style={{
      position:      'relative',
      border:        `1px solid ${border}`,
      background:    bg,
      borderRadius:  16,
      padding:       '1.5rem',
      display:       'flex',
      flexDirection: 'column',
      gap:           '0.75rem',
      overflow:      'hidden',
      height:        '100%',
      boxSizing:     'border-box',
    }}>
      <GlowingEffectInline
        spread={40} glow disabled={false}
        proximity={60} inactiveZone={0.01}
        borderWidth={1.5} isNegative={isNegative}
      />

      {/* Метка категории — маленький uppercase (как в FeatureCard title) */}
      <div style={{
        fontSize:      '0.72rem',
        fontWeight:    700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color:         labelC,
        fontFamily:    'Inter, system-ui, sans-serif',
        position:      'relative',
        zIndex:        1,
        flexShrink:    0,
      }}>
        {category.label}
      </div>

      {/* Список инструментов */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        flex:          1,
        position:      'relative',
        zIndex:        1,
      }}>
        {category.items.map((item, i) => (
          <React.Fragment key={item.name}>
            {i > 0 && (
              <div style={{ height: 1, background: divC, margin: '0.75rem 0', flexShrink: 0 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Название — как FeatureCard title */}
                <span style={{
                  fontSize:   'clamp(1rem, 1.5vw, 1.15rem)',
                  fontWeight: 700,
                  color:      nameC,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  lineHeight: 1.25,
                }}>
                  {item.name}
                </span>
                {item.badge && (
                  <span style={{
                    fontSize:      '0.62rem',
                    fontWeight:    600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color:          badgeC,
                    background:     badgeBg,
                    borderRadius:   6,
                    padding:        '1px 7px',
                    fontFamily:     'ui-monospace, monospace',
                    flexShrink:     0,
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              {/* Описание — как FeatureCard text */}
              <span style={{
                fontSize:   'clamp(0.9rem, 1.3vw, 1rem)',
                color:      descC,
                lineHeight: 1.65,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                {item.description}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── TechStackSection ─────────────────────────────────────────────────────────

interface TechStackSectionProps {
  isNegative: boolean;
  navOffset?: number;
}

export const TechStackSection: React.FC<TechStackSectionProps> = ({
  isNegative,
  navOffset = 0,
}) => {
  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff'  : '#000000';
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
        .ts-inner {
          padding: clamp(4rem, 8vw, 7rem) clamp(2rem, 6vw, 5rem);
          box-sizing: border-box;
        }

        .ts-header {
          margin-bottom: clamp(2.5rem, 5vw, 4rem);
        }

        /*
          Десктоп: [left-col] [canvas] [right-col]
          2 явных строки — карточки выравниваются по высоте
        */
        .ts-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.5rem);
        }

        .ts-card-l0 { grid-column: 1; grid-row: 1; }
        .ts-card-l1 { grid-column: 1; grid-row: 2; }
        .ts-card-r0 { grid-column: 3; grid-row: 1; }
        .ts-card-r1 { grid-column: 3; grid-row: 2; }

        /* Canvas — центр, span обе строки */
        .ts-canvas-cell {
          grid-column: 2;
          grid-row: 1 / 3;
        }

        .ts-canvas-wrap {
          width: 100%;
          height: 100%;
          min-height: clamp(360px, 45vw, 560px);
          border-radius: 20px;
          overflow: hidden;
        }

        /*
          Планшет ≤ 900px: canvas сверху, карточки 2 col снизу
        */
        @media (max-width: 900px) {
          .ts-grid {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto;
          }
          .ts-canvas-cell { grid-column: 1 / -1; grid-row: 1; }
          .ts-canvas-wrap { min-height: clamp(240px, 55vw, 380px); height: auto; }

          .ts-card-l0 { grid-column: 1; grid-row: 2; }
          .ts-card-r0 { grid-column: 2; grid-row: 2; }
          .ts-card-l1 { grid-column: 1; grid-row: 3; }
          .ts-card-r1 { grid-column: 2; grid-row: 3; }
        }

        /* Мобилка ≤ 560px — одна колонка */
        @media (max-width: 560px) {
          .ts-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }
          .ts-canvas-cell { grid-column: 1; grid-row: 1; }
          .ts-canvas-wrap { min-height: clamp(220px, 70vw, 320px); height: auto; }

          .ts-card-l0 { grid-column: 1; grid-row: 2; }
          .ts-card-r0 { grid-column: 1; grid-row: 3; }
          .ts-card-l1 { grid-column: 1; grid-row: 4; }
          .ts-card-r1 { grid-column: 1; grid-row: 5; }
        }
      `}</style>

      <div className="ts-inner">

        {/* ── Заголовок ─────────────────────────────────────────────────────── */}
        <div className="ts-header">
          <p style={{
            fontSize:      '1rem',
            fontWeight:    600,
            color:         textMut,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            margin:        '0 0 2rem',
            fontFamily:    'Inter, sans-serif',
          }}>
            Технологии
          </p>

          {/* Заголовок — просто белый/чёрный, без shiny (как «Безопасность прежде всего») */}
          <h2 style={{
            fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin:     '0 0 1.5rem',
            color:      textMain,
            fontFamily: 'Inter, sans-serif',
          }}>
            Технологический стек
          </h2>

          {/* Подзаголовок — ShinyText (как второй абзац в EcosystemSection) */}
          <p style={{
            fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin:     0,
            fontFamily: 'Inter, sans-serif',
          }}>
            <ShinyText
              text="Инструменты и подходы, которые мы используем в реальных проектах — для разработки, инфраструктуры и безопасности."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        {/* ── Грид ──────────────────────────────────────────────────────────── */}
        <div className="ts-grid">

          {/* Canvas */}
          <div className="ts-canvas-cell">
            <div className="ts-canvas-wrap">
              <IsometricPillars isNegative={isNegative} />
            </div>
          </div>

          {/* Левые карточки (FeatureCard-стиль) */}
          <div className="ts-card-l0">
            <StackItemCard category={STACK_LEFT[0]} isNegative={isNegative} />
          </div>
          <div className="ts-card-l1">
            <StackItemCard category={STACK_LEFT[1]} isNegative={isNegative} />
          </div>

          {/* Правые карточки */}
          <div className="ts-card-r0">
            <StackItemCard category={STACK_RIGHT[0]} isNegative={isNegative} />
          </div>
          <div className="ts-card-r1">
            <StackItemCard category={STACK_RIGHT[1]} isNegative={isNegative} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default TechStackSection;