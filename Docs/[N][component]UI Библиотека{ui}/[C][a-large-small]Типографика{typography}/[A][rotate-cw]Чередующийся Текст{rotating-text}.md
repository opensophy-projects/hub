---
title: "Чередующийся текст"
description: Текст, который автоматически переключается между несколькими строками с анимацией. Поддерживает разбивку по буквам, словам или строкам, stagger, spring-переходы и программное управление через ref.
author: davidhdev
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: rotating text, animated text, text switcher, framer motion, stagger
robots: index, follow
lang: ru
---

[uic:rotating-text]

Компонент автоматически чередует строки из массива `texts` с анимацией появления и исчезновения. Текст разбивается на буквы, слова или строки — каждый элемент анимируется независимо с настраиваемым stagger. Поддерживает программное управление через `ref`: `next()`, `previous()`, `jumpTo(n)`, `reset()`.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `framer-motion` | `^11` | Анимация (`motion.span`, `AnimatePresence`) |
| `react` | `^18` или `^19` | Базовый фреймворк |

Установка:

```bash
npm install framer-motion
```

Оригинальный компонент написан под `motion/react` (Motion for React) — в проекте используется `framer-motion`, API идентичен.

---

## Использование

```tsx
import RotatingText from '@/features/ui-components/rotating-text/rotating-text';

// Базовый пример
<RotatingText
  texts={['Дизайн', 'Интерфейс', 'Анимация']}
/>

// По словам с медленным stagger
<RotatingText
  texts={['Быстро и просто', 'Красиво и точно', 'Гибко и надёжно']}
  splitBy="words"
  staggerDuration={0.06}
  staggerFrom="center"
  rotationInterval={3000}
/>

// Кастомные keyframes анимации
<RotatingText
  texts={['Один', 'Два', 'Три']}
  initial={{ y: '100%', opacity: 0, rotateX: -90 }}
  animate={{ y: 0,      opacity: 1, rotateX: 0   }}
  exit={{    y: '-100%', opacity: 0, rotateX: 90  }}
  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
/>

// Программное управление через ref
const textRef = useRef<RotatingTextRef>(null);

<RotatingText
  ref={textRef}
  texts={['Alpha', 'Beta', 'Gamma']}
  auto={false}
/>
<button onClick={() => textRef.current?.next()}>→</button>
<button onClick={() => textRef.current?.previous()}>←</button>

// Встраивание в строку с другим текстом
<h1 className="flex items-center gap-3 text-5xl font-bold">
  Мы делаем
  <RotatingText
    texts={['дизайн', 'код', 'продукты']}
    mainClassName="text-blue-500 overflow-hidden px-2"
  />
</h1>
```

## Оригинальный код

```tsx
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  motion,
  AnimatePresence,
  Transition,
  type VariantLabels,
  type Target,
  type TargetAndTransition
} from 'motion/react';

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export interface RotatingTextProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.span>,
    'children' | 'transition' | 'initial' | 'animate' | 'exit'
  > {
  texts: string[];
  transition?: Transition;
  initial?: boolean | Target | VariantLabels;
  animate?: boolean | VariantLabels | TargetAndTransition;
  exit?: Target | VariantLabels;
  animatePresenceMode?: 'sync' | 'wait';
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      transition = { type: 'spring', damping: 25, stiffness: 300 },
      initial = { y: '100%', opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: '-120%', opacity: 0 },
      animatePresenceMode = 'wait',
      animatePresenceInitial = false,
      rotationInterval = 2000,
      staggerDuration = 0,
      staggerFrom = 'first',
      loop = true,
      auto = true,
      splitBy = 'characters',
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
      ...rest
    },
    ref
  ) => {
    const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

    const splitIntoCharacters = (text: string): string[] => {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(text), segment => segment.segment);
      }
      return Array.from(text);
    };

    const elements = useMemo(() => {
      const currentText: string = texts[currentTextIndex];
      if (splitBy === 'characters') {
        const words = currentText.split(' ');
        return words.map((word, i) => ({
          characters: splitIntoCharacters(word),
          needsSpace: i !== words.length - 1
        }));
      }
      if (splitBy === 'words') {
        return currentText.split(' ').map((word, i, arr) => ({
          characters: [word],
          needsSpace: i !== arr.length - 1
        }));
      }
      if (splitBy === 'lines') {
        return currentText.split('\n').map((line, i, arr) => ({
          characters: [line],
          needsSpace: i !== arr.length - 1
        }));
      }

      return currentText.split(splitBy).map((part, i, arr) => ({
        characters: [part],
        needsSpace: i !== arr.length - 1
      }));
    }, [texts, currentTextIndex, splitBy]);

    const getStaggerDelay = useCallback(
      (index: number, totalChars: number): number => {
        const total = totalChars;
        if (staggerFrom === 'first') return index * staggerDuration;
        if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
        if (staggerFrom === 'center') {
          const center = Math.floor(total / 2);
          return Math.abs(center - index) * staggerDuration;
        }
        if (staggerFrom === 'random') {
          const randomIndex = Math.floor(Math.random() * total);
          return Math.abs(randomIndex - index) * staggerDuration;
        }
        return Math.abs((staggerFrom as number) - index) * staggerDuration;
      },
      [staggerFrom, staggerDuration]
    );

    const handleIndexChange = useCallback(
      (newIndex: number) => {
        setCurrentTextIndex(newIndex);
        if (onNext) onNext(newIndex);
      },
      [onNext]
    );

    const next = useCallback(() => {
      const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
      if (nextIndex !== currentTextIndex) {
        handleIndexChange(nextIndex);
      }
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const previous = useCallback(() => {
      const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
      if (prevIndex !== currentTextIndex) {
        handleIndexChange(prevIndex);
      }
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const jumpTo = useCallback(
      (index: number) => {
        const validIndex = Math.max(0, Math.min(index, texts.length - 1));
        if (validIndex !== currentTextIndex) {
          handleIndexChange(validIndex);
        }
      },
      [texts.length, currentTextIndex, handleIndexChange]
    );

    const reset = useCallback(() => {
      if (currentTextIndex !== 0) {
        handleIndexChange(0);
      }
    }, [currentTextIndex, handleIndexChange]);

    useImperativeHandle(
      ref,
      () => ({
        next,
        previous,
        jumpTo,
        reset
      }),
      [next, previous, jumpTo, reset]
    );

    useEffect(() => {
      if (!auto) return;
      const intervalId = setInterval(next, rotationInterval);
      return () => clearInterval(intervalId);
    }, [next, rotationInterval, auto]);

    return (
      <motion.span
        className={cn('flex flex-wrap whitespace-pre-wrap relative', mainClassName)}
        {...rest}
        layout
        transition={transition}
      >
        <span className="sr-only">{texts[currentTextIndex]}</span>
        <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
          <motion.span
            key={currentTextIndex}
            className={cn(splitBy === 'lines' ? 'flex flex-col w-full' : 'flex flex-wrap whitespace-pre-wrap relative')}
            layout
            aria-hidden="true"
          >
            {elements.map((wordObj, wordIndex, array) => {
              const previousCharsCount = array
                .slice(0, wordIndex)
                .reduce((sum, word) => sum + word.characters.length, 0);
              return (
                <span key={wordIndex} className={cn('inline-flex', splitLevelClassName)}>
                  {wordObj.characters.map((char, charIndex) => (
                    <motion.span
                      key={charIndex}
                      initial={initial}
                      animate={animate}
                      exit={exit}
                      transition={{
                        ...transition,
                        delay: getStaggerDelay(
                          previousCharsCount + charIndex,
                          array.reduce((sum, word) => sum + word.characters.length, 0)
                        )
                      }}
                      className={cn('inline-block', elementLevelClassName)}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {wordObj.needsSpace && <span className="whitespace-pre"> </span>}
                </span>
              );
            })}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    );
  }
);

RotatingText.displayName = 'RotatingText';
export default RotatingText;
```

## Адаптированный код под проекты opensophy

```tsx
import React, {
  forwardRef, useCallback, useEffect,
  useImperativeHandle, useMemo, useState,
} from 'react';
import {
  motion, AnimatePresence,
  type Transition, type VariantLabels,
  type Target, type TargetAndTransition,
} from 'framer-motion';

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export interface RotatingTextProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.span>,
    'children' | 'transition' | 'initial' | 'animate' | 'exit'
  > {
  texts: string[];
  transition?: Transition;
  initial?: boolean | Target | VariantLabels;
  animate?: boolean | VariantLabels | TargetAndTransition;
  exit?: Target | VariantLabels;
  animatePresenceMode?: 'sync' | 'wait';
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>((
  {
    texts,
    transition = { type: 'spring', damping: 25, stiffness: 300 },
    initial = { y: '100%', opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: '-120%', opacity: 0 },
    animatePresenceMode = 'wait',
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  },
  ref,
) => {
  const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

  const splitIntoCharacters = (text: string): string[] => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), s => s.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === 'characters') {
      return currentText.split(' ').map((word, i, arr) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === 'words') {
      return currentText.split(' ').map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === 'lines') {
      return currentText.split('\n').map((line, i, arr) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1,
      }));
    }
    return currentText.split(splitBy).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1,
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback((index: number, totalChars: number): number => {
    if (staggerFrom === 'first')  return index * staggerDuration;
    if (staggerFrom === 'last')   return (totalChars - 1 - index) * staggerDuration;
    if (staggerFrom === 'center') return Math.abs(Math.floor(totalChars / 2) - index) * staggerDuration;
    if (staggerFrom === 'random') return Math.abs(Math.floor(Math.random() * totalChars) - index) * staggerDuration;
    return Math.abs((staggerFrom as number) - index) * staggerDuration;
  }, [staggerFrom, staggerDuration]);

  const handleIndexChange = useCallback((newIndex: number) => {
    setCurrentTextIndex(newIndex);
    onNext?.(newIndex);
  }, [onNext]);

  const next = useCallback(() => {
    const nextIndex = currentTextIndex === texts.length - 1
      ? (loop ? 0 : currentTextIndex)
      : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex);
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const prevIndex = currentTextIndex === 0
      ? (loop ? texts.length - 1 : currentTextIndex)
      : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) handleIndexChange(prevIndex);
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback((index: number) => {
    const valid = Math.max(0, Math.min(index, texts.length - 1));
    if (valid !== currentTextIndex) handleIndexChange(valid);
  }, [texts.length, currentTextIndex, handleIndexChange]);

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) handleIndexChange(0);
  }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [next, rotationInterval, auto]);

  return (
    <motion.span
      className={cn('flex flex-wrap whitespace-pre-wrap relative', mainClassName)}
      {...rest}
      layout
      transition={transition}
    >
      <span className="sr-only">{texts[currentTextIndex]}</span>
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.span
          key={currentTextIndex}
          className={cn(
            splitBy === 'lines'
              ? 'flex flex-col w-full'
              : 'flex flex-wrap whitespace-pre-wrap relative',
          )}
          layout
          aria-hidden="true"
        >
          {elements.map((wordObj, wordIndex, array) => {
            const previousCharsCount = array
              .slice(0, wordIndex)
              .reduce((sum, w) => sum + w.characters.length, 0);
            const totalChars = array.reduce((sum, w) => sum + w.characters.length, 0);
            return (
              <span key={wordIndex} className={cn('inline-flex', splitLevelClassName)}>
                {wordObj.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(previousCharsCount + charIndex, totalChars),
                    }}
                    className={cn('inline-block', elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span className="whitespace-pre"> </span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});

RotatingText.displayName = 'RotatingText';
export default RotatingText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `texts` | `string[]` | — | Массив строк для чередования |
| `rotationInterval` | `number` | `2000` | Интервал смены текста в мс |
| `splitBy` | `'characters' \| 'words' \| 'lines' \| string` | `'characters'` | Единица анимации. Можно передать произвольный разделитель |
| `staggerDuration` | `number` | `0` | Задержка между элементами в секундах |
| `staggerFrom` | `'first' \| 'last' \| 'center' \| 'random' \| number` | `'first'` | Откуда начинается stagger |
| `loop` | `boolean` | `true` | Зациклить чередование |
| `auto` | `boolean` | `true` | Автоматически переключать по интервалу |
| `initial` | `Target` | `{ y: '100%', opacity: 0 }` | Начальное состояние для входа |
| `animate` | `TargetAndTransition` | `{ y: 0, opacity: 1 }` | Конечное состояние анимации |
| `exit` | `Target` | `{ y: '-120%', opacity: 0 }` | Состояние при выходе |
| `transition` | `Transition` | `spring(damping:25, stiffness:300)` | Spring или tween переход |
| `animatePresenceMode` | `'wait' \| 'sync'` | `'wait'` | Режим AnimatePresence |
| `animatePresenceInitial` | `boolean` | `false` | Анимировать при первом рендере |
| `onNext` | `(index: number) => void` | — | Колбэк при смене текста |
| `mainClassName` | `string` | — | CSS классы для корневого `<span>` |
| `splitLevelClassName` | `string` | — | CSS классы для группы (слово/строка) |
| `elementLevelClassName` | `string` | — | CSS классы для каждой буквы/слова |

---

## Ref API

Компонент принимает `ref` и предоставляет методы для программного управления:

```tsx
const ref = useRef<RotatingTextRef>(null);

ref.current?.next()         // следующий текст
ref.current?.previous()     // предыдущий текст
ref.current?.jumpTo(2)      // перейти на индекс 2
ref.current?.reset()        // вернуться к первому тексту
```

:::tip
При `auto={false}` компонент не переключается автоматически — удобно для управления кнопками или внешними событиями.
:::

---

## Режим `animatePresenceMode`

- **`wait`** (по умолчанию) — старый текст полностью уходит, затем появляется новый. Нет наложения.
- **`sync`** — старый текст исчезает и новый появляется одновременно. Даёт эффект наложения.

---

## staggerFrom

Определяет порядок начала анимации букв:

| Значение | Описание |
|----------|---------|
| `'first'` | Буквы анимируются слева направо |
| `'last'` | Справа налево |
| `'center'` | От центра к краям |
| `'random'` | Случайный порядок при каждой смене |
| `number` | От конкретного индекса |