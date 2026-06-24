---
title: "Карточки Opensophy"
description: Базовые карточки в стиле Hub с управляемыми углами и alert-вариантами.
date: 2026-06-24
tags: разработка, ui, opensophy, cards
keywords: opensophy cards, alert cards, react component
robots: index, follow
lang: ru
---

[uic:opensophy-cards]

| Проп | Type | Обычно | Описание |
|------|------|---------|----------|
| `title` | `string` | — | Заголовок карточки. |
| `description` | `string` | — | Краткое описание. |
| `icon` | `ReactNode` | — | Иконка в левом верхнем блоке. |
| `radius` | `'round' \| 'soft' \| 'sharp'` | `'soft'` | Скругление: круглые, слегка круглые или острые углы. |
| `alert` | `'green' \| 'purple' \| 'yellow' \| 'orange' \| 'red' \| 'blue'` | — | Alert-тон по аналогии с системными предупреждениями Hub. |
