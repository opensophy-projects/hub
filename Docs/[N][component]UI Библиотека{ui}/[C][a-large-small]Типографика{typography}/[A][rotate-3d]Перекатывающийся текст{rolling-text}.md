---
title: "Перекатывающийся текст | UI Компонент"
description: Буквы текста «перекатываются» через 3D-вращение по оси X — старая буква уходит назад, новая выкатывается вперёд. Запускается сразу или при появлении в области видимости.
author: davidhdev
date: 2026-04-25
tags: разработка, ui, ui-компоненты
keywords: rolling text, 3d text animation, rotateX, framer motion, in-view, stagger, react
robots: index, follow
lang: ru
---

[uic:rolling-text]

Каждая буква анимируется двумя наложенными `motion.span`. Первый спан вращается от `rotateX: 0` до `rotateX: 90` — «откидывается» назад. Второй приходит из `rotateX: 90` в `rotateX: 0` — «выкатывается» вперёд. Оба спана абсолютно позиционированы поверх невидимого третьего, который только резервирует место. Третий невидимый спан резервирует место в потоке. Анимация запускается сразу или через `useInView` при появлении в области видимости.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `framer-motion` | `^11` | `motion.span`, `useInView`, `useImperativeHandle` |
| `react` | `^18` или `^19` | Базовый фреймворк |

```bash
npm install framer-motion
```

---

## Использование

```tsx
import RollingText from '@/features/ui-components/rolling-text/rolling-text';

// Базовый — запускается сразу при монтировании
<RollingText text="Hello World" />

// Запуск при появлении в области видимости
<RollingText
  text="Появляюсь при скролле"
  inView
  inViewOnce
  className="text-5xl font-bold"
/>

// Медленная анимация с большим stagger
<RollingText
  text="Медленно"
  transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
/>

// Встраивание в заголовок
<h1 className="text-6xl font-black">
  <RollingText text="Opensophy" className="text-purple-400" />
</h1>

// Повторный запуск через смену key
const [key, setKey] = useState(0);
<RollingText key={key} text="Перезапуск" />
<button onClick={() => setKey(k => k + 1)}>Повторить</button>
```

## Оригинальный код

```tsx
'use client';
import { motion, type Transition, type UseInViewOptions, useInView } from 'motion/react';
import * as React from 'react';

const ENTRY_ANIMATION = {
  initial: { rotateX: 0 },
  animate: { rotateX: 90 },
};

const EXIT_ANIMATION = {
  initial: { rotateX: 90 },
  animate: { rotateX: 0 },
};

const formatCharacter = (char: string) => (char === ' ' ? '\u00A0' : char);

type RollingTextProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  transition?: Transition;
  inView?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
  inViewOnce?: boolean;
  text: string;
};

function RollingText({
  ref,
  transition = { duration: 0.5, delay: 0.1, ease: 'easeOut' },
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  text,
  ...props
}: RollingTextProps) {
  const localRef = React.useRef<HTMLSpanElement>(null);
  React.useImperativeHandle(ref as any, () => localRef.current!);

  const inViewResult = useInView(localRef, { once: inViewOnce, margin: inViewMargin });
  const isInView     = !inView || inViewResult;
  const characters   = React.useMemo(() => text.split(''), [text]);

  return (
    <span data-slot="rolling-text" {...(props as any)} ref={ref}>
      {characters.map((char, idx) => (
        <span
          aria-hidden="true"
          className="relative inline-block perspective-[9999999px] transform-3d w-auto"
          key={idx}
        >
          <motion.span
            animate={isInView ? ENTRY_ANIMATION.animate : undefined}
            className="absolute inline-block backface-hidden origin-[50%_25%]"
            initial={ENTRY_ANIMATION.initial}
            transition={{ ...transition, delay: idx * (transition?.delay ?? 0) }}
          >
            {formatCharacter(char)}
          </motion.span>
          <motion.span
            animate={isInView ? EXIT_ANIMATION.animate : undefined}
            className="absolute inline-block backface-hidden origin-[50%_100%]"
            initial={EXIT_ANIMATION.initial}
            transition={{ ...transition, delay: idx * (transition?.delay ?? 0) + 0.3 }}
          >
            {formatCharacter(char)}
          </motion.span>
          <span className="invisible">{formatCharacter(char)}</span>
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </span>
  );
}

export { RollingText, type RollingTextProps };
export default RollingText;
```

## Адаптированный код под проекты opensophy

```tsx
import { motion, type Transition, type UseInViewOptions, useInView } from 'framer-motion';
import * as React from 'react';

const ENTRY_ANIMATION = {
  initial: { rotateX: 0 },
  animate: { rotateX: 90 },
};

const EXIT_ANIMATION = {
  initial: { rotateX: 90 },
  animate: { rotateX: 0 },
};

const formatCharacter = (char: string) => (char === ' ' ? '\u00A0' : char);

type RollingTextProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  transition?: Transition;
  inView?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
  inViewOnce?: boolean;
  text: string;
};

function RollingText({
  ref,
  transition = { duration: 0.5, delay: 0.1, ease: 'easeOut' },
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  text,
  ...props
}: RollingTextProps) {
  const localRef = React.useRef<HTMLSpanElement>(null);
  React.useImperativeHandle(ref as React.Ref<HTMLSpanElement>, () => localRef.current!);

  const inViewResult = useInView(localRef, { once: inViewOnce, margin: inViewMargin });
  const isInView     = !inView || inViewResult;
  const characters   = React.useMemo(() => text.split(''), [text]);

  return (
    <span
      data-slot="rolling-text"
      {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      ref={localRef}
    >
      {characters.map((char, idx) => (
        <span
          aria-hidden="true"
          className="relative inline-block w-auto"
          key={idx}
          style={{ perspective: '9999999px', transformStyle: 'preserve-3d' }}
        >
          <motion.span
            animate={isInView ? ENTRY_ANIMATION.animate : undefined}
            className="absolute inline-block"
            initial={ENTRY_ANIMATION.initial}
            style={{ backfaceVisibility: 'hidden', transformOrigin: '50% 25%' }}
            transition={{
              ...transition,
              delay: idx * ((transition?.delay as number) ?? 0),
            }}
          >
            {formatCharacter(char)}
          </motion.span>
          <motion.span
            animate={isInView ? EXIT_ANIMATION.animate : undefined}
            className="absolute inline-block"
            initial={EXIT_ANIMATION.initial}
            style={{ backfaceVisibility: 'hidden', transformOrigin: '50% 100%' }}
            transition={{
              ...transition,
              delay: idx * ((transition?.delay as number) ?? 0) + 0.3,
            }}
          >
            {formatCharacter(char)}
          </motion.span>
          <span className="invisible">{formatCharacter(char)}</span>
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </span>
  );
}

export { RollingText, type RollingTextProps };
export default RollingText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `text` | `string` | — | Текст для анимации |
| `transition` | `Transition` | `{ duration: 0.5, delay: 0.1, ease: 'easeOut' }` | framer-motion transition. `delay` используется как stagger между буквами |
| `inView` | `boolean` | `false` | Если `true` — анимация запускается только при появлении в области видимости |
| `inViewMargin` | `string` | `'0px'` | Отступ для `useInView` (формат CSS margin) |
| `inViewOnce` | `boolean` | `true` | Запустить анимацию только один раз |
| `className` | `string` | `''` | CSS классы на корневом `<span>` |

Компонент также принимает все стандартные пропсы `<span>` кроме `children`.

---

## Как работает анимация

Каждая буква состоит из трёх слоёв внутри одного `<span>` с `perspective` и `transformStyle: preserve-3d`:

**Слой 1 — entry (уходит):** начинает с `rotateX: 0` (смотрит на пользователя) и поворачивается к `rotateX: 90` (уходит за горизонт). `transformOrigin: '50% 25%'` — ось вращения выше центра буквы, создавая эффект «откидывания назад».

**Слой 2 — exit (приходит):** начинает с `rotateX: 90` (за горизонтом) и приходит к `rotateX: 0`. `transformOrigin: '50% 100%'` — ось вращения снизу буквы, создавая эффект «выкатывания снизу». Запускается с дополнительной задержкой `+0.3` после entry-спана.

**Слой 3 — невидимый:** `visibility: hidden` — держит место в потоке, чтобы ширина контейнера не схлопывалась.

**Stagger:** задержка каждой буквы вычисляется как `idx * transition.delay`. Это значит что `delay` в `transition` — не задержка перед стартом, а шаг stagger'а.

:::tip
Для повторного запуска анимации — смени `key` на компоненте. framer-motion не перезапускает анимацию если пропсы не менялись.
:::

:::note
`'use client'` убран — в проекте не используется Next.js App Router. Также убраны Tailwind-классы `perspective-[...]`, `transform-3d`, `backface-hidden` и `origin-[...]` так как они требуют кастомных плагинов — заменены на инлайн-стили, которые работают в любой среде.
:::