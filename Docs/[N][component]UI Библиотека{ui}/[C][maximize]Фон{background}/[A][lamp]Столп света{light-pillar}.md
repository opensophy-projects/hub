---
title: "Столп света"
description: WebGL-фон на Three.js с объёмным столпом света через ray marching. Трёхмерный шейдер марширует по сцене, деформируя пространство волновыми функциями. Градиентная окраска по высоте, интерактивное вращение мышью, адаптивное качество для мобильных.
date: 2026-05-07
tags: разработка, ui, ui-компоненты
keywords: webgl three.js ray marching, light pillar shader, animated background, react three.js, volumetric light
robots: index, follow
lang: ru
---

[uic:light-pillar]

| Проп | Type | Обычно | Описание |
|------|------|---------|-------------|
| `topColor` | `string` | `'#5227FF'` | Цвет верхней части столпа |
| `bottomColor` | `string` | `'#FF9FFC'` | Цвет нижней части столпа |
| `intensity` | `number` | `1.0` | Яркость итогового изображения |
| `rotationSpeed` | `number` | `0.3` | Скорость вращения столпа |
| `interactive` | `boolean` | `false` | Управление вращением мышью |
| `glowAmount` | `number` | `0.005` | Интенсивность свечения |
| `pillarWidth` | `number` | `3.0` | Ширина столпа |
| `pillarHeight` | `number` | `0.4` | Коэффициент вертикального сжатия |
| `noiseIntensity` | `number` | `0.5` | Интенсивность плёночного шума |
| `pillarRotation` | `number` | `0` | Статический поворот камеры (°) |
| `quality` | `string` | `'high'` | Качество рендера (`low`/`medium`/`high`) |