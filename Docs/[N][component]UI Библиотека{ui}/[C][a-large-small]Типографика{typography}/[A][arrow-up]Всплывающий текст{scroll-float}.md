---
title: "Всплывающий текст | UI Компонент"
description: Текст с эффектом всплытия при скролле. Каждая буква появляется снизу с деформацией масштаба через GSAP ScrollTrigger, синхронизировано с позицией скролла.
author: davidhdev
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: scroll animation, gsap scrolltrigger, text reveal, react
robots: index, follow
lang: ru
---

[uic:scroll-float]

Текст с эффектом всплытия при скролле. Компонент разбивает строку на отдельные буквы и анимирует каждую через `gsap.fromTo` с привязкой к позиции скролла через `ScrollTrigger`. Буквы появляются снизу с вертикальной деформацией масштаба (`scaleY: 2.3 → 1`), создавая выразительный эффект «выпрыгивания» текста по мере прокрутки.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `gsap` | `^3.12` | Анимация букв (`fromTo`, `ScrollTrigger`) |
| `@gsap/react` | `^2` | Опционально, для `useGSAP` хука |
| `react` | `^18` или `^19` | Базовый фреймворк |

Установка:

```bash
npm install gsap
```

`ScrollTrigger` входит в состав GSAP — отдельно устанавливать не нужно. Плагин регистрируется один раз через `gsap.registerPlugin(ScrollTrigger)`.

---

## Использование

```tsx
import ScrollFloat from '@/features/ui-components/scroll-float/scroll-float';

// Базовый пример
<ScrollFloat>
  Всплывающий текст
</ScrollFloat>

// С кастомным easing и скоростью
<ScrollFloat
  animationDuration={1.4}
  ease="elastic.out(1, 0.3)"
  stagger={0.05}
>
  Эластичное появление
</ScrollFloat>

// Контроль триггерных точек скролла
<ScrollFloat
  scrollStart="top bottom"
  scrollEnd="center center"
  stagger={0.02}
>
  Тонкая настройка скролла
</ScrollFloat>

// С кастомным скролл-контейнером (не window)
const containerRef = useRef<HTMLDivElement>(null);

<div ref={containerRef} style={{ overflowY: 'scroll', height: '400px' }}>
  <ScrollFloat scrollContainerRef={containerRef}>
    Текст внутри скролл-контейнера
  </ScrollFloat>
</div>

// Стилизация через className
<ScrollFloat
  containerClassName="text-center"
  textClassName="font-black tracking-tight"
>
  Кастомные стили
</ScrollFloat>
```

## Оригинальный код

```tsx
import React, { useEffect, useMemo, useRef, ReactNode, RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split('').map((char, index) => (
      <span className="inline-block word" key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    const charElements = el.querySelectorAll('.inline-block');

    gsap.fromTo(
      charElements,
      {
        willChange: 'opacity, transform',
        opacity: 0,
        yPercent: 120,
        scaleY: 2.3,
        scaleX: 0.7,
        transformOrigin: '50% 0%'
      },
      {
        duration: animationDuration,
        ease: ease,
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger: stagger,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: scrollEnd,
          scrub: true
        }
      }
    );
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return (
    <h2 ref={containerRef} className={`my-5 overflow-hidden ${containerClassName}`}>
      <span className={`inline-block text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] ${textClassName}`}>{splitText}</span>
    </h2>
  );
};

export default ScrollFloat;
```

## Адаптированный код под проекты opensophy

```tsx
import React, { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split('').map((char, index) => (
      <span className="inline-block word" key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller =
      scrollContainerRef && scrollContainerRef.current
        ? scrollContainerRef.current
        : window;

    const charElements = el.querySelectorAll('.inline-block');

    gsap.fromTo(
      charElements,
      {
        willChange: 'opacity, transform',
        opacity: 0,
        yPercent: 120,
        scaleY: 2.3,
        scaleX: 0.7,
        transformOrigin: '50% 0%',
      },
      {
        duration: animationDuration,
        ease,
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: scrollEnd,
          scrub: true,
        },
      }
    );
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return (
    <h2
      ref={containerRef}
      className={`my-5 overflow-hidden ${containerClassName}`}
    >
      <span
        className={`inline-block text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] ${textClassName}`}
      >
        {splitText}
      </span>
    </h2>
  );
};

export default ScrollFloat;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `children` | `ReactNode` | — | Текст для анимации. Только строки разбиваются на буквы |
| `animationDuration` | `number` | `1` | Длительность анимации каждой буквы в секундах |
| `ease` | `string` | `'back.inOut(2)'` | GSAP easing функция |
| `scrollStart` | `string` | `'center bottom+=50%'` | Точка начала анимации (ScrollTrigger `start`) |
| `scrollEnd` | `string` | `'bottom bottom-=40%'` | Точка конца анимации (ScrollTrigger `end`) |
| `stagger` | `number` | `0.03` | Задержка между буквами в секундах |
| `scrollContainerRef` | `RefObject<HTMLElement>` | `window` | Ref на кастомный скролл-контейнер (если не `window`) |
| `containerClassName` | `string` | `''` | CSS классы для обёртки `<h2>` |
| `textClassName` | `string` | `''` | CSS классы для текстового `<span>` |

---

## Как работает анимация

Компонент разбивает `children`-строку на массив `<span>` через `useMemo`. Каждая буква получает класс `inline-block`, что позволяет GSAP трансформировать их независимо.

`useEffect` создаёт одну `gsap.fromTo` анимацию со `scrollTrigger.scrub: true` — это привязывает прогресс анимации к позиции скролла напрямую, без автоматического воспроизведения.

**Начальное состояние:**
- `opacity: 0`
- `yPercent: 120` — буква полностью за нижним краем
- `scaleY: 2.3`, `scaleX: 0.7` — вертикальная деформация
- `transformOrigin: '50% 0%'` — трансформация от верхней точки

**Конечное состояние:** `opacity: 1`, все трансформации сброшены в `1`.

:::tip
`scrub: true` означает, что анимация отматывается назад при скролле вверх. Для однократного воспроизведения замени на `scrub: false` и добавь `once: true` в `scrollTrigger`.
:::

---

## Настройка триггерных точек

`scrollStart` и `scrollEnd` — это стандартный синтаксис GSAP ScrollTrigger.

Формат: `"<позиция элемента> <позиция вьюпорта>"`.

```
'top bottom'          // верх элемента достигает низа экрана
'center center'       // центр элемента в центре экрана
'bottom bottom-=40%'  // низ элемента на 40% от низа экрана
'center bottom+=50%'  // центр элемента за нижней границей экрана
```

:::note
Компонент оборачивает текст в `<h2>`. Если нужен другой тег — можно доработать, передав дополнительный проп `as`.
:::