---
title: "Мягкая аурора"
description: WebGL-фон на OGL с мягким свечением авроры. Три октавы трёхмерного шума Перлина формируют светящиеся ленты через экспоненциальную функцию полосы. Два цветовых слоя с косинусоидальным градиентом, настраиваемая высота, плотность и мышиное взаимодействие.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, soft-aurora, shader
robots: index, follow
lang: ru
---

[uic:soft-aurora]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `color1` | `string` | `'#ff00ff'` | Первый цвет авроры |
| `color2` | `string` | `'#00ffff'` | Второй цвет авроры |
| `speed` | `number` | `1` | Скорость анимации |
| `scale` | `number` | `1` | Масштаб шумового паттерна |
| `brightness` | `number` | `1` | Яркость |
| `noiseFrequency` | `number` | `1` | Частота шума Перлина |
| `noiseAmplitude` | `number` | `1` | Амплитуда шума |
| `bandHeight` | `number` | `0.5` | Высота полосы авроры |
| `bandSpread` | `number` | `1` | Рассеивание краёв полосы |
| `octaveDecay` | `number` | `0.5` | Затухание амплитуды по октавам |
| `layerOffset` | `number` | `0.2` | Сдвиг второго слоя по времени |
| `colorSpeed` | `number` | `1` | Скорость смены цвета |
| `enableMouseInteraction` | `boolean` | `true` | Реакция на мышь |
| `mouseInfluence` | `number` | `0.2` | Сила смещения UV от мыши |
