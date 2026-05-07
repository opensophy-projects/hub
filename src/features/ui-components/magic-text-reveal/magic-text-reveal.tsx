'use client'
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface Particle {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  color: string;
  opacity: number;
  originalAlpha: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  speed: number;
  floatingOffsetX: number;
  floatingOffsetY: number;
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

// Измеряет реальный px-размер шрифта из CSS-значения (например clamp(...))
function resolveNumericFontSize(fontSizePx: number): number {
  return fontSizePx;
}

export const MagicTextReveal: React.FC<MagicTextRevealProps> = ({
  text = "Magic Text",
  color = "rgba(255, 255, 255, 1)",
  fontSize = 70,
  fontFamily = "Jakarta Sans, sans-serif",
  fontWeight = 600,
  spread = 40,
  speed = 0.5,
  density = 4,
  resetOnMouseLeave = true,
  className = "",
  style = {}
}) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef  = useRef<number>(performance.now());

  const [isHovered,    setIsHovered]    = useState(false);
  const [showText,     setShowText]     = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  // Размеры канваса вычисляются из реального размера текста через off-screen canvas,
  // с padding = spread чтобы частицы не вылезали за видимую область
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const transformedDensity = 6 - density;

  // DPR с запасом для чёткости
  const globalDpr = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return (window.devicePixelRatio || 1) * 1.5;
  }, []);

  // Вычисляем размер канваса по реальным метрикам текста + отступ для частиц
  useEffect(() => {
    if (typeof window === "undefined") return;

    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const resolvedSize = resolveNumericFontSize(fontSize);
    ctx.font = `${fontWeight} ${resolvedSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);

    // Реальная ширина текста
    const textW = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    // Реальная высота текста
    const textH = (metrics.actualBoundingBoxAscent || resolvedSize) +
                  (metrics.actualBoundingBoxDescent || resolvedSize * 0.2);

    // Добавляем spread с обеих сторон чтобы частицы не обрезались
    const padding = spread * 1.5;
    const w = Math.ceil(textW + padding * 2);
    const h = Math.ceil(textH + padding * 2);

    setCanvasSize({ w, h });
  }, [text, fontSize, fontFamily, fontWeight, spread]);

  // Создание частиц из растеризованного текста
  const createParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    text: string,
    textX: number,
    textY: number,
    font: string,
    color: string,
    density: number
  ): Particle[] => {
    const particles: Particle[] = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.imageSmoothingEnabled = true;
    ctx.fillText(text, textX, textY);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const dpr         = canvas.width / parseInt(canvas.style.width || String(canvas.width));
    const sampleRate  = Math.max(2, Math.round(dpr)) * density;

    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    for (let y = 0; y < canvas.height; y += sampleRate) {
      for (let x = 0; x < canvas.width; x += sampleRate) {
        if (data[(y * canvas.width + x) * 4 + 3] > 0) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }

    const spreadRadius = Math.max(maxX - minX, maxY - minY) * 0.1;

    for (let y = 0; y < canvas.height; y += sampleRate) {
      for (let x = 0; x < canvas.width; x += sampleRate) {
        const idx   = (y * canvas.width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 0) {
          const originalAlpha = alpha / 255;
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * spreadRadius;
          particles.push({
            x: x + Math.cos(a) * d,
            y: y + Math.sin(a) * d,
            originalX: x,
            originalY: y,
            color: `rgba(${data[idx]},${data[idx+1]},${data[idx+2]},${originalAlpha})`,
            opacity: originalAlpha * 0.3,
            originalAlpha,
            velocityX: 0, velocityY: 0,
            angle: Math.random() * Math.PI * 2,
            speed: 0,
            floatingOffsetX: 0, floatingOffsetY: 0,
            floatingSpeed: Math.random() * 2 + 1,
            floatingAngle: Math.random() * Math.PI * 2,
            targetOpacity: Math.random() * originalAlpha * 0.5,
            sparkleSpeed: Math.random() * 2 + 1,
          });
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return particles;
  }, []);

  // Обновление физики частиц
  const updateParticles = useCallback((
    particles: Particle[],
    dt: number,
    isHovered: boolean,
    showText: boolean,
    setShowText: (v: boolean) => void,
    spread: number,
    speed: number
  ) => {
    const FLOAT_RADIUS     = spread;
    const RETURN_SPEED     = 3;
    const FLOAT_SPEED      = speed;
    const TRANSITION_SPEED = 5 * FLOAT_SPEED;
    const NOISE_SCALE      = 0.6;
    const CHAOS_FACTOR     = 1.3;
    const FADE_SPEED       = 13;

    particles.forEach(p => {
      if (isHovered) {
        const dx = p.originalX - p.x, dy = p.originalY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1) {
          p.x += (dx / dist) * RETURN_SPEED * dt * 60;
          p.y += (dy / dist) * RETURN_SPEED * dt * 60;
        } else {
          p.x = p.originalX; p.y = p.originalY;
        }
        p.opacity = Math.max(0, p.opacity - FADE_SPEED * dt);
      } else {
        p.floatingAngle += dt * p.floatingSpeed * (1 + Math.random() * CHAOS_FACTOR);
        const t  = Date.now() * 0.001;
        const uo = p.floatingSpeed * 2000;
        const nx = (Math.sin(t * p.floatingSpeed + p.floatingAngle) * 1.2 +
                    Math.sin((t + uo) * 0.5) * 0.8 +
                    (Math.random() - 0.5) * CHAOS_FACTOR) * NOISE_SCALE;
        const ny = (Math.cos(t * p.floatingSpeed + p.floatingAngle * 1.5) * 0.6 +
                    Math.cos((t + uo) * 0.5) * 0.4 +
                    (Math.random() - 0.5) * CHAOS_FACTOR) * NOISE_SCALE;

        const tx = p.originalX + FLOAT_RADIUS * nx;
        const ty = p.originalY + FLOAT_RADIUS * ny;
        const dx = tx - p.x, dy = ty - p.y;
        const distT = Math.sqrt(dx * dx + dy * dy);
        const js    = Math.min(1, distT / (FLOAT_RADIUS * 1.5));
        p.x += dx * TRANSITION_SPEED * dt + (Math.random() - 0.5) * FLOAT_SPEED * js;
        p.y += dy * TRANSITION_SPEED * dt + (Math.random() - 0.5) * FLOAT_SPEED * js;

        const distO = Math.sqrt(Math.pow(p.x - p.originalX, 2) + Math.pow(p.y - p.originalY, 2));
        if (distO > FLOAT_RADIUS) {
          const a = Math.atan2(p.y - p.originalY, p.x - p.originalX);
          const pb = (distO - FLOAT_RADIUS) * 0.1;
          p.x -= Math.cos(a) * pb; p.y -= Math.sin(a) * pb;
        }

        const od = p.targetOpacity - p.opacity;
        p.opacity += od * p.sparkleSpeed * dt * 3;
        if (Math.abs(od) < 0.01) {
          p.targetOpacity = Math.random() < 0.5
            ? Math.random() * 0.1 * p.originalAlpha
            : p.originalAlpha * 3;
          p.sparkleSpeed = Math.random() * 3 + 1;
        }
      }
    });

    if (isHovered && !showText)  setShowText(true);
    if (!isHovered && showText)  setShowText(false);
  }, []);

  // Рендер частиц батчами по цвету
  const renderParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    dpr: number
  ) => {
    ctx.save();
    ctx.scale(dpr, dpr);

    const byColor = new Map<string, Array<{x: number; y: number}>>();
    particles.forEach(p => {
      if (p.opacity <= 0) return;
      const c = p.color.replace(/[\d.]+\)$/, `${p.opacity})`);
      if (!byColor.has(c)) byColor.set(c, []);
      byColor.get(c)!.push({ x: p.x / dpr, y: p.y / dpr });
    });
    byColor.forEach((pts, c) => {
      ctx.fillStyle = c;
      pts.forEach(({ x, y }) => ctx.fillRect(x, y, 1, 1));
    });

    ctx.restore();
  }, []);

  // Перестройка канваса при изменении размера или пропсов
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.w <= 0 || canvasSize.h <= 0) return;

    const { w, h } = canvasSize;
    canvas.width        = w * globalDpr;
    canvas.height       = h * globalDpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const font = `${fontWeight} ${fontSize * globalDpr}px ${fontFamily}`;
    const particles = createParticles(
      ctx, canvas, text,
      canvas.width / 2, canvas.height / 2,
      font, color, transformedDensity
    );
    particlesRef.current = particles;
    renderParticles(ctx, particles, globalDpr);
  }, [canvasSize, globalDpr, text, fontSize, fontFamily, fontWeight, color, transformedDensity, createParticles, renderParticles]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  // Анимационный цикл
  useEffect(() => {
    const animate = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      const ctx    = canvas?.getContext("2d");

      if (!canvas || !ctx || !particlesRef.current.length) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateParticles(particlesRef.current, dt, isHovered, showText, setShowText, spread, speed);
      renderParticles(ctx, particlesRef.current, globalDpr);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isHovered, showText, spread, speed, globalDpr, updateParticles, renderParticles]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setHasBeenShown(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (resetOnMouseLeave || !hasBeenShown) setIsHovered(false);
  }, [resetOnMouseLeave, hasBeenShown]);

  // Wrapper sized по канвасу (= по тексту + padding).
  // display: inline-flex → размер по содержимому, центрируется родителем (ComponentWrapper flex).
  // overflow: visible → частицы никогда не обрезаются, любой scale безопасен.
  const wrapperW = canvasSize.w || 'auto';
  const wrapperH = canvasSize.h || 'auto';

  return (
    <div
      ref={wrapperRef}
      className={`relative flex items-center justify-center rounded-lg transition-all duration-300 ${className}`}
      style={{
        width:    wrapperW,
        height:   wrapperH,
        flexShrink: 0,
        // overflow: visible — частицы не обрезаются при любом zoom/scale
        overflow: 'visible',
        backgroundColor: 'rgba(15, 15, 15, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Текст проявляется при ховере */}
      <div
        className={`absolute z-10 transition-opacity duration-200 pointer-events-none select-none ${
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
          textAlign: 'center',
        }}
      >
        {text}
      </div>

      {/* Канвас с частицами */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};