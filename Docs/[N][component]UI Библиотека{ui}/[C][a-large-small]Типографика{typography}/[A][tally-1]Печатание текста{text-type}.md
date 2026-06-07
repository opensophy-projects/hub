---
title: "Печатание текста"
description: UI Компонент. Эффект печатающей машинки на GSAP. Поддерживает массив строк, удаление, переменную скорость, цвета и кастомный курсор.
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: typewriter effect, typing animation, gsap cursor
robots: index, follow
lang: ru
---

[uic:text-type]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string \| string[]` | `'Привет, мир!'` | Текст или массив строк |
| `typingSpeed` | `number` | `50` | Скорость печати (мс/символ) |
| `deletingSpeed` | `number` | `30` | Скорость удаления (мс/символ) |
| `pauseDuration` | `number` | `2000` | Пауза после строки (мс) |
| `initialDelay` | `number` | `0` | Задержка перед стартом (мс) |
| `loop` | `boolean` | `true` | Зациклить |
| `showCursor` | `boolean` | `true` | Показывать курсор |
| `cursorCharacter` | `string` | `'\|'` | Символ курсора |
| `cursorBlinkDuration` | `number` | `0.5` | Скорость мигания курсора (с) |
| `hideCursorWhileTyping` | `boolean` | `false` | Скрывать курсор при печати |
| `reverseMode` | `boolean` | `false` | Печать задом наперёд |
| `startOnVisible` | `boolean` | `false` | Старт при появлении в вьюпорте |
| `textColors` | `string[]` | `[]` | Цвет для каждой строки |
| `variableSpeed` | `object` | `undefined` | Переменная скорость `{min,max}` |
| `as` | `ElementType` | `'div'` | HTML-тег контейнера |
| `className` | `string` | `'text-4xl font-bold'` | CSS классы |
| `onSentenceComplete` | `function` | `undefined` | Коллбэк по завершении строки |