---
title: "Скорость скролла"
description: Бесконечная бегущая строка, скорость которой зависит от скорости прокрутки. Чётные строки идут вправо, нечётные — влево. Основана на framer-motion useVelocity и useSpring.
author: davidhdev
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: scroll velocity, marquee, framer motion, scroll speed, react animation
robots: index, follow
lang: ru
---

[uic:scroll-velocity]

Бесконечная бегущая строка с реакцией на скорость скролла. При быстрой прокрутке вниз строки ускоряются, при прокрутке вверх — замедляются и меняют направление. Передай несколько строк через запятую — чётные пойдут вправо, нечётные влево, создавая эффект противоположных дорожек.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `framer-motion` | `^11` | `useVelocity`, `useSpring`, `useTransform`, `useAnimationFrame` |
| `react` | `^18` или `^19` | Базовый фреймворк |

Установка:

```bash
npm install framer-motion
```

---

## Использование

```tsx
import ScrollVelocity from '@/features/ui-components/scroll-velocity/scroll-velocity';

// Одна строка
<ScrollVelocity
  texts={['Scroll Velocity • Framer Motion •']}
  velocity={100}
/>

// Две строки в противоположных направлениях
<ScrollVelocity
  texts={[
    'Дизайн • Интерфейс • Анимация •',
    'Motion • React • GSAP • Framer •',
  ]}
  velocity={80}
/>

// Медленно, плавная пружина
<ScrollVelocity
  texts={['Opensophy • Hub •']}
  velocity={40}
  damping={80}
  stiffness={200}
/>

// С кастомными стилями
<ScrollVelocity
  texts={['Hello World •']}
  velocity={120}
  className="text-blue-500"
  parallaxStyle={{ padding: '2rem 0' }}
  scrollerStyle={{ gap: '2rem' }}
/>

// С кастомным скролл-контейнером
const containerRef = useRef<HTMLDivElement>(null);

<div ref={containerRef} style={{ overflowY: 'scroll', height: '600px' }}>
  <ScrollVelocity
    scrollContainerRef={containerRef}
    texts={['Внутри контейнера •']}
    velocity={100}
  />
</div>
```

## Оригинальный код

```tsx
import React, { useRef, useLayoutEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame
} from 'motion/react';

interface VelocityMapping {
  input: [number, number];
  output: [number, number];
}

interface VelocityTextProps {
  children: React.ReactNode;
  baseVelocity: number;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: VelocityMapping;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
}

interface ScrollVelocityProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
  texts: React.ReactNode[];
  velocity?: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: VelocityMapping;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
}

function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    function updateWidth() {
      if (ref.current) {
        setWidth(ref.current.offsetWidth);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [ref]);

  return width;
}

export const ScrollVelocity: React.FC<ScrollVelocityProps> = ({
  scrollContainerRef,
  texts = [],
  velocity = 100,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName,
  scrollerClassName,
  parallaxStyle,
  scrollerStyle
}) => {
  function VelocityText({
    children,
    baseVelocity = velocity,
    scrollContainerRef,
    className = '',
    damping,
    stiffness,
    numCopies,
    velocityMapping,
    parallaxClassName,
    scrollerClassName,
    parallaxStyle,
    scrollerStyle
  }: VelocityTextProps) {
    const baseX = useMotionValue(0);
    const scrollOptions = scrollContainerRef ? { container: scrollContainerRef } : {};
    const { scrollY } = useScroll(scrollOptions);
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
      damping: damping ?? 50,
      stiffness: stiffness ?? 400
    });
    const velocityFactor = useTransform(
      smoothVelocity,
      velocityMapping?.input || [0, 1000],
      velocityMapping?.output || [0, 5],
      { clamp: false }
    );

    const copyRef = useRef<HTMLSpanElement>(null);
    const copyWidth = useElementWidth(copyRef);

    function wrap(min: number, max: number, v: number): number {
      const range = max - min;
      const mod = (((v - min) % range) + range) % range;
      return mod + min;
    }

    const x = useTransform(baseX, v => {
      if (copyWidth === 0) return '0px';
      return `${wrap(-copyWidth, 0, v)}px`;
    });

    const directionFactor = useRef<number>(1);
    useAnimationFrame((t, delta) => {
      let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

      if (velocityFactor.get() < 0) {
        directionFactor.current = -1;
      } else if (velocityFactor.get() > 0) {
        directionFactor.current = 1;
      }

      moveBy += directionFactor.current * moveBy * velocityFactor.get();
      baseX.set(baseX.get() + moveBy);
    });

    const spans = [];
    for (let i = 0; i < (numCopies ?? 6); i++) {
      spans.push(
        <span className={`flex-shrink-0 ${className}`} key={i} ref={i === 0 ? copyRef : null}>
          {children}&nbsp;
        </span>
      );
    }

    return (
      <div className={`${parallaxClassName} relative overflow-hidden`} style={parallaxStyle}>
        <motion.div
          className={`${scrollerClassName} flex whitespace-nowrap text-center font-sans text-4xl font-bold tracking-[-0.02em] drop-shadow md:text-[5rem] md:leading-[5rem]`}
          style={{ x, ...scrollerStyle }}
        >
          {spans}
        </motion.div>
      </div>
    );
  }

  return (
    <section>
      {texts.map((text, index) => (
        <VelocityText
          key={index}
          className={className}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
          scrollContainerRef={scrollContainerRef}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
        >
          {text}
        </VelocityText>
      ))}
    </section>
  );
};

export default ScrollVelocity;
```

## Адаптированный код под проекты opensophy

```tsx
import React, { useRef, useLayoutEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from 'framer-motion';

interface VelocityMapping {
  input: [number, number];
  output: [number, number];
}

interface VelocityTextProps {
  children: React.ReactNode;
  baseVelocity: number;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: VelocityMapping;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
}

export interface ScrollVelocityProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
  /** Массив строк или строка через запятую */
  texts?: React.ReactNode[] | string;
  velocity?: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: VelocityMapping;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
}

function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    function updateWidth() {
      if (ref.current) setWidth(ref.current.offsetWidth);
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [ref]);

  return width;
}

function VelocityText({
  children,
  baseVelocity,
  scrollContainerRef,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName,
  scrollerClassName,
  parallaxStyle,
  scrollerStyle,
}: VelocityTextProps) {
  const baseX = useMotionValue(0);
  const scrollOptions = scrollContainerRef ? { container: scrollContainerRef } : {};
  const { scrollY } = useScroll(scrollOptions);
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness });
  const velocityFactor = useTransform(
    smoothVelocity,
    velocityMapping.input,
    velocityMapping.output,
    { clamp: false }
  );

  const copyRef = useRef<HTMLSpanElement>(null);
  const copyWidth = useElementWidth(copyRef);

  function wrap(min: number, max: number, v: number): number {
    const range = max - min;
    const mod = (((v - min) % range) + range) % range;
    return mod + min;
  }

  const x = useTransform(baseX, v => {
    if (copyWidth === 0) return '0px';
    return `${wrap(-copyWidth, 0, v)}px`;
  });

  const directionFactor = useRef<number>(1);

  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0)      directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  const spans = Array.from({ length: numCopies }, (_, i) => (
    <span
      className={`flex-shrink-0 ${className}`}
      key={i}
      ref={i === 0 ? copyRef : null}
    >
      {children}&nbsp;
    </span>
  ));

  return (
    <div
      className={`relative overflow-hidden ${parallaxClassName ?? ''}`}
      style={parallaxStyle}
    >
      <motion.div
        className={`flex whitespace-nowrap text-center font-sans text-4xl font-bold tracking-[-0.02em] drop-shadow md:text-[5rem] md:leading-[5rem] ${scrollerClassName ?? ''}`}
        style={{ x, ...scrollerStyle }}
      >
        {spans}
      </motion.div>
    </div>
  );
}

const ScrollVelocity: React.FC<ScrollVelocityProps> = ({
  scrollContainerRef,
  texts = ['Scroll Velocity •', 'Framer Motion •'],
  velocity = 100,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName,
  scrollerClassName,
  parallaxStyle,
  scrollerStyle,
}) => {
  // Поддержка строки через запятую (для UIComponentViewer)
  const textArray: React.ReactNode[] = typeof texts === 'string'
    ? texts.split(',').map(t => t.trim()).filter(Boolean)
    : texts;

  return (
    <section>
      {textArray.map((text, index) => (
        <VelocityText
          key={index}
          className={className}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
          scrollContainerRef={scrollContainerRef}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
        >
          {text}
        </VelocityText>
      ))}
    </section>
  );
};

export default ScrollVelocity;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `texts` | `ReactNode[]` | `[]` | Массив строк. Чётные индексы — вправо, нечётные — влево |
| `velocity` | `number` | `100` | Базовая скорость в пикс/с |
| `damping` | `number` | `50` | Демпфирование spring-пружины (выше = быстрее затухает) |
| `stiffness` | `number` | `400` | Жёсткость spring-пружины (выше = резче реакция) |
| `numCopies` | `number` | `6` | Количество копий текста для бесшовного повтора |
| `velocityMapping` | `{ input: [n,n], output: [n,n] }` | `{[0,1000],[0,5]}` | Маппинг скорости скролла → множитель скорости бегущей строки |
| `scrollContainerRef` | `RefObject<HTMLElement>` | `window` | Ref на кастомный скролл-контейнер |
| `className` | `string` | `''` | CSS классы для каждого `<span>` с текстом |
| `parallaxClassName` | `string` | `''` | CSS классы для внешнего `<div>` каждой строки |
| `scrollerClassName` | `string` | `''` | CSS классы для `motion.div` с текстом |
| `parallaxStyle` | `CSSProperties` | — | Инлайн-стили для внешнего контейнера |
| `scrollerStyle` | `CSSProperties` | — | Инлайн-стили для скроллируемого контейнера |

---

## Как работает

Каждая строка — отдельный `VelocityText`. Внутри:

1. `useScroll` отслеживает позицию скролла
2. `useVelocity` вычисляет скорость изменения `scrollY`
3. `useSpring` сглаживает скачки скорости через `damping` и `stiffness`
4. `useTransform` маппит скорость скролла в множитель через `velocityMapping`
5. `useAnimationFrame` каждый кадр сдвигает `baseX` на `velocity × delta × velocityFactor`
6. При достижении границы `-copyWidth` позиция оборачивается через `wrap()` — бесшовный повтор

:::tip
`damping` и `stiffness` влияют на «инерцию» реакции. Низкий `damping` + высокий `stiffness` = резкая моментальная реакция. Высокий `damping` + низкий `stiffness` = плавное, ленивое ускорение.
:::

:::note
`numCopies` нужно увеличить если текст короткий и между копиями появляются пустые промежутки. Для одного слова поставь `8–10`.
:::