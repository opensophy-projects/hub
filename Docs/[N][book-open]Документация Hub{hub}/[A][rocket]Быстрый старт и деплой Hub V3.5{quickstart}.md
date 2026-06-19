---
title: "Быстрый старт и деплой Hub V3.5"
description: "Как запустить Hub локально, добавить контент, собрать production build и задеплоить проект на GitHub Pages, Vercel, Netlify/Cloudflare Pages, Bolt.new и статический хостинг."
author: veilosophy
date: 2026-06-16
updated: 2026-06-16
tags: "quickstart, deploy, github pages, vercel, bolt.new, astro, hub"
keywords: "Hub quickstart, Astro deploy, GitHub Pages, Vercel, Bolt.new, Opensophy Hub"
icon: rocket
lang: ru
robots: "index, follow"
priority: 2
---

# Быстрый старт Hub V3.5

Hub — статический Astro-проект с React-островами. Контент хранится в `Docs/`, данные для навигации генерируются в `public/data/docs/manifest.json`, а маршруты собираются через Astro.

---

## Требования

- Node.js 20+;
- npm 10+;
- Git;
- доступ к репозиторию проекта.

Проверка:

```bash
node -v
npm -v
git --version
```

---

## Локальный запуск

```bash
git clone https://github.com/opensophy-projects/hub.git
cd hub
npm install
npm run generate
npm run dev
```

После запуска Astro покажет локальный адрес, обычно:

```txt
http://localhost:4321/
```

---

## Основные команды

| Команда | Назначение |
|---|---|
| `npm run dev` | Генерация данных и запуск dev-сервера. |
| `npm run generate` | Пересобрать manifest, sitemap и LLM-файл. |
| `npm run build` | Production-сборка Astro. |
| `npm run preview` | Локальный preview production build. |
| `npm run lint` | Проверка ESLint через кастомный runner. |
| `npm test` | Запуск unit-тестов. |

---

## Добавить первую страницу

Создайте файл:

```txt
Docs/[N][book-open]Документация{docs}/[A][file-text]Моя страница{my-page}.md
```

Минимальное содержимое:

```md
---
title: "Моя страница"
description: "Короткое описание страницы."
author: veilosophy
date: 2026-06-16
icon: file-text
robots: "index, follow"
---

# Моя страница

Контент страницы.
```

Затем:

```bash
npm run generate
npm run dev
```

Страница будет доступна по адресу:

```txt
/docs/my-page/
```

---

## Production build

```bash
npm run generate
npm run build
npm run preview
```

Результат сборки находится в `dist/`.

---

## Деплой на Vercel

### Через UI

1. Импортируйте GitHub-репозиторий в Vercel.
2. Framework preset: **Astro**.
3. Install command: `npm install`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

`npm run build` уже запускает `npm run generate`, поэтому manifest и sitemap будут актуальными.

### Через CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

---

## Деплой на GitHub Pages

Для GitHub Pages лучше использовать GitHub Actions.

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

В настройках репозитория включите **Settings → Pages → Source: GitHub Actions**.

### Если сайт публикуется не в корне домена

Если GitHub Pages отдаёт проект по адресу вида:

```txt
https://username.github.io/repository-name/
```

нужно настроить `base`/`site` в `astro.config.mjs` под ваш репозиторий. Для кастомного домена вроде `https://opensophy.com/` base обычно не нужен.

---

## Деплой на Netlify или Cloudflare Pages

Общие настройки одинаковые:

| Параметр | Значение |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | `20` или выше |

Для Netlify можно добавить `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

---

## Bolt.new / StackBlitz-подобные окружения

1. Откройте проект в Bolt.new.
2. Убедитесь, что установлены зависимости: `npm install`.
3. Запустите `npm run generate`.
4. Запустите `npm run dev`.
5. Для публикации используйте встроенный deploy или экспорт проекта в GitHub/Vercel.

Если окружение пересоздаётся, первым делом запускайте:

```bash
npm install
npm run generate
```

---

## Статический хостинг / VPS / Nginx

Соберите проект:

```bash
npm ci
npm run build
```

Скопируйте `dist/` на сервер.

Пример Nginx:

```nginx
server {
  listen 80;
  server_name example.com;

  root /var/www/hub/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /404.html;
  }
}
```

---

## Чеклист перед публикацией

:::steps
:::step[status=done] Генерация
`npm run generate` выполнен после изменений в `Docs/`.
:::
:::step[status=done] Проверки
`npm test` и `npm run lint` не показывают критичных ошибок.
:::
:::step[status=done] Build
`npm run build` завершился успешно.
:::
:::step[status=done] SEO
Проверьте `title`, `description`, `robots`, canonical, sitemap и OG image.
:::
:::step[status=done] Навигация
Проверьте, что новые страницы появились в поиске, sidebar и категориях.
:::
:::

---

## Частые проблемы

| Проблема | Решение |
|---|---|
| Страница не появилась | Запустите `npm run generate`, проверьте имя файла и slug. |
| 404 после деплоя | Проверьте `dist/`, настройки output directory и base path. |
| Не грузятся картинки | Используйте пути `/assets/name.png` для файлов из `public/assets/`. |
| Не работает custom page | Проверьте `src/custom/<folder>{slug}/Page.tsx` и поле `custom` во frontmatter. |
| GitHub Pages показывает пустой сайт | Проверьте `astro.config.mjs` `base`, если сайт не на корне домена. |
