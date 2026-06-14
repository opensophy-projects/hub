---
title: "Кастомные страницы: React-страницы из папки custom"
description: Как создавать полностью кастомные кодовые страницы Hub через папку src/custom и slug в имени папки.
author: veilosophy
date: 2026-06-09
tags: "документация, custom pages, react, astro"
icon: blocks
lang: ru
robots: "index, follow"
---

# Кастомные страницы

Кастомные страницы — это отдельные React-страницы, которые не пишутся в Markdown.
Они подходят для лендингов, промо-страниц, интерактивных страниц и любых экранов,
которые удобнее полностью собрать кодом.

## Где лежат страницы

Все кастомные страницы находятся в папке:

```txt
src/custom/
```

Каждая страница — это отдельная папка. Slug задаётся так же, как в Markdown-системе:
через фигурные скобки в имени папки.

```txt
src/custom/
└── Название страницы{page-slug}/
    └── Page.tsx
```

Папка `Название страницы{page-slug}` создаст страницу по адресу:

```txt
/page-slug/
```

Если фигурные скобки не указаны, slug будет сгенерирован из имени папки.

## Структура Page.tsx

Минимальный пример `Page.tsx`:

```tsx
export default function MyCustomPage() {
  return <main>Привет из кастомной страницы</main>;
}
```

SEO-метаданные можно вынести в соседний `metadata.ts`:

```ts
import type { CustomPageMetadata } from '../types';

const metadata: CustomPageMetadata = {
  title: 'Моя кастомная страница',
  description: 'Описание страницы для SEO.',
  robots: 'index, follow',
  lang: 'ru',
  type: 'website',
};

export default metadata;
```

`metadata` используется в общем `Layout`: title, description, keywords, robots,
lang, image и другие SEO-поля можно указать прямо рядом с компонентом страницы.

## General как первая кастомная страница

Лендинг General перенесён в новую систему:

```txt
src/custom/general{general}/
├── Page.tsx
├── metadata.ts
└── components/
    ├── GeneralPage.tsx
    └── SingularityShaders.tsx
```

Slug берётся из имени папки `general{general}`, поэтому страница доступна по адресу:

```txt
/general/
```

Главная страница `/` в режиме `useLanding: true` также использует эту же кастомную
страницу `general`.

## Как добавить новую страницу

:::steps
:::step[status=done] Создайте папку
Например: `src/custom/Промо продукта{product}/`.
:::
:::step[status=done] Добавьте Page.tsx
Экспортируйте React-компонент по умолчанию, а SEO-данные при необходимости положите в `metadata.ts`.
:::
:::step[status=done] Откройте slug
Страница будет доступна по адресу `/product/`.
:::
:::

## Конфликты slug

Если slug кастомной страницы совпадёт со slug Markdown-документа или категории,
приоритет останется у Markdown-страницы, а кастомная страница будет пропущена при
генерации статических путей. Поэтому лучше задавать уникальные slug.
