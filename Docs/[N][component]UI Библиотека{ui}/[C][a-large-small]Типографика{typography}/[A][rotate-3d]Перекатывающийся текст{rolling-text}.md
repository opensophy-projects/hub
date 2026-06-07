---
title: "Перекатывающийся текст"
description: UI Компонент. Буквы текста «перекатываются» через 3D-вращение по оси X — старая буква уходит назад, новая выкатывается вперёд. Запускается сразу или при появлении в области видимости.
date: 2026-04-25
tags: разработка, ui, ui-компоненты
keywords: rolling text, 3d text animation, rotateX, framer motion, in-view, stagger, react
robots: index, follow
lang: ru
---

[uic:rolling-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string` | `'Перекатывающийся текст'` | Текст для анимации |
| `duration` | `number` | `0.5` | Длительность анимации буквы (с) |
| `delay` | `number` | `0.1` | Задержка stagger между буквами (с) |
| `inView` | `boolean` | `false` | Запуск при появлении в вьюпорте |
| `inViewOnce` | `boolean` | `true` | Анимировать только один раз |
| `inViewMargin` | `string` | `'0px'` | rootMargin для IntersectionObserver |
| `className` | `string` | `'text-4xl font-bold'` | CSS классы |