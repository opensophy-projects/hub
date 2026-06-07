---
title: "Скрытый текст"
description: UI Компонент. Текст скрыт облаком мерцающих частиц. При наведении частицы собираются на исходные позиции и текст проявляется. Canvas-анимация с шумовым движением, sparkle-эффектом и плавным reveal.
date: 2026-05-07
tags: разработка, ui, ui-компоненты
keywords: magic text reveal, particle text, canvas particles, hover reveal, hidden text, sparkle animation
robots: index, follow
lang: ru
---

[uic:magic-text-reveal]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string` | `'Magic Text'` | Скрытый текст для проявления |
| `color` | `string` | `'rgba(255,255,255,1)'` | Цвет текста и частиц |
| `fontSize` | `number` | `70` | Размер шрифта (px) |
| `fontWeight` | `number` | `600` | Жирность шрифта |
| `spread` | `number` | `40` | Радиус блуждания частиц (px) |
| `speed` | `number` | `0.5` | Скорость движения частиц |
| `density` | `number` | `4` | Плотность частиц (1=макс, 5=мин) |
| `resetOnMouseLeave` | `boolean` | `true` | Возврат в хаос при уходе курсора |
| `className` | `string` | `''` | CSS классы контейнера |