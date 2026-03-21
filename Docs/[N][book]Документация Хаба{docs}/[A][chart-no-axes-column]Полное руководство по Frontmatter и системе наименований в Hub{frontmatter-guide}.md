---
title: Полное руководство по Frontmatter и системе наименований в Hub
description: "Справочник по всем доступным полям frontmatter, новой системе [N]/[C]/[A] для именования папок и файлов, с примерами и рекомендациями."
author: veilosophy
date: 2026-03-07
tags: "frontmatter, документация, markdown, руководство, наименование"
icon: chart-no-axes-column
lang: ru
robots: "index, follow"
---

# Система наименований папок и файлов

Hub использует специальный синтаксис для именования папок и файлов в директории `Docs/`. Благодаря префиксам `[N]`, `[C]`, `[A]` сразу понятно что создаётся — nav popover, категория или статья.


## Синтаксис

```
[ТИП][иконка]Название{slug}
```

| Часть | Обязательно | Описание |
|-------|-------------|----------|
| `[ТИП]` | ✅ | `N`, `C` или `A` — тип элемента |
| `[иконка]` | ❌ | Иконка из [Lucide Icons](https://lucide.dev/icons) |
| `Название` | ✅ | Отображаемое имя в интерфейсе |
| `{slug}` | ❌ | URL-slug. Если не указан — генерируется автоматически |

- исключение: welcome.md - это самая главная страница и ее желательно писать через frontmatter.

---

## Типы элементов

### `[N]` — Nav Popover

Верхнеуровневая папка. Создаёт **переключатель разделов** в сайдбаре.

```
[N][brain]Статьи opensophy{article}
```

- Иконка `brain` отображается в переключателе
- Название `Статьи opensophy` — подпись раздела
- Slug `article` — префикс всех URL внутри: `article/...`

---

### `[C]` — Категория

Папка внутри Nav Popover. Создаёт **сворачиваемую группу** в сайдбаре.

```
[C][signal]Инструменты и Сервисы{tools-and-services}
```

- Иконка `signal` отображается рядом с названием группы
- Название `Инструменты и Сервисы` — заголовок группы
- Slug `tools-and-services` — часть URL: `article/tools-and-services/...`

---

### `[A]` — Статья (файл)

MD-файл. Задаёт **slug и иконку** для конкретной статьи.

```
[A][shield]Введение в DevSecOps{devsecops-intro}.md
```

- Иконка `shield` отображается рядом с названием в сайдбаре
- Название `Введение в DevSecOps` — используется как title если не задан в frontmatter
- Slug `devsecops-intro` — итоговый URL: `article/tools-and-services/devsecops-intro`

---

## Полный пример структуры

```
Docs/
├── welcome.md
├── [N][brain]Статьи opensophy{article}/
│   ├── [C][signal]Инструменты и Сервисы{tools-and-services}/
│   │   ├── [A][shield]Введение в DevSecOps{devsecops-intro}.md
│   │   └── [A][wrench]Обзор инструментов SAST{sast-overview}.md
│   └── [C][book-open]Руководства{guides}/
│       └── [A][file-code]Быстрый старт{quickstart}.md
└── [N][newspaper]Новости{news}/
    └── [A][zap]Релиз Hub 3.0{release-3}.md
```

Результирующие URL:

```
/article/tools-and-services/devsecops-intro
/article/tools-and-services/sast-overview
/article/guides/quickstart
/news/release-3
```

---

## Правила и рекомендации

- Slug пишется **только латиницей** с дефисами: `my-article`, `tools-and-services`
- Если `{slug}` не указан — генерируется из названия через транслитерацию кириллицы
- Вложенность: только `[N]` → `[C]` → `[A].md`. Nav Popover внутри Nav Popover не работает
- `[иконка]` и `{slug}` можно опускать:
  - `[C]Руководства` — категория без иконки, slug = `rukovodstva`
  - `[A]Моя статья` — статья без иконки, slug = `moya-statya`
- Полный список иконок: [lucide.dev/icons](https://lucide.dev/icons)

---

# Frontmatter

Frontmatter — блок метаданных в начале `.md` файла, обёрнутый в `---`.

```yaml
---
title: "Название статьи"
description: Краткое описание.
---
```

## Обязательные поля

### `title`

**Тип:** `string`

Заголовок статьи. Отображается в шапке, поиске, SEO-метатегах и вкладке браузера.

> Если не указан — берётся из имени файла `[A]Название{slug}.md`

```yaml
title: "Введение в DevSecOps"
```

---

### `description`

**Тип:** `string`

Краткое описание (1–2 предложения). Используется в поиске, карточках документов и метатеге `<meta name="description">`.

```yaml
description: Обзор основных инструментов DevSecOps и их применения в CI/CD.
```

---

## Необязательные поля

### `author`

**Тип:** `string`

Имя автора. Отображается в шапке статьи. Несколько авторов — через запятую.

```yaml
author: veilosophy
# или
author: veilosophy, opensophy
```

---

### `date`

**Тип:** `string` | Формат: `YYYY-MM-DD`

Дата публикации. Используется для сортировки, отображения в шапке и генерации `sitemap.xml`.

```yaml
date: 2026-03-07
```

---

### `updated`

**Тип:** `string` | Формат: `YYYY-MM-DD`

Дата последнего обновления. Если указана — отображается как «Обновлено: {дата}».

```yaml
updated: 2026-04-01
```

---

### `tags`

**Тип:** `string` (список через запятую)

Теги для поиска и фильтрации.

```yaml
tags: безопасность, DevSecOps, инструменты, CI/CD
```

---

### `icon`

**Тип:** `string`

Иконка из [Lucide Icons](https://lucide.dev/icons). Отображается рядом с названием в сайдбаре.

> Приоритет: frontmatter `icon` > иконка из имени файла `[A][icon]...`

```yaml
icon: shield
```

Популярные иконки:

| Иконка | Применение |
|--------|-----------|
| `book` | Документация |
| `file-code` | Техническая статья |
| `shield` | Безопасность |
| `rocket` | Новые функции |
| `lightbulb` | Советы и идеи |
| `wrench` | Инструменты |
| `zap` | Новости / быстрое |
| `crown` | Важное |
| `newspaper` | Статьи / новости |
| `brain` | Исследования |
| `signal` | Сервисы |

---

### `typename`

**Тип:** `string`

Переопределяет название категории из папки `[C]`. Отображается в бейдже над заголовком и в breadcrumbs.

> Обычно не нужен — берётся автоматически из `[C]Название`.

```yaml
typename: Инструменты безопасности
```

---

### `keywords`

**Тип:** `string` (список через запятую)

SEO-ключевые слова для метатега `<meta name="keywords">`.

```yaml
keywords: DevSecOps инструменты, SAST DAST, безопасность CI/CD
```

---

### `robots`

**Тип:** `string`

Инструкции для поисковых роботов.

| Значение | Описание |
|----------|----------|
| `index, follow` | Индексировать и переходить по ссылкам (по умолчанию) |
| `noindex, follow` | Не индексировать, но переходить |
| `index, nofollow` | Индексировать, не переходить |
| `noindex, nofollow` | Не индексировать и не переходить |

```yaml
robots: index, follow
```

---

### `lang`

**Тип:** `string` (ISO 639-1)

Язык документа. Влияет на `<html lang="">` и индексацию.

```yaml
lang: ru
# или
lang: en
```

---

### `canonical`

**Тип:** `string` (URL) или `null`

Каноническая ссылка на оригинал если контент продублирован на нескольких URL.

```yaml
canonical: https://hub.opensophy.com/article/original
# или если дублей нет:
canonical: null
```

---

# Что больше не нужно в frontmatter

С новой системой `[N]`/`[C]`/`[A]` следующие поля **определяются автоматически из структуры папок** и в frontmatter не нужны:

| Поле | Откуда берётся теперь |
|------|-----------------------|
| `type` | Slug nav popover `[N]..{slug}` становится префиксом URL |
| `typename` | Название папки `[C]Название` |
| `category` | Структура папок и есть категория |
| `icon` (опционально) | Из имени файла `[A][icon]...` |

---

# Шаблоны frontmatter

## Минимальный

```yaml
---
title: "Название статьи"
description: Краткое описание содержимого.
---
```

## Стандартный

```yaml
---
title: "Название статьи"
description: Краткое описание содержимого.
author: veilosophy
date: 2026-03-07
tags: тег1, тег2, тег3
robots: index, follow
lang: ru
---
```

## Полный

```yaml
---
title: "Название статьи"
description: Краткое описание содержимого.
author: veilosophy
date: 2026-03-07
updated: 2026-04-01
tags: тег1, тег2, тег3
icon: shield
typename: Переопределённая категория
keywords: ключевое слово 1, ключевое слово 2
canonical: null
robots: index, follow
lang: ru
---
```

## Для welcome.md

```yaml
---
title: "Добро пожаловать в Hub"
description: Hub проекта Opensophy — центр знаний по ИИ и кибербезопасности.
author: ""
date: 2026-03-07
tags: welcome, hub, opensophy
keywords: Opensophy, Hub, документация
canonical: null
robots: index, follow
lang: ru
---
```

---

# Примеры именования

## Простая статья без категории

```
Docs/[N][file-text]База знаний{kb}/
    [A]Глоссарий{glossary}.md
```

URL: `/kb/glossary`

---

## Статья с иконкой в имени файла

```
Docs/[N][brain]Исследования{research}/
    [C][flask-conical]Эксперименты{experiments}/
        [A][microscope]Анализ данных{data-analysis}.md
```

URL: `/research/experiments/data-analysis`  
Иконка статьи в сайдбаре: `microscope`

---

## Без nav popover (прямой URL)

```
Docs/
    [A]Политика конфиденциальности{privacy}.md
```

URL: `/privacy`

---

## Несколько nav popover разделов

```
Docs/
├── welcome.md
├── [N][book]Документация{docs}/
│   └── [C][settings]Настройка{setup}/
│       └── [A]Установка{install}.md
└── [N][newspaper]Блог{blog}/
    └── [A]Первый пост{first-post}.md
```

В сайдбаре появится переключатель между разделами «Документация» и «Блог».