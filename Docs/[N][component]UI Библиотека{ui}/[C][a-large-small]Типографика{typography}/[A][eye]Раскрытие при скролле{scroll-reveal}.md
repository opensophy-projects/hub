---
title: "Раскрытие при скролле"
description: UI Компонент. Текст с эффектом раскрытия при скролле. Слова появляются с opacity и blur, весь блок плавно выравнивается из наклонного положения — синхронизировано с позицией скролла через GSAP ScrollTrigger.
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: scroll reveal, gsap scrolltrigger, text animation, blur reveal, react
robots: index, follow
lang: ru
---

[uic:scroll-reveal]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `children` | `string` | `'Текст появляется...'` | Текст для анимации |
| `enableBlur` | `boolean` | `true` | Blur-анимация слов |
| `baseOpacity` | `number` | `0.1` | Начальная прозрачность слов |
| `baseRotation` | `number` | `3` | Начальный наклон блока (°) |
| `blurStrength` | `number` | `4` | Сила размытия (px) |
| `rotationEnd` | `string` | `'bottom bottom'` | Конец анимации наклона (ScrollTrigger) |
| `wordAnimationEnd` | `string` | `'bottom bottom'` | Конец анимации слов (ScrollTrigger) |
| `scrollContainerRef` | `RefObject` | `undefined` | Ref скролл-контейнера |
| `containerClassName` | `string` | `''` | CSS классы `<h2>` |
| `textClassName` | `string` | `''` | CSS классы `<p>` |
