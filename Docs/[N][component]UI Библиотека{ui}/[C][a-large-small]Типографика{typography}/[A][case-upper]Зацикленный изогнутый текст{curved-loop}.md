---
title: "Зацикленный изогнутый текст"
description: UI Компонент. Бесконечный marquee-текст по SVG-кривой. Поддерживает перетаскивание мышью для изменения скорости и направления.
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: curved marquee text, svg textpath animation, draggable marquee
robots: index, follow
lang: ru
---

[uic:curved-loop]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `marqueeText` | `string` | `'CURVED LOOP • CURVED LOOP •'` | Текст бегущей строки |
| `speed` | `number` | `2` | Скорость прокрутки (px/кадр) |
| `curveAmount` | `number` | `400` | Глубина изгиба (px), 0 = прямая |
| `direction` | `string` | `'left'` | Направление (`left`/`right`) |
| `interactive` | `boolean` | `true` | Перетаскивание мышью |
| `className` | `string` | `''` | CSS классы SVG-текста |