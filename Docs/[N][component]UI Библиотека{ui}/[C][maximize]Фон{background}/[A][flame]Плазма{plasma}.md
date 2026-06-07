---
title: "Плазма"
description: WebGL-фон на OGL с объёмной плазмой через ray marching. 60 итераций трассировки луча строят трубчатую структуру с синусоидальными деформациями. Поддерживает кастомный цвет, направление, pingpong-режим и мышиное взаимодействие.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, plasma, shader
robots: index, follow
lang: ru
---

[uic:plasma]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `color` | `string` | `'#ff8844'` | Цвет-тинт плазмы |
| `speed` | `number` | `1` | Скорость анимации |
| `direction` | `string` | `'forward'` | Направление (`forward`/`reverse`/`pingpong`) |
| `scale` | `number` | `1` | Масштаб паттерна |
| `opacity` | `number` | `1` | Прозрачность |
| `mouseInteractive` | `boolean` | `false` | Деформация от позиции мыши |