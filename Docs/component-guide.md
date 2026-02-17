---
title: "Руководство по добавлению новых UI компонентов"
description: "Полное руководство по структуре проекта, добавлению компонентов в существующие и новые категории, конфигурациям и примерам кода"
type: docs
typename: Документация
category: hub
author: veilosophy
date: 2026-02-12
tags: Markdown, форматирование, руководство, синтаксис, документация, UI компоненты
keywords: Markdown руководство, форматирование текста, документация Hub, примеры форматирования
bannercolor: "#bf548f"
bannertext: "UI Components Guide"
canonical: null
robots: index, follow
lang: ru
---

## Структура проекта для компонентов

```
src/uic-system/
├── registry/
│   ├── index.ts          # Главный файл реестра (объединяет все категории)
│   ├── text.ts           # Текстовые компоненты (blur-text, etc)
│   ├── buttons.ts        # Кнопки
│   ├── cards.ts          # Карточки
│   └── shader.ts         # Шейдеры (новая категория)
├── types.ts              # TypeScript типы и интерфейсы
├── loader.ts             # Загрузчик компонентов (не менять!)
├── blur-text/            # Пример существующего компонента
│   ├── BlurText.tsx      # Основной компонент
│   ├── config.json       # Конфигурация компонента
│   ├── types.ts          # Типы (опционально)
│   └── index.ts          # Export компонента
└── your-component/       # Ваш новый компонент
    ├── YourComponent.tsx # Основной компонент
    ├── config.json       # Конфигурация
    ├── types.ts          # Типы (опционально)
    └── index.ts          # Export компонента
```

---

## Сценарий 1: Добавление компонента в СУЩЕСТВУЮЩУЮ категорию (например, "text")

### Шаг 1: Создать папку компонента

```
src/uic-system/your-new-text-component/
├── YourNewTextComponent.tsx
├── config.json
├── types.ts (опционально)
└── index.ts
```

### Шаг 2: Создать сам компонент

**Файл: `src/uic-system/your-new-text-component/YourNewTextComponent.tsx`**

```
import React from 'react';

export interface YourNewTextComponentProps {
  text: string;
  color?: string;
  fontSize?: number;
}

export const YourNewTextComponent: React.FC<YourNewTextComponentProps> = ({
  text,
  color = '#000000',
  fontSize = 16,
}) => {
  return (
    <div style={{ color, fontSize }}>
      {text}
    </div>
  );
};
```

### Шаг 3: Создать config.json

**Файл: `src/uic-system/your-new-text-component/config.json`**

```
{
  "id": "your-new-text-component",
  "name": "Your New Text Component",
  "description": "Описание компонента на русском",
  "category": "text",
  "version": "1.0.0",
  "author": "Your Name",
  "files": [
    {
      "name": "YourNewTextComponent.tsx",
      "path": "src/uic-system/your-new-text-component/YourNewTextComponent.tsx",
      "language": "tsx"
    },
    {
      "name": "config.json",
      "path": "src/uic-system/your-new-text-component/config.json",
      "language": "json"
    }
  ],
  "props": [
    {
      "name": "text",
      "type": "string",
      "default": "Hello",
      "description": "Текст компонента",
      "control": "text"
    },
    {
      "name": "color",
      "type": "string",
      "default": "#000000",
      "description": "Цвет текста",
      "control": "color"
    },
    {
      "name": "fontSize",
      "type": "number",
      "default": 16,
      "description": "Размер шрифта в пиксelях",
      "control": "number",
      "min": 8,
      "max": 72,
      "step": 1
    }
  ],
  "tags": ["text", "typography"]
}
```

### Шаг 4: Создать index.ts

**Файл: `src/uic-system/your-new-text-component/index.ts`**

```
export { YourNewTextComponent } from './YourNewTextComponent';
export type { YourNewTextComponentProps } from './YourNewTextComponent';
```

### Шаг 5: Добавить в registry/text.ts

**Редактировать: `src/uic-system/registry/text.ts`**

```
import type { ComponentConfig } from '../types';
import blurTextConfig from '../blur-text/config.json';
import yourNewTextComponentConfig from '../your-new-text-component/config.json';

const textLoaders = {
  'blur-text': () => import('../blur-text').then(m => m.BlurText),
  'your-new-text-component': () => import('../your-new-text-component').then(m => m.YourNewTextComponent),
} as const;

const textConfigs: Record<string, ComponentConfig> = {
  'blur-text': blurTextConfig as ComponentConfig,
  'your-new-text-component': yourNewTextComponentConfig as ComponentConfig,
};

export const textRegistry = {
  loaders: textLoaders,
  configs: textConfigs,
};

export type TextComponentId = keyof typeof textLoaders;
```

### Шаг 6: Запустить build

```bash
npm run build
```

✅ Готово! Компонент автоматически доступен через `registry.loadComponent('your-new-text-component')`

---

## Сценарий 2: Добавление компонента в НОВУЮ категорию (например, "shader")

### Шаг 1-4: Повторить как выше

Создать папку компонента, компонент, config.json, index.ts

### Шаг 5: Создать новый файл категории

**Создать новый файл: `src/uic-system/registry/shader.ts`**

```
import type { ComponentConfig } from '../types';
import yourShaderConfig from '../your-shader/config.json';

const shaderLoaders = {
  'your-shader': () => import('../your-shader').then(m => m.YourShader),
} as const;

const shaderConfigs: Record<string, ComponentConfig> = {
  'your-shader': yourShaderConfig as ComponentConfig,
};

export const shaderRegistry = {
  loaders: shaderLoaders,
  configs: shaderConfigs,
};

export type ShaderComponentId = keyof typeof shaderLoaders;
```

### Шаг 6: Обновить registry/index.ts

**Редактировать: `src/uic-system/registry/index.ts`**

```
import type { ComponentConfig } from '../types';
import { textRegistry, type TextComponentId } from './text';
import { buttonRegistry, type ButtonComponentId } from './buttons';
import { cardRegistry, type CardComponentId } from './cards';
import { shaderRegistry, type ShaderComponentId } from './shader';  // ДОБАВИТЬ

export type ComponentId =
  | TextComponentId
  | ButtonComponentId
  | CardComponentId
  | ShaderComponentId;  // ДОБАВИТЬ

const allLoaders = {
  ...textRegistry.loaders,
  ...buttonRegistry.loaders,
  ...cardRegistry.loaders,
  ...shaderRegistry.loaders,  // ДОБАВИТЬ
};

const allConfigs = {
  ...textRegistry.configs,
  ...buttonRegistry.configs,
  ...cardRegistry.configs,
  ...shaderRegistry.configs,  // ДОБАВИТЬ
};

// Остальной код без изменений...
```

### Шаг 7: Запустить build

```
npm run build
```

✅ Готово! Новая категория создана и компонент доступен

---

## Обновить types.ts для новой категории (опционально)

Если вы создали новую категорию, обновите `category` в `types.ts`:

**Редактировать: `src/uic-system/types.ts`** (строка ~15)

```
category?: 'text' | 'button' | 'card' | 'shader' | 'other';
```

---

## Чек-лист для добавления компонента

### Для существующей категории (text, button, card):
- [ ] Создана папка компонента: `src/uic-system/my-component/`
- [ ] Создан файл компонента: `MyComponent.tsx`
- [ ] Создан файл config: `config.json`
- [ ] Создан файл index: `index.ts`
- [ ] Добавлен импорт в соответствующий `registry/[category].ts`
- [ ] Добавлена запись в `loaders` (строка вида: `'my-component': () => import(...)`)
- [ ] Добавлена запись в `configs` (строка вида: `'my-component': configObject`)
- [ ] Запущен `npm run build` успешно

### Для новой категории:
- [ ] Все пункты выше
- [ ] Создан новый файл: `src/uic-system/registry/[category].ts`
- [ ] Обновлен `src/uic-system/registry/index.ts`:
  - [ ] Добавлен импорт новой категории
  - [ ] Добавлен тип в `ComponentId` union
  - [ ] Добавлены лоадеры и конфиги в `allLoaders` и `allConfigs`
- [ ] Обновлен `src/uic-system/types.ts` (добавлена новая категория в union)
- [ ] Запущен `npm run build` успешно

---

## Пример config.json для разных типов компонентов

### Текстовый компонент:
```
{
  "id": "glitch-text",
  "name": "Glitch Text",
  "description": "Текстовый эффект с глитчем",
  "category": "text",
  "props": [
    {
      "name": "text",
      "type": "string",
      "default": "GLITCH",
      "description": "Текст для отображения",
      "control": "text"
    }
  ]
}
```

### Кнопка:
```
{
  "id": "neon-button",
  "name": "Neon Button",
  "description": "Кнопка с неоновым свечением",
  "category": "button",
  "props": [
    {
      "name": "label",
      "type": "string",
      "default": "Click me",
      "description": "Текст на кнопке",
      "control": "text"
    },
    {
      "name": "color",
      "type": "string",
      "default": "#00ff00",
      "description": "Цвет неона",
      "control": "color"
    }
  ]
}
```

### Шейдер:
```
{
  "id": "wave-shader",
  "name": "Wave Shader",
  "description": "Волновой шейдер эффект",
  "category": "shader",
  "props": [
    {
      "name": "amplitude",
      "type": "number",
      "default": 0.5,
      "description": "Амплитуда волны",
      "control": "number",
      "min": 0,
      "max": 1,
      "step": 0.1
    },
    {
      "name": "frequency",
      "type": "number",
      "default": 1,
      "description": "Частота волны",
      "control": "number",
      "min": 0.1,
      "max": 5,
      "step": 0.1
    }
  ]
}
```

---

## Правила именования

- **Папки компонентов**: kebab-case (например: `my-awesome-component`)
- **Файлы компонентов**: PascalCase (например: `MyAwesomeComponent.tsx`)
- **ID компонента в config**: kebab-case (например: `my-awesome-component`)
- **Типы в TypeScript**: PascalCase (например: `MyAwesomeComponentProps`)

---

## Тестирование компонента

Компонент автоматически доступен через:

```
import { loadComponent } from '@/uic-system/loader';
import { registry } from '@/uic-system/registry';

// Получить конфиг
const config = registry.getConfig('my-awesome-component');

// Загрузить компонент
const Component = await loadComponent('my-awesome-component');

// Использовать
<Component {...componentProps} />
```

---

## Часто встречающиеся ошибки

### ❌ Ошибка: "Component not found"
**Причина**: Компонент не добавлен в соответствующий `registry/[category].ts`
**Решение**: Проверить, что добавлены записи в `loaders` и `configs`

### ❌ Ошибка: "Cannot find module"
**Причина**: Неправильный путь в импорте или typo в имени файла
**Решение**: Проверить точное имя файла компонента и путь в импорте

### ❌ Ошибка: Build не проходит
**Причина**: Синтаксическая ошибка в tsx/ts/json файле
**Решение**: Проверить синтаксис через `npm run build` и исправить ошибки

### ❌ Ошибка: Конфиг не загружается
**Причина**: `config.json` импортируется как ES module, но путь неправильный
**Решение**: Убедиться, что путь в импорте совпадает с реальным расположением файла
