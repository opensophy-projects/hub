---
title: "Скрытый текст | UI Компонент"
description: Текст скрыт облаком мерцающих частиц. При наведении частицы собираются на исходные позиции и текст проявляется. Canvas-анимация с шумовым движением, sparkle-эффектом и плавным reveal.
author: davidhdev
date: 2026-05-07
tags: разработка, ui, ui-компоненты
keywords: magic text reveal, particle text, canvas particles, hover reveal, hidden text, sparkle animation
robots: index, follow
lang: ru
---

[uic:magic-text-reveal]

Текст растеризуется в offscreen Canvas и превращается в облако частиц. Каждая частица блуждает вокруг своей исходной позиции с шумовым движением и непрерывно мерцает, меняя прозрачность. При наведении курсора частицы притягиваются обратно к исходным координатам, а поверх них проявляется настоящий HTML-текст. Никаких внешних зависимостей — только нативный Canvas API.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `react` | `^18` или `^19` | Базовый фреймворк |

Внешних зависимостей нет.

---

## Установка

Скопируй файл `magic-text-reveal.tsx` в свой проект.

---

## Использование

```tsx
import MagicTextReveal from '@/features/ui-components/magic-text-reveal/magic-text-reveal';

// Базовый пример
<MagicTextReveal text="Hover me" />

// Плотное облако частиц, медленное движение
<MagicTextReveal
  text="Тайный текст"
  spread={20}
  speed={0.2}
  density={2}
/>

// Широко рассеянные частицы, быстрое возвращение
<MagicTextReveal
  text="REVEAL"
  spread={80}
  speed={1.5}
  density={5}
  fontSize={90}
  fontWeight={900}
/>

// Текст остаётся видимым после первого наведения
<MagicTextReveal
  text="Открыт навсегда"
  resetOnMouseLeave={false}
/>

// Кастомный цвет и стиль контейнера
<MagicTextReveal
  text="Gradient"
  color="rgba(251, 146, 60, 1)"
  fontSize={60}
  style={{ borderRadius: '1.5rem' }}
/>
```

---

## Оригинальный код

```tsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface Particle {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  color: string;
  opacity: number;
  originalAlpha: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  speed: number;
  floatingOffsetX: number;
  floatingOffsetY: number;
  floatingSpeed: number;
  floatingAngle: number;
  targetOpacity: number;
  sparkleSpeed: number;
}

interface MagicTextRevealProps {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  spread?: number;
  speed?: number;
  density?: number;
  resetOnMouseLeave?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const MagicTextReveal: React.FC<MagicTextRevealProps> = ({
  text = 'Magic Text',
  color = 'rgba(255, 255, 255, 1)',
  fontSize = 70,
  fontFamily = 'inherit',
  fontWeight = 600,
  spread = 40,
  speed = 0.5,
  density = 4,
  resetOnMouseLeave = true,
  className = '',
  style = {},
}) => {
  // ... (полный код в файле компонента)
};

export default MagicTextReveal;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `text` | `string` | `'Magic Text'` | Скрытый текст для проявления |
| `color` | `string` | `'rgba(255,255,255,1)'` | Цвет текста и частиц. Любой CSS-цвет включая rgba |
| `fontSize` | `number` | `70` | Размер шрифта в пикселях |
| `fontFamily` | `string` | `'inherit'` | Семейство шрифтов. `'inherit'` берёт шрифт из родителя |
| `fontWeight` | `number` | `600` | Жирность шрифта (100–900) |
| `spread` | `number` | `40` | Радиус блуждания частиц вокруг исходной позиции в пикселях |
| `speed` | `number` | `0.5` | Скорость движения частиц. Влияет на плавность и хаотичность |
| `density` | `number` | `4` | Плотность частиц от `1` (максимум) до `5` (минимум) |
| `resetOnMouseLeave` | `boolean` | `true` | Рассеивать частицы обратно при уходе курсора |
| `className` | `string` | `''` | CSS классы на корневом `<div>` |
| `style` | `CSSProperties` | `{}` | Инлайн-стили на корневом контейнере |

---

## Как работает анимация

Компонент проходит два этапа при монтировании и при изменении пропсов.

**Растеризация текста.** Сначала измеряются реальные размеры текста через `ctx.measureText()` — это нужно чтобы задать правильный размер контейнера. Затем текст рисуется в offscreen Canvas с нужными шрифтом и цветом. `ctx.getImageData()` сканирует пиксели с шагом `sampleRate = baseSampleRate × transformedDensity`. Каждый непрозрачный пиксель становится частицей.

**Структура частицы.** У каждой частицы есть два набора координат: `originalX/Y` (исходная позиция в тексте) и `x/y` (текущая). При создании частица получает случайное смещение от исходной позиции в радиусе `spreadRadius`, а также уникальные параметры движения: `floatingSpeed`, `floatingAngle`, `sparkleSpeed`.

**Анимационный цикл** работает через `requestAnimationFrame` и обновляет частицы в двух режимах:

*Режим покоя (курсор не на компоненте):*
Каждый кадр вычисляется новая целевая позиция на основе шумовой функции из суммы синусоид с уникальным фазовым сдвигом (`floatingSpeed × 2000`). Частица плавно движется к цели с добавлением случайного джиттера. Мягкая граница `FLOAT_RADIUS` возвращает частицу если она улетела слишком далеко. Прозрачность непрерывно колеблется между почти нулём и `originalAlpha × 3` — создаётся sparkle-эффект.

*Режим hover:*
Частица движется прямолинейно к `originalX/Y` со скоростью `RETURN_SPEED`. Одновременно прозрачность быстро падает к нулю (`FADE_SPEED = 13`). Когда частицы «схлопнулись», поверх проявляется HTML-слой с настоящим текстом через `opacity: 1`.

**DPR-адаптация.** Компонент использует `devicePixelRatio × 1.5` для чёткости на Retina-экранах. Все координаты частиц хранятся в физических пикселях Canvas, при рендеринге делятся на DPR обратно.

**Батчинг рендера.** Вместо отдельного `fillRect` на каждую частицу, компонент группирует частицы по цвету через `Map`. Один `fillStyle` применяется сразу ко всем частицам одного цвета — это существенно снижает количество вызовов Canvas API.

:::tip
`density: 1` создаёт максимально плотное облако — каждый пиксель текста становится частицей. Для крупного текста это может быть тысячи частиц. Если нужна производительность — ставь `density: 3–5`.
:::

:::note
`fontFamily: 'inherit'` работает только если родительский элемент явно задаёт шрифт. Для надёжности лучше передать конкретное название: `fontFamily="'Geist', sans-serif"`. Компонент ждёт загрузки шрифтов через `document.fonts` не нужно — шрифты берутся из текущего контекста.
:::

:::tip
`resetOnMouseLeave: false` полезен для интерактивных UI-элементов типа кнопок или заголовков, которые должны «открыться» один раз при первом наведении и остаться видимыми. Текст остаётся в HTML-слое, частицы больше не анимируются.
:::