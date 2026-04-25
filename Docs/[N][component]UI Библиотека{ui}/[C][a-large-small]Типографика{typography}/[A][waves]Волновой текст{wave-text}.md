---
title: "Волновой текст | UI Компонент"
description: Буквы текста непрерывно анимируются волной — каждая буква покачивается вверх-вниз со сдвигом по времени относительно соседей. Поддерживает prefers-reduced-motion.
author: davidhdev
date: 2026-04-25
tags: разработка, ui, ui-компоненты
keywords: wave text, text animation, framer motion, stagger, loop animation, react
robots: index, follow
lang: ru
---

[uic:wave-text]

Каждая буква текста непрерывно покачивается по синусоидальной траектории. Буквы анимируются независимо с нарастающей задержкой через `staggerDelay` — создаётся эффект волны, бегущей слева направо. Анимация работает через бесконечный цикл framer-motion и автоматически отключается при `prefers-reduced-motion`.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `framer-motion` | `^11` | `motion.span`, `useReducedMotion`, бесконечная анимация |
| `react` | `^18` или `^19` | Базовый фреймворк |

```bash
npm install framer-motion
```

---

## Использование

```tsx
import WaveText from '@/features/ui-components/wave-text/wave-text';

// Базовый пример
<WaveText>Волновой текст</WaveText>

// Высокая амплитуда, медленная волна
<WaveText amplitude={20} duration={2} staggerDelay={0.08}>
  Hello World
</WaveText>

// Частая волна с малым смещением
<WaveText amplitude={4} duration={0.8} staggerDelay={0.03} className="text-2xl">
  Быстрая волна
</WaveText>

// Встраивание в строку текста
<h1 className="text-5xl font-bold">
  Добро пожаловать в{' '}
  <WaveText className="text-purple-400">будущее</WaveText>
</h1>
```

## Оригинальный код

```tsx
import { motion, useReducedMotion } from 'motion/react';
import type React from 'react';

export interface WaveTextProps {
  amplitude?: number;
  children: string;
  className?: string;
  duration?: number;
  staggerDelay?: number;
}

const WaveText: React.FC<WaveTextProps> = ({
  children,
  amplitude = 8,
  duration = 1.2,
  staggerDelay = 0.05,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className={className} style={{ display: 'inline-block' }}>
      {children.split('').map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          animate={
            shouldReduceMotion
              ? { y: 0 }
              : { y: [0, -amplitude, 0, amplitude * 0.5, 0] }
          }
          style={{
            display: 'inline-block',
            willChange: shouldReduceMotion ? undefined : 'transform',
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  repeat: Number.POSITIVE_INFINITY,
                  duration,
                  delay: i * staggerDelay,
                  ease: [0.37, 0, 0.63, 1],
                  times: [0, 0.25, 0.5, 0.75, 1],
                }
          }
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

export default WaveText;
```

## Адаптированный код под проекты opensophy

```tsx
import { motion, useReducedMotion } from 'framer-motion';
import type React from 'react';

export interface WaveTextProps {
  amplitude?: number;
  children: string;
  className?: string;
  duration?: number;
  staggerDelay?: number;
}

const WaveText: React.FC<WaveTextProps> = ({
  children,
  amplitude = 8,
  duration = 1.2,
  staggerDelay = 0.05,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className={className} style={{ display: 'inline-block' }}>
      {children.split('').map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          animate={
            shouldReduceMotion
              ? { y: 0 }
              : { y: [0, -amplitude, 0, amplitude * 0.5, 0] }
          }
          style={{
            display: 'inline-block',
            willChange: shouldReduceMotion ? undefined : 'transform',
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  repeat: Number.POSITIVE_INFINITY,
                  duration,
                  delay: i * staggerDelay,
                  ease: [0.37, 0, 0.63, 1],
                  times: [0, 0.25, 0.5, 0.75, 1],
                }
          }
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

export default WaveText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `children` | `string` | — | Текст для анимации |
| `amplitude` | `number` | `8` | Амплитуда волны в пикселях. Контролирует насколько высоко/низко уходит буква |
| `duration` | `number` | `1.2` | Длительность одного цикла волны в секундах |
| `staggerDelay` | `number` | `0.05` | Задержка между буквами в секундах. Чем больше — тем медленнее бежит волна |
| `className` | `string` | `''` | CSS классы на корневом `<span>` |

---

## Как работает анимация

Компонент разбивает `children` на массив символов через `.split('')`. Каждый символ оборачивается в `motion.span` с `display: inline-block` — без этого вертикальные трансформации не работают на инлайн-элементах.

Анимация задаётся keyframes-массивом по оси Y:

```
[0, -amplitude, 0, amplitude * 0.5, 0]
```

С временными точками `times: [0, 0.25, 0.5, 0.75, 1]` это создаёт асимметричную волну — буква уходит выше, чем опускается ниже нейтральной позиции. Это даёт более органичное, «живое» ощущение по сравнению с чистым синусом.

Задержка `delay: i * staggerDelay` сдвигает каждую следующую букву на фиксированное время, создавая эффект бегущей волны.

**Доступность:** хук `useReducedMotion` проверяет системную настройку `prefers-reduced-motion`. При включённой настройке анимация полностью отключается — буквы остаются на месте.

:::tip
Пробел заменяется на `\u00A0` (неразрывный пробел) — обычный пробел схлопывается в inline-контексте и разрушает ритм волны между словами.
:::

:::note
`children` принимает только `string`. ReactNode не поддерживается, так как компонент разбивает текст на символы через `.split('')`. Передавайте текст напрямую без вложенных элементов.
:::