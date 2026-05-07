---
title: "Столп света"
description: UI Компонент. Генеративный WebGL-фон на основе трёхмерного ray marching шейдера. Анимированный столп света с градиентной окраской, волновой деформацией пространства и интерактивным откликом на мышь. Использует Three.js для управления рендером.
date: 2026-05-07
tags: разработка, ui, ui-компоненты
keywords: webgl three.js ray marching, light pillar shader, animated background, react three.js, volumetric light
robots: index, follow
lang: ru
---

[uic:light-pillar]

Трёхмерный столп света рендерится через ray marching на GPU. Алгоритм итеративно проходит по лучам из камеры, вычисляет поле расстояний до деформированного объекта и аккумулирует цвет через градиент между `topColor` и `bottomColor`. Волновая деформация создаётся последовательными итерациями косинусных осцилляторов с нарастающей частотой. Three.js используется как минимальная обёртка для управления WebGL-контекстом, шейдерным материалом и ресайзом.

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `three` | `^0.128` (r128) | WebGL-рендерер, `ShaderMaterial`, геометрия |
| `react` | `^18` или `^19` | Базовый фреймворк |

Установка:

```bash
npm install three
```

Типы для Three.js (если используется TypeScript):

```bash
npm install -D @types/three
```

---

## Установка

Скопируй файл `light-pillar.tsx` в свой проект.

---

## Использование

```tsx
import LightPillar from '@/features/ui-components/light-pillar/light-pillar';

// Базовый пример — фон поверх тёмного контейнера
<div style={{ position: 'relative', width: '100%', height: '400px', background: '#000' }}>
  <LightPillar />
</div>

// Кастомные цвета
<div style={{ position: 'relative', width: '100%', height: '400px', background: '#000' }}>
  <LightPillar
    topColor="#00ffcc"
    bottomColor="#ff6600"
    intensity={1.5}
  />
</div>

// Интерактивный режим — вращение столпа мышью
<div style={{ position: 'relative', width: '100%', height: '400px', background: '#000' }}>
  <LightPillar interactive rotationSpeed={0} glowAmount={0.008} />
</div>

// Широкий и низкий столп
<div style={{ position: 'relative', width: '100%', height: '400px', background: '#000' }}>
  <LightPillar
    pillarWidth={6}
    pillarHeight={0.15}
    intensity={0.8}
    glowAmount={0.003}
  />
</div>

// Поворот и шум
<div style={{ position: 'relative', width: '100%', height: '400px', background: '#000' }}>
  <LightPillar
    pillarRotation={45}
    noiseIntensity={1.5}
    rotationSpeed={0.5}
  />
</div>

// Производительный режим для мобильных
<div style={{ position: 'relative', width: '100%', height: '400px', background: '#000' }}>
  <LightPillar quality="low" rotationSpeed={0.2} intensity={1.2} />
</div>

// Режим смешивания screen поверх светлого фона
<div style={{ position: 'relative', width: '100%', height: '400px', background: '#f0f0f0' }}>
  <LightPillar
    mixBlendMode="multiply"
    topColor="#3300ff"
    bottomColor="#cc00ff"
    isNegative
  />
</div>
```

:::note
Компонент занимает **100% ширины и высоты** через `position: absolute; top: 0; left: 0`. Родительский контейнер должен иметь `position: relative` и явные размеры. Для фона страницы используй `position: fixed; inset: 0`.
:::

---

## Оригинальный код

```tsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface LightPillarProps {
  topColor?: string;
  bottomColor?: string;
  intensity?: number;
  rotationSpeed?: number;
  interactive?: boolean;
  className?: string;
  glowAmount?: number;
  pillarWidth?: number;
  pillarHeight?: number;
  noiseIntensity?: number;
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
  pillarRotation?: number;
  quality?: 'low' | 'medium' | 'high';
}

const LightPillar: React.FC<LightPillarProps> = ({
  topColor = '#5227FF',
  bottomColor = '#FF9FFC',
  // ... остальные пропсы
}) => {
  // Полный код в файле light-pillar.tsx
};

export default LightPillar;
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `topColor` | `string` | `'#5227FF'` | Цвет верхней части столпа. Любой CSS-цвет: hex, rgb, named |
| `bottomColor` | `string` | `'#FF9FFC'` | Цвет нижней части столпа |
| `intensity` | `number` | `1.0` | Яркость итогового изображения. Значения выше `2` пересвечивают |
| `rotationSpeed` | `number` | `0.3` | Скорость вращения. `0` — стоп-кадр, `3` — быстро |
| `interactive` | `boolean` | `false` | При `true` — вращение управляется позицией мыши по горизонтали |
| `glowAmount` | `number` | `0.005` | Интенсивность свечения. Диапазон `0.001–0.05`. Больше — насыщеннее |
| `pillarWidth` | `number` | `3.0` | Радиус столпа в условных единицах сцены |
| `pillarHeight` | `number` | `0.4` | Коэффициент вертикального сжатия. Меньше — столп выше и тоньше |
| `noiseIntensity` | `number` | `0.5` | Интенсивность плёночного зерна. `0` — чистый рендер |
| `mixBlendMode` | `CSSProperties['mixBlendMode']` | `'screen'` | CSS blend mode контейнера. `'screen'` накладывает поверх тёмного фона |
| `pillarRotation` | `number` | `0` | Статический поворот камеры в градусах (-180..180) |
| `quality` | `'low' \| 'medium' \| 'high'` | `'high'` | Качество рендера. На мобильных автоматически понижается |
| `className` | `string` | `''` | CSS классы на корневом `<div>` |

---

## Уровни качества

| Значение | Итерации ray marching | Волновые итерации | Pixel ratio | FPS |
|----------|-----------------------|-------------------|-------------|-----|
| `'low'` | 24 | 1 | 0.5 | 30 |
| `'medium'` | 40 | 2 | 0.65 | 60 |
| `'high'` | 80 | 4 | devicePixelRatio (макс 2) | 60 |

На мобильных устройствах `quality` автоматически снижается: `'high'` → `'medium'`, а на телефонах — до `'low'`, независимо от переданного значения пропа.

---

## Как работает шейдер

Компонент состоит из двух слоёв — Three.js-настройки и GLSL фрагментного шейдера.

**Three.js-обёртка.** При монтировании создаётся `WebGLRenderer` с параметрами `alpha: true`, `depth: false`, `stencil: false`. На сцену добавляется `PlaneGeometry(2, 2)` — полноэкранный прямоугольник, покрывающий весь viewport через ортографическую камеру `OrthographicCamera(-1, 1, 1, -1, 0, 1)`. Шейдерный материал `ShaderMaterial` принимает все пропсы через uniforms. Вращение предвычисляется на CPU через `Math.cos / Math.sin` каждый кадр и передаётся как `uRotCos / uRotSin` — это дешевле чем вычислять матрицу внутри шейдера.

**Ray marching.** Для каждого пикселя запускается луч из точки `origin = (0, 0, -10)` в направлении `(uv, 1)`. В цикле до 80 итераций (на `quality: 'high'`) луч продвигается вперёд на расстояние `fieldDistance`. Поле расстояний вычисляется как `length(cos(deformed.xz)) - 0.2` — это даёт волнистую тороидальную структуру.

**Волновая деформация.** Перед вычислением поля позиция проходит через `WAVE_ITERATIONS` итераций косинусных осцилляторов с нарастающей частотой (`frequency *= 2`, `amplitude *= 0.5`). Каждая итерация добавляет своё вращение через `uWaveSin / uWaveCos`. Это создаёт органичную турбулентность.

**Смешение формы.** Радиальная граница `radialBound = length(pos.xz) - pillarWidth` объединяется с полем расстояний через smooth minimum (`blendMax`): `h = max(k - abs(a - b), 0); result = min(a, b) - h² / (4k)`. Это даёт плавный переход между столпом и пустым пространством без резких краёв.

**Финальная окраска.** Каждый шаг луча аккумулирует `gradient / fieldDistance`. Цвет градиента вычисляется через `mix(bottomColor, topColor, smoothstep(15, -15, pos.y))`. Итоговый цвет нормируется через `tanh(color * glowAmount / widthNormalization)` — это предотвращает пересвет при малых `fieldDistance`. Поверх добавляется плёночный шум через `noise(gl_FragCoord.xy)`.

**Оптимизация обновлений.** Все пропсы кроме `quality` обновляются без пересоздания WebGL-программы через отдельные `useEffect` — каждый пишет напрямую в соответствующий uniform. `rotationSpeed` хранится в `rotationSpeedRef` и читается каждый кадр без перезапуска анимационного цикла.

:::tip
`mixBlendMode: 'screen'` работает поверх тёмного фона — столп светится как неоновый. Для светлых фонов используй `'multiply'` или `'color-burn'`.
:::

:::tip
`interactive: true` + `rotationSpeed: 0` даёт полный контроль над ракурсом мышью без автоматического вращения — хорошо для hero-секций где пользователь исследует объект.
:::

:::note
При изменении `quality` компонент полностью пересоздаёт WebGL-контекст — константы `ITERATIONS` и `WAVE_ITERATIONS` встраиваются в GLSL через template literals на этапе компиляции шейдера.
:::

---

## Рецепты

**Фон hero-секции:**

```tsx
<div style={{ position: 'relative', minHeight: '100vh', background: '#050505' }}>
  <LightPillar
    topColor="#7c3aed"
    bottomColor="#ec4899"
    intensity={1.2}
    rotationSpeed={0.2}
    glowAmount={0.006}
  />
  <div style={{ position: 'relative', zIndex: 1 }}>
    {/* контент */}
  </div>
</div>
```

**Интерактивный портал:**

```tsx
<LightPillar
  interactive
  rotationSpeed={0}
  topColor="#00d4ff"
  bottomColor="#0066ff"
  glowAmount={0.01}
  pillarWidth={2.5}
  pillarHeight={0.6}
/>
```

**Широкая горизонтальная полоса:**

```tsx
<LightPillar
  pillarWidth={7}
  pillarHeight={0.1}
  pillarRotation={90}
  topColor="#ff4400"
  bottomColor="#ffcc00"
  intensity={0.7}
/>
```

**Производительный мобильный режим:**

```tsx
<LightPillar
  quality="low"
  rotationSpeed={0.15}
  intensity={1.3}
  glowAmount={0.007}
/>
```