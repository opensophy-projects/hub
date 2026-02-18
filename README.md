# Hub — Open-source платформа для документации и контента

<img width="981" height="363" alt="banner" src="https://github.com/user-attachments/assets/d56ddb4b-0554-4f5d-9c5f-eee5b7d8986a" />

<div align="center">

**Статическая платформа для создания документации, блога и новостей на основе Markdown-файлов а также UI Библиотек!**

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=opensophy-projects_hub&metric=alert_status)](https://sonarcloud.io/project/overview?id=opensophy-projects_hub)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=opensophy-projects_hub&metric=security_rating)](https://sonarcloud.io/project/overview?id=opensophy-projects_hub)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=opensophy-projects_hub&metric=vulnerabilities)](https://sonarcloud.io/project/overview?id=opensophy-projects_hub)
[![CodeFactor](https://www.codefactor.io/repository/github/opensophy-projects/hub/badge)](https://www.codefactor.io/repository/github/opensophy-projects/hub)
[![License](https://img.shields.io/badge/code-Apache%202.0-blue)](./LICENSE)
[![License: CC BY-ND 4.0](https://img.shields.io/badge/docs-CC%20BY--ND%204.0-lightgrey)](./LICENSE-DOCS)
[![Version](https://img.shields.io/badge/version-3.1.0-purple)](./package.json)

[Демо](https://hub.opensophy.com) · [Документация](https://hub.opensophy.com/docs/markdown-guide) · [Opensophy](https://opensophy.com)

</div>

---

<div align="center">

## Почему Hub?

</div>

<div align="center">

|  |  |  |  |
|:---:|:---:|:---:|:---:|
| **📝 Расширенный Markdown** | **🧩 UI Component System** | **🔍 Умный поиск** | **⚡ Быстрый старт** |
| Алерты `:::note` `:::tip` `:::warning`, аккордеоны, таблицы с сортировкой и фильтрами, подсветка синтаксиса — всё из коробки | Встраивайте интерактивные React-компоненты прямо в Markdown через `[uic:component-name]` с живым preview и настройкой пропсов | Полнотекстовый поиск по заголовку, описанию, тегам и авторам. Фильтры по категориям, сортировка по дате | Добавьте `.md` файл в `Docs/` — страница появится автоматически. Никакой настройки роутинга |
| **🎨 Modern UI/UX** | **📱 Mobile-first** | **🔒 Безопасность** | **🪶 Лёгкость** |
| Тёмная и светлая тема, кастомные шрифты, Framer Motion анимации, прогресс-бар чтения, TOC на десктопе и в мобильном bottom sheet | Адаптивная навигация: sidebar на десктопе, bottom navigation bar на мобильных устройствах | SonarCloud + CodeFactor + XSS-санитизация через DOMPurify. Статический сайт без серверного кода | Сборка за 5 секунд. Файлы чанков от 0.1 до 205 кБ. Lazy-loading поиска и модальных окон |

</div>

---

## 📚 Документация

| Ресурс | Описание |
|---|---|
| [📝 Полное руководство по Markdown](https://hub.opensophy.com/docs/markdown-guide/) | Все возможности форматирования: алерты, таблицы, блоки кода, аккордеоны и UI-компоненты |
| [🧩 Добавление UI компонентов](https://hub.opensophy.com/docs/component-guide/) | Как создать и зарегистрировать новый интерактивный компонент |
| [🌐 Opensophy](https://opensophy.com/) | Главный сайт проекта |

---

## 🎨 Технологии

**Core:** [Astro 5](https://astro.build) · [React 18](https://react.dev) · [TypeScript](https://www.typescriptlang.org)

**Стилизация:** [Tailwind CSS](https://tailwindcss.com) · [Framer Motion](https://www.framer.com/motion)

**Контент:** [Marked](https://marked.js.org) · [highlight.js](https://highlightjs.org) · [isomorphic-dompurify](https://github.com/cure53/DOMPurify)

**UI:** [Lucide React](https://lucide.dev) · Custom Registry System · tailwind-merge

---

## 🚀 Deploy

<table>
<tr>
<td width="50%">

### ⚡ Открыть в Bolt

Запустите проект прямо в браузере — без установки Node.js и клонирования репозитория.

[![Open in Bolt](https://img.shields.io/badge/Open%20in-Bolt.new-7C3AED?style=for-the-badge&logo=lightning&logoColor=white)](https://bolt.new/~/github-zekqzpyk)

</td>
<td width="50%">

### 💻 Локальный запуск

```bash
git clone https://github.com/opensophy-projects/hub.git
cd hub
npm install
npm run dev
```

Проект запустится на `http://localhost:4321`

</td>
</tr>
</table>

### Команды

```bash
npm run dev              # Dev-сервер
npm run build            # Production-сборка
npm run preview          # Preview production
npm run generate:docs    # Генерация JSON из Docs/
npm run generate:sitemap # Генерация sitemap.xml
npm run generate         # Оба скрипта разом
```

---

## 📖 Создание контента

Создайте `.md` файл в директории `Docs/` с frontmatter:

```markdown
---
title: "Заголовок статьи"
description: "Краткое описание"
type: docs          # docs | blog | news (и прочие)
typename: Категория # отображаемая категория в сайдбаре
author: veilosophy
date: 2026-02-18
tags: тег1, тег2
keywords: ключевое слово для поиска
robots: index, follow
lang: ru
---

# Содержимое статьи
```

Затем выполните `npm run generate:docs` — страница появится автоматически.

> Главная страница (`/`) управляется через файл `Docs/welcome.md`

---

## 🎯 Структура проекта

```
hub/
├── Docs/                     # Markdown-источники контента
├── public/
│   ├── data/docs/            # Сгенерированные JSON (manifest + статьи)
│   └── sitemap.xml
├── scripts/
│   ├── generateDocs.mjs      # Markdown → JSON
│   └── generateSitemap.mjs   # sitemap.xml
└── src/
    ├── app/                  # Astro-страницы и layout
    ├── features/
    │   ├── docs/             # Рендер документов, TOC, scroll progress
    │   ├── navigation/       # Sidebar, MobileNavbar, Search, TocPanel
    │   ├── table/            # Интерактивные таблицы с фильтрами
    │   └── ui-components/    # Registry, Viewer, ComponentWrapper
    └── shared/
        ├── components/       # CodeBlock, Alert, Accordion, NotFound
        ├── contexts/         # ThemeContext (cross-island CustomEvent)
        ├── hooks/            # useDebounce
        └── lib/              # htmlParser, classUtils
```

---

## 🔒 Безопасность

Проект проходит комплексную проверку:

- **[SonarCloud](https://sonarcloud.io/project/overview?id=opensophy-projects_hub)** — качество кода, уязвимости, технический долг
- **[CodeFactor](https://www.codefactor.io/repository/github/opensophy-projects/hub)** — статический анализ
- **[HostedScan](https://hostedscan.com)** — OWASP Top 10, SSL/TLS
- **DOMPurify** — XSS-санитизация всего пользовательского HTML

---

## 🤝 Благодарности

- **[Claude Code](https://claude.ai/code)** — AI-ассистент разработки от Anthropic
- **[@4erfox](https://github.com/4erfox)** — за примеры и критику

---

## 📄 Лицензии

### Исходный код

Код проекта Hub лицензирован под **Apache License 2.0**

- ✅ Коммерческое использование
- ✅ Модификация
- ✅ Распространение
- ✅ Патентное использование
- ⚠️ Требуется указание авторства
- ⚠️ Требуется указание изменений

Подробнее: [LICENSE](./LICENSE)

### Документация и контент

Все материалы в директории `Docs/`, опубликованные от авторов **veilosophy / opensophy** (ветка `main`), лицензированы под **Creative Commons Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)**

- ✅ Копирование и распространение
- ✅ Коммерческое использование
- ⚠️ Требуется указание авторства (veilosophy / opensophy)
- ❌ Запрещены производные работы

Подробнее: [LICENSE-DOCS](./LICENSE-DOCS)

---

## 🔗 Ссылки

[Демо](https://hub.opensophy.com) · [Opensophy](https://opensophy.com) · [SonarCloud](https://sonarcloud.io/project/overview?id=opensophy-projects_hub) · [GitHub](https://github.com/opensophy-projects/hub)

**Email:** opensophy@gmail.com

---

<div align="center">

Если Hub оказался полезным — ⭐ поставьте звезду на GitHub

</div>
