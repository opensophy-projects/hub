---
title: "Раскрытие при скролле | UI Компонент"
description: Текст с эффектом раскрытия при скролле. Слова появляются с opacity и blur, весь блок плавно выравнивается из наклонного положения — синхронизировано с позицией скролла через GSAP ScrollTrigger.
author: davidhdev
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: scroll reveal, gsap scrolltrigger, text animation, blur reveal, react
robots: index, follow
lang: ru
---

[uic:scroll-reveal]

Компонент разбивает текст на слова и применяет три независимые анимации, привязанные к скроллу через `scrub: true`: плавное выравнивание всего блока из наклона (`baseRotation`), постепенное появление слов через `opacity`, и размытие → резкость через `filter: blur`. Все три анимации идут синхронно с позицией скролла.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `gsap` | `^3.12` | Анимация (`fromTo`, `ScrollTrigger`) |
| `react` | `^18` или `^19` | Базовый фреймворк |

Установка:

```bash
npm install gsap
```

`ScrollTrigger` входит в GSAP и регистрируется один раз через `gsap.registerPlugin(ScrollTrigger)`.

---

## Использование

```tsx
import ScrollReveal from '@/features/ui-components/scroll-reveal/scroll-reveal';

// Базовый пример
<ScrollReveal>
  Этот текст раскрывается по мере прокрутки страницы.
</ScrollReveal>

// Без blur, только opacity + наклон
<ScrollReveal enableBlur={false} baseRotation={5}>
  Чистое появление без размытия.
</ScrollReveal>

// Сильный blur и высокая начальная прозрачность
<ScrollReveal
  blurStrength={10}
  baseOpacity={0}
  baseRotation={2}
>
  Слова буквально проявляются из тумана.
</ScrollReveal>

// Контроль точек триггера
<ScrollReveal
  rotationEnd="center center"
  wordAnimationEnd="center center"
>
  Быстрее заканчивает анимацию.
</ScrollReveal>

// С кастомным скролл-контейнером
const containerRef = useRef<HTMLDivElement>(null);

<div ref={containerRef} style={{ overflowY: 'scroll', height: '500px' }}>
  <ScrollReveal scrollContainerRef={containerRef}>
    Текст внутри кастомного скролл-контейнера.
  </ScrollReveal>
</div>
```

## Оригинальный код

```tsx
import React, { useEffect, useRef, useMemo, ReactNode, RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom'
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="inline-block word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    gsap.fromTo(
      el,
      { transformOrigin: '0% 50%', rotate: baseRotation },
      {
        ease: 'none',
        rotate: 0,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom',
          end: rotationEnd,
          scrub: true
        }
      }
    );

    const wordElements = el.querySelectorAll<HTMLElement>('.word');

    gsap.fromTo(
      wordElements,
      { opacity: baseOpacity, willChange: 'opacity' },
      {
        ease: 'none',
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom-=20%',
          end: wordAnimationEnd,
          scrub: true
        }
      }
    );

    if (enableBlur) {
      gsap.fromTo(
        wordElements,
        { filter: `blur(${blurStrength}px)` },
        {
          ease: 'none',
          filter: 'blur(0px)',
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true
          }
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

  return (
    <h2 ref={containerRef} className={`my-5 ${containerClassName}`}>
      <p className={`text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold ${textClassName}`}>{splitText}</p>
    </h2>
  );
};

export default ScrollReveal;
```

## Адаптированный код под проекты opensophy

```tsx
import React, { useEffect, useRef, useMemo, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="inline-block word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef?.current ?? window;
    const triggers: ReturnType<typeof ScrollTrigger.create>[] = [];

    const rotAnim = gsap.fromTo(
      el,
      { transformOrigin: '0% 50%', rotate: baseRotation },
      {
        ease: 'none',
        rotate: 0,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom',
          end: rotationEnd,
          scrub: true,
        },
      }
    );
    if (rotAnim.scrollTrigger) triggers.push(rotAnim.scrollTrigger);

    const wordElements = el.querySelectorAll<HTMLElement>('.word');

    const opacityAnim = gsap.fromTo(
      wordElements,
      { opacity: baseOpacity, willChange: 'opacity' },
      {
        ease: 'none',
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom-=20%',
          end: wordAnimationEnd,
          scrub: true,
        },
      }
    );
    if (opacityAnim.scrollTrigger) triggers.push(opacityAnim.scrollTrigger);

    if (enableBlur) {
      const blurAnim = gsap.fromTo(
        wordElements,
        { filter: `blur(${blurStrength}px)` },
        {
          ease: 'none',
          filter: 'blur(0px)',
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true,
          },
        }
      );
      if (blurAnim.scrollTrigger) triggers.push(blurAnim.scrollTrigger);
    }

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

  return (
    <h2 ref={containerRef} className={`my-5 ${containerClassName}`}>
      <p className={`text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold ${textClassName}`}>
        {splitText}
      </p>
    </h2>
  );
};

export default ScrollReveal;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `children` | `ReactNode` | — | Текст для анимации (только строки разбиваются на слова) |
| `enableBlur` | `boolean` | `true` | Включить blur-анимацию слов |
| `baseOpacity` | `number` | `0.1` | Начальная прозрачность слов (0–1) |
| `baseRotation` | `number` | `3` | Начальный наклон всего блока в градусах |
| `blurStrength` | `number` | `4` | Сила размытия в пикселях |
| `rotationEnd` | `string` | `'bottom bottom'` | Точка конца анимации наклона (ScrollTrigger `end`) |
| `wordAnimationEnd` | `string` | `'bottom bottom'` | Точка конца анимации слов (ScrollTrigger `end`) |
| `scrollContainerRef` | `RefObject<HTMLElement>` | `window` | Ref на кастомный скролл-контейнер |
| `containerClassName` | `string` | `''` | CSS классы для `<h2>` |
| `textClassName` | `string` | `''` | CSS классы для `<p>` |

---

## Как работает анимация

Компонент создаёт три параллельных `gsap.fromTo` с `scrub: true` — все привязаны к одному триггеру (элемент `<h2>`), но с разными точками старта и конца:

**1. Наклон блока** — стартует когда верх элемента достигает низа экрана (`top bottom`), заканчивается в `rotationEnd`. Весь `<h2>` поворачивается от `baseRotation` до `0deg`.

**2. Opacity слов** — стартует чуть позже (`top bottom-=20%`). Каждое слово появляется с `stagger: 0.05` — слева направо, от `baseOpacity` до `1`.

**3. Blur слов** — тот же триггер что и opacity. Каждое слово расфокусируется от `blur(N px)` до `blur(0px)`. Отключается через `enableBlur={false}`.

:::note
В отличие от `scroll-float`, здесь анимируются **слова**, а не буквы — это даёт более плавный и читаемый эффект для длинных текстов.
:::

:::tip
`scrub: true` означает что анимация отматывается при скролле вверх. Для однократного воспроизведения убери `scrub` и добавь `once: true` в объект `scrollTrigger` напрямую в коде компонента.
:::