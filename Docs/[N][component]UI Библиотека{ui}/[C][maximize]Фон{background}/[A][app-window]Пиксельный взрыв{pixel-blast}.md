---
title: "Пиксельный взрыв"
description: WebGL-фон на Three.js с анимированным пиксельным паттерном. fBm-шум управляет заполненностью ячеек, поддерживаются четыре формы пикселей. Клики создают расходящиеся волны-рипплы. Опциональный liquid-эффект через postprocessing и деформацию по карте касаний мыши.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, pixel-blast, shader
robots: index, follow
lang: ru
---

[uic:pixel-blast]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `variant` | `string` | `'square'` | Форма пикселей (`square`/`circle`/`triangle`/`diamond`) |
| `pixelSize` | `number` | `8` | Размер одного пикселя (px) |
| `color` | `string` | `'#ffffff'` | Цвет пикселей |
| `antialias` | `boolean` | `false` | Антиалиасинг рендерера |
| `patternScale` | `number` | `1` | Масштаб fBm-паттерна |
| `patternDensity` | `number` | `1` | Плотность заполнения пикселями |
| `liquid` | `boolean` | `false` | Liquid-эффект от касания мыши |
| `liquidStrength` | `number` | `0.5` | Сила жидкостной деформации |
| `liquidRadius` | `number` | `0.5` | Радиус жидкостного следа |
| `pixelSizeJitter` | `number` | `0` | Случайный разброс размера пикселей |
| `enableRipples` | `boolean` | `true` | Волны-рипплы от кликов |
| `rippleIntensityScale` | `number` | `1` | Интенсивность рипплов |
| `rippleThickness` | `number` | `1` | Толщина кольца рипплa |
| `rippleSpeed` | `number` | `1` | Скорость распространения рипплов |
| `liquidWobbleSpeed` | `number` | `1` | Скорость wobble liquid-эффекта |
| `speed` | `number` | `1` | Скорость fBm-анимации |
| `transparent` | `boolean` | `true` | Прозрачный фон |
| `edgeFade` | `number` | `0` | Затухание пикселей по краям |
| `noiseAmount` | `number` | `0` | Постпроцессинг-шум поверх |
| `autoPauseOffscreen` | `boolean` | `true` | Пауза при уходе из вьюпорта |
