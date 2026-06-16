---
title: Полное руководство по Frontmatter и системе наименований в Hub V3.5
description: "Актуальный справочник V3.5 по frontmatter, slug-системе [N]/[C]/[A], категориям, custom-страницам, SEO-полям, приоритетам и генерации manifest/sitemap."
author: veilosophy
date: 2026-03-07
updated: 2026-06-16
tags: "frontmatter, документация, markdown, руководство, наименование, seo, custom pages, v3.5"
keywords: "Hub frontmatter, Opensophy Hub, markdown документация, SEO поля, custom pages, sitemap, manifest"
icon: chart-no-axes-column
lang: ru
robots: "index, follow"
priority: 1
---

# Frontmatter и имена файлов в Hub V3.5

В V3.5 структура `Docs/` стала главным источником правды для навигации, URL, поиска, sitemap, карточек категорий и SEO. Документ можно описать двумя слоями:

1. **Имя папки/файла** — задаёт тип элемента, иконку, человекочитаемое имя и slug.
2. **Frontmatter** — уточняет SEO, описание, даты, сортировку, теги и поведение страницы.

```txt
Docs/
├── welcome.md
├── resume.md
└── [N][book-open]Документация Hub{hub}/
    ├── [A][boxes]Hub{general}.md
    ├── [A][rocket]Быстрый старт{quickstart}.md
    └── [C][folder-code]Раздел{section}/
        └── [A][file-text]Статья{article}.md
```

---

## Система имён `[N]`, `[C]`, `[A]`

```txt
[ТИП][lucide-icon]Название{slug}
```

| Часть | Обязательно | Пример | Зачем нужна |
|---|---:|---|---|
| `[ТИП]` | ✅ | `[N]`, `[C]`, `[A]` | Определяет роль элемента. |
| `[lucide-icon]` | Нет | `[book-open]` | Иконка из Lucide Icons. |
| `Название` | ✅ | `Документация Hub` | Текст в навигации, breadcrumbs и fallback title. |
| `{slug}` | Желательно | `{hub}` | Стабильная URL-часть. |

### `[N]` — верхний nav-раздел

Папка первого уровня. Создаёт верхнеуровневый раздел навигации.

```txt
[N][brain]Статьи opensophy{article}/
```

URL всех вложенных документов начнётся с `/article/...`.

### `[C]` — категория

Папка внутри nav-раздела. В V3.5 категория создаёт не только группу в сайдбаре, но и отдельную **страницу категории** со списком вложенных документов.

```txt
[C][shield]Кибербезопасность{security}/
```

Итоговая страница категории: `/article/security/`.

### `[A]` — статья

Markdown-файл. Создаёт страницу документа.

```txt
[A][siren]CVSS: как правильно оценивать критичность уязвимостей{cvss-guide}.md
```

Итоговый URL: `/article/security/cvss-guide/`.

### `welcome.md` и одиночные файлы в корне `Docs/`

- `Docs/welcome.md` — контент главной страницы, когда `useLanding: false`, или SEO/контентный fallback для `/`.
- Файлы в корне без папок получают URL из имени файла: `Docs/resume.md` → `/resume/`.
- Если у Markdown-документа указан `custom`, контент файла используется как метаданные/маршрут, а тело страницы рендерит React-страница из `src/custom/`.

---

## Как строится URL

```txt
Docs/[N][component]UI Библиотека{ui}/[C][maximize]Фон{background}/[A][stars]Аурора{aurora}.md
```

Результат:

```txt
/ui/background/aurora/
```

Правила:

- slug лучше всегда задавать явно в `{}`;
- используйте латиницу, цифры и дефисы: `quickstart`, `seo-guide`, `tools-and-services`;
- не меняйте slug после публикации без редиректа, иначе сломаются ссылки и SEO;
- избегайте дублей: при конфликте генератор пропустит повторный slug и выведет warning.

---

## Frontmatter: полный справочник V3.5

Frontmatter находится в начале `.md` файла между `---`.

```yaml
---
title: "Название страницы"
description: "Краткое описание для карточек, поиска и SEO."
date: 2026-06-16
---
```

### Основные поля

| Поле | Тип | Обязательно | Где используется |
|---|---|---:|---|
| `title` | string | Желательно | Заголовок страницы, `<title>`, OG/Twitter title, карточки, поиск. |
| `description` | string | Желательно | Hero, карточки категорий, поиск, meta description, OG/Twitter description. |
| `author` | string | Нет | Шапка статьи, meta author, JSON-LD Article author. |
| `date` | `YYYY-MM-DD` | Нет | Дата публикации, sitemap, article published_time, JSON-LD. |
| `updated` | `YYYY-MM-DD` | Нет | Дата обновления, article modified_time, JSON-LD dateModified. |
| `tags` | string через запятую | Нет | Поиск, карточки, тематическая группировка. |
| `icon` | string | Нет | Иконка документа; имеет приоритет над иконкой из имени файла. |
| `typename` | string | Нет | Тип/бейдж документа; по умолчанию берётся последняя категория. |
| `priority` | number | Нет | Сортировка в навигации/manifest: меньше — выше. По умолчанию `999`. |

### SEO-поля

| Поле | Тип | По умолчанию | Назначение |
|---|---|---|---|
| `keywords` | string | глобальные keywords layout или пусто | `<meta name="keywords">`. |
| `robots` | string | `index, follow` | Управляет индексацией: `index, follow`, `noindex, follow`, `noindex, nofollow`. |
| `lang` | string | `ru` | Атрибут `<html lang>`, JSON-LD `inLanguage`. |
| `image` | string | `/og-image.png` из Layout | OG/Twitter image и JSON-LD image. |

### Поведенческие поля

| Поле | Тип | Что делает |
|---|---|---|
| `custom` | string | Подключает React-страницу из `src/custom/<name>{slug}/` вместо обычного Markdown-рендера. |

Пример Markdown-страницы, которая использует кастомный React-рендер:

```yaml
---
title: "Resume"
description: "Интерактивное резюме."
custom: resume
robots: "index, follow"
priority: 10
---
```

Если существует `src/custom/resume{resume}/Page.tsx`, маршрут `/resume/` будет создан из Markdown-файла, но тело страницы отрендерит React-компонент.

---

## Рекомендуемый шаблон статьи

```yaml
---
title: "Понятное название страницы"
description: "Одно-два предложения: что пользователь получит на странице."
author: veilosophy
date: 2026-06-16
updated: 2026-06-16
tags: "hub, документация, quickstart"
keywords: "Hub, Opensophy, документация, Astro, React"
icon: rocket
lang: ru
robots: "index, follow"
priority: 20 // на ваш выбор как он должен распологаться в навигации
---
```

---

## Как генерация использует frontmatter

`npm run generate` запускает сборку данных:

1. сканирует все `.md` в `Docs/`;
2. парсит frontmatter;
3. строит slug из `[N]`, `[C]`, `[A]` и `{slug}`;
4. генерирует `public/data/docs/manifest.json` для навигации и поиска;
5. генерирует `public/sitemap.xml`;
6. обновляет `public/llm.txt` для LLM/AI-потребителей.

Динамический маршрут `src/app/pages/[...slug].astro` умеет отдавать три типа страниц:

- обычный Markdown-документ;
- страницу категории;
- кастомную React-страницу.

---

## Best practices

:::cards[cols=2]

:::card
[title]Для SEO
[icon]search
Всегда заполняйте `title`, `description`, `date`, `updated`, `robots`, `lang`, `keywords` и при необходимости `image`.
:::

:::card
[title]Для навигации
[icon]list-tree
Используйте `priority` на страницах и явные `{slug}` для стабильных URL.
:::

:::card
[title]Для категорий
[icon]folder-open
Не кладите слишком много документов в одну категорию: в V3.5 у категорий есть отдельные карточные страницы.
:::

:::card
[title]Для custom pages
[icon]blocks
Используйте `custom`, когда нужен полноценный React-экран, но маршрут и SEO удобнее держать в `Docs/`.
:::

:::

---

## Частые ошибки

| Ошибка | Как исправить |
|---|---|
| Русский slug без `{}` | Задайте явный латинский slug: `{quickstart}`. |
| Дубликат slug | Проверьте путь и `custom`-страницы; slug должен быть уникален. |
| Нет описания | Добавьте `description`, иначе будет взят первый абзац. |
| Страница не появилась | Запустите `npm run generate` и проверьте имя файла. |
| `custom` не работает | Убедитесь, что есть `src/custom/<folder>{slug}/Page.tsx` или `Page.jsx`. |
