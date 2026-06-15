---
title: "Градиентные жалюзи"
description: WebGL-фон на OGL с эффектом градиентных жалюзи. Горизонтальные полосы нарезают градиент, накладываются со spotlight-пятном от мыши и анимированным шумом. Поддерживает вращение, зеркалирование, UV-дисторшн и mix-blend-mode.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, gradient-blinds, shader
robots: index, follow
lang: ru
---

[uic:gradient-blinds]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `gradientColors` | `string[]` | `['#FF9FFC','#5227FF']` | Цвета градиента (до 8) |
| `paused` | `boolean` | `false` | Пауза анимации |
| `angle` | `number` | `0` | Угол поворота полос (°) |
| `noise` | `number` | `0.3` | Интенсивность шума |
| `blindCount` | `number` | `16` | Количество полос |
| `blindMinWidth` | `number` | `60` | Минимальная ширина полосы (px) |
| `mouseDampening` | `number` | `0.15` | Инерция следования spotlight за мышью |
| `mirrorGradient` | `boolean` | `false` | Зеркальное отражение градиента |
| `spotlightRadius` | `number` | `0.5` | Радиус spotlight-пятна |
| `spotlightSoftness` | `number` | `1` | Мягкость края spotlight |
| `spotlightOpacity` | `number` | `1` | Непрозрачность spotlight |
| `distortAmount` | `number` | `0` | Сила синусоидальной дисторции |
| `shineDirection` | `string` | `'left'` | Направление блика (`left`/`right`) |
| `mixBlendMode` | `string` | `'lighten'` | CSS mix-blend-mode |