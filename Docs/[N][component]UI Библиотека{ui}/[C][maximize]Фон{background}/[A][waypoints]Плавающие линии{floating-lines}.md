---
title: "Плавающие линии"
description: WebGL-фон на Three.js с тремя слоями синусоидальных линий. Каждая линия рассчитывается в фрагментном шейдере через волновую функцию с вращением и реагирует на курсор через bend-деформацию. Поддерживает параллакс и градиентную окраску линий.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, floating-lines, shader
robots: index, follow
lang: ru
---

[uic:floating-lines]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `linesGradient` | `string[]` | `undefined` | Цвета градиента линий (до 8) |
| `enabledWaves` | `string[]` | `['top','middle','bottom']` | Активные слои волн |
| `lineCount` | `number \| number[]` | `6` | Количество линий на слой |
| `lineDistance` | `number \| number[]` | `5` | Расстояние между линиями |
| `animationSpeed` | `number` | `1` | Скорость анимации |
| `interactive` | `boolean` | `true` | Реакция на курсор |
| `bendRadius` | `number` | `5` | Радиус bend-деформации от мыши |
| `bendStrength` | `number` | `-0.5` | Сила bend-деформации |
| `mouseDamping` | `number` | `0.05` | Инерция следования за мышью |
| `parallax` | `boolean` | `true` | Параллакс от мыши |
| `parallaxStrength` | `number` | `0.2` | Сила параллакса |
| `mixBlendMode` | `string` | `'screen'` | CSS mix-blend-mode |
| `topWavePosition` | `object` | `{x:10,y:0.5,rotate:-0.4}` | Позиция и поворот верхнего слоя |
| `middleWavePosition` | `object` | `{x:5,y:0,rotate:0.2}` | Позиция и поворот среднего слоя |
| `bottomWavePosition` | `object` | `{x:2,y:-0.7,rotate:0.4}` | Позиция и поворот нижнего слоя |
