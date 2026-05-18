---
title: "Плавающие линии"
description: UI Компонент. Анимированный фоновый эффект плавающие линии.
date: 2026-05-18
tags: разработка, ui, ui-компоненты
keywords: react background, animated background, ui component
robots: index, follow
lang: ru
---

[uic:floating-lines]

Компонент фонового эффекта **Плавающие линии** для UI-сцен и декоративных секций страницы.

---


## Стек и зависимости

- `react`
- `ogl` или `three` (в зависимости от реализации компонента)

## Использование

```tsx
import Component from '@/features/ui-components/floating-lines/floating-lines';

<div style={{ width: '100%', height: '420px' }}>
  <Component />
</div>
```

## Пропсы

См. `config.json` компонента — все пропсы вынесены в viewer.

## Архитектура шейдера

Компонент рендерит анимированный фон на основе шейдерной/канвас-логики с управлением через пропсы.

## Оригинальный код

Оригинальный код находится в:
- `src/features/ui-components/floating-lines/floating-lines.tsx`

## Рецепты

- Для hero-блока: увеличьте скорость/интенсивность.
- Для фоновых секций: уменьшите интенсивность и шум.

## Дефолтные настройки

Используются значения из `config.json` и дефолты в компоненте.
