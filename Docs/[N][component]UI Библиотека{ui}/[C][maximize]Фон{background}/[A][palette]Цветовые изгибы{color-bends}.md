---
title: "Цветовые изгибы"
description: WebGL-фон на Three.js с итеративными цветовыми волнами. Шейдер деформирует UV-координаты через синусоидальные итерации, создавая перетекающие цветные ленты. Поддерживает до 8 цветов, warp-деформацию, мышиное взаимодействие и параллакс.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, color-bends, shader
robots: index, follow
lang: ru
---

[uic:color-bends]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `colors` | `string[]` | `[]` | До 8 цветов волн |
| `rotation` | `number` | `0` | Начальный угол поворота (°) |
| `speed` | `number` | `1` | Скорость анимации |
| `transparent` | `boolean` | `true` | Прозрачный фон |
| `autoRotate` | `number` | `0` | Скорость авто-вращения (°/с) |
| `scale` | `number` | `1` | Масштаб паттерна |
| `frequency` | `number` | `1` | Частота волн |
| `warpStrength` | `number` | `1` | Сила деформации |
| `mouseInfluence` | `number` | `0` | Влияние мыши на паттерн |
| `parallax` | `number` | `0` | Сила параллакса от мыши |
| `noise` | `number` | `0` | Интенсивность плёночного шума |
| `iterations` | `number` | `4` | Количество итераций деформации |
| `intensity` | `number` | `1` | Яркость итогового цвета |
| `bandWidth` | `number` | `1` | Ширина цветовых лент |