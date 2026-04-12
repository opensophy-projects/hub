<div align="center">

<img width="1536" height="1024" alt="banner" src="https://github.com/user-attachments/assets/0abdee80-dc2c-4cd5-a710-6a4b744e0166" />

# Opensophy Hub

Современная SSG+SPA платформа для публикации технических знаний — с мощными Markdown-блоками, интерактивными таблицами и live UI-компонентами. Open-source. 
[![License](https://img.shields.io/badge/code-Apache%202.0-blue)](./LICENSE)
[![License: CC BY-ND 4.0](https://img.shields.io/badge/docs-CC%20BY--ND%204.0-lightgrey)](./LICENSE-DOCS)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro%206-FF5D01?style=flat-square&logo=astro)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Bundle](https://img.shields.io/badge/bundle-~460KB%20gzip-brightgreen?style=flat-square)](#)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-hub.opensophy.com-8B5CF6?style=flat-square)](https://opensophy.com)
[![CodeFactor](https://www.codefactor.io/repository/github/opensophy-projects/hub/badge)](https://www.codefactor.io/repository/github/opensophy-projects/hub)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=opensophy-projects_hub&metric=alert_status)](https://sonarcloud.io/project/overview?id=opensophy-projects_hub)

[**Демо →**](https://hub.opensophy.com) · [**Markdown →**](https://hub.opensophy.com/docs/markdown-guide/) · [**Frontmatter →**](https://hub.opensophy.com/docs/frontmatter-guide/) · [**Компоненты →**](https://hub.opensophy.com/docs/component-guide/)

</div>

---

## Что это

**Opensophy Hub** — это платформа для публикации структурированного контента: документации, статей, гайдов, новостей. Построена на Astro 6 + React + TypeScript, работает как гибридное SSG+SPA приложение.

---

## Killer Features

### 🔥 Таблицы на стероидах

Стандартная Markdown-таблица превращается в интерактивный компонент:

- **Мультиселект-фильтры** по любому столбцу
- **Поиск с подсветкой** совпадений
- **Скрытие колонок** на лету
- **Fullscreen-режим** для широких таблиц
- **Drag-to-scroll** для горизонтальной прокрутки
- **Копирование** в Markdown или Excel одним кликом
- **HTML в ячейках** — бейджи, ссылки, иконки

Всё это из обычного `| col | col |` синтаксиса.

### 🔥 Markdown Blocks — богатый контент без MDX

[Поддерживаемые блоки](https://opensophy.com/docs/markdown-guide/)

### 🔥 Live UI Component Playground

Каждый UI-компонент платформы доступен в интерактивном playground прямо в документации. Меняй `scale`, `rotation`, `blur`, `gradient`, скорость анимации — и видишь результат в реальном времени.

### 🔥 CMS-like панель редактирования

Встроенный редактор с live preview — правишь Markdown и сразу видишь результат. Создание страниц, секций и категорий прямо из UI. Никакого деплоя ради одной правки.

---

## Возможности

<details>
<summary><strong>Форматирование</strong></summary>

| Возможность | Статус |
|---|---|
| Заголовки H1–H6 | ✅ |
| Жирный, курсив, зачёркнутый | ✅ |
| Подчёркнутый, выделенный текст | ✅ |
| Подстрочный / надстрочный | ✅ |
| Встроенный код | ✅ |
| Маркированные и нумерованные списки | ✅ |
| Списки задач (checkbox) | ✅ |
| Цитаты | ✅ |
| Горизонтальный разделитель | ✅ |

</details>

<details>
<summary><strong>Блоки кода</strong></summary>

| Возможность | Статус |
|---|---|
| Подсветка синтаксиса | ✅ |
| Копирование содержимого | ✅ |
| Fullscreen-режим | ✅ |
| Поиск внутри блока | ✅ |

</details>

<details>
<summary><strong>Таблицы</strong></summary>

| Возможность | Статус |
|---|---|
| Фильтры (мультиселект) | ✅ 🔥 |
| Поиск с подсветкой | ✅ |
| Скрытие колонок | ✅ |
| Fullscreen-режим | ✅ |
| Drag-to-scroll | ✅ |
| Копирование в Markdown / Excel | ✅ 🔥 |
| HTML в ячейках | ✅ |
| Выравнивание колонок | ✅ |

</details>

<details>
<summary><strong>Блоки уведомлений</strong></summary>

`note` · `tip` · `important` · `warning` · `caution`

</details>

<details>
<summary><strong>Графики (из Markdown)</strong></summary>

| Тип | Статус |
|---|---|
| Area / Area Stacked | ✅ |
| Bar / Bar Stacked / Bar Horizontal | ✅ |
| Pie / Pie Donut | ✅ |
| Radar | ✅ |
| Управление видимостью серий | ✅ |
| Mermaid / диаграммы | ❌ |

</details>

<details>
<summary><strong>KaTeX — математические формулы</strong></summary>

Инлайн (`$...$`) и блочный (`$$...$$`) вариант.

</details>

<details>
<summary><strong>Платформа</strong></summary>

| Возможность | Статус |
|---|---|
| Тёмная / светлая тема | ✅ |
| Mobile-first навигация (bottom bar) | ✅ |
| Автоматический сайдбар из файловой структуры | ✅ |
| Breadcrumbs | ✅ |
| TOC (оглавление) на странице | ✅ |
| Прогресс-бар чтения | ✅ |
| Lightbox для изображений | ✅ |
| Поиск по проекту | ✅ |
| Версионирование документов | ✅ |
| i18n / мультиязычность | ✅ |
| Sitemap автогенерация | ✅ |
| SEO + GEO (AI-поисковики) настройки | ✅ |
| CMS-like панель редактирования | ✅ 🔥 |
| Live preview при редактировании | ✅ |
| UI playground | ✅ 🔥 |
| OpenAPI / API docs | ❌ |
| AI-поиск | ❌ |

</details>

<details>
<summary><strong>Корпоративный функционал</strong></summary>

| Возможность | Статус |
|---|---|
| Приватные страницы / авторизация | ❌ |
| Роли и права доступа | ❌ |
| Совместное редактирование | ❌ |
| Комментарии к страницам | ❌ |
| История изменений / Git blame UI | ❌ |
| Встроенная аналитика | ❌ |
| SSO / SAML | ❌ |
| Аудит-лог | ❌ |
| SLA / поддержка | ❌ |

> Opensophy Hub — инструмент для индивидуальных авторов и небольших команд, а не enterprise-платформа.

</details>

---

## 🚀 Deploy

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/github-tejvnjhm-xmbdzn3v)

деплой на любой хостинг: Vercel, Netlify, Cloudflare Pages, GitHub Pages, VPS.

---

<div align="center">

[opensophy.com](https://opensophy.com) · [GitHub](https://github.com/opensophy-projects/hub)

</div>
