---
title: "Призматический всплеск"
description: WebGL-фон на OGL с призматическими лучами через ray marching. 44 итерации формируют радиальный паттерн лучей с bend-деформацией и спектральной или пользовательской градиентной окраской. Три режима анимации, настраиваемое количество лучей и mix-blend-mode.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, prismatic-burst, shader
robots: index, follow
lang: ru
---

[uic:prismatic-burst]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `intensity` | `number` | `2` | Яркость лучей |
| `speed` | `number` | `0.5` | Скорость анимации |
| `animationType` | `string` | `'rotate3d'` | Режим (`rotate`/`rotate3d`/`hover`) |
| `colors` | `string[]` | `undefined` | Кастомные цвета спектра (до 64) |
| `distort` | `number` | `0` | Сила bend-деформации лучей |
| `paused` | `boolean` | `false` | Пауза анимации |
| `rayCount` | `number` | `24` | Количество лучей в паттерне |
| `hoverDampness` | `number` | `0.1` | Инерция hover-режима |
| `offset` | `object` | `{x:0,y:0}` | Смещение центра (px) |
| `mixBlendMode` | `string` | `'screen'` | CSS mix-blend-mode |