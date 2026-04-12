---
title: "Главная страница: лендинг и welcome.md"
description: Как работают два режима главной страницы Hub — лендинг и welcome.md — и как создать собственную welcome.md или кастомный лендинг.
author: veilosophy
date: 2026-04-12
tags: "документация, конфигурация"
icon: house
lang: ru
robots: "index, follow"
---


# Главная страница: лендинг и welcome.md

Hub поддерживает два режима главной страницы. Переключение между ними
происходит мгновенно — без пересборки в dev-режиме.

## Как это работает

Режим хранится в одном файле:

```json
// public/data/site-config.json
{ "useLanding": false }
```

При каждом запросе к `/` файл `src/app/pages/index.astro` читает этот конфиг
и решает, что показать:

:::columns[layout=equal]
:::col
**`useLanding: false`**

Показывает файл `Docs/welcome.md`, обработанный через стандартный `DocContent`.
Это обычная Markdown-страница — со всеми расширениями, графиками, карточками,
алертами и прочим.
:::
:::col
**`useLanding: true`**

Показывает React-компонент `GeneralPageWrapper` из
`src/features/general/components/GeneralPage.tsx`.
Это полноценная визуальная посадочная страница с WebGL-анимацией,
анимированными секциями и адаптивным макетом.
:::
:::

## Переключение в dev-режиме

Самый простой способ — через Admin Panel:

:::steps
:::step[status=done] Откройте Admin Panel
Нажмите `Ctrl+Shift+D` или кнопку **ADMIN** в левом нижнем углу экрана.
:::
:::step[status=done] Перейдите на вкладку «Сайт»
Четвёртая вкладка в верхней панели Admin Panel.
:::
:::step[status=done] Выберите нужный режим
Нажмите «Welcome.md» или «Лендинг» — конфиг сохраняется мгновенно.
:::
:::step[status=done] Обновите страницу
Нажмите `F5` — изменение вступит в силу.
:::
:::

Либо отредактируйте `public/data/site-config.json` вручную.

:::note
В продакшне после смены режима потребуется пересборка (`npm run build`),
так как страница пре-рендерится статически.
:::

---

## Режим welcome.md

### Создание welcome.md

Создайте файл `Docs/welcome.md`. Это обычный Markdown с frontmatter:

```markdown
---
title: Добро пожаловать в Hub
description: Центр знаний нашей команды
author: Ваше имя
date: 2026-04-12
icon: crown
---

# Добро пожаловать

Здесь хранятся наши документы, гайды и компоненты.

:::cards[cols=3]
:::card[color=#3b82f6]
[title]Статьи
[icon]book-open
Руководства и туториалы.
:::
:::card[color=#22c55e]
[title]UI-библиотека
[icon]component
Готовые компоненты.
:::
:::card[color=#f59e0b]
[title]Документация
[icon]file-text
Справочники и гайды.
:::
:::
```

### Особенности welcome.md

- Файл не появляется в навигации и поиске — он отдельный от дерева `Docs/`
- Slug для `welcome.md` всегда пустой — это и есть путь `/`
- Поддерживаются все Markdown-расширения Hub: карточки, графики, шаги, табы,
  алерты, KaTeX, UI-компоненты через `[uic:component-id]`
- Отображается через тот же `DocContent`, что и все остальные страницы,
  поэтому тема, навигация и оглавление работают так же

---

## Режим лендинга

### Что такое GeneralPage

`GeneralPageWrapper` → `GeneralPage` → `LandingContent` — это React-компонент
в `src/features/general/components/GeneralPage.tsx`. Он полностью независим от
системы Markdown и имеет собственную тему (синхронизированную с глобальной через
`localStorage` и кастомное событие `hub:theme-change`).

Структура лендинга по умолчанию:

```
LandingContent
├── Navigation              ← Глобальная навигация Hub
├── Hero (WebGL SingularityShaders + заголовок Opensophy)
├── О проекте (ShinyText)
├── SecuritySection (график + карточки FeatureCard)
└── EcosystemSection (RotatingText + EcoCard × 4)
```

### Как создать собственный лендинг

Редактируйте `src/features/general/components/GeneralPage.tsx`.
Это обычный React-файл — можно менять всё, что внутри `LandingContent`.

**Минимальный собственный лендинг:**

```tsx
// src/features/general/components/GeneralPage.tsx
import React from 'react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';

const LandingContent: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <Navigation />
      <main style={{ padding: '8rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 700 }}>
          Мой Hub
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.7 }}>
          Описание проекта.
        </p>
      </main>
    </div>
  );
};

const GeneralPage: React.FC = () => (
  <ThemeProvider>
    <LandingContent />
  </ThemeProvider>
);

export default GeneralPage;
```

:::warning
Всегда оборачивайте `LandingContent` в `<ThemeProvider>` —
иначе `Navigation` и переключатель темы не будут работать.
:::

### Готовые компоненты для лендинга

В `GeneralPage.tsx` уже подключены и используются:

| Компонент | Откуда | Описание |
|-----------|--------|----------|
| `SingularityShaders` | `./SingularityShaders` | WebGL-анимация для Hero |
| `RotatingText` | `@/features/ui-components/rotating-text` | Чередующийся текст |
| `GlowingEffect` | `./ui/GlowingEffect` | Свечение по краю карточки при наведении |
| `Navigation` | `@/features/navigation/components/Navigation` | Глобальная навигация |

Все UI-компоненты из библиотеки (`blur-text`, `gradient-text`, `shiny-text` и другие)
можно импортировать напрямую:

```tsx
import GradientText from '@/features/ui-components/gradient-text/gradient-text';
import BlurText from '@/features/ui-components/blur-text/BlurText';
```

### Синхронизация темы в лендинге

Лендинг не использует `useTheme()` из `ThemeContext` — вместо этого он читает
тему напрямую из `localStorage` и слушает событие `hub:theme-change`:

```tsx
const [isNegative, setIsNegative] = useState(() => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('theme') !== 'light';
});

useEffect(() => {
  const onCustom = (e: Event) => {
    setIsNegative((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
  };
  window.addEventListener('hub:theme-change', onCustom);
  return () => window.removeEventListener('hub:theme-change', onCustom);
}, []);
```

`isNegative === true` соответствует тёмной теме. Переменная пробрасывается
во все дочерние секции как пропс.

---

## Смещение контента от навигации

Когда открыта боковая панель навигации (десктоп), CSS-переменная `--nav-left`
содержит ширину рейла + открытой панели. В лендинге это учитывается так:

```tsx
const [navOffset, setNavOffset] = useState(0);

useEffect(() => {
  const readOffset = () => {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-left').trim();
    setNavOffset(val ? parseInt(val, 10) : 0);
  };
  readOffset();
  const observer = new MutationObserver(readOffset);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style'],
  });
  return () => observer.disconnect();
}, []);

// Применяется к каждой секции:
<section style={{ marginLeft: navOffset > 0 ? `${navOffset}px` : 0 }}>
```

Если вы создаёте собственный лендинг и хотите корректно отступать от навигации —
используйте этот же паттерн для каждой секции на полную ширину.

---

## Продакшн

В продакшне `src/app/pages/index.astro` пре-рендерится статически
(`export const prerender = true`). Это значит:

- `site-config.json` читается **в момент сборки**
- Изменить режим на живом сайте без пересборки нельзя
- Для деплоя с нужным режимом достаточно выставить `useLanding` в конфиге перед `npm run build`

:::note
В dev-режиме (`astro dev`) страница рендерится динамически при каждом запросе,
поэтому смена режима через Admin Panel отражается сразу после перезагрузки.
:::