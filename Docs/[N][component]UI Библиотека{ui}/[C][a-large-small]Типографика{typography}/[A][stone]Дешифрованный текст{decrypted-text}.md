---
title: "Дешифрованный текст"
description: UI Компонент. Эффект дешифровки текста. Символы случайно заменяются, затем последовательно или хаотично раскрываются в исходный текст.
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: decrypted text effect, scramble text animation, cipher reveal
robots: index, follow
lang: ru
---

[uic:decrypted-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string` | `'Decrypted Text'` | Текст для дешифровки |
| `animateOn` | `string` | `'hover'` | Триггер (`hover`/`view`/`inViewHover`/`click`) |
| `speed` | `number` | `50` | Интервал между шагами (мс) |
| `maxIterations` | `number` | `10` | Итераций случайного шифрования |
| `sequential` | `boolean` | `false` | Последовательное раскрытие символов |
| `revealDirection` | `string` | `'start'` | Направление раскрытия (`start`/`end`/`center`) |
| `useOriginalCharsOnly` | `boolean` | `false` | Шифровать только символами исходного текста |
| `characters` | `string` | `'ABC...+_'` | Набор символов для шифрования |
| `clickMode` | `string` | `'once'` | Режим клика (`once`/`toggle`) |
| `className` | `string` | `'text-4xl font-bold'` | Классы для раскрытых символов |
| `encryptedClassName` | `string` | `'text-4xl font-bold opacity-40'` | Классы для зашифрованных символов |
| `parentClassName` | `string` | `''` | Классы корневого элемента |