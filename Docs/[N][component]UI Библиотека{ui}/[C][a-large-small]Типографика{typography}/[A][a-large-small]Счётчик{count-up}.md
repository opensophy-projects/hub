---
title: "Счётчик"
description: UI Компонент. Анимированный числовой счётчик с пружинной анимацией на framer-motion. Запускается при появлении в зоне видимости или программно.
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: count up, number animation, framer motion, spring animation, react counter
robots: index, follow
lang: ru
---

[uic:count-up]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `to` | `number` | `100` | Конечное значение |
| `from` | `number` | `0` | Начальное значение |
| `direction` | `string` | `'up'` | Направление (`up`/`down`) |
| `delay` | `number` | `0` | Задержка перед запуском (с) |
| `duration` | `number` | `2` | Длительность анимации (с) |
| `separator` | `string` | `''` | Разделитель тысяч |
| `startWhen` | `boolean` | `true` | Программный старт |
| `className` | `string` | `''` | CSS классы |
| `onStart` | `function` | `undefined` | Коллбэк при старте |
| `onEnd` | `function` | `undefined` | Коллбэк при завершении |