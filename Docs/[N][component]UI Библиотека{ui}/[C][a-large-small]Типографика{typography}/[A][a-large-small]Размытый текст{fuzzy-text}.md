---
title: "Размытый текст"
description: UI Компонент. Текст с эффектом случайного фаззинга строк через Canvas. Каждая строка пикселей независимо смещается по горизонтали, создавая органичный шум. Поддерживает hover, глитч-режим, градиент и плавные переходы.
date: 2026-05-06
tags: разработка, ui, ui-компоненты
keywords: fuzzy text, canvas text animation, glitch text, noise text, react canvas
robots: index, follow
lang: ru
---

[uic:fuzzy-text]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `children` | `string` | `'Fuzzy'` | Текст для отображения |
| `fontSize` | `string \| number` | `'clamp(2rem,8vw,8rem)'` | Размер шрифта |
| `fontWeight` | `number` | `900` | Жирность шрифта |
| `baseIntensity` | `number` | `0.18` | Базовая интенсивность фаззинга (0–1) |
| `hoverIntensity` | `number` | `0.5` | Интенсивность при наведении (0–1) |
| `fuzzRange` | `number` | `30` | Максимальный сдвиг строки (px) |
| `direction` | `string` | `'horizontal'` | Направление (`horizontal`/`vertical`/`both`) |
| `enableHover` | `boolean` | `true` | Реакция на наведение мыши |
| `glitchMode` | `boolean` | `false` | Периодические глитч-вспышки |
| `glitchInterval` | `number` | `2000` | Интервал между глитчами (мс) |
| `glitchDuration` | `number` | `200` | Длительность глитча (мс) |
| `transitionDuration` | `number` | `0` | Длительность перехода интенсивности (мс) |
| `clickEffect` | `boolean` | `false` | Вспышка при клике |
| `fps` | `number` | `60` | Частота кадров анимации |
| `letterSpacing` | `number` | `0` | Межбуквенный интервал (px) |
| `gradient` | `string[]` | `null` | Градиент текста |
| `className` | `string` | `''` | CSS классы |