---
title: "Грейниент"
description: WebGL-фон на OGL с анимированным зернистым градиентом. Два цветовых слоя смешиваются через шум Перлина с warp-деформацией, вращением и плёночной зернистостью. Полный контроль над контрастом, насыщенностью, гаммой и зумом.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, grainient, shader
robots: index, follow
lang: ru
---

[uic:grainient]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `color1` | `string` | `'#ff00ff'` | Первый цвет градиента |
| `color2` | `string` | `'#00ffff'` | Второй цвет градиента |
| `color3` | `string` | `'#ffffff'` | Третий цвет градиента |
| `timeSpeed` | `number` | `1` | Скорость анимации |
| `colorBalance` | `number` | `0.5` | Баланс между цветами |
| `warpStrength` | `number` | `1` | Сила warp-деформации |
| `warpFrequency` | `number` | `1` | Частота warp |
| `warpSpeed` | `number` | `1` | Скорость warp-движения |
| `warpAmplitude` | `number` | `1` | Амплитуда warp |
| `blendAngle` | `number` | `0` | Угол смешивания слоёв (°) |
| `blendSoftness` | `number` | `0.5` | Мягкость перехода между слоями |
| `rotationAmount` | `number` | `0` | Угол вращения паттерна шума |
| `noiseScale` | `number` | `1` | Масштаб шума |
| `grainAmount` | `number` | `0.1` | Интенсивность зернистости |
| `grainScale` | `number` | `1` | Масштаб зерна |
| `grainAnimated` | `boolean` | `true` | Анимировать зерно |
| `contrast` | `number` | `1` | Контраст |
| `gamma` | `number` | `1` | Гамма-коррекция |
| `saturation` | `number` | `1` | Насыщенность |
| `centerX` | `number` | `0` | Горизонтальное смещение центра |
| `centerY` | `number` | `0` | Вертикальное смещение центра |
| `zoom` | `number` | `1` | Масштаб вьюпорта |