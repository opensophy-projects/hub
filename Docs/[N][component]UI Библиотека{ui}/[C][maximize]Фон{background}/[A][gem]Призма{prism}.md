---
title: "Призма"
description: WebGL-фон на OGL с анимированной призмой через ray marching. 100 итераций трассируют SDF-октаэдр с анизотропным масштабом. Три режима анимации — вращение волной, трёхосевое вращение и hover-управление мышью. Поддерживает hue-rotation, bloom и saturation.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, prism, shader
robots: index, follow
lang: ru
---

[uic:prism]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `height` | `number` | `3.5` | Высота октаэдра |
| `baseWidth` | `number` | `5.5` | Ширина основания |
| `animationType` | `string` | `'rotate'` | Режим анимации (`rotate`/`hover`/`3drotate`) |
| `glow` | `number` | `1` | Интенсивность свечения |
| `noise` | `number` | `0.5` | Плёночный шум |
| `scale` | `number` | `3.6` | Масштаб вьюпорта |
| `hueShift` | `number` | `0` | Сдвиг оттенка (°) |
| `colorFrequency` | `number` | `1` | Частота цветового паттерна |
| `hoverStrength` | `number` | `2` | Сила наклона в hover-режиме |
| `inertia` | `number` | `0.05` | Инерция hover-анимации |
| `bloom` | `number` | `1` | Множитель bloom-свечения |
| `timeScale` | `number` | `0.5` | Скорость анимации |
| `suspendWhenOffscreen` | `boolean` | `false` | Пауза вне вьюпорта |
| `transparent` | `boolean` | `true` | Прозрачный фон |
| `offset` | `object` | `{x:0,y:0}` | Смещение призмы в пикселях |
