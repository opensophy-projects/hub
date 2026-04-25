---
title: "Линейная тень текста | UI Компонент"
description: Текст с анимированной диагональной штриховкой в качестве тени. Штриховка бесконечно движется по тексту через bg-clip-text и CSS-анимацию.
author: davidhdev
date: 2026-04-25
tags: разработка, ui, ui-компоненты
keywords: line shadow text, animated shadow, diagonal hatching, bg-clip-text, css animation, framer motion
robots: index, follow
lang: ru
---

[uic:line-shadow-text]

Компонент создаёт декоративную тень из диагональных линий, которые непрерывно движутся под текстом. Эффект достигается через `background-clip: text` на абсолютно позиционированном спане-дубликате, сдвинутом на `0.04em` вправо и вниз. Фон дубликата — `linear-gradient` с диагональными полосами шириной `0.06em`, анимированный через `background-position`.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `framer-motion` | `^11` | `motion.create()` для поддержки произвольного тега через проп `as` |
| `react` | `^18` или `^19` | Базовый фреймворк |

```bash
npm install framer-motion
```

### Обязательная CSS-анимация

Компонент требует keyframe-анимации `line-shadow` в глобальных стилях. Добавь в `globals.css`:

```css
@keyframes line-shadow {
  0%   { background-position: 0 0; }
  100% { background-position: 100% -100%; }
}
```

---

## Использование

```tsx
import LineShadowText from '@/features/ui-components/line-shadow-text/line-shadow-text';

// Базовый пример — добавь @keyframes в globals.css
<LineShadowText shadowColor="#a855f7" className="text-6xl font-bold">
  LineShadow
</LineShadowText>

// Чёрная штриховка на светлом фоне
<LineShadowText shadowColor="black" className="text-5xl font-black">
  Hello World
</LineShadowText>

// Другой тег
<LineShadowText as="h1" shadowColor="#f59e0b" className="text-7xl font-extrabold">
  Заголовок
</LineShadowText>

// Со всеми motion-пропсами
<LineShadowText
  shadowColor="#6366f1"
  className="text-5xl font-bold"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Появляюсь
</LineShadowText>
```

## Оригинальный код

```tsx
'use client';
import { type MotionProps, motion } from 'motion/react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

interface LineShadowTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>,
    MotionProps {
  shadowColor?: string;
  as?: React.ElementType;
}

function LineShadowText({
  children,
  shadowColor = 'black',
  className,
  as: Component = 'span',
  ...props
}: LineShadowTextProps) {
  const MotionComponent = motion.create(Component);
  const content = typeof children === 'string' ? children : null;
  if (!content) throw new Error('LineShadowText only accepts string content');

  return (
    <MotionComponent
      className={cn(
        'relative z-0 inline-flex',
        'after:absolute after:left-[0.04em] after:top-[0.04em] after:content-[attr(data-text)]',
        'after:bg-[linear-gradient(45deg,transparent_45%,var(--shadow-color)_45%,var(--shadow-color)_55%,transparent_0)]',
        'after:-z-10 after:bg-[length:0.06em_0.06em] after:bg-clip-text after:text-transparent',
        'after:animate-line-shadow',
        className,
      )}
      data-text={content}
      style={{ '--shadow-color': shadowColor } as React.CSSProperties}
      {...(props as any)}
    >
      {content}
    </MotionComponent>
  );
}

export { LineShadowText, type LineShadowTextProps };
export default LineShadowText;
```

## Адаптированный код под проекты opensophy

```tsx
import { type MotionProps, motion } from 'framer-motion';
import type * as React from 'react';

interface LineShadowTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>,
    MotionProps {
  shadowColor?: string;
  as?: React.ElementType;
}

function LineShadowText({
  children,
  shadowColor = 'black',
  className = '',
  as: Component = 'span',
  ...props
}: LineShadowTextProps) {
  const MotionComponent = motion.create(Component as React.ElementType);
  const content = typeof children === 'string' ? children : null;
  if (!content) throw new Error('LineShadowText only accepts string content');

  return (
    <MotionComponent
      className={`relative z-0 inline-flex ${className}`}
      data-text={content}
      style={
        {
          '--shadow-color': shadowColor,
          position: 'relative',
          display: 'inline-flex',
          zIndex: 0,
        } as React.CSSProperties
      }
      {...(props as MotionProps)}
    >
      {content}
      {/* Span-дубликат вместо ::after — CSS псевдоэлемент не может читать CSS-переменные
          внутри bg-clip-text без дополнительной конфигурации Tailwind */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '0.04em',
          top: '0.04em',
          zIndex: -1,
          backgroundImage: `linear-gradient(45deg, transparent 45%, ${shadowColor} 45%, ${shadowColor} 55%, transparent 0)`,
          backgroundSize: '0.06em 0.06em',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          pointerEvents: 'none',
          userSelect: 'none',
          animation: 'line-shadow 3s linear infinite',
        }}
      >
        {content}
      </span>
    </MotionComponent>
  );
}

export { LineShadowText, type LineShadowTextProps };
export default LineShadowText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `children` | `string` | — | Текст для отображения. Только строки — другие типы выбросят ошибку |
| `shadowColor` | `string` | `'black'` | Цвет диагональных линий тени. Любой CSS-цвет: hex, rgb, named |
| `as` | `React.ElementType` | `'span'` | HTML-тег или React-компонент. Оборачивается через `motion.create()` |
| `className` | `string` | `''` | CSS классы на корневом элементе |
| `...props` | `MotionProps` | — | Все пропсы framer-motion: `initial`, `animate`, `transition`, `whileHover` и т.д. |

---

## Как работает эффект

**Слой 1 — основной текст:** рендерится как обычный текстовый узел внутри `MotionComponent`.

**Слой 2 — тень:** абсолютно позиционированный `<span>` со смещением `left: 0.04em, top: 0.04em` содержит дубликат текста. Его фон — `linear-gradient(45deg, ...)` с диагональными полосами шириной `0.06em`, обрезанный по контуру букв через `background-clip: text`. Анимация `line-shadow` сдвигает `background-position` от `0 0` до `100% -100%` — полосы движутся вправо-вниз.

**`motion.create(Component)`** — framer-motion утилита для оборачивания произвольных элементов в motion-компонент. Позволяет передавать `initial`, `animate`, `whileHover` и т.д. на любой тег через проп `as`.

### Почему span вместо ::after

Оригинальный код использует Tailwind-утилиты для `::after` с `content-[attr(data-text)]`. В адаптированной версии псевдоэлемент заменён на реальный `<span>` — это надёжнее работает с `background-clip: text` без дополнительной конфигурации Tailwind и без зависимости от `cn`. `aria-hidden="true"` скрывает дубликат от скринридеров.

### Скорость анимации

Длительность задаётся в инлайн-стиле span-тени: `animation: 'line-shadow 3s linear infinite'`. Для изменения скорости — поменяй `3s` на нужное значение, либо вынеси в проп.

:::note
Keyframe `@keyframes line-shadow` должен быть добавлен глобально — в `globals.css` или через `<style>` тег. Preview-обёртка инжектирует его программно через `document.createElement('style')`. В продакшне добавь анимацию в `globals.css`.
:::

:::tip
Для тёмной темы используй светлый `shadowColor` — например `#e2e8f0` или `white`. Для светлой — тёмный или цветной: `black`, `#7c3aed`.
:::