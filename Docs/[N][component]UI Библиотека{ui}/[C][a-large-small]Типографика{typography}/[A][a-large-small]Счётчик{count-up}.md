---
title: "Счётчик"
description: Анимированный числовой счётчик с пружинной анимацией на framer-motion. Запускается при появлении в зоне видимости или программно.
author: davidhdev
date: 2026-03-23
tags: animation, number, counter, spring, framer-motion
keywords: count up, number animation, framer motion, spring animation, react counter
robots: index, follow
lang: ru
---

[uic:count-up]

Анимированный счётчик, который плавно считает от одного числа к другому. Использует пружинную физику framer-motion для естественного ощущения движения. Запускается автоматически когда элемент попадает в область видимости, или программно через проп `startWhen`.

## Стек и зависимости

- [framer-motion](https://www.framer.com/motion/) — пружинная анимация и `useInView`
- React 18+

## Установка

```bash
npm install framer-motion
```

Скопируй файл `count-up.tsx` в свой проект.

## Использование

```tsx
import CountUp from '@/components/count-up';
```

## Оригинальный код

```tsx
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = (num: number): number => {
    const str = num.toString();
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      if (parseInt(decimals) !== 0) {
        return decimals.length;
      }
    }
    return 0;
  };

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;

      const options: Intl.NumberFormatOptions = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0
      };

      const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);

      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, separator]
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === 'down' ? to : from);
    }
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof onStart === 'function') {
        onStart();
      }

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? from : to);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === 'function') {
            onEnd();
          }
        },
        delay * 1000 + duration * 1000
      );

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}
```

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `to` | `number` | — | Конечное значение счётчика |
| `from` | `number` | `0` | Начальное значение |
| `direction` | `'up' \| 'down'` | `'up'` | Направление счёта |
| `duration` | `number` | `2` | Длительность анимации в секундах |
| `delay` | `number` | `0` | Задержка перед запуском в секундах |
| `separator` | `string` | `''` | Разделитель тысяч, например `','` |
| `startWhen` | `boolean` | `true` | Программное управление запуском |
| `className` | `string` | `''` | CSS-класс для `<span>` |
| `onStart` | `() => void` | — | Колбэк при старте анимации |
| `onEnd` | `() => void` | — | Колбэк при завершении анимации |