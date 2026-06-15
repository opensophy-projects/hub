---
title: "Разбиение текста"
description: UI Компонент. Анимированный текст на GSAP с разбивкой по символам, словам или строкам. Запускается при скролле через ScrollTrigger.
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: split text animation, gsap scrolltrigger, text animation
robots: index, follow
lang: ru
---

[uic:split-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string` | `'Привет, это Split Text!'` | Текст для анимации |
| `splitType` | `string` | `'chars'` | Тип разбивки (`chars`/`words`/`lines`/`words, chars`) |
| `tag` | `string` | `'p'` | HTML-тег обёртки |
| `delay` | `number` | `50` | Задержка stagger (мс) |
| `duration` | `number` | `1.25` | Длительность анимации элемента (с) |
| `ease` | `string` | `'power3.out'` | GSAP easing |
| `threshold` | `number` | `0.1` | Порог видимости (0–1) |
| `rootMargin` | `string` | `'-100px'` | rootMargin ScrollTrigger |
| `textAlign` | `string` | `'center'` | Выравнивание текста |
| `from` | `object` | `{opacity:0,y:40}` | Начальное состояние GSAP |
| `to` | `object` | `{opacity:1,y:0}` | Конечное состояние GSAP |
| `className` | `string` | `'text-4xl font-bold'` | CSS классы |
| `onLetterAnimationComplete` | `function` | `undefined` | Коллбэк по завершении |
