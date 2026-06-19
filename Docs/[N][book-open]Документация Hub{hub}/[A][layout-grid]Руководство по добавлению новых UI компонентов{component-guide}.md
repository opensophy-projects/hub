---
title: "Руководство по UI библиотеке Hub V3.5"
description: "Актуальное руководство V3.5 по добавлению UI-компонентов: структура backgrounds/texts, auto-discovery registry, preview-файлы, вкладка кода, universal props и Markdown-документация."
author: veilosophy
date: 2026-02-12
updated: 2026-06-16
tags: "ui-компоненты, react, registry, markdown, документация, v3.5"
keywords: "Hub UI library, React компоненты, import.meta.glob, UI registry, documentation components"
robots: "index, follow"
lang: ru
icon: layout-grid
priority: 4
---

# UI библиотека Hub V3.5

В V3.5 UI-библиотека больше не работает через обязательные `config.json`. Компоненты обнаруживаются автоматически через `import.meta.glob` в `src/features/ui-components/registry/index.ts`.

Минимальная идея:

1. создать папку компонента в категории;
2. положить `.tsx` компонент или preview-файл;
3. создать Markdown-документацию в `Docs/[N][component]UI Библиотека{ui}/...`;
4. запустить `npm run generate`.

---

## Где лежат компоненты

```txt
src/features/ui-components/
├── backgrounds/
│   ├── aurora/aurora.tsx
│   ├── beams/beams.tsx
│   └── soft-aurora/soft-aurora.tsx
├── texts/
│   ├── count-up/count-up.tsx
│   ├── count-up/count-up-preview.tsx
│   └── wave-text/wave-text.tsx
├── registry/index.ts       # auto-discovery
├── loader.ts               # кеш загрузки компонента + исходников
├── NewUIComponentViewer.tsx
├── ComponentWrapper.tsx
└── types.ts                # UniversalProps
```

Поддерживаемые категории registry:

```ts
backgrounds, texts, buttons, cards, effects, loaders, inputs
```

Сейчас в V3.5 активно используются `backgrounds` и `texts`.

---

## Как registry выбирает компонент

Для id `count-up` registry ищет папку с таким именем на любой глубине:

```txt
src/features/ui-components/texts/count-up/
```

Затем выбирает файл в порядке приоритета:

1. `index.tsx` или `index.ts`;
2. `<id>-preview.tsx` или `<id>-preview.ts`;
3. `<id>.tsx` или `<id>.ts`;
4. любой другой файл с React-компонентом.

Preview-файл нужен, когда основной компонент требует props, а документации нужен готовый демо-экран с дефолтными значениями.

---

## Минимальный компонент

```txt
src/features/ui-components/texts/my-text/
└── my-text.tsx
```

```tsx
import React from 'react';

export default function MyText() {
  return <span style={{ fontSize: 48 }}>Hello Hub</span>;
}
```

Документация:

```txt
Docs/[N][component]UI Библиотека{ui}/[C][a-large-small]Типографика{typography}/[A][sparkles]Мой текст{my-text}.md
```

Ключевое правило: slug документа `{my-text}` должен совпадать с именем папки компонента `my-text`, если вы хотите, чтобы viewer загрузил компонент автоматически.

---

## Компонент с preview-файлом

```txt
src/features/ui-components/texts/my-effect/
├── my-effect.tsx
└── my-effect-preview.tsx
```

```tsx
// my-effect.tsx
export default function MyEffect({ text = 'Opensophy' }: { text?: string }) {
  return <strong>{text}</strong>;
}
```

```tsx
// my-effect-preview.tsx
import MyEffect from './my-effect';

export default function MyEffectPreview() {
  return <MyEffect text="Live preview" />;
}
```

Viewer сначала возьмёт preview и покажет готовый пример.

---

## Universal Props

`ComponentWrapper` и viewer умеют применять универсальные настройки внешнего вида:

| Группа | Props |
|---|---|
| Цвет | `color`, `colorMode`, `gradientFrom`, `gradientTo`, `gradientAngle` |
| Размер и позиция | `scale`, `width`, `height`, `offsetX`, `offsetY` |
| Выравнивание | `justifyContent`, `alignItems` |
| Анимация | `animationSpeed` |
| Фильтры | `opacity`, `blur`, `brightness`, `contrast`, `saturate` |
| Поведение | `enableUniversalProps` |

Компонент не обязан принимать все эти props. Wrapper применяет большую часть эффектов на контейнере.

---

## Вкладка «Код»

Registry загружает raw-содержимое файлов из папки компонента:

```txt
src/features/ui-components/backgrounds/aurora/
└── aurora.tsx
```

В viewer пользователь увидит исходники файлов компонента. Поэтому держите рядом только те файлы, которые действительно относятся к компоненту: `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.html`, `.json`.

---

## Документационный Markdown для компонента

Рекомендуемый frontmatter:

```yaml
---
title: "Название компонента"
description: "Что делает компонент и где его использовать."
author: veilosophy
date: 2026-06-16
tags: "ui, component, animation"
icon: sparkles
lang: ru
robots: "index, follow"
priority: 30
---
```

В теле документа добавьте:

- короткое описание;
- пример использования;
- props/API;
- рекомендации по производительности;
- ограничения для mobile;
- заметки по accessibility.

---

## Добавить новый background-компонент

:::steps
:::step[status=done] Создайте папку
`src/features/ui-components/backgrounds/my-background/`.
:::
:::step[status=done] Добавьте компонент
`my-background.tsx` или `my-background-preview.tsx` с default export React-компонента.
:::
:::step[status=done] Добавьте документацию
`Docs/[N][component]UI Библиотека{ui}/[C][maximize]Фон{background}/[A][sparkles]Мой фон{my-background}.md`.
:::
:::step[status=done] Сгенерируйте данные
Запустите `npm run generate`, затем `npm run dev`.
:::
:::

---

## Добавить новый typography-компонент

```txt
src/features/ui-components/texts/typewriter/
├── typewriter.tsx
└── typewriter-preview.tsx

Docs/[N][component]UI Библиотека{ui}/[C][a-large-small]Типографика{typography}/[A][type]Печатная строка{typewriter}.md
```

Если компонент использует browser-only API (`window`, `document`, canvas, WebGL), обращайтесь к ним внутри `useEffect` или после проверки окружения, чтобы не ломать SSR/dev-сборку.

---

## Требования к компонентам

| Требование | Почему важно |
|---|---|
| `default export` или экспорт React-компонента | Registry ищет React-компонент в default или среди named exports. |
| Уникальная папка-id в kebab-case | По имени папки строится связь с Markdown slug. |
| Preview для сложных компонентов | Документация должна открываться без ручной настройки props. |
| Без тяжёлых глобальных side effects | Компоненты грузятся лениво и должны безопасно размонтироваться. |
| Cleanup в `useEffect` | Canvas/WebGL/таймеры/RAF должны освобождаться. |
| Mobile fallback | Viewer используется на мобильных экранах. |

---

## Частые проблемы

| Симптом | Причина | Решение |
|---|---|---|
| Viewer пишет, что компонент не найден | Slug документа не совпадает с папкой | Сделайте `{my-component}` и папку `my-component`. |
| Загружается не тот файл | Есть несколько `.tsx` | Добавьте `<id>-preview.tsx` или `index.tsx`. |
| Вкладка «Код» пустая | Нет raw-файлов в папке компонента | Проверьте расширения и расположение файлов. |
| Ошибка SSR | Используется `window` на верхнем уровне | Перенесите browser API в `useEffect`. |
| Слишком тяжёлая страница | WebGL/анимация без cleanup | Остановите RAF, dispose geometry/material/renderer. |

---

## Что изменилось относительно V3.4

- Компоненты разложены по категориям `backgrounds` и `texts`.
- Добавлена автоматическая загрузка исходников во вкладку «Код».
- Registry стал искать компонент по имени папки, а не по ручному списку конфигов.
- Preview-файлы получили приоритет над основными файлами.
- Добавлены `three` и `postprocessing` для сложных визуалов.
- Viewer получил панель настроек, fullscreen/preview controls и общий стиль через theme tokens.
