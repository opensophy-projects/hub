---
title: "Всплывающий текст"
description: UI Компонент. Текст с эффектом всплытия при скролле. Каждая буква появляется снизу с деформацией масштаба через GSAP ScrollTrigger, синхронизировано с позицией скролла.
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: scroll animation, gsap scrolltrigger, text reveal, react
robots: index, follow
lang: ru
---

[uic:scroll-float]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `children` | `string` | `'Scroll Float'` | Текст для анимации |
| `animationDuration` | `number` | `1` | Длительность анимации буквы (с) |
| `ease` | `string` | `'back.inOut(2)'` | GSAP easing |
| `scrollStart` | `string` | `'center bottom+=50%'` | Точка начала (ScrollTrigger) |
| `scrollEnd` | `string` | `'bottom bottom-=40%'` | Точка конца (ScrollTrigger) |
| `stagger` | `number` | `0.03` | Задержка между буквами (с) |
| `scrollContainerRef` | `RefObject` | `undefined` | Ref скролл-контейнера |
| `containerClassName` | `string` | `''` | CSS классы `<h2>` |
| `textClassName` | `string` | `''` | CSS классы текстового `<span>` |