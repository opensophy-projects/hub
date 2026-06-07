---
title: "Чередующийся текст"
description: UI Компонент. Текст, который автоматически переключается между несколькими строками с анимацией. Поддерживает разбивку по буквам, словам или строкам, stagger, spring-переходы и программное управление через ref.
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: rotating text, animated text, text switcher, framer motion, stagger
robots: index, follow
lang: ru
---

[uic:rotating-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `texts` | `string[]` | `['Дизайн','Интерфейс','Анимация','Движение']` | Массив строк |
| `rotationInterval` | `number` | `2000` | Интервал смены текста (мс) |
| `splitBy` | `string` | `'characters'` | Разбивка (`characters`/`words`/`lines`) |
| `staggerDuration` | `number` | `0.03` | Задержка stagger (с) |
| `staggerFrom` | `string` | `'first'` | Откуда stagger (`first`/`last`/`center`/`random`) |
| `loop` | `boolean` | `true` | Зациклить |
| `auto` | `boolean` | `true` | Автоматическое переключение |
| `animatePresenceMode` | `string` | `'wait'` | Режим AnimatePresence (`wait`/`sync`) |
| `transition` | `object` | `{type:'spring',damping:25,stiffness:300}` | Framer Motion transition |
| `mainClassName` | `string` | `'text-4xl font-bold overflow-hidden'` | CSS классы корневого span |
| `elementLevelClassName` | `string` | `''` | CSS классы каждой буквы/слова |