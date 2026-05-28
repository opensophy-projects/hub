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

// Конфигурация для создания частиц
interface CreateParticlesConfig {
  text: string;
  font: string;
  color: string;
  density: number;
}

// Константы физики частиц
interface PhysicsConfig {
  floatRadius: number;
  floatSpeed: number;
  transitionSpeed: number;
  noiseScale: number;
  chaosFactor: number;
  returnSpeed: number;
  fadeSpeed: number;
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
  // с padding = spread, чтобы частицы не вылезали за видимую область
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const transformedDensity = 6 - density;

  // DPR с запасом для чёткости
  const globalDpr = useMemo(() => {
    if (globalThis.window === undefined) { return 1; }
    return (globalThis.window.devicePixelRatio || 1) * 1.5;
  }, []);

  // Вычисляем размер канваса по реальным метрикам текста + отступ для частиц
  useEffect(() => {
    if (globalThis.window === undefined) { return; }

    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d');
    if (!ctx) { return; }

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);

    const textW = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const textH = (metrics.actualBoundingBoxAscent || fontSize) +
                  (metrics.actualBoundingBoxDescent || fontSize * 0.2);

    const padding = spread * 1.5;
    const w = Math.ceil(textW + padding * 2);
    const h = Math.ceil(textH + padding * 2);

    setCanvasSize({ w, h });
  }, [text, fontSize, fontFamily, fontWeight, spread]);

  // Сканирование пикселей для определения границ текста
  const scanTextBounds = useCallback((
    data: Uint8ClampedArray,
    canvasWidth: number,
    canvasHeight: number,
    sampleRate: number
  ) => {
    let minX = canvasWidth, maxX = 0, minY = canvasHeight, maxY = 0;
    for (let y = 0; y < canvasHeight; y += sampleRate) {
      for (let x = 0; x < canvasWidth; x += sampleRate) {
        if (data[(y * canvasWidth + x) * 4 + 3] > 0) {
          if (x < minX) { minX = x; }
          if (x > maxX) { maxX = x; }
          if (y < minY) { minY = y; }
          if (y > maxY) { maxY = y; }
        }
      }
    }
    return { minX, maxX, minY, maxY };
  }, []);

  // Создание частиц из растеризованного текста
  const createParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: CreateParticlesConfig
  ): Particle[] => {
    const { text: particleText, font, color: particleColor, density: particleDensity } = config;
    const particles: Particle[] = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = particleColor;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.imageSmoothingEnabled = true;
    ctx.fillText(particleText, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const styleWidth = Number.parseInt(canvas.style.width || String(canvas.width), 10);
    const computedDpr = canvas.width / styleWidth;
    const sampleRate = Math.max(2, Math.round(computedDpr)) * particleDensity;

    const { minX, maxX, minY, maxY } = scanTextBounds(data, canvas.width, canvas.height, sampleRate);
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
  }, [scanTextBounds]);

  // Обновление частицы в режиме ховера — возврат на исходную позицию
  const updateHoveredParticle = useCallback((p: Particle, dt: number, physics: PhysicsConfig) => {
    const dx = p.originalX - p.x;
    const dy = p.originalY - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.1) {
      p.x += (dx / dist) * physics.returnSpeed * dt * 60;
      p.y += (dy / dist) * physics.returnSpeed * dt * 60;
    } else {
      p.x = p.originalX;
      p.y = p.originalY;
    }
    p.opacity = Math.max(0, p.opacity - physics.fadeSpeed * dt);
  }, []);

  // Обновление частицы в режиме парения — хаотичное движение вокруг исходной позиции
  const updateFloatingParticle = useCallback((p: Particle, dt: number, physics: PhysicsConfig) => {
    const { floatRadius, floatSpeed, transitionSpeed, noiseScale, chaosFactor } = physics;
    p.floatingAngle += dt * p.floatingSpeed * (1 + Math.random() * chaosFactor);
    const t  = Date.now() * 0.001;
    const uo = p.floatingSpeed * 2000;
    const nx = (Math.sin(t * p.floatingSpeed + p.floatingAngle) * 1.2 +
                Math.sin((t + uo) * 0.5) * 0.8 +
                (Math.random() - 0.5) * chaosFactor) * noiseScale;
    const ny = (Math.cos(t * p.floatingSpeed + p.floatingAngle * 1.5) * 0.6 +
                Math.cos((t + uo) * 0.5) * 0.4 +
                (Math.random() - 0.5) * chaosFactor) * noiseScale;

    const tx = p.originalX + floatRadius * nx;
    const ty = p.originalY + floatRadius * ny;
    const dx = tx - p.x;
    const dy = ty - p.y;
    const distT = Math.hypot(dx, dy);
    const js    = Math.min(1, distT / (floatRadius * 1.5));
    p.x += dx * transitionSpeed * dt + (Math.random() - 0.5) * floatSpeed * js;
    p.y += dy * transitionSpeed * dt + (Math.random() - 0.5) * floatSpeed * js;

    const distO = Math.hypot(p.x - p.originalX, p.y - p.originalY);
    if (distO > floatRadius) {
      const a = Math.atan2(p.y - p.originalY, p.x - p.originalX);
      const pb = (distO - floatRadius) * 0.1;
      p.x -= Math.cos(a) * pb;
      p.y -= Math.sin(a) * pb;
    }

    const od = p.targetOpacity - p.opacity;
    p.opacity += od * p.sparkleSpeed * dt * 3;
    if (Math.abs(od) < 0.01) {
      p.targetOpacity = Math.random() < 0.5
        ? Math.random() * 0.1 * p.originalAlpha
        : p.originalAlpha * 3;
      p.sparkleSpeed = Math.random() * 3 + 1;
    }
  }, []);

  // Обновление физики всех частиц
  const updateParticles = useCallback((
    particles: Particle[],
    dt: number,
    hovered: boolean,
    textVisible: boolean,
    setTextVisible: (v: boolean) => void,
    spreadRadius: number,
    animSpeed: number
  ) => {
    const physics: PhysicsConfig = {
      floatRadius:      spreadRadius,
      returnSpeed:      3,
      floatSpeed:       animSpeed,
      transitionSpeed:  5 * animSpeed,
      noiseScale:       0.6,
      chaosFactor:      1.3,
      fadeSpeed:        13,
    };

    particles.forEach(p => {
      if (hovered) {
        updateHoveredParticle(p, dt, physics);
      } else {
        updateFloatingParticle(p, dt, physics);
      }
    });

    if (hovered && !textVisible)  { setTextVisible(true); }
    if (!hovered && textVisible)  { setTextVisible(false); }
  }, [updateHoveredParticle, updateFloatingParticle]);

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
      if (p.opacity <= 0) { return; }
      const c = p.color.replace(/[\d.]+\)$/, `${p.opacity})`);
      if (!byColor.has(c)) { byColor.set(c, []); }
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
    if (!canvas || canvasSize.w <= 0 || canvasSize.h <= 0) { return; }

    const { w, h } = canvasSize;
    canvas.width        = w * globalDpr;
    canvas.height       = h * globalDpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) { return; }

    const font = `${fontWeight} ${fontSize * globalDpr}px ${fontFamily}`;
    const particles = createParticles(ctx, canvas, {
      text,
      font,
      color,
      density: transformedDensity,
    });
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
    return () => {
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); }
    };
  }, [isHovered, showText, spread, speed, globalDpr, updateParticles, renderParticles]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setHasBeenShown(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (resetOnMouseLeave || !hasBeenShown) { setIsHovered(false); }
  }, [resetOnMouseLeave, hasBeenShown]);

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