---
title: "Скрытый текст"
description: UI Компонент. Текст скрыт облаком мерцающих частиц. При наведении частицы собираются на исходные позиции и текст проявляется. Canvas-анимация с шумовым движением, sparkle-эффектом и плавным reveal.
date: 2026-05-07
tags: разработка, ui, ui-компоненты
keywords: magic text reveal, particle text, canvas particles, hover reveal, hidden text, sparkle animation
robots: index, follow
lang: ru
---

[uic:magic-text-reveal]

Текст растеризуется в offscreen Canvas и превращается в облако частиц. Каждая частица блуждает вокруг своей исходной позиции с шумовым движением и непрерывно мерцает, меняя прозрачность. При наведении курсора частицы притягиваются обратно к исходным координатам, а поверх них проявляется настоящий HTML-текст. Никаких внешних зависимостей — только нативный Canvas API.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `react` | `^18` или `^19` | Базовый фреймворк |

Внешних зависимостей нет.

---

## Установка

Скопируй файл `magic-text-reveal.tsx` в свой проект.

---

## Использование

```tsx
import MagicTextReveal from '@/features/ui-components/magic-text-reveal/magic-text-reveal';

// Базовый пример
<MagicTextReveal text="Hover me" />

// Плотное облако частиц, медленное движение
<MagicTextReveal
  text="Тайный текст"
  spread={20}
  speed={0.2}
  density={2}
/>

// Широко рассеянные частицы, быстрое возвращение
<MagicTextReveal
  text="REVEAL"
  spread={80}
  speed={1.5}
  density={5}
  fontSize={90}
  fontWeight={900}
/>

// Текст остаётся видимым после первого наведения
<MagicTextReveal
  text="Открыт навсегда"
  resetOnMouseLeave={false}
/>

// Кастомный цвет и стиль контейнера
<MagicTextReveal
  text="Gradient"
  color="rgba(251, 146, 60, 1)"
  fontSize={60}
  style={{ borderRadius: '1.5rem' }}
/>
```

---

## Оригинальный код

```tsx
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
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `text` | `string` | `'Magic Text'` | Скрытый текст для проявления |
| `color` | `string` | `'rgba(255,255,255,1)'` | Цвет текста и частиц. Любой CSS-цвет включая rgba |
| `fontSize` | `number` | `70` | Размер шрифта в пикселях |
| `fontFamily` | `string` | `'inherit'` | Семейство шрифтов. `'inherit'` берёт шрифт из родителя |
| `fontWeight` | `number` | `600` | Жирность шрифта (100–900) |
| `spread` | `number` | `40` | Радиус блуждания частиц вокруг исходной позиции в пикселях |
| `speed` | `number` | `0.5` | Скорость движения частиц. Влияет на плавность и хаотичность |
| `density` | `number` | `4` | Плотность частиц от `1` (максимум) до `5` (минимум) |
| `resetOnMouseLeave` | `boolean` | `true` | Рассеивать частицы обратно при уходе курсора |
| `className` | `string` | `''` | CSS классы на корневом `<div>` |
| `style` | `CSSProperties` | `{}` | Инлайн-стили на корневом контейнере |

---

## Как работает анимация

Компонент проходит два этапа при монтировании и при изменении пропсов.

**Растеризация текста.** Сначала измеряются реальные размеры текста через `ctx.measureText()` — это нужно чтобы задать правильный размер контейнера. Затем текст рисуется в offscreen Canvas с нужными шрифтом и цветом. `ctx.getImageData()` сканирует пиксели с шагом `sampleRate = baseSampleRate × transformedDensity`. Каждый непрозрачный пиксель становится частицей.

**Структура частицы.** У каждой частицы есть два набора координат: `originalX/Y` (исходная позиция в тексте) и `x/y` (текущая). При создании частица получает случайное смещение от исходной позиции в радиусе `spreadRadius`, а также уникальные параметры движения: `floatingSpeed`, `floatingAngle`, `sparkleSpeed`.

**Анимационный цикл** работает через `requestAnimationFrame` и обновляет частицы в двух режимах:

*Режим покоя (курсор не на компоненте):*
Каждый кадр вычисляется новая целевая позиция на основе шумовой функции из суммы синусоид с уникальным фазовым сдвигом (`floatingSpeed × 2000`). Частица плавно движется к цели с добавлением случайного джиттера. Мягкая граница `FLOAT_RADIUS` возвращает частицу если она улетела слишком далеко. Прозрачность непрерывно колеблется между почти нулём и `originalAlpha × 3` — создаётся sparkle-эффект.

*Режим hover:*
Частица движется прямолинейно к `originalX/Y` со скоростью `RETURN_SPEED`. Одновременно прозрачность быстро падает к нулю (`FADE_SPEED = 13`). Когда частицы «схлопнулись», поверх проявляется HTML-слой с настоящим текстом через `opacity: 1`.

**DPR-адаптация.** Компонент использует `devicePixelRatio × 1.5` для чёткости на Retina-экранах. Все координаты частиц хранятся в физических пикселях Canvas, при рендеринге делятся на DPR обратно.

**Батчинг рендера.** Вместо отдельного `fillRect` на каждую частицу, компонент группирует частицы по цвету через `Map`. Один `fillStyle` применяется сразу ко всем частицам одного цвета — это существенно снижает количество вызовов Canvas API.

:::tip
`density: 1` создаёт максимально плотное облако — каждый пиксель текста становится частицей. Для крупного текста это может быть тысячи частиц. Если нужна производительность — ставь `density: 3–5`.
:::

:::note
`fontFamily: 'inherit'` работает только если родительский элемент явно задаёт шрифт. Для надёжности лучше передать конкретное название: `fontFamily="'Geist', sans-serif"`. Компонент ждёт загрузки шрифтов через `document.fonts` не нужно — шрифты берутся из текущего контекста.
:::

:::tip
`resetOnMouseLeave: false` полезен для интерактивных UI-элементов типа кнопок или заголовков, которые должны «открыться» один раз при первом наведении и остаться видимыми. Текст остаётся в HTML-слое, частицы больше не анимируются.
:::