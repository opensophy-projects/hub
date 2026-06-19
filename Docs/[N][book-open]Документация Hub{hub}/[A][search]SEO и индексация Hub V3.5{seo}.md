---
title: "SEO и индексация Hub V3.5"
description: "Практическое руководство по SEO в Hub: frontmatter, meta tags, Open Graph, Twitter Cards, canonical, robots.txt, sitemap.xml, JSON-LD, llm.txt и чеклист публикации."
author: veilosophy
date: 2026-06-16
updated: 2026-06-16
tags: "seo, индексация, sitemap, robots, open graph, json-ld, llm.txt"
keywords: "Hub SEO, Astro SEO, sitemap, robots.txt, Open Graph, JSON-LD, llm.txt"
icon: search
lang: ru
robots: "index, follow"
priority: 3
---

# SEO и индексация Hub V3.5

Hub V3.5 уже содержит базовый SEO-слой в `Layout.astro`: title, description, keywords, canonical, robots, Open Graph, Twitter Cards, sitemap discovery и JSON-LD для сайта/статей. Задача автора — правильно заполнить frontmatter и не ломать slug.

---

## Что генерируется автоматически

| Механизм | Где создаётся | Что даёт |
|---|---|---|
| `<title>` | `Layout.astro` | Заголовок вкладки и поисковой выдачи. |
| `meta description` | `Layout.astro` | Сниппет страницы. |
| Canonical | `Layout.astro` | Основной URL страницы. |
| Open Graph | `Layout.astro` | Превью в соцсетях и мессенджерах. |
| Twitter Cards | `Layout.astro` | Превью в X/Twitter-совместимых клиентах. |
| JSON-LD WebSite | Главная страница | Структурированные данные сайта. |
| JSON-LD Article | Статьи | Даты, автор, описание, image. |
| `sitemap.xml` | `npm run generate` | Карта сайта для поисковиков. |
| `robots.txt` | `public/robots.txt` | Правила индексации для ботов. |
| `llm.txt` | `npm run generate` | Удобный индекс контента для LLM/AI. |

---

## SEO frontmatter для статьи

```yaml
---
title: "CVSS: как правильно оценивать критичность уязвимостей"
description: "Подробное руководство по CVSS: метрики, векторы, примеры оценки и типичные ошибки."
author: opensophy
date: 2026-06-16
updated: 2026-06-16
tags: "cvss, vulnerability management, security"
keywords: "CVSS, оценка уязвимостей, кибербезопасность, vulnerability scoring"
icon: siren
image: "/assets/cvss-guide.png"
lang: ru
robots: "index, follow"
priority: 20
---
```

### Минимум для качественной страницы

- `title` до 60–70 символов;
- `description` до 150–170 символов;
- стабильный slug в `{}`;
- `date` и `updated` в формате `YYYY-MM-DD`;
- `robots: "index, follow"` для публичных страниц;
- уникальный `keywords` без спама;
- `image` 1200×630 для важных страниц.

---

## Robots: когда что ставить

| Значение | Когда использовать |
|---|---|
| `index, follow` | Публичные статьи, документация, landing pages. |
| `noindex, follow` | Служебные страницы, черновики, страницы без ценности для выдачи. |
| `noindex, nofollow` | 404, технические страницы, закрытые материалы. |

Не ставьте `noindex` на страницы, которые должны попадать в поиск.

---

## Sitemap

`sitemap.xml` обновляется командой:

```bash
npm run generate
```

Он должен включать все публичные Markdown-документы, категории и custom pages. После добавления контента всегда запускайте генерацию и проверяйте `public/sitemap.xml`.

---

## Canonical и slug

Canonical строится из `SITE.url` в `Layout.astro` и текущего slug. Поэтому важно:

- не менять slug без необходимости;
- не создавать дубли страниц с одинаковым смыслом;
- использовать один формат URL со слешем на конце;
- проверять custom pages на конфликт с Markdown-документами.

---

## Open Graph image

Если `image` не указан, используется глобальный fallback `/og-image.png`. Для важных статей лучше добавлять индивидуальную картинку:

```yaml
image: "/assets/article-cover.png"
```

Рекомендации:

- размер 1200×630;
- понятный визуальный заголовок;
- путь от корня сайта (`/assets/...`);
- небольшой вес файла.

---

## SEO для категорий

Категории V3.5 создаются автоматически из `[C]` папок и получают описание вида:

```txt
Статьи в категории «Название категории»
```

Чтобы категория была полезной:

- давайте категории понятное название;
- используйте точный slug;
- не смешивайте разные темы;
- добавляйте качественные `description` и `tags` в дочерние статьи.

---

## SEO для custom pages

У custom page есть `metadata.ts`:

```ts
import type { CustomPageMetadata } from '../types';

const metadata: CustomPageMetadata = {
  title: 'General',
  description: 'Главная страница Opensophy.',
  keywords: 'opensophy, open source, security, development',
  robots: 'index, follow',
  lang: 'ru',
  type: 'website',
  image: '/assets/cover.png',
};

export default metadata;
```

Если custom page подключена через Markdown frontmatter `custom`, SEO лучше держать в Markdown-файле, потому что именно он создаёт маршрут документа.

---

## `robots.txt` и `llm.txt`

- `public/robots.txt` должен указывать правила индексации и sitemap.
- `public/llm.txt` обновляется генератором и помогает AI/LLM быстро понять структуру контента.

После крупных изменений контента запускайте:

```bash
npm run generate
```

---

## Чеклист SEO перед релизом

:::steps
:::step[status=done] Метаданные
У всех важных страниц есть `title`, `description`, `date`, `updated`, `lang`, `robots`.
:::
:::step[status=done] URL
Slug задан явно, стабилен и не конфликтует с другими страницами.
:::
:::step[status=done] Sitemap
`npm run generate` обновил `public/sitemap.xml`.
:::
:::step[status=done] OG
Для главных страниц есть `image` или корректный fallback `/og-image.png`.
:::
:::step[status=done] Индексация
Нет случайных `noindex` на публичных страницах.
:::
:::step[status=done] Контент
На странице есть один `h1`, логичная структура `h2/h3`, внутренние ссылки и понятное вступление.
:::
:::

---

## Быстрый аудит после деплоя

```bash
curl -I https://example.com/sitemap.xml
curl https://example.com/robots.txt
curl https://example.com/llm.txt
```

Также проверьте:

- title и description в исходном HTML;
- canonical;
- OG preview в мессенджере;
- отсутствие 404 на новых URL;
- Lighthouse SEO-раздел.
