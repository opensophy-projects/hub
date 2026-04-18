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

      // Уменьшаем MAX_H чтобы пилляры не вылезали за верхнюю границу
      const twByWidth  = (width  * 0.82) / ((COLS + ROWS) / 2);
      // Ключ: оставляем 30% сверху под высоту пилляров
      const twByHeight = (height * 0.62) / (2.0 + (COLS + ROWS) / 8);
      TW    = Math.min(twByWidth, twByHeight, 120);
      TH    = TW / 2;
      MAX_H = TW * 2.0;
      MIN_H = TW * 0.14;
      cx    = width  / 2;
      // Центр смещён ниже середины, чтобы вершины пилляров оставались в кадре
      cy    = height * 0.65 + (COLS + ROWS - 2) * TH / 12;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const gCtrY = (COLS - 1 + ROWS - 1) / 2;
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

    // Без rx/ry — нет mouse-реакции
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

      const grd = ctx.createRadialGradient(
        cx, cy - MAX_H * 0.35, 0,
        cx, cy - MAX_H * 0.35, Math.min(width, height) * 0.5,
      );
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
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
};

// ─── Данные стека ─────────────────────────────────────────────────────────────

interface StackItem {
  name: string;
  description: string;
  badge?: string;
}

interface StackCategory {
  title: string;
  items: StackItem[];
}

const STACK_LEFT: StackCategory[] = [
  {
    title: 'Контейнеризация',
    items: [
      { name: 'Docker',           description: 'Изоляция и упаковка приложений. Одинаковое поведение в dev, staging и prod.' },
      { name: 'Dokploy',          description: 'Управление деплоем и контейнерами на сервере. Упрощает запуск и обновление.' },
      { name: 'K3s / Kubernetes', description: 'Оркестрация: масштабирование, отказоустойчивость, распределённые системы.', badge: 'soon' },
    ],
  },
  {
    title: 'Автоматизация',
    items: [
      { name: 'Bash / shell', description: 'Автоматизация рутины: деплой, настройка окружения, обслуживание инфраструктуры.' },
      { name: 'n8n',          description: 'Автоматизированные процессы и интеграции, включая сценарии с AI и внешними сервисами.' },
    ],
  },
];

const STACK_RIGHT: StackCategory[] = [
  {
    title: 'Мониторинг',
    items: [
      { name: 'Beszel',  description: 'Минималистичный мониторинг серверов с упором на простоту и контроль ресурсов.' },
      { name: 'OSSEC',   description: 'Лёгкий мониторинг безопасности и логов. Для небольших и средних инфраструктур.' },
      { name: 'Wazuh',   description: 'SIEM-платформа для анализа событий и обнаружения угроз в масштабируемых системах.' },
      { name: 'Netdata', description: 'Мониторинг в реальном времени с детализацией метрик и визуализацией состояния.' },
    ],
  },
  {
    title: 'Безопасность и качество кода',
    items: [
      { name: 'SonarQube', description: 'Анализ качества кода, поиск багов и уязвимостей на этапе разработки.' },
      { name: 'Semgrep',   description: 'Гибкий SAST с возможностью создания собственных правил безопасности.' },
      { name: 'OWASP ZAP', description: 'Динамическое тестирование (DAST): уязвимости в работающем приложении.' },
      { name: 'Trivy',     description: 'Сканирование зависимостей, контейнеров и образов на известные уязвимости.' },
    ],
  },
];

// ─── StackCard ────────────────────────────────────────────────────────────────

interface StackCardProps {
  category: StackCategory;
  isNegative: boolean;
}

const StackCard: React.FC<StackCardProps> = ({ category, isNegative }) => {
  const border  = isNegative ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const bg      = isNegative ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const nameC   = isNegative ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.8)';
  const descC   = isNegative ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.5)';
  const divC    = isNegative ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const badgeBg = isNegative ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const badgeC  = isNegative ? 'rgba(255,255,255,0.4)'  : 'rgba(0,0,0,0.4)';

  return (
    <div style={{
      position:      'relative',
      border:        `1px solid ${border}`,
      background:    bg,
      borderRadius:  16,
      padding:       '1.25rem 1.35rem',
      overflow:      'hidden',
      // Карточки растягиваются на всю высоту своей grid-ячейки
      display:       'flex',
      flexDirection: 'column',
      height:        '100%',
      boxSizing:     'border-box',
    }}>
      <GlowingEffectInline
        spread={40} glow disabled={false}
        proximity={60} inactiveZone={0.01}
        borderWidth={1.5} isNegative={isNegative}
      />

      {/* Category label */}
      <div style={{
        fontSize:      '0.72rem',
        fontWeight:    700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color:         isNegative ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
        marginBottom:  '0.85rem',
        fontFamily:    'Inter, system-ui, sans-serif',
        position:      'relative',
        zIndex:        1,
        flexShrink:    0,
      }}>
        {category.title}
      </div>

      {/* Items */}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize:   'clamp(0.88rem, 1.2vw, 0.95rem)',
                  fontWeight: 600,
                  color:      nameC,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  lineHeight: 1.3,
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
              <span style={{
                fontSize:   'clamp(0.8rem, 1.1vw, 0.87rem)',
                color:      descC,
                lineHeight: 1.55,
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
          Десктоп: [left] [canvas] [right]
          Обе карточки-колонки — одинаковая высота через явные grid rows
        */
        .ts-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr 1fr;
          /* 2 строки под карточки, canvas занимает span 2 */
          grid-template-rows: 1fr 1fr;
          gap: clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.5rem);
        }

        /* Левая колонка — 2 карточки, каждая в своей row */
        .ts-card-l0 { grid-column: 1; grid-row: 1; }
        .ts-card-l1 { grid-column: 1; grid-row: 2; }

        /* Правая колонка */
        .ts-card-r0 { grid-column: 3; grid-row: 1; }
        .ts-card-r1 { grid-column: 3; grid-row: 2; }

        /* Canvas — центральная колонка, span обе строки */
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
          Мобилка ≤ 900px:
          Сначала canvas, потом карточки (2 col)
        */
        @media (max-width: 900px) {
          .ts-grid {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto auto auto;
          }

          .ts-canvas-cell {
            grid-column: 1 / -1;
            grid-row: 1;
          }
          .ts-canvas-wrap {
            min-height: clamp(240px, 55vw, 380px);
          }

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
          .ts-canvas-wrap { min-height: clamp(220px, 70vw, 320px); }

          .ts-card-l0 { grid-column: 1; grid-row: 2; }
          .ts-card-r0 { grid-column: 1; grid-row: 3; }
          .ts-card-l1 { grid-column: 1; grid-row: 4; }
          .ts-card-r1 { grid-column: 1; grid-row: 5; }
        }
      `}</style>

      <div className="ts-inner">
        {/* Заголовок */}
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

          <h2 style={{
            fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin:     '0 0 1.5rem',
            color:      textMain,
            fontFamily: 'Inter, sans-serif',
          }}>
            <ShinyText
              text="Технологический стек"
              speed={5}
              color={shinyBase}
              shineColor={shinyGlow}
              spread={120}
            />
          </h2>

          <p style={{
            fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin:     0,
            color:      textMut,
            fontFamily: 'Inter, sans-serif',
          }}>
            Инструменты и подходы, которые мы используем в реальных проектах — для разработки, инфраструктуры и безопасности.
          </p>
        </div>

        {/* Грид */}
        <div className="ts-grid">

          {/* Canvas (центр на десктопе, топ на мобилке) */}
          <div className="ts-canvas-cell">
            <div className="ts-canvas-wrap">
              <IsometricPillars isNegative={isNegative} />
            </div>
          </div>

          {/* Левые карточки */}
          <div className="ts-card-l0"><StackCard category={STACK_LEFT[0]} isNegative={isNegative} /></div>
          <div className="ts-card-l1"><StackCard category={STACK_LEFT[1]} isNegative={isNegative} /></div>

          {/* Правые карточки */}
          <div className="ts-card-r0"><StackCard category={STACK_RIGHT[0]} isNegative={isNegative} /></div>
          <div className="ts-card-r1"><StackCard category={STACK_RIGHT[1]} isNegative={isNegative} /></div>

        </div>
      </div>
    </section>
  );
};

export default TechStackSection;