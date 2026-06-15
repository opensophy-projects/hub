---
title: "Вариативная близость"
description: UI Компонент. Буквы меняют параметры вариативного шрифта в зависимости от близости курсора. Чем ближе мышь — тем жирнее, шире или курсивнее становится буква.
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: variable font, proximity, mouse interaction, fontVariationSettings, react
robots: index, follow
lang: ru
---

[uic:variable-proximity]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `label` | `string` | `'Наведи курсор'` | Текст для анимации |
| `fromFontVariationSettings` | `string` | `"'wght' 400, 'wdth' 100"` | Параметры шрифта вдали от курсора |
| `toFontVariationSettings` | `string` | `"'wght' 900, 'wdth' 125"` | Параметры шрифта под курсором |
| `containerRef` | `RefObject` | — | Ref контейнера для отслеживания мыши |
| `radius` | `number` | `100` | Радиус влияния курсора (px) |
| `falloff` | `string` | `'linear'` | Кривая затухания (`linear`/`exponential`/`gaussian`) |
| `className` | `string` | `''` | CSS классы |
