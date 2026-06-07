---
title: "Волновой текст"
description: UI Компонент. Буквы текста непрерывно анимируются волной — каждая буква покачивается вверх-вниз со сдвигом по времени относительно соседей. Поддерживает prefers-reduced-motion.
date: 2026-04-25
tags: разработка, ui, ui-компоненты
keywords: wave text, text animation, framer motion, stagger, loop animation, react
robots: index, follow
lang: ru
---

[uic:wave-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `children` | `string` | `'Волновой текст'` | Текст для анимации |
| `amplitude` | `number` | `8` | Амплитуда волны (px) |
| `duration` | `number` | `1.2` | Длительность цикла (с) |
| `staggerDelay` | `number` | `0.05` | Задержка между буквами (с) |
| `className` | `string` | `'text-4xl font-bold'` | CSS классы |