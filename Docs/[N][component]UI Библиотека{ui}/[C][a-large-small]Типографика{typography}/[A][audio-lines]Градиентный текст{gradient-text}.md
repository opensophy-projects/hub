---
title: "Градиентный текст"
description: UI Компонент. Текст с анимированным градиентом. Поддерживает горизонтальное, вертикальное и диагональное движение, yoyo-режим и опциональную градиентную рамку.
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: gradient text animation, animated gradient, framer motion text
robots: index, follow
lang: ru
---

[uic:gradient-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string` | `'Gradient Text'` | Текст с градиентом |
| `colors` | `string[]` | `['#5227FF','#FF9FFC','#B19EEF']` | Цвета градиента |
| `animationSpeed` | `number` | `8` | Скорость анимации (с на цикл) |
| `direction` | `string` | `'horizontal'` | Направление (`horizontal`/`vertical`/`diagonal`) |
| `yoyo` | `boolean` | `true` | Туда-обратно |
| `showBorder` | `boolean` | `false` | Градиентная рамка |
| `pauseOnHover` | `boolean` | `false` | Пауза при наведении |
| `className` | `string` | `'text-5xl font-bold'` | CSS классы |
