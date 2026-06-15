---
title: "Световые лучи"
description: WebGL-фон на OGL с расходящимися лучами света. Два слоя лучей формируются через угловую функцию от источника, ослабевают по расстоянию и опционально следуют за мышью. Поддерживает восемь точек источника, пульсацию, дисторшн и шум.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, light-rays, shader
robots: index, follow
lang: ru
---

[uic:light-rays]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `raysOrigin` | `string` | `'top-center'` | Точка источника лучей |
| `raysColor` | `string` | `'#ffffff'` | Цвет лучей |
| `raysSpeed` | `number` | `1` | Скорость анимации лучей |
| `lightSpread` | `number` | `1` | Угол рассеивания лучей |
| `rayLength` | `number` | `1` | Длина лучей (коэф. от ширины экрана) |
| `pulsating` | `boolean` | `false` | Пульсирующая яркость |
| `fadeDistance` | `number` | `1` | Расстояние затухания |
| `saturation` | `number` | `1` | Насыщенность цвета лучей |
| `followMouse` | `boolean` | `false` | Лучи следуют за мышью |
| `mouseInfluence` | `number` | `0.1` | Сила отклонения от мыши |
| `noiseAmount` | `number` | `0` | Шум поверх лучей |
| `distortion` | `number` | `0` | Синусоидальная дисторция лучей |