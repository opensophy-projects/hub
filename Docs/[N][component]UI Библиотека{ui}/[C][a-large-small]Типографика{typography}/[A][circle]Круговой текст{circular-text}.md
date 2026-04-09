---
title: "Круговой текст"
description: Текст расположенный по кругу с непрерывной анимацией вращения. Реагирует на ховер — замедление, ускорение, пауза или хаотичное вращение.
author: davidhdev
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: circular text animation, rotating text, motion react
robots: index, follow
lang: ru
---

[uic:circular-text]

Текст расположенный по окружности с бесконечным вращением на `motion/react`. Каждая буква позиционируется через `rotateZ` + `translate3d`. При наведении поведение меняется через `useAnimation`.

---

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `motion` (motion/react) | `^11` | Анимация — `useAnimation`, `useMotionValue`, `motion.div` |
| `react` | `^18` или `^19` | Базовый фреймворк |

```bash
npm install motion
```

---

## Использование

```tsx
import CircularText from '@/features/ui-components/circular-text/CircularText';

// Базовый
<CircularText text="CIRCULAR TEXT • CIRCULAR TEXT •" />

// Замедляется при наведении
<CircularText
  text="HOVER ME • HOVER ME •"
  spinDuration={15}
  onHover="slowDown"
/>

// Хаотичное вращение при наведении
<CircularText
  text="GO BONKERS • GO BONKERS •"
  onHover="goBonkers"
  className="text-purple-400"
/>
```

## Оригинальный код

```tsx
import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue, MotionValue, Transition } from 'motion/react';
interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: 'slowDown' | 'speedUp' | 'pause' | 'goBonkers';
  className?: string;
}

const getRotationTransition = (duration: number, from: number, loop: boolean = true) => ({
  from,
  to: from + 360,
  ease: 'linear' as const,
  duration,
  type: 'tween' as const,
  repeat: loop ? Infinity : 0
});

const getTransition = (duration: number, from: number) => ({
  rotate: getRotationTransition(duration, from),
  scale: {
    type: 'spring' as const,
    damping: 20,
    stiffness: 300
  }
});

const CircularText: React.FC<CircularTextProps> = ({
  text,
  spinDuration = 20,
  onHover = 'speedUp',
  className = ''
}) => {
  const letters = Array.from(text);
  const controls = useAnimation();
  const rotation: MotionValue<number> = useMotionValue(0);

  useEffect(() => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start)
    });
  }, [spinDuration, text, onHover, controls]);

  const handleHoverStart = () => {
    const start = rotation.get();

    if (!onHover) return;

    let transitionConfig: ReturnType<typeof getTransition> | Transition;
    let scaleVal = 1;

    switch (onHover) {
      case 'slowDown':
        transitionConfig = getTransition(spinDuration * 2, start);
        break;
      case 'speedUp':
        transitionConfig = getTransition(spinDuration / 4, start);
        break;
      case 'pause':
        transitionConfig = {
          rotate: { type: 'spring', damping: 20, stiffness: 300 },
          scale: { type: 'spring', damping: 20, stiffness: 300 }
        };
        break;
      case 'goBonkers':
        transitionConfig = getTransition(spinDuration / 20, start);
        scaleVal = 0.8;
        break;
      default:
        transitionConfig = getTransition(spinDuration, start);
    }

    controls.start({
      rotate: start + 360,
      scale: scaleVal,
      transition: transitionConfig
    });
  };

  const handleHoverEnd = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start)
    });
  };

  return (
    <motion.div
      className={`m-0 mx-auto rounded-full w-[200px] h-[200px] relative font-black text-white text-center cursor-pointer origin-center ${className}`}
      style={{ rotate: rotation }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {letters.map((letter, i) => {
        const rotationDeg = (360 / letters.length) * i;
        const factor = Math.PI / letters.length;
        const x = factor * i;
        const y = factor * i;
        const transform = `rotateZ(${rotationDeg}deg) translate3d(${x}px, ${y}px, 0)`;

        return (
          <span
            key={i}
            className="absolute inline-block inset-0 text-2xl transition-all duration-500 ease-[cubic-bezier(0,0,0,1)]"
            style={{ transform, WebkitTransform: transform }}
          >
            {letter}
          </span>
        );
      })}
    </motion.div>
  );
};

export default CircularText;
```

## Адаптированный код под проекты opensophy

```tsx
import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue, type MotionValue, type Transition } from 'framer-motion';

interface CircularTextProps {
  text?: string;
  spinDuration?: number;
  onHover?: 'slowDown' | 'speedUp' | 'pause' | 'goBonkers';
  className?: string;
}

const getRotationTransition = (duration: number, from: number, loop: boolean = true) => ({
  from,
  to: from + 360,
  ease: 'linear' as const,
  duration,
  type: 'tween' as const,
  repeat: loop ? Infinity : 0,
});

const getTransition = (duration: number, from: number) => ({
  rotate: getRotationTransition(duration, from),
  scale: {
    type: 'spring' as const,
    damping: 20,
    stiffness: 300,
  },
});

const CircularText: React.FC<CircularTextProps> = ({
  text = 'CIRCULAR TEXT • CIRCULAR TEXT •',
  spinDuration = 20,
  onHover = 'speedUp',
  className = '',
}) => {
  const letters  = Array.from(text);
  const controls = useAnimation();
  const rotation: MotionValue<number> = useMotionValue(0);

  useEffect(() => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    });
  }, [spinDuration, text, onHover, controls]);

  const handleHoverStart = () => {
    const start = rotation.get();
    if (!onHover) return;

    let transitionConfig: ReturnType<typeof getTransition> | Transition;
    let scaleVal = 1;

    switch (onHover) {
      case 'slowDown':
        transitionConfig = getTransition(spinDuration * 2, start);
        break;
      case 'speedUp':
        transitionConfig = getTransition(spinDuration / 4, start);
        break;
      case 'pause':
        transitionConfig = {
          rotate: { type: 'spring', damping: 20, stiffness: 300 },
          scale:  { type: 'spring', damping: 20, stiffness: 300 },
        };
        break;
      case 'goBonkers':
        transitionConfig = getTransition(spinDuration / 20, start);
        scaleVal = 0.8;
        break;
      default:
        transitionConfig = getTransition(spinDuration, start);
    }

    controls.start({
      rotate: start + 360,
      scale: scaleVal,
      transition: transitionConfig,
    });
  };

  const handleHoverEnd = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    });
  };

  return (
    <motion.div
      className={`m-0 mx-auto rounded-full w-[200px] h-[200px] relative font-black text-center cursor-pointer origin-center ${className}`}
      style={{ rotate: rotation }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {letters.map((letter, i) => {
        const rotationDeg = (360 / letters.length) * i;
        const factor      = Math.PI / letters.length;
        const x           = factor * i;
        const y           = factor * i;
        const transform   = `rotateZ(${rotationDeg}deg) translate3d(${x}px, ${y}px, 0)`;
        return (
          <span
            key={i}
            className="absolute inline-block inset-0 text-2xl transition-all duration-500 ease-[cubic-bezier(0,0,0,1)]"
            style={{ transform, WebkitTransform: transform }}
          >
            {letter}
          </span>
        );
      })}
    </motion.div>
  );
};

export default CircularText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `text` | `string` | `'CIRCULAR TEXT • CIRCULAR TEXT •'` | Текст по кругу |
| `spinDuration` | `number` | `20` | Длительность одного оборота в секундах |
| `onHover` | `'slowDown' \| 'speedUp' \| 'pause' \| 'goBonkers'` | `'speedUp'` | Поведение при наведении |
| `className` | `string` | `''` | CSS классы на контейнере |

---

## Режимы onHover

| Значение | Поведение |
|----------|-----------|
| `slowDown` | Скорость уменьшается вдвое |
| `speedUp` | Скорость увеличивается в 4 раза |
| `pause` | Вращение останавливается (spring) |
| `goBonkers` | Скорость ×20 + scale 0.8 |