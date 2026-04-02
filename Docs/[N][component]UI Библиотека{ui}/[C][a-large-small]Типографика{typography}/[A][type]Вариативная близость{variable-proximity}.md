---
title: "Вариативная близость"
description: Буквы меняют параметры вариативного шрифта в зависимости от близости курсора. Чем ближе мышь — тем жирнее, шире или курсивнее становится буква.
author: davidhdev
date: 2026-03-23
tags: animation, text, variable-font, mouse, proximity, interactive
keywords: variable font, proximity, mouse interaction, fontVariationSettings, react
robots: index, follow
lang: ru
---

[uic:variable-proximity]

Каждая буква отслеживает расстояние до курсора и интерполирует `fontVariationSettings` — параметры вариативного шрифта. Чем ближе курсор, тем сильнее меняется жирность, ширина или наклон буквы. Эффект рассчитывается через `requestAnimationFrame` без React-перерисовок — прямая мутация `style` для максимальной производительности.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `framer-motion` | `^11` | `motion.span` для ref на DOM-элементы букв |
| `react` | `^18` или `^19` | Базовый фреймворк |

Установка:

```bash
npm install framer-motion
```

Компонент требует **вариативный шрифт** с поддержкой нужных осей. По умолчанию используется `Roboto Flex` — его нужно подключить:

```html
<link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,75..125,100..900&display=swap" rel="stylesheet" />
```

---

## Использование

```tsx
import VariableProximity from '@/features/ui-components/variable-proximity/variable-proximity';

// containerRef — обязательный проп, указывает на родительский контейнер
const containerRef = useRef<HTMLDivElement>(null);

// Базовый пример: жирность от 400 до 900
<div ref={containerRef}>
  <VariableProximity
    label="Наведи курсор"
    fromFontVariationSettings="'wght' 400, 'wdth' 100"
    toFontVariationSettings="'wght' 900, 'wdth' 125"
    containerRef={containerRef}
    radius={100}
  />
</div>

// Только жирность, большой радиус
<div ref={containerRef}>
  <VariableProximity
    label="Variable Font"
    fromFontVariationSettings="'wght' 100"
    toFontVariationSettings="'wght' 900"
    containerRef={containerRef}
    radius={200}
    falloff="gaussian"
    className="text-7xl"
  />
</div>

// Кастомный шрифт
<div ref={containerRef}>
  <VariableProximity
    label="Custom Font"
    fromFontVariationSettings="'wght' 100"
    toFontVariationSettings="'wght' 900"
    containerRef={containerRef}
    radius={80}
    style={{ fontFamily: '"Inter", sans-serif' }}
  />
</div>
```

## Оригинальный код

```tsx
import { forwardRef, useMemo, useRef, useEffect, MutableRefObject, CSSProperties, HTMLAttributes } from 'react';
import { motion } from 'motion/react';

function useAnimationFrame(callback: () => void) {
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      callback();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [callback]);
}

function useMousePositionRef(containerRef: MutableRefObject<HTMLElement | null>) {
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (x: number, y: number) => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        positionRef.current = { x: x - rect.left, y: y - rect.top };
      } else {
        positionRef.current = { x, y };
      }
    };

    const handleMouseMove = (ev: MouseEvent) => updatePosition(ev.clientX, ev.clientY);
    const handleTouchMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [containerRef]);

  return positionRef;
}

interface VariableProximityProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  containerRef: MutableRefObject<HTMLElement | null>;
  radius?: number;
  falloff?: 'linear' | 'exponential' | 'gaussian';
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

const VariableProximity = forwardRef<HTMLSpanElement, VariableProximityProps>((props, ref) => {
  const {
    label,
    fromFontVariationSettings,
    toFontVariationSettings,
    containerRef,
    radius = 50,
    falloff = 'linear',
    className = '',
    onClick,
    style,
    ...restProps
  } = props;

  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const interpolatedSettingsRef = useRef<string[]>([]);
  const mousePositionRef = useMousePositionRef(containerRef);
  const lastPositionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  const parsedSettings = useMemo(() => {
    const parseSettings = (settingsStr: string) =>
      new Map(
        settingsStr
          .split(',')
          .map(s => s.trim())
          .map(s => {
            const [name, value] = s.split(' ');
            return [name.replace(/['"]/g, ''), parseFloat(value)];
          })
      );

    const fromSettings = parseSettings(fromFontVariationSettings);
    const toSettings = parseSettings(toFontVariationSettings);

    return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: toSettings.get(axis) ?? fromValue
    }));
  }, [fromFontVariationSettings, toFontVariationSettings]);

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const calculateFalloff = (distance: number) => {
    const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
    switch (falloff) {
      case 'exponential':
        return norm ** 2;
      case 'gaussian':
        return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
      case 'linear':
      default:
        return norm;
    }
  };

  useAnimationFrame(() => {
    if (!containerRef?.current) return;
    const { x, y } = mousePositionRef.current;
    if (lastPositionRef.current.x === x && lastPositionRef.current.y === y) {
      return;
    }
    lastPositionRef.current = { x, y };
    const containerRect = containerRef.current.getBoundingClientRect();

    letterRefs.current.forEach((letterRef, index) => {
      if (!letterRef) return;

      const rect = letterRef.getBoundingClientRect();
      const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
      const letterCenterY = rect.top + rect.height / 2 - containerRect.top;

      const distance = calculateDistance(
        mousePositionRef.current.x,
        mousePositionRef.current.y,
        letterCenterX,
        letterCenterY
      );

      if (distance >= radius) {
        letterRef.style.fontVariationSettings = fromFontVariationSettings;
        return;
      }

      const falloffValue = calculateFalloff(distance);
      const newSettings = parsedSettings
        .map(({ axis, fromValue, toValue }) => {
          const interpolatedValue = fromValue + (toValue - fromValue) * falloffValue;
          return `'${axis}' ${interpolatedValue}`;
        })
        .join(', ');

      interpolatedSettingsRef.current[index] = newSettings;
      letterRef.style.fontVariationSettings = newSettings;
    });
  });

  const words = label.split(' ');
  let letterIndex = 0;

  return (
    <span
      ref={ref}
      onClick={onClick}
      style={{
        display: 'inline',
        fontFamily: '"Roboto Flex", sans-serif',
        ...style
      }}
      className={className}
      {...restProps}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {word.split('').map(letter => {
            const currentLetterIndex = letterIndex++;
            return (
              <motion.span
                key={currentLetterIndex}
                ref={el => {
                  letterRefs.current[currentLetterIndex] = el;
                }}
                style={{
                  display: 'inline-block',
                  fontVariationSettings: interpolatedSettingsRef.current[currentLetterIndex]
                }}
                aria-hidden="true"
              >
                {letter}
              </motion.span>
            );
          })}
          {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
});

VariableProximity.displayName = 'VariableProximity';
export default VariableProximity;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `label` | `string` | — | Текст для анимации |
| `fromFontVariationSettings` | `string` | — | Параметры шрифта когда курсор далеко |
| `toFontVariationSettings` | `string` | — | Параметры шрифта под курсором |
| `containerRef` | `MutableRefObject<HTMLElement>` | — | Ref на контейнер для расчёта позиции курсора |
| `radius` | `number` | `50` | Радиус влияния курсора в пикселях |
| `falloff` | `'linear' \| 'exponential' \| 'gaussian'` | `'linear'` | Кривая затухания эффекта |
| `className` | `string` | `''` | CSS классы |
| `style` | `CSSProperties` | — | Инлайн-стили (можно переопределить `fontFamily`) |
| `onClick` | `() => void` | — | Обработчик клика |

---

## Кривые затухания

| Значение | Описание |
|----------|---------|
| `linear` | Равномерное затухание от центра к краю радиуса |
| `exponential` | Резкое у центра, быстро затухает к краям |
| `gaussian` | Мягкое колоколообразное затухание, концентрированный эффект |

---

## Оси вариативных шрифтов

| Ось | Название | Диапазон (Roboto Flex) |
|-----|----------|----------------------|
| `wght` | Weight (жирность) | `100` — `900` |
| `wdth` | Width (ширина) | `75` — `125` |
| `ital` | Italic | `0` — `1` |
| `slnt` | Slant (наклон) | `0` — `-10` |
| `opsz` | Optical size | `8` — `144` |

:::note
`containerRef` должен указывать на элемент который **содержит** компонент. Позиция курсора вычисляется относительно этого контейнера — поэтому важно чтобы контейнер не был слишком маленьким.
:::

:::tip
Для Roboto Flex доступны все пять осей выше. Это один из наиболее гибких Google Fonts для экспериментов с вариативным шрифтом.
:::