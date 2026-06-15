---
title: "Темная вуаль"
description: Генеративный WebGL-фон на основе CPPN — нейросети с периодическими активациями. Бесконечно анимированная органическая текстура с поддержкой сдвига оттенка, зернистости, сканлайнов и UV-деформации пространства.
date: 2026-03-23
tags: разработка, ui, ui-компоненты
keywords: webgl background, generative art, cppn shader, animated background, react
robots: index, follow
lang: ru
---

[uic:dark-veil]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `speed` | `number` | `0.5` | Скорость анимации |
| `hueShift` | `number` | `0` | Сдвиг оттенка (0–360°) |
| `noiseIntensity` | `number` | `0` | Интенсивность зернистости |
| `scanlineIntensity` | `number` | `0` | Интенсивность сканлайнов |
| `scanlineFrequency` | `number` | `0` | Частота сканлайнов |
| `warpAmount` | `number` | `0` | Сила UV-деформации |
| `resolutionScale` | `number` | `1` | Масштаб разрешения (0.5 = экономия GPU) |
