import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  color: string;
  opacity: number;
  originalAlpha: number;
  floatingSpeed: number;
  floatingAngle: number;
  targetOpacity: number;
  sparkleSpeed: number;
}

interface MagicTextRevealProps {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  spread?: number;
  speed?: number;
  density?: number;
  resetOnMouseLeave?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const MagicTextReveal: React.FC<MagicTextRevealProps> = ({
  text = 'Magic Text',
  color = 'rgba(255, 255, 255, 1)',
  fontSize = 70,
  fontFamily = 'inherit',
  fontWeight = 600,
  spread = 40,
  speed = 0.5,
  density = 4,
  resetOnMouseLeave = true,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const [isHovered, setIsHovered] = useState(false);
  const [showText, setShowText] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  // шаг сканирования в CSS-пикселях
  const sampleStep = Math.max(1, 7 - density);

  // Рисуем частицы — контекст уже настроен с setTransform(dpr,0,0,dpr,0,0)
  // значит 1 единица = 1 CSS-пиксель, координаты частиц тоже в CSS-пикселях
  const renderParticles = useCallback(
    (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
      const byColor = new Map<string, Array<{ x: number; y: number }>>();

      for (const p of particles) {
        if (p.opacity <= 0.005) continue;
        const clr = p.color.replace(/[\d.]+\)$/, `${Math.min(1, p.opacity)})`);
        if (!byColor.has(clr)) byColor.set(clr, []);
        byColor.get(clr)!.push({ x: p.x, y: p.y });
      }

      byColor.forEach((positions, clr) => {
        ctx.fillStyle = clr;
        for (const { x, y } of positions) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      });
    },
    []
  );

  // Создаём частицы — все координаты в CSS-пикселях
  const buildParticles = useCallback(
    (cssW: number, cssH: number): Particle[] => {
      const dpr = window.devicePixelRatio || 1;

      // Offscreen canvas в физических пикселях для чёткого sampling
      const offscreen = document.createElement('canvas');
      offscreen.width = cssW * dpr;
      offscreen.height = cssH * dpr;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return [];

      // Рисуем текст в CSS-единицах через scale
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = color;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cssW / 2, cssH / 2);

      // Читаем физические пиксели
      const physW = cssW * dpr;
      const physH = cssH * dpr;
      const imageData = ctx.getImageData(0, 0, physW, physH);
      const data = imageData.data;

      // Шаг в физических пикселях
      const physStep = Math.max(1, Math.round(sampleStep * dpr));

      const particles: Particle[] = [];

      for (let py = 0; py < physH; py += physStep) {
        for (let px = 0; px < physW; px += physStep) {
          const idx = (py * physW + px) * 4;
          const alpha = data[idx + 3];
          if (alpha < 10) continue;

          const originalAlpha = alpha / 255;

          // Переводим физические координаты в CSS-пиксели
          const cssX = px / dpr;
          const cssY = py / dpr;

          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * spread * 0.3;

          particles.push({
            x: cssX + Math.cos(angle) * dist,
            y: cssY + Math.sin(angle) * dist,
            originalX: cssX,
            originalY: cssY,
            color: `rgba(${data[idx]},${data[idx + 1]},${data[idx + 2]},1)`,
            opacity: originalAlpha * 0.4,
            originalAlpha,
            floatingSpeed: Math.random() * 2 + 0.5,
            floatingAngle: Math.random() * Math.PI * 2,
            targetOpacity: Math.random() * originalAlpha * 0.6,
            sparkleSpeed: Math.random() * 2 + 1,
          });
        }
      }

      return particles;
    },
    [text, fontSize, fontFamily, fontWeight, color, sampleStep, spread]
  );

  // Пересчёт canvas + генерация частиц
  const rebuild = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const cssW = wrapper.clientWidth;
    const cssH = wrapper.clientHeight;
    if (!cssW || !cssH) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем transform один раз: 1 единица = 1 CSS-пиксель
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles = buildParticles(cssW, cssH);
    particlesRef.current = particles;

    ctx.clearRect(0, 0, cssW, cssH);
    renderParticles(ctx, particles);
  }, [buildParticles, renderParticles]);

  // ResizeObserver — перестраиваем при изменении размера
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => rebuild());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [rebuild]);

  // Анимационный цикл
  useEffect(() => {
    const RETURN_SPEED = 4;
    const FLOAT_SPEED = speed;
    const TRANSITION_SPEED = 5 * FLOAT_SPEED;
    const NOISE_SCALE = 0.6;
    const CHAOS_FACTOR = 1.3;
    const FADE_SPEED = 10;

    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const particles = particlesRef.current;

      if (!canvas || !ctx || !particles.length) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;

      // Каждый кадр восстанавливаем transform (clearRect сбрасывает состояние)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const t = Date.now() * 0.001;

      for (const p of particles) {
        if (isHovered) {
          const dx = p.originalX - p.x;
          const dy = p.originalY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.5) {
            p.x += (dx / dist) * RETURN_SPEED * dt * 60;
            p.y += (dy / dist) * RETURN_SPEED * dt * 60;
          } else {
            p.x = p.originalX;
            p.y = p.originalY;
          }
          p.opacity = Math.max(0, p.opacity - FADE_SPEED * dt);
        } else {
          p.floatingAngle += dt * p.floatingSpeed * (1 + Math.random() * CHAOS_FACTOR);

          const uid = p.floatingSpeed * 2000;
          const nx =
            (Math.sin(t * p.floatingSpeed + p.floatingAngle) * 1.2 +
              Math.sin((t + uid) * 0.5) * 0.8 +
              (Math.random() - 0.5) * CHAOS_FACTOR) *
            NOISE_SCALE;
          const ny =
            (Math.cos(t * p.floatingSpeed + p.floatingAngle * 1.5) * 0.6 +
              Math.cos((t + uid) * 0.5) * 0.4 +
              (Math.random() - 0.5) * CHAOS_FACTOR) *
            NOISE_SCALE;

          const tx = p.originalX + spread * nx;
          const ty = p.originalY + spread * ny;
          const dx = tx - p.x;
          const dy = ty - p.y;
          const dft = Math.sqrt(dx * dx + dy * dy);
          const jitter = Math.min(1, dft / (spread * 1.5));

          p.x += dx * TRANSITION_SPEED * dt + (Math.random() - 0.5) * FLOAT_SPEED * jitter;
          p.y += dy * TRANSITION_SPEED * dt + (Math.random() - 0.5) * FLOAT_SPEED * jitter;

          // мягкая граница
          const dfo = Math.sqrt((p.x - p.originalX) ** 2 + (p.y - p.originalY) ** 2);
          if (dfo > spread) {
            const a = Math.atan2(p.y - p.originalY, p.x - p.originalX);
            const pull = (dfo - spread) * 0.1;
            p.x -= Math.cos(a) * pull;
            p.y -= Math.sin(a) * pull;
          }

          // sparkle
          const od = p.targetOpacity - p.opacity;
          p.opacity += od * p.sparkleSpeed * dt * 3;
          if (Math.abs(od) < 0.01) {
            p.targetOpacity =
              Math.random() < 0.5
                ? Math.random() * 0.1 * p.originalAlpha
                : p.originalAlpha * 3;
            p.sparkleSpeed = Math.random() * 3 + 1;
          }
        }
      }

      renderParticles(ctx, particles);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isHovered, spread, speed, renderParticles]);

  // showText синхронизация с isHovered
  useEffect(() => {
    if (isHovered && !showText) setShowText(true);
    if (!isHovered && showText) setShowText(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setHasBeenShown(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (resetOnMouseLeave || !hasBeenShown) setIsHovered(false);
  }, [resetOnMouseLeave, hasBeenShown]);

  return (
    <div
      ref={wrapperRef}
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '150px',
        minHeight: '80px',
        cursor: 'pointer',
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* HTML-текст поверх — проявляется при hover */}
      <div
        className={`absolute z-10 transition-opacity duration-200 select-none pointer-events-none ${
          showText ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          color,
          fontFamily,
          fontWeight,
          fontSize: `${fontSize}px`,
          whiteSpace: 'nowrap',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {text}
      </div>

      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};

export default MagicTextReveal;