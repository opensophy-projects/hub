---
title: "Молния"
description: WebGL-фон с анимированной молнией через fBm-шум. Fractional Brownian Motion из 10 октав деформирует пространство вокруг вертикальной оси, создавая живой разряд с настраиваемым цветом через HSV, смещением и интенсивностью.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, lightning, shader
robots: index, follow
lang: ru
---

[uic:lightning]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `hue` | `number` | `230` | Оттенок молнии (0–360°) |
| `xOffset` | `number` | `0` | Горизонтальное смещение молнии |
| `speed` | `number` | `1` | Скорость анимации |
| `intensity` | `number` | `1` | Яркость молнии |
| `size` | `number` | `1` | Масштаб fBm-шума |