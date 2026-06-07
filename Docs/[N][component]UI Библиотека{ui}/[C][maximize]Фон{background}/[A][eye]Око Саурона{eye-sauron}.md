---
title: "Око Саурона"
description: WebGL-фон на OGL с огненным глазом. Шейдер строит радиальную структуру глаза через полярные координаты и многослойный шум из текстуры — радужная оболочка, зрачок и внешнее свечение. Зрачок следит за мышью.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, eye-sauron, shader
robots: index, follow
lang: ru
---

[uic:eye-sauron]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `eyeColor` | `string` | `'#ff4500'` | Цвет глаза и свечения |
| `intensity` | `number` | `1` | Яркость глаза |
| `pupilSize` | `number` | `0.35` | Размер зрачка |
| `irisWidth` | `number` | `0.25` | Ширина радужки |
| `glowIntensity` | `number` | `1` | Интенсивность внешнего свечения |
| `scale` | `number` | `1` | Масштаб глаза |
| `noiseScale` | `number` | `1` | Масштаб шума текстуры |
| `pupilFollow` | `number` | `1` | Сила слежения зрачка за мышью |
| `flameSpeed` | `number` | `1` | Скорость анимации огня |
| `backgroundColor` | `string` | `'#000000'` | Цвет фона |
