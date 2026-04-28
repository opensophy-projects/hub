---
title: "Разбиение текста | UI Компонент"
description: Анимированный текст на GSAP с разбивкой по символам, словам или строкам. Запускается при скролле через ScrollTrigger.
author: davidhdev
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: split text animation, gsap scrolltrigger, text animation
robots: index, follow
lang: ru
---

[uic:split-text]

Анимированный текст на базе GSAP `SplitText` и `ScrollTrigger`. Разбивает текст на символы, слова или строки и анимирует каждый элемент по отдельности при скролле. Ждёт загрузки шрифтов перед запуском через `document.fonts.ready`.

---

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `gsap` | `^3.12` | Анимация, `ScrollTrigger`, `SplitText` |
| `@gsap/react` | `^2` | Хук `useGSAP` для React |
| `react` | `^18` или `^19` | Базовый фреймворк |

Установка:

```bash
npm install gsap @gsap/react
```

---

## Использование

```tsx
import SplitText from '@/features/ui-components/split-text/SplitText';

// Базовый пример — анимация по символам
<SplitText
  text="Привет, мир!"
  splitType="chars"
  duration={1.25}
  delay={50}
  ease="power3.out"
/>

// По словам, заголовок h2
<SplitText
  text="Красивый заголовок"
  tag="h2"
  splitType="words"
  delay={80}
  duration={1}
  ease="expo.out"
  className="text-5xl font-bold"
/>

// С колбэком по окончании
<SplitText
  text="Загрузка завершена"
  onLetterAnimationComplete={() => console.log('done')}
/>

// Кастомные from/to
<SplitText
  text="Кастом"
  from={{ opacity: 0, y: 60, rotationX: -90 }}
  to={{ opacity: 1, y: 0, rotationX: 0 }}
  duration={1.5}
  ease="back.out(1.7)"
/>
```

## Оригинальный код

```tsx
import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onLetterAnimationComplete
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      const el = ref.current as HTMLElement & {
        _rbsplitInstance?: GSAPSplitText;
      };

      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch (_) {}
        el._rbsplitInstance = undefined;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let targets: Element[] = [];

      const assignTargets = (self: GSAPSplitText) => {
        if (splitType.includes('chars') && (self as GSAPSplitText).chars?.length)
          targets = (self as GSAPSplitText).chars;
        if (!targets.length && splitType.includes('words') && self.words.length)
          targets = self.words;
        if (!targets.length && splitType.includes('lines') && self.lines.length)
          targets = self.lines;
        if (!targets.length) targets = self.chars || self.words || self.lines;
      };

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self: GSAPSplitText) => {
          assignTargets(self);
          return gsap.fromTo(targets, { ...from }, {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
              fastScrollEnd: true,
              anticipatePin: 0.4
            },
            onComplete: () => {
              animationCompletedRef.current = true;
              onCompleteRef.current?.();
            },
            willChange: 'transform, opacity',
            force3D: true
          });
        }
      });

      el._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach(st => {
          if (st.trigger === el) st.kill();
        });
        try {
          splitInstance.revert();
        } catch (_) {}
        el._rbsplitInstance = undefined;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded
      ],
      scope: ref
    }
  );

  const style: React.CSSProperties = {
    textAlign,
    wordWrap: 'break-word',
    willChange: 'transform, opacity'
  };

  const classes = `split-parent overflow-hidden inline-block whitespace-normal ${className}`;
  const Tag = (tag || 'p') as React.ElementType;

  return (
    <Tag ref={ref} style={style} className={classes}>
      {text}
    </Tag>
  );
};

export default SplitText;
```

## Адаптированный код под проекты opensophy

```tsx
import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onLetterAnimationComplete
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      const el = ref.current as HTMLElement & {
        _rbsplitInstance?: GSAPSplitText;
      };

      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch (_) {}
        el._rbsplitInstance = undefined;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let targets: Element[] = [];

      const assignTargets = (self: GSAPSplitText) => {
        if (splitType.includes('chars') && (self as GSAPSplitText).chars?.length)
          targets = (self as GSAPSplitText).chars;
        if (!targets.length && splitType.includes('words') && self.words.length)
          targets = self.words;
        if (!targets.length && splitType.includes('lines') && self.lines.length)
          targets = self.lines;
        if (!targets.length) targets = self.chars || self.words || self.lines;
      };

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self: GSAPSplitText) => {
          assignTargets(self);
          return gsap.fromTo(targets, { ...from }, {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
              fastScrollEnd: true,
              anticipatePin: 0.4
            },
            onComplete: () => {
              animationCompletedRef.current = true;
              onCompleteRef.current?.();
            },
            willChange: 'transform, opacity',
            force3D: true
          });
        }
      });

      el._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach(st => {
          if (st.trigger === el) st.kill();
        });
        try {
          splitInstance.revert();
        } catch (_) {}
        el._rbsplitInstance = undefined;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded
      ],
      scope: ref
    }
  );

  const style: React.CSSProperties = {
    textAlign,
    wordWrap: 'break-word',
    willChange: 'transform, opacity'
  };

  const classes = `split-parent overflow-hidden inline-block whitespace-normal ${className}`;
  const Tag = (tag || 'p') as React.ElementType;

  return (
    <Tag ref={ref} style={style} className={classes}>
      {text}
    </Tag>
  );
};

export default SplitText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `text` | `string` | — | Текст для анимации (обязательный) |
| `splitType` | `'chars' \| 'words' \| 'lines' \| 'words, chars'` | `'chars'` | Тип разбивки текста |
| `tag` | `'p' \| 'h1'–'h6' \| 'span'` | `'p'` | HTML тег обёртки |
| `delay` | `number` | `50` | Stagger между элементами в мс |
| `duration` | `number` | `1.25` | Длительность анимации каждого элемента в секундах |
| `ease` | `string \| function` | `'power3.out'` | GSAP easing строка или функция |
| `from` | `gsap.TweenVars` | `{ opacity: 0, y: 40 }` | Начальное состояние анимации |
| `to` | `gsap.TweenVars` | `{ opacity: 1, y: 0 }` | Конечное состояние анимации |
| `threshold` | `number` | `0.1` | Порог видимости для ScrollTrigger (0–1) |
| `rootMargin` | `string` | `'-100px'` | Смещение триггера (например `-100px`) |
| `textAlign` | `React.CSSProperties['textAlign']` | `'center'` | Выравнивание текста |
| `className` | `string` | `''` | CSS классы (Tailwind или свои) |
| `onLetterAnimationComplete` | `() => void` | — | Колбэк после завершения всей анимации |

---

## Как работает ScrollTrigger

Анимация запускается один раз (`once: true`) когда верхний край элемента достигает точки `(1 - threshold) * 100%` высоты вьюпорта с учётом `rootMargin`. Например при дефолтных значениях (`threshold: 0.1`, `rootMargin: '-100px'`) — старт в `top 90%-=100px`.

После завершения анимации ScrollTrigger уничтожается и `SplitText` возвращается к исходному HTML через `revert()` на анмаунте.