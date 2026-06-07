---
title: "Лучи"
description: WebGL-фон на Three.js с анимированными вертикальными лучами. Плоские полигональные ленты деформируются через 3D-шум Перлина, освещаются направленным источником света и вращаются на заданный угол.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, beams, shader
robots: index, follow
lang: ru
---

[uic:beams]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `beamWidth` | `number` | `2` | Ширина одного луча |
| `beamHeight` | `number` | `20` | Высота лучей |
| `beamNumber` | `number` | `12` | Количество лучей |
| `lightColor` | `string` | `'#ffffff'` | Цвет освещения |
| `speed` | `number` | `1` | Скорость анимации |
| `noiseIntensity` | `number` | `1.75` | Интенсивность дитеринг-шума |
| `scale` | `number` | `0.2` | Масштаб шума деформации |
| `rotation` | `number` | `0` | Угол поворота группы лучей (°) |