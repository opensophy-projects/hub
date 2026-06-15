---
title: "Скорость скролла"
description: UI Компонент. Бесконечная бегущая строка, скорость которой зависит от скорости прокрутки. Чётные строки идут вправо, нечётные — влево. Основана на framer-motion useVelocity и useSpring.
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: scroll velocity, marquee, framer motion, scroll speed, react animation
robots: index, follow
lang: ru
---

[uic:scroll-velocity]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `texts` | `string[] \| string` | `['Scroll Velocity •','Framer Motion •']` | Строки (или через запятую) |
| `velocity` | `number` | `100` | Базовая скорость (px/с) |
| `damping` | `number` | `50` | Демпфирование spring |
| `stiffness` | `number` | `400` | Жёсткость spring |
| `numCopies` | `number` | `6` | Копий для бесшовного повтора |
| `velocityMapping` | `object` | `{input:[0,1000],output:[0,5]}` | Маппинг скорости скролла |
| `className` | `string` | `''` | CSS классы span текста |
| `scrollContainerRef` | `RefObject` | `undefined` | Ref скролл-контейнера |