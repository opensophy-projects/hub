---
title: "Круговой текст"
description: UI Компонент. Текст расположенный по кругу с непрерывной анимацией вращения. Реагирует на ховер — замедление, ускорение, пауза или хаотичное вращение.
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: circular text animation, rotating text, motion react
robots: index, follow
lang: ru
---

[uic:circular-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string` | `'CIRCULAR TEXT • CIRCULAR TEXT •'` | Текст по кругу |
| `spinDuration` | `number` | `20` | Длительность одного оборота (с) |
| `onHover` | `string` | `'speedUp'` | Поведение при наведении (`slowDown`/`speedUp`/`pause`/`goBonkers`) |
| `className` | `string` | `''` | CSS классы |