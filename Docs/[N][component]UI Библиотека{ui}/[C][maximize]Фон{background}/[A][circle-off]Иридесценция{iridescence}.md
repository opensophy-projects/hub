---
title: "Иридесценция"
description: WebGL-фон на OGL с переливающейся радужной текстурой. Восемь итераций косинусоидальных волн в фрагментном шейдере создают эффект перламутровой поверхности. Реагирует на движение мыши через смещение UV.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, iridescence, shader
robots: index, follow
lang: ru
---

[uic:iridescence]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `color` | `[number,number,number]` | `[1,1,1]` | Цвет-множитель RGB (0–1) |
| `speed` | `number` | `1.0` | Скорость анимации |
| `amplitude` | `number` | `0.1` | Сила смещения UV от мыши |
| `mouseReact` | `boolean` | `true` | Реакция на движение мыши |