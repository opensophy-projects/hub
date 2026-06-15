---
title: "Сияющий текст"
description: UI Компонент. Текст с анимированным блеском. Световой блик скользит по тексту с настраиваемой скоростью, цветом и направлением.
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: shiny text, animated gradient text, framer motion text
robots: index, follow
lang: ru
---

[uic:shiny-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `text` | `string` | `'Shiny Text'` | Текст с блеском |
| `color` | `string` | `'#b5b5b5'` | Основной цвет текста |
| `shineColor` | `string` | `'#ffffff'` | Цвет блика |
| `speed` | `number` | `2` | Скорость анимации (с) |
| `spread` | `number` | `120` | Угол градиента (°) |
| `delay` | `number` | `0` | Пауза между проходами (с) |
| `direction` | `string` | `'left'` | Направление блика (`left`/`right`) |
| `yoyo` | `boolean` | `false` | Туда-обратно |
| `pauseOnHover` | `boolean` | `false` | Пауза при наведении |
| `disabled` | `boolean` | `false` | Выключить анимацию |
| `className` | `string` | `'text-4xl font-bold'` | CSS классы |