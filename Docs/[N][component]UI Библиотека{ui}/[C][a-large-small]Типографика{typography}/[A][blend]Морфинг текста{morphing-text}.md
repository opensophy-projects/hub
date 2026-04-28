---
title: "Морфинг текста | UI Компонент"
description: Плавный переход между словами через blur-морфинг с SVG-фильтром threshold. Слова перетекают друг в друга с эффектом расплавленного текста.
author: davidhdev
date: 2026-04-25
tags: разработка, ui, ui-компоненты
keywords: morphing text, text morph, blur morph, svg filter, threshold, text animation, react
robots: index, follow
lang: ru
---

[uic:morphing-text]

Два `<span>` накладываются друг на друга и анимируются через прямую мутацию `style` в `requestAnimationFrame`. Первый спан угасает с нарастающим blur, второй — проявляется из размытия. SVG-фильтр `threshold` через `feColorMatrix` усиливает контраст краёв во время перехода, создавая эффект «расплавленного» морфинга между словами.

---

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `react` | `^18` или `^19` | Базовый фреймворк |

Внешних зависимостей нет — только нативный `requestAnimationFrame` и встроенный SVG-фильтр.

---

## Использование

```tsx
import MorphingText from '@/features/ui-components/morphing-text/morphing-text';

// Базовый пример
<MorphingText texts={['Дизайн', 'Интерфейс', 'Анимация']} />

// С кастомным классом
<MorphingText
  texts={['Hello', 'World', 'React']}
  className="text-purple-400"
/>

// В hero-секции
<section className="flex items-center justify-center min-h-screen">
  <div className="text-center">
    <p className="text-xl mb-4 opacity-60">Мы делаем</p>
    <MorphingText
      texts={['красивый дизайн', 'быстрый код', 'крутые продукты']}
    />
  </div>
</section>
```

## Оригинальный код

```tsx
'use client';
import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const morphTime    = 1.5;
const cooldownTime = 0.5;

const useMorphingText = (texts: string[]) => {
  const textIndexRef  = useRef(0);
  const morphRef      = useRef(0);
  const cooldownRef   = useRef(0);
  const timeRef       = useRef(new Date());
  const text1Ref      = useRef<HTMLSpanElement>(null);
  const text2Ref      = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const [current1, current2] = [text1Ref.current, text2Ref.current];
      if (!current1 || !current2) return;

      current2.style.filter  = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const invertedFraction  = 1 - fraction;
      current1.style.filter  = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];
    },
    [texts]
  );

  const doMorph = useCallback(() => {
    morphRef.current    -= cooldownRef.current;
    cooldownRef.current  = 0;

    let fraction = morphRef.current / morphTime;
    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);
    if (fraction === 1) textIndexRef.current++;
  }, [setStyles]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const [current1, current2] = [text1Ref.current, text2Ref.current];
    if (current1 && current2) {
      current2.style.filter  = 'none';
      current2.style.opacity = '100%';
      current1.style.filter  = 'none';
      current1.style.opacity = '0%';
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const newTime = new Date();
      const dt      = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current   = newTime;
      cooldownRef.current -= dt;
      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [doMorph, doCooldown]);

  return { text1Ref, text2Ref };
};

interface MorphingTextProps {
  className?: string;
  texts: string[];
}

const Texts: React.FC<Pick<MorphingTextProps, 'texts'>> = ({ texts }) => {
  const { text1Ref, text2Ref } = useMorphingText(texts);
  return (
    <>
      <span className="absolute inset-x-0 top-0 m-auto inline-block w-full" ref={text1Ref} />
      <span className="absolute inset-x-0 top-0 m-auto inline-block w-full" ref={text2Ref} />
    </>
  );
};

const SvgFilters: React.FC = () => (
  <svg id="filters" className="fixed h-0 w-0" preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="threshold">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

export const MorphingText: React.FC<MorphingTextProps> = ({ texts, className }) => (
  <div
    className={cn(
      'relative mx-auto h-16 w-full max-w-3xl text-center font-sans text-[40pt] leading-none font-bold filter-[url(#threshold)_blur(0.6px)] md:h-24 lg:text-[6rem]',
      className
    )}
  >
    <Texts texts={texts} />
    <SvgFilters />
  </div>
);
```

## Адаптированный код под проекты opensophy

```tsx
import { useCallback, useEffect, useRef } from 'react';

const morphTime    = 1.5;
const cooldownTime = 0.5;

const useMorphingText = (texts: string[]) => {
  const textIndexRef  = useRef(0);
  const morphRef      = useRef(0);
  const cooldownRef   = useRef(0);
  const timeRef       = useRef(new Date());
  const text1Ref      = useRef<HTMLSpanElement>(null);
  const text2Ref      = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const [current1, current2] = [text1Ref.current, text2Ref.current];
      if (!current1 || !current2) return;

      current2.style.filter  = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const invertedFraction  = 1 - fraction;
      current1.style.filter  = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];
    },
    [texts]
  );

  const doMorph = useCallback(() => {
    morphRef.current    -= cooldownRef.current;
    cooldownRef.current  = 0;

    let fraction = morphRef.current / morphTime;
    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);
    if (fraction === 1) textIndexRef.current++;
  }, [setStyles]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const [current1, current2] = [text1Ref.current, text2Ref.current];
    if (current1 && current2) {
      current2.style.filter  = 'none';
      current2.style.opacity = '100%';
      current1.style.filter  = 'none';
      current1.style.opacity = '0%';
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const newTime = new Date();
      const dt      = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current   = newTime;
      cooldownRef.current -= dt;
      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [doMorph, doCooldown]);

  return { text1Ref, text2Ref };
};

interface MorphingTextProps {
  className?: string;
  texts: string[];
}

const Texts: React.FC<Pick<MorphingTextProps, 'texts'>> = ({ texts }) => {
  const { text1Ref, text2Ref } = useMorphingText(texts);
  return (
    <>
      <span className="absolute inset-x-0 top-0 m-auto inline-block w-full" ref={text1Ref} />
      <span className="absolute inset-x-0 top-0 m-auto inline-block w-full" ref={text2Ref} />
    </>
  );
};

const SvgFilters: React.FC = () => (
  <svg id="filters" className="fixed h-0 w-0" preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="threshold">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

const MorphingText: React.FC<MorphingTextProps> = ({ texts, className = '' }) => (
  <div
    className={`relative mx-auto h-16 w-full max-w-3xl text-center font-sans text-[40pt] leading-none font-bold [filter:url(#threshold)_blur(0.6px)] md:h-24 lg:text-[6rem] ${className}`}
  >
    <Texts texts={texts} />
    <SvgFilters />
  </div>
);

export default MorphingText;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `texts` | `string[]` | — | Массив слов или фраз для циклического морфинга |
| `className` | `string` | `''` | CSS классы на корневом `<div>` |

---

## Как работает анимация

Компонент использует два позиционированных `<span>` (`text1`, `text2`) поверх друг друга. В каждом кадре `requestAnimationFrame` вычисляется прогресс `fraction` от 0 до 1 в рамках `morphTime`:

**Стили задаются напрямую через `.style`** — без React state — чтобы не вызывать ре-рендер на каждом кадре.

```
opacity = Math.pow(fraction, 0.4) * 100%
filter  = blur(8 / fraction - 8)px   // стремится к ∞ при fraction → 0
```

Степень `0.4` делает нарастание opacity нелинейным — быстрее в начале, медленнее к концу. Blur по формуле `8/fraction - 8` стремится к бесконечности при `fraction → 0` и к нулю при `fraction = 1`, то есть слово полностью чёткое только в момент когда оно уже «победило».

**SVG-фильтр `threshold`** применяется через `[filter:url(#threshold)_blur(0.6px)]` на весь контейнер. `feColorMatrix` с коэффициентом `255 -140` по альфа-каналу усиливает контраст: полупрозрачные пиксели в зоне перехода либо становятся непрозрачными, либо исчезают. Это создаёт эффект «жидкого» слияния букв в момент морфинга.

**Cooldown:** после завершения перехода включается пауза `cooldownTime` (0.5 с) — `doCooldown` фиксирует финальное состояние и обнуляет морф. Затем цикл начинается заново для следующей пары слов.

:::tip
SVG-фильтр `<SvgFilters />` рендерится с `position: fixed` и нулевыми размерами — он глобальный для страницы. Если на странице несколько экземпляров `MorphingText`, фильтр рендерится несколько раз, но браузер использует первый найденный по `id="threshold"`. Это безопасно.
:::

:::note
Компонент адаптирован без зависимости от `cn` из `@/lib/utils` — класс передаётся напрямую через шаблонную строку. Если в проекте используется `cn`, можно вернуть его обратно.
:::