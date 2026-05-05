---
title: "Руководство по добавлению новых UI компонентов"
description: Полное руководство по структуре проекта, добавлению компонентов в существующие и новые категории, конфигурациям и примерам кода.
author: veilosophy
date: 2026-02-12
tags: Markdown, форматирование, руководство, синтаксис, документация, UI компоненты
keywords: Markdown руководство, форматирование текста, документация Hub, примеры форматирования
robots: index, follow
lang: ru
---

Добавить компонент = создать папку с двумя файлами. Больше ничего.

---

## Структура

```
src/features/ui-components/
├── registry/
│   └── index.ts          ← авто-discovery, не трогать
├── loader.ts             ← кеш + загрузка, не трогать
├── types.ts              ← типы, не трогать
│
├── blur-text/            ← существующий компонент
│   ├── BlurText.tsx
│   └── config.json
│
└── my-new-component/     ← новый компонент
    ├── MyNewComponent.tsx
    └── config.json
```

---

## Добавить компонент (2 шага)

### Шаг 1 — создать `config.json`

```json
{
  "id": "my-new-component",
  "name": "Мой компонент",
  "description": "Описание компонента",
  "category": "text",
  "props": [
    {
      "name": "text",
      "type": "string",
      "default": "Hello",
      "description": "Текст",
      "control": "text"
    },
    {
      "name": "speed",
      "type": "number",
      "default": 1,
      "description": "Скорость",
      "control": "number",
      "min": 0,
      "max": 5,
      "step": 0.1
    },
    {
      "name": "direction",
      "type": "string",
      "default": "top",
      "description": "Направление",
      "control": "select",
      "options": ["top", "bottom", "left", "right"]
    }
  ],
  "specificProps": ["speed", "direction"],
  "tags": ["animation", "text"],
  "author": "veilosophy",
  "version": "1.0.0"
}
```

### Шаг 2 — создать компонент

```tsx
// src/features/ui-components/my-new-component/MyNewComponent.tsx
import React from 'react';

interface Props {
  text?: string;
  speed?: number;
  direction?: 'top' | 'bottom' | 'left' | 'right';
}

const MyNewComponent: React.FC<Props> = ({
  text = 'Hello',
  speed = 1,
  direction = 'top',
}) => {
  return <div>{text}</div>;
};

export default MyNewComponent;
```

Готово. `import.meta.glob` автоматически подхватит папку при следующем `npm run dev`.

---

## Новая категория

Категория — просто поле `"category"` в `config.json`. Никаких отдельных файлов создавать не нужно.

```json
{ "category": "shader" }
```

Фильтрация по категории:
```ts
registry.getByCategory('shader') // → ComponentConfig[]
```

---

## Вложенные папки

Если хочешь раскладывать компоненты по подпапкам:

```
ui-components/
├── shaders/
│   └── wave-shader/
│       ├── WaveShader.tsx
│       └── config.json
└── buttons/
    └── neon-button/
        ├── NeonButton.tsx
        └── config.json
```

Измени glob в `registry/index.ts` с `'../*/'` на `'../**/'`:

```ts
// registry/index.ts — одна строка
const configModules = import.meta.glob('../**/config.json', { eager: true });
const componentModules = import.meta.glob('../**/*.tsx');
```

---

## API registry

```ts
import { registry } from './registry';

registry.getAllIds()              // → ['blur-text', 'wave-shader', ...]
registry.getConfig('blur-text')  // → ComponentConfig | null
registry.getByCategory('text')   // → ComponentConfig[]
registry.hasComponent('blur-text') // → boolean
await registry.loadComponent('blur-text') // → React.ComponentType | null
```

---

## Поле `main` (опционально)

Если в папке несколько `.tsx` файлов, укажи главный:

```json
{
  "id": "my-component",
  "main": "MyComponent.tsx",
  ...
}
```

Без `main` registry возьмёт первый найденный `.tsx` файл.

---

## config.json — все поля

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|---------|
| `id` | string | ✅ | kebab-case, уникальный |
| `name` | string | ✅ | Отображаемое имя |
| `description` | string | ✅ | Краткое описание |
| `props` | PropDefinition[] | ✅ | Список пропсов |
| `main` | string | — | Главный файл (если несколько .tsx) |
| `specificProps` | string[] | — | Пропсы для вкладки "Специфические" |
| `category` | string | — | Любая строка |
| `tags` | string[] | — | Теги |
| `author` | string | — | Автор |
| `version` | string | — | Версия |

### control — типы управления

| Значение | Что рендерит |
|----------|-------------|
| `"text"` | Текстовый input |
| `"number"` | Слайдер + числовой input |
| `"select"` | Дропдаун (нужно `options: []`) |
| `"checkbox"` | Чекбокс |
| `"color"` | Цветовой picker |
