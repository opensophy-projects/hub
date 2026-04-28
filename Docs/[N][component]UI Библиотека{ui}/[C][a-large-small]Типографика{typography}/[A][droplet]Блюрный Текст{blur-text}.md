---
title: "Блюрный текст | UI Компонент"
description: Анимированный текст с эффектом размытия. Появляется по словам или буквам при попадании в область видимости.
author: davidhdev
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: text animation, motion react, text
robots: index, follow
lang: ru
---

[uic:blur-text]

Анимированный текст с эффектом размытия. Активируется через `IntersectionObserver` — анимация запускается, когда элемент появляется в видимой области. Поддерживает анимацию по словам или буквам, кастомные keyframes и easing.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `motion` (motion/react) | `^11` | Анимация (`motion.span`, `Transition`, `Easing`) |
| `react` | `^18` или `^19` | Базовый фреймворк |

Установка:

```bash
npm install motion
```

Компонент использует нативный браузерный `IntersectionObserver` — полифил не нужен для современных браузеров.

## Использование

```tsx
import BlurText from '@/features/ui-components/blur-text/BlurText';

// Базовый пример
<BlurText
  text="Привет, мир!"
  delay={200}
  animateBy="words"
  direction="top"
/>

// Анимация по буквам снизу вверх
<BlurText
  text="Hello World"
  animateBy="letters"
  direction="bottom"
  delay={50}
  stepDuration={0.4}
  className="text-6xl font-bold"
/>

// С колбэком по окончании
<BlurText
  text="Загрузка завершена"
  onAnimationComplete={() => console.log('done')}
/>
```

## Оригинальный код

```typescript
import { motion, Transition, Easing } from 'motion/react';
import { useEffect, useRef, useState, useMemo } from 'react';

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, string | number>;
  animationTo?: Array<Record<string, string | number>>;
  easing?: Easing | Easing[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
};

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);

  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])];
  });
  return keyframes;
};

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.35
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top' ? { filter: 'blur(10px)', opacity: 0, y: -50 } : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      {
        filter: 'blur(5px)',
        opacity: 0.5,
        y: direction === 'top' ? 5 : -5
      },
      { filter: 'blur(0px)', opacity: 1, y: 0 }
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));

  return (
    <p ref={ref} className={`blur-text ${className} flex flex-wrap`}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);

        const spanTransition: Transition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: easing
        };

        return (
          <motion.span
            key={index}
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
            style={{
              display: 'inline-block',
              willChange: 'transform, filter, opacity'
            }}
          >
            {segment === ' ' ? '\u00A0' : segment}
            {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
          </motion.span>
        );
      })}
    </p>
  );
};

export default BlurText;
```

## Адаптированный код под проекты opensophy

```tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, type Transition } from 'framer-motion';
import type { BlurTextProps } from './types';

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);
  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])];
  });
  return keyframes;
};

let componentIdCounter = 0;

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.35,
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  const componentId = useRef<number>();
  if (componentId.current === undefined) {
    componentId.current = componentIdCounter++;
  }

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, y: -50 }
        : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1)
  );

  return (
    <p ref={ref} className={`blur-text ${className} flex flex-wrap`}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
        const spanTransition: Transition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: easing as any,
        };

        const stableKey = `blur-text-${componentId.current}-${index}`;

        return (
          <motion.span
            key={stableKey}
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
            style={{
              display: 'inline-block',
              willChange: 'transform, filter, opacity',
            }}
          >
            {segment === ' ' ? '\u00A0' : segment}
            {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
          </motion.span>
        );
      })}
    </p>
  );
};

export default BlurText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `text` | `string` | `''` | Текст для анимации |
| `animateBy` | `'words' \| 'letters'` | `'words'` | Анимировать по словам или буквам |
| `direction` | `'top' \| 'bottom'` | `'top'` | Направление появления |
| `delay` | `number` | `200` | Задержка между элементами в мс |
| `stepDuration` | `number` | `0.35` | Длительность одного шага анимации в секундах |
| `threshold` | `number` | `0.1` | Порог видимости для IntersectionObserver (0–1) |
| `rootMargin` | `string` | `'0px'` | rootMargin для IntersectionObserver |
| `className` | `string` | `''` | CSS классы (Tailwind или свои) для `<p>` |
| `animationFrom` | `Record<string, string \| number>` | — | Начальное состояние keyframe (переопределяет дефолтное) |
| `animationTo` | `Array<Record<string, string \| number>>` | — | Массив шагов keyframe (переопределяет дефолтное) |
| `easing` | `Easing \| Easing[]` | линейная функция | Функция easing из `motion/react` |
| `onAnimationComplete` | `() => void` | — | Колбэк после завершения анимации последнего элемента |

---

## Кастомные keyframes

Можно полностью переопределить анимацию через `animationFrom` и `animationTo`:

```tsx
<BlurText
  text="Custom animation"
  animationFrom={{ filter: 'blur(20px)', opacity: 0, scale: 0.8 }}
  animationTo={[
    { filter: 'blur(8px)', opacity: 0.3, scale: 0.9 },
    { filter: 'blur(0px)', opacity: 1, scale: 1 }
  ]}
  stepDuration={0.5}
/>
```

---

## Дефолтные keyframes

Если `animationFrom` / `animationTo` не переданы, используются встроенные:

**direction = 'top':**
- From: `{ filter: 'blur(10px)', opacity: 0, y: -50 }`
- Step 1: `{ filter: 'blur(5px)', opacity: 0.5, y: 5 }`
- Step 2: `{ filter: 'blur(0px)', opacity: 1, y: 0 }`

**direction = 'bottom':**
- From: `{ filter: 'blur(10px)', opacity: 0, y: 50 }`
- Step 1: `{ filter: 'blur(5px)', opacity: 0.5, y: -5 }`
- Step 2: `{ filter: 'blur(0px)', opacity: 1, y: 0 }`