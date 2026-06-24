---
title: "Кнопки Opensophy"
description: Кнопки в стиле Hub, включая тёмную close-кнопку X, поиск, кнопку выбора секции и action-кнопку в формате карточки.
date: 2026-06-24
tags: разработка, ui, opensophy, buttons
keywords: opensophy buttons, close button, card button, react component
robots: index, follow
lang: ru
---

[uic:opensophy-buttons]

| Проп | Type | Обычно | Описание |
|------|------|---------|----------|
| `variant` | `'close' \| 'search' \| 'section' \| 'ghost' \| 'solid' \| 'outline' \| 'card'` | `'ghost'` | Визуальный вариант кнопки. |
| `radius` | `'round' \| 'soft' \| 'sharp'` | `'soft'` | Форма углов. |
| `icon` | `ReactNode` | — | Иконка слева или иконка X для `close`. |
| `label` | `string` | — | Текстовая подпись. |
