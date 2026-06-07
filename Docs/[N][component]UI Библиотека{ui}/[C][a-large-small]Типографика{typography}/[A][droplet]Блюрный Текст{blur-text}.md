---
title: "Блюрный текст"
description: UI Компонент. Анимированный текст с эффектом размытия. Появляется по словам или буквам при попадании в область видимости.
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: text animation, motion react, text
robots: index, follow
lang: ru
---

[uic:blur-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string` | `'Добро пожаловать в будущее веб-дизайна'` | Текст для анимации |
| `delay` | `number` | `200` | Задержка между элементами (мс) |
| `animateBy` | `string` | `'words'` | Разбивка (`words`/`letters`) |
| `direction` | `string` | `'top'` | Направление появления (`top`/`bottom`) |
| `threshold` | `number` | `0.1` | Порог видимости для IntersectionObserver |
| `rootMargin` | `string` | `'0px'` | rootMargin для IntersectionObserver |
| `stepDuration` | `number` | `0.35` | Длительность одного шага анимации (с) |
| `className` | `string` | `'text-4xl font-bold text-center'` | CSS классы |
| `onAnimationComplete` | `function` | `undefined` | Коллбэк по завершении анимации |
| `animationFrom` | `object` | `undefined` | Переопределение начального состояния |
| `animationTo` | `object[]` | `undefined` | Переопределение шагов анимации |
| `easing` | `function` | `t => t` | Функция плавности |