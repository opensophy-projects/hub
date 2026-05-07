---
title: "Размытый текст"
description: UI Компонент. Текст с эффектом случайного фаззинга строк через Canvas. Каждая строка пикселей независимо смещается по горизонтали, создавая органичный шум. Поддерживает hover, глитч-режим, градиент и плавные переходы.
date: 2026-05-06
tags: разработка, ui, ui-компоненты
keywords: fuzzy text, canvas text animation, glitch text, noise text, react canvas
robots: index, follow
lang: ru
---

[uic:fuzzy-text]

Текст рендерится в Canvas. Каждая горизонтальная строка пикселей независимо смещается по оси X (или Y, или обеим) на случайную величину, ограниченную `fuzzRange * intensity`. Интенсивность плавно меняется при наведении, клике или в глитч-режиме. Никаких внешних зависимостей — только нативный Canvas API и `requestAnimationFrame`.

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `react` | `^18` или `^19` | Базовый фреймворк |

Внешних зависимостей нет — только нативный Canvas API и `requestAnimationFrame`.

---

## Установка

Внешних пакетов не требуется. Скопируй файл `fuzzy-text.tsx` в свой проект.

---

## Использование

```tsx
import FuzzyText from '@/features/ui-components/fuzzy-text/fuzzy-text';

// Базовый пример
<FuzzyText>Fuzzy</FuzzyText>

// С кастомной интенсивностью и диапазоном
<FuzzyText
  baseIntensity={0.1}
  hoverIntensity={0.8}
  fuzzRange={40}
>
  Hover me
</FuzzyText>

// Глитч-режим — периодические вспышки
<FuzzyText
  glitchMode
  glitchInterval={3000}
  glitchDuration={150}
  baseIntensity={0.05}
>
  GLITCH
</FuzzyText>

// Вертикальный фаззинг
<FuzzyText direction="vertical" fuzzRange={15}>
  Vertical
</FuzzyText>

// Градиентный текст
<FuzzyText gradient={['#f97316', '#ec4899', '#8b5cf6']}>
  Gradient
</FuzzyText>

// Плавный переход интенсивности при hover
<FuzzyText
  transitionDuration={300}
  baseIntensity={0.05}
  hoverIntensity={0.6}
>
  Smooth
</FuzzyText>

// Вспышка при клике + отключённый hover
<FuzzyText clickEffect enableHover={false}>
  Click me
</FuzzyText>
```

## Оригинальный код

```tsx
import React, { useEffect, useRef } from 'react';

interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  fps?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
  transitionDuration?: number;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  gradient?: string[] | null;
  letterSpacing?: number;
  className?: string;
}

const FuzzyText: React.FC<FuzzyTextProps> = ({
  children,
  fontSize = 'clamp(2rem, 8vw, 8rem)',
  fontWeight = 900,
  fontFamily = 'inherit',
  color = '#fff',
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = 'horizontal',
  transitionDuration = 0,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 2000,
  glitchDuration = 200,
  gradient = null,
  letterSpacing = 0,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement & { cleanupFuzzyText?: () => void }>(null);

  useEffect(() => {
    let animationFrameId: number;
    let isCancelled = false;
    let glitchTimeoutId: ReturnType<typeof setTimeout>;
    let glitchEndTimeoutId: ReturnType<typeof setTimeout>;
    let clickTimeoutId: ReturnType<typeof setTimeout>;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === 'inherit' ? window.getComputedStyle(canvas).fontFamily || 'sans-serif' : fontFamily;

      const fontSizeStr = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;

      try {
        await document.fonts.load(fontString);
      } catch {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      let numericFontSize: number;
      if (typeof fontSize === 'number') {
        numericFontSize = fontSize;
      } else {
        const temp = document.createElement('span');
        temp.style.fontSize = fontSize;
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
      }

      const text = React.Children.toArray(children).join('');

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = 'alphabetic';

      let totalWidth = 0;
      if (letterSpacing !== 0) {
        for (const char of text) {
          totalWidth += offCtx.measureText(char).width + letterSpacing;
        }
        totalWidth -= letterSpacing;
      } else {
        totalWidth = offCtx.measureText(text).width;
      }

      const metrics = offCtx.measureText(text);
      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight = letterSpacing !== 0 ? totalWidth : (metrics.actualBoundingBoxRight ?? metrics.width);
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
      const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

      const textBoundingWidth = Math.ceil(letterSpacing !== 0 ? totalWidth : actualLeft + actualRight);
      const tightHeight = Math.ceil(actualAscent + actualDescent);

      const extraWidthBuffer = 10;
      const offscreenWidth = textBoundingWidth + extraWidthBuffer;

      offscreen.width = offscreenWidth;
      offscreen.height = tightHeight;

      const xOffset = extraWidthBuffer / 2;
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = 'alphabetic';

      if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
        const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
        gradient.forEach((c, i) => grad.addColorStop(i / (gradient.length - 1), c));
        offCtx.fillStyle = grad;
      } else {
        offCtx.fillStyle = color;
      }

      if (letterSpacing !== 0) {
        let xPos = xOffset;
        for (const char of text) {
          offCtx.fillText(char, xPos, actualAscent);
          xPos += offCtx.measureText(char).width + letterSpacing;
        }
      } else {
        offCtx.fillText(text, xOffset - actualLeft, actualAscent);
      }

      const horizontalMargin = fuzzRange + 20;
      const verticalMargin = direction === 'vertical' || direction === 'both' ? fuzzRange + 10 : 0;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveLeft = horizontalMargin + xOffset;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight;

      let isHovering = false;
      let isClicking = false;
      let isGlitching = false;
      let currentIntensity = baseIntensity;
      let targetIntensity = baseIntensity;
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

      const startGlitchLoop = () => {
        if (!glitchMode || isCancelled) return;
        glitchTimeoutId = setTimeout(() => {
          if (isCancelled) return;
          isGlitching = true;
          glitchEndTimeoutId = setTimeout(() => {
            isGlitching = false;
            startGlitchLoop();
          }, glitchDuration);
        }, glitchInterval);
      };

      if (glitchMode) startGlitchLoop();

      const run = (timestamp: number) => {
        if (isCancelled) return;

        if (timestamp - lastFrameTime < frameDuration) {
          animationFrameId = window.requestAnimationFrame(run);
          return;
        }
        lastFrameTime = timestamp;

        ctx.clearRect(
          -fuzzRange - 20,
          -fuzzRange - 10,
          offscreenWidth + 2 * (fuzzRange + 20),
          tightHeight + 2 * (fuzzRange + 10)
        );

        if (isClicking) {
          targetIntensity = 1;
        } else if (isGlitching) {
          targetIntensity = 1;
        } else if (isHovering) {
          targetIntensity = hoverIntensity;
        } else {
          targetIntensity = baseIntensity;
        }

        if (transitionDuration > 0) {
          const step = 1 / (transitionDuration / frameDuration);
          if (currentIntensity < targetIntensity) {
            currentIntensity = Math.min(currentIntensity + step, targetIntensity);
          } else if (currentIntensity > targetIntensity) {
            currentIntensity = Math.max(currentIntensity - step, targetIntensity);
          }
        } else {
          currentIntensity = targetIntensity;
        }

        for (let j = 0; j < tightHeight; j++) {
          let dx = 0, dy = 0;
          if (direction === 'horizontal' || direction === 'both') {
            dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
          }
          if (direction === 'vertical' || direction === 'both') {
            dy = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5);
          }
          ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j + dy, offscreenWidth, 1);
        }
        animationFrameId = window.requestAnimationFrame(run);
      };

      animationFrameId = window.requestAnimationFrame(run);

      const isInsideTextArea = (x: number, y: number) =>
        x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom;

      const handleMouseMove = (e: MouseEvent) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleMouseLeave = () => { isHovering = false; };

      const handleClick = () => {
        if (!clickEffect) return;
        isClicking = true;
        clearTimeout(clickTimeoutId);
        clickTimeoutId = setTimeout(() => { isClicking = false; }, 150);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!enableHover) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleTouchEnd = () => { isHovering = false; };

      if (enableHover) {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
      }

      if (clickEffect) {
        canvas.addEventListener('click', handleClick);
      }

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        clearTimeout(glitchTimeoutId);
        clearTimeout(glitchEndTimeoutId);
        clearTimeout(clickTimeoutId);
        if (enableHover) {
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('mouseleave', handleMouseLeave);
          canvas.removeEventListener('touchmove', handleTouchMove);
          canvas.removeEventListener('touchend', handleTouchEnd);
        }
        if (clickEffect) {
          canvas.removeEventListener('click', handleClick);
        }
      };

      canvas.cleanupFuzzyText = cleanup;
    };

    init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      clearTimeout(glitchTimeoutId);
      clearTimeout(glitchEndTimeoutId);
      clearTimeout(clickTimeoutId);
      if (canvas && canvas.cleanupFuzzyText) {
        canvas.cleanupFuzzyText();
      }
    };
  }, [
    children, fontSize, fontWeight, fontFamily, color,
    enableHover, baseIntensity, hoverIntensity, fuzzRange,
    fps, direction, transitionDuration, clickEffect,
    glitchMode, glitchInterval, glitchDuration, gradient, letterSpacing
  ]);

  return <canvas ref={canvasRef} className={className} />;
};

export default FuzzyText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `children` | `ReactNode` | — | Текст для отображения |
| `fontSize` | `number \| string` | `'clamp(2rem, 8vw, 8rem)'` | Размер шрифта — число в px или любое CSS-значение |
| `fontWeight` | `string \| number` | `900` | Жирность шрифта |
| `fontFamily` | `string` | `'inherit'` | Семейство шрифтов. `'inherit'` берёт шрифт из родителя |
| `color` | `string` | `'#fff'` | Цвет текста. Игнорируется если задан `gradient` |
| `baseIntensity` | `number` | `0.18` | Базовая интенсивность фаззинга (0–1) |
| `hoverIntensity` | `number` | `0.5` | Интенсивность при наведении (0–1) |
| `fuzzRange` | `number` | `30` | Максимальный сдвиг строки в пикселях |
| `direction` | `'horizontal' \| 'vertical' \| 'both'` | `'horizontal'` | Направление фаззинга |
| `enableHover` | `boolean` | `true` | Реагировать на наведение мыши и касание |
| `transitionDuration` | `number` | `0` | Длительность плавного перехода интенсивности в мс. `0` — мгновенно |
| `clickEffect` | `boolean` | `false` | Вспышка интенсивности при клике (до `1`) на 150 мс |
| `glitchMode` | `boolean` | `false` | Включить автоматические вспышки глитча |
| `glitchInterval` | `number` | `2000` | Интервал между глитчами в мс |
| `glitchDuration` | `number` | `200` | Длительность одного глитча в мс |
| `gradient` | `string[] \| null` | `null` | Массив цветов для линейного градиента слева направо. Минимум 2 цвета |
| `letterSpacing` | `number` | `0` | Межбуквенный интервал в пикселях |
| `fps` | `number` | `60` | Частота кадров анимации |
| `className` | `string` | `''` | CSS классы на `<canvas>` |

---

## Как работает анимация

Компонент использует два Canvas: **offscreen** и **видимый**.

**Offscreen Canvas** рендерится один раз при монтировании — на нём рисуется исходный текст с нужным шрифтом, цветом и интервалами. Этот канвас служит источником пикселей и не обновляется.

**Видимый Canvas** в каждом кадре очищается и перерисовывается через `requestAnimationFrame`. Логика перерисовки:

```
for (let j = 0; j < tightHeight; j++) {
  dx = intensity * (Math.random() - 0.5) * fuzzRange   // горизонт.
  dy = intensity * (Math.random() - 0.5) * fuzzRange * 0.5  // верт.
  ctx.drawImage(offscreen, 0, j, width, 1, dx, j + dy, width, 1)
}
```

Для каждой горизонтальной строки пикселей вычисляется случайное смещение `dx` (и/или `dy`). `drawImage` копирует одну строку (`height=1`) из offscreen в видимый canvas со смещением. Итог — каждая строка «съехала» на разное расстояние, создавая эффект дрожащего, размытого текста.

**Интенсивность** вычисляется каждый кадр на основе состояния:

| Состояние | `targetIntensity` |
|-----------|------------------|
| Покой | `baseIntensity` |
| Hover | `hoverIntensity` |
| Glitch / Click | `1.0` |

При `transitionDuration > 0` текущая интенсивность линейно интерполируется к целевой с шагом `1 / (transitionDuration / frameDuration)`.

**Глитч-режим** запускает рекурсивный таймер: ждёт `glitchInterval` мс, ставит `isGlitching = true` на `glitchDuration` мс, затем повторяется.

**FPS-контроль** реализован через проверку `timestamp - lastFrameTime < frameDuration` — кадр пропускается если не прошло достаточно времени. Это снижает нагрузку на GPU при низких значениях `fps`.

:::tip
Для тонкого фонового эффекта используй `baseIntensity: 0.03–0.08` и `fuzzRange: 10–15`. Для агрессивного глитч-заголовка — `baseIntensity: 0.3`, `fuzzRange: 50`, `glitchMode: true`.
:::

:::note
Canvas наследует шрифт из родительского элемента при `fontFamily: 'inherit'`. Убедись что нужный шрифт загружен до монтирования компонента, иначе текст отрисуется в fallback-шрифте. Компонент ждёт `document.fonts.load()` перед первой отрисовкой.
:::

:::tip
`gradient` переопределяет `color`. Передай массив из 2+ цветов — компонент создаст `LinearGradient` слева направо через весь текст. Например: `gradient={['#f97316', '#ec4899', '#8b5cf6']}`.
:::