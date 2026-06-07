---
title: "Поле точек"
description: Canvas-фон с анимированной сеткой точек. Точки реагируют на движение мыши — отталкиваются или выпучиваются, поддерживают волновое движение, искры и свечение курсора через SVG-градиент.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, dot-field, shader
robots: index, follow
lang: ru
---

[uic:dot-field]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `dotRadius` | `number` | `1.5` | Радиус каждой точки (px) |
| `dotSpacing` | `number` | `14` | Шаг сетки точек (px) |
| `cursorRadius` | `number` | `500` | Радиус влияния курсора (px) |
| `cursorForce` | `number` | `0.1` | Сила отталкивания точек |
| `bulgeOnly` | `boolean` | `true` | Режим выпуклости вместо отталкивания |
| `bulgeStrength` | `number` | `67` | Сила выпуклости |
| `glowRadius` | `number` | `160` | Радиус свечения курсора (px) |
| `sparkle` | `boolean` | `false` | Случайные вспышки точек |
| `waveAmplitude` | `number` | `0` | Амплитуда волнового движения |
| `gradientFrom` | `string` | `'rgba(168,85,247,0.35)'` | Начальный цвет градиента точек |
| `gradientTo` | `string` | `'rgba(180,151,207,0.25)'` | Конечный цвет градиента точек |
| `glowColor` | `string` | `'#120F17'` | Цвет свечения курсора |