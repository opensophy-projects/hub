---
title: "Полное руководство по форматированию Markdown в Hub"
description: Справочник по всем доступным вариантам форматирования текста, кода, таблиц и компонентов в документации Hub. Включает примеры синтаксиса и демонстрацию результатов.
type: docs
typename: Документация
category: hub
author: veilosophy
date: 2026-02-16
tags: Markdown, форматирование, руководство, синтаксис, документация, UI компоненты
keywords: Markdown руководство, форматирование текста, синтаксис Markdown, документация Hub, примеры форматирования
canonical: null
robots: index, follow
lang: ru
---

Это полное руководство по использованию Markdown в проекте Hub. Здесь вы найдете все доступные варианты форматирования с примерами синтаксиса и результатами отображения.

## Заголовки

Заголовки используются для структурирования документа и создания оглавления.

# Заголовок 1 уровня (H1)

```markdown
# Заголовок 1 уровня (H1)
```

## Заголовок 2 уровня (H2)

```markdown
## Заголовок 2 уровня (H2)
```

### Заголовок 3 уровня (H3)

```markdown
### Заголовок 3 уровня (H3)
```

#### Заголовок 4 уровня (H4)

```markdown
#### Заголовок 4 уровня (H4)
```

##### Заголовок 5 уровня (H5)

```markdown
##### Заголовок 5 уровня (H5)
```

###### Заголовок 6 уровня (H6)

```markdown
###### Заголовок 6 уровня (H6)
```

## Форматирование текста

### Базовое форматирование

**Жирный текст** создается двойными звездочками или подчеркиваниями.

```markdown
**Жирный текст**
__Жирный текст__
```

*Курсивный текст* создается одинарными звездочками или подчеркиваниями.

```markdown
*Курсивный текст*
_Курсивный текст_
```

***Жирный и курсивный текст*** можно комбинировать.

```markdown
***Жирный и курсивный текст***
**_Жирный и курсивный текст_**
```

### Расширенное форматирование

~~Зачеркнутый текст~~ использует двойные тильды.

```markdown
~~Зачеркнутый текст~~
```

`Встроенный код` создается одинарными обратными кавычками.

```markdown
`Встроенный код`
```

<u>Подчеркнутый текст</u>

```markdown
<u>Подчеркнутый текст</u>
```

<mark>выделенный текст</mark>

```markdown
<mark>выделенный текст</mark>
```

<sub>текст</sub>

```markdown
<sub>текст</sub>
```

<sup>текст</sup>

```markdown
<sup>текст</sup>
```

## Списки

### Маркированные списки

- Первый элемент
- Второй элемент
- Третий элемент
  - Вложенный элемент
  - Еще один вложенный элемент
- Четвертый элемент

```markdown
- Первый элемент
- Второй элемент
- Третий элемент
  - Вложенный элемент
  - Еще один вложенный элемент
- Четвертый элемент
```

### Нумерованные списки

1. Первый элемент
2. Второй элемент
3. Третий элемент
   1. Вложенный элемент
   2. Еще один вложенный элемент
4. Четвертый элемент

```markdown
1. Первый элемент
2. Второй элемент
3. Третий элемент
   1. Вложенный элемент
   2. Еще один вложенный элемент
4. Четвертый элемент
```

### Списки задач

- [x] Завершенная задача
- [ ] Незавершенная задача
- [ ] Еще одна задача
  - [x] Вложенная завершенная задача
  - [ ] Вложенная незавершенная задача

```markdown
- [x] Завершенная задача
- [ ] Незавершенная задача
- [ ] Еще одна задача
  - [x] Вложенная завершенная задача
  - [ ] Вложенная незавершенная задача
```

## Ссылки и изображения

### Ссылки

[Текст ссылки](https://opensophy.com) создается следующим синтаксисом:

```markdown
[Текст ссылки](https://opensophy.com)
```

Автоматическая ссылка: https://opensophy.com

```markdown
https://opensophy.com
```

### Изображения

Изображения вставляются следующим образом:

```markdown
[image.png]
```

Изображения с описанием:

```markdown
![Альтернативный текст](/assets/image.png "Заголовок изображения")
```

## Цитаты

> Это простая цитата.
> Она может занимать несколько строк.

```markdown
> Это простая цитата.
> Она может занимать несколько строк.
```

> Это вложенная цитата.
>> Еще более глубокая вложенность.
>>> И еще глубже.

```markdown
> Это вложенная цитата.
>> Еще более глубокая вложенность.
>>> И еще глубже.
```

## GitHub Alerts

Hub поддерживает специальные блоки уведомлений в стиле GitHub.

:::note
Полезная информация, которую пользователи должны знать, даже при беглом просмотре.
:::

```markdown
:::note
Полезная информация, которую пользователи должны знать, даже при беглом просмотре.
:::
```

:::tip
Полезный совет для улучшения работы пользователя.
:::

```markdown
:::tip
Полезный совет для улучшения работы пользователя.
:::
```

:::important
Ключевая информация, необходимая для успешного выполнения задачи.
:::

```markdown
:::important
Ключевая информация, необходимая для успешного выполнения задачи.
:::
```

:::warning
Срочная информация, требующая немедленного внимания для предотвращения проблем.
:::

```markdown
:::warning
Срочная информация, требующая немедленного внимания для предотвращения проблем.
:::
```
:::caution
Рекомендации о рисках или негативных последствиях определенных действий.
:::

```markdown
:::caution
Рекомендации о рисках или негативных последствиях определенных действий.
:::
```

## Блоки кода

### Встроенный код

Используйте `const variable = value;` для объявления переменных.

```markdown
Используйте `const variable = value;` для объявления переменных.
```

### Блоки кода с подсветкой синтаксиса

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome to Hub, ${name}`;
}

const result = greet('User');
```

````markdown
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome to Hub, ${name}`;
}

const result = greet('User');
```
````

```python
def calculate_sum(a, b):
    """Вычисляет сумму двух чисел"""
    return a + b

result = calculate_sum(10, 20)
print(f"Результат: {result}")
```

````markdown
```python
def calculate_sum(a, b):
    """Вычисляет сумму двух чисел"""
    return a + b

result = calculate_sum(10, 20)
print(f"Результат: {result}")
```
````

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const createUser = (name: string, email: string): User => {
  return {
    id: Math.random(),
    name,
    email
  };
};
```

````markdown
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const createUser = (name: string, email: string): User => {
  return {
    id: Math.random(),
    name,
    email
  };
};
```
````

```bash
# Установка зависимостей
npm install

# Запуск проекта в режиме разработки
npm run dev

# Сборка проекта для продакшена
npm run build
```

````markdown
```bash
# Установка зависимостей
npm install

# Запуск проекта в режиме разработки
npm run dev

# Сборка проекта для продакшена
npm run build
```
````

## Таблицы

### Простая таблица

| Заголовок 1 | Заголовок 2 | Заголовок 3 |
|-------------|-------------|-------------|
| Ячейка 1    | Ячейка 2    | Ячейка 3    |
| Ячейка 4    | Ячейка 5    | Ячейка 6    |
| Ячейка 7    | Ячейка 8    | Ячейка 9    |

```markdown
| Заголовок 1 | Заголовок 2 | Заголовок 3 |
|-------------|-------------|-------------|
| Ячейка 1    | Ячейка 2    | Ячейка 3    |
| Ячейка 4    | Ячейка 5    | Ячейка 6    |
| Ячейка 7    | Ячейка 8    | Ячейка 9    |
```

### Таблица с выравниванием

| Слева       | По центру   | Справа      |
|:------------|:-----------:|------------:|
| Текст слева | По центру   | Текст справа|
| Еще текст   | Еще текст   | Еще текст   |

```markdown
| Слева       | По центру   | Справа      |
|:------------|:-----------:|------------:|
| Текст слева | По центру   | Текст справа|
| Еще текст   | Еще текст   | Еще текст   |
```

### Таблица с форматированием

| Название    | Описание                  | Статус          |
|-------------|---------------------------|-----------------|
| **Hub**     | *Документация проекта*    | ✅ Активен      |
| **API**     | `REST API` для разработки | 🔄 В разработке |
| **CLI**     | ~~Командная строка~~      | ❌ Устарело     |

```markdown
| Название    | Описание                  | Статус          |
|-------------|---------------------------|-----------------|
| **Hub**     | *Документация проекта*    | ✅ Активен      |
| **API**     | `REST API` для разработки | 🔄 В разработке |
| **CLI**     | ~~Командная строка~~      | ❌ Устарело     |
```

### Большая таблица с данными

| ID  | Название       | Категория     | Тип       | Дата создания | Автор      | Статус      | Версия |
|-----|----------------|---------------|-----------|---------------|------------|-------------|--------|
| 001 | Проект Alpha   | Разработка    | Frontend  | 2026-01-15    | Ivan       | Активен     | 2.1.0  |
| 002 | Проект Beta    | Документация  | Backend   | 2026-01-20    | Maria      | В работе    | 1.5.3  |
| 003 | Проект Gamma   | Тестирование  | QA        | 2026-02-01    | Alex       | Завершен    | 3.0.0  |
| 004 | Проект Delta   | Безопасность  | Security  | 2026-02-10    | Elena      | Активен     | 1.2.1  |
| 005 | Проект Epsilon | Дизайн        | UI/UX     | 2026-02-12    | Dmitry     | На паузе    | 2.0.0  |

```markdown
| ID  | Название       | Категория     | Тип       | Дата создания | Автор      | Статус      | Версия |
|-----|----------------|---------------|-----------|---------------|------------|-------------|--------|
| 001 | Проект Alpha   | Разработка    | Frontend  | 2026-01-15    | Ivan       | Активен     | 2.1.0  |
| 002 | Проект Beta    | Документация  | Backend   | 2026-01-20    | Maria      | В работе    | 1.5.3  |
| 003 | Проект Gamma   | Тестирование  | QA        | 2026-02-01    | Alex       | Завершен    | 3.0.0  |
| 004 | Проект Delta   | Безопасность  | Security  | 2026-02-10    | Elena      | Активен     | 1.2.1  |
| 005 | Проект Epsilon | Дизайн        | UI/UX     | 2026-02-12    | Dmitry     | На паузе    | 2.0.0  |
```

## Детали/Аккордеон

<details>
<summary>Нажмите, чтобы развернуть</summary>

Это скрытый контент, который отображается при клике на заголовок.

Здесь может быть любой Markdown:

- Списки
- **Жирный текст**
- `Код`
````javascript
console.log("Hello from accordion!");
````

</details>

Как такое написать?

````markdown

<details>
<summary>Нажмите, чтобы развернуть</summary>

Это скрытый контент, который отображается при клике на заголовок.

Здесь может быть любой Markdown:

- Списки
- **Жирный текст**
- `Код`
```javascript
console.log("Hello from accordion!");
```
</details>

````

## Горизонтальная линия

Горизонтальная линия создается тремя или более дефисами, звездочками или подчеркиваниями:

---

```markdown
---
***
___
```

## UI компоненты

Hub поддерживает встраивание интерактивных UI компонентов прямо в документацию.

### Blur Text компонент

[uic:blur-text]

```markdown
[uic:blur-text]
```

---

## Карточки

Hub поддерживает красивые карточки с иконкой, заголовком и акцентным цветом. Цвет задаётся любым CSS-значением: hex, rgb, hsl, oklch и именованные цвета.

### Одиночная карточка

:::card[color=#7234ff]
[title]Одиночная карточка
[icon]rocket
Это пример одиночной карточки с фиолетовым акцентом и иконкой ракеты.
:::

```markdown
:::card[color=#7234ff]
[title]Одиночная карточка
[icon]rocket
Это пример одиночной карточки с фиолетовым акцентом и иконкой ракеты.
:::
```

### Карточка без иконки и без цвета

:::card
[title]Простая карточка
Карточка без иконки и без акцентного цвета — нейтральный вариант.
:::

```markdown
:::card
[title]Простая карточка
Карточка без иконки и без акцентного цвета — нейтральный вариант.
:::
```

### Сетка 2×2

Четыре карточки в две колонки — параметр `cols=2`.

:::cards[cols=2]
:::card[color=#3b82f6]
[title]Документация
[icon]book-open
Вся документация проекта в одном месте. Структурированно и с поиском.
:::
:::card[color=#22c55e]
[title]API Reference
[icon]code-2
Полный справочник по REST API с примерами запросов и ответов.
:::
:::card[color=#f59e0b]
[title]Компоненты
[icon]layers
Библиотека UI-компонентов с интерактивными примерами и playground.
:::
:::card[color=#ef4444]
[title]Безопасность
[icon]shield-check
Руководство по аутентификации, правам доступа и лучшим практикам.
:::
:::

```markdown
:::cards[cols=2]
:::card[color=#3b82f6]
[title]Документация
[icon]book-open
Вся документация проекта в одном месте.
:::
:::card[color=#22c55e]
[title]API Reference
[icon]code-2
Полный справочник по REST API.
:::
:::card[color=#f59e0b]
[title]Компоненты
[icon]layers
Библиотека UI-компонентов.
:::
:::card[color=#ef4444]
[title]Безопасность
[icon]shield-check
Руководство по аутентификации.
:::
:::
```

### Сетка 3×1 (три карточки в ряд)

Три карточки в одну строку — параметр `cols=3`.

:::cards[cols=3]
:::card[color=#8b5cf6]
[title]Быстрый старт
[icon]zap
Запустите проект за 5 минут с нашим руководством.
:::
:::card[color=#06b6d4]
[title]Интеграции
[icon]plug
Подключите сторонние сервисы и инструменты.
:::
:::card[color=#f43f5e]
[title]Поддержка
[icon]life-buoy
Свяжитесь с командой или найдите ответ в FAQ.
:::
:::

```markdown
:::cards[cols=3]
:::card[color=#8b5cf6]
[title]Быстрый старт
[icon]zap
Запустите проект за 5 минут.
:::
:::card[color=#06b6d4]
[title]Интеграции
[icon]plug
Подключите сторонние сервисы.
:::
:::card[color=#f43f5e]
[title]Поддержка
[icon]life-buoy
Свяжитесь с командой.
:::
:::
```

:::note
Лимит сетки — 3 колонки. На мобильных устройствах карточки автоматически выстраиваются в одну колонку. Параметр `cols` принимает значения `1`, `2` или `3`.
:::

---

## Колонки

Блок `:::columns` позволяет разместить контент в несколько колонок. Параметр `layout` управляет шириной и порядком колонок.

### Текст слева, изображение справа

:::columns[layout=wide-left]
:::col
## Заголовок раздела

Текст располагается в широкой левой колонке. Здесь можно писать любой Markdown — списки, ссылки, форматирование.

- Поддерживаются все элементы Markdown
- Гибкая настройка через параметр `layout`
- Адаптивность: на мобиле колонки складываются вертикально
:::
:::col
![Иллюстрация](/assets/image.png "Подпись к изображению")
:::
:::

```markdown
:::columns[layout=wide-left]
:::col
## Заголовок раздела

Текст располагается в широкой левой колонке.

- Поддерживаются все элементы Markdown
- Гибкая настройка через параметр `layout`
:::
:::col
![Иллюстрация](/assets/placeholder.png "Подпись к изображению")
:::
:::
```

### Изображение слева, текст справа

:::columns[layout=image-left]
:::col
![Иллюстрация](/assets/image.png "Подпись к изображению")
:::
:::col
## Другой порядок

Теперь изображение стоит слева, а текст — справа. Используйте `layout=image-left` когда хотите начать визуально с картинки.

Колонки автоматически подбирают пропорции: под изображение — меньше, под текст — больше.
:::
:::

```markdown
:::columns[layout=image-left]
:::col
![Иллюстрация](/assets/placeholder.png)
:::
:::col
## Другой порядок

Изображение слева, текст справа.
:::
:::
```

:::tip
Доступные варианты `layout`: `equal` — равные колонки, `image-left` — фото слева, `image-right` — фото справа, `wide-left` — левая колонка шире (70/30), `wide-right` — правая колонка шире (30/70).
:::

---

## Steps (Шаги)

Блок `:::steps` создаёт пронумерованный вертикальный список шагов — удобно для инструкций и туториалов. Каждому шагу можно задать статус: `done`, `active`, `pending`.

### Пример: установка проекта

:::steps
:::step Установка зависимостей
Клонируйте репозиторий и установите пакеты:

```bash
git clone https://github.com/your/project.git
cd project
npm install
```
:::
:::step[status=active] Настройка окружения
Создайте файл `.env` в корне проекта и заполните переменные окружения:

```bash
cp .env.example .env
```

Обязательные переменные: `DATABASE_URL`, `API_SECRET`, `PORT`.
:::
:::step[status=pending] Запуск в режиме разработки
Запустите dev-сервер командой:

```bash
npm run dev
```

Проект будет доступен по адресу `http://localhost:3000`.
:::
:::step[status=pending] Сборка для продакшена
Когда всё готово — собирайте и деплойте:

```bash
npm run build
npm run start
```
:::
:::

```markdown
:::steps
:::step Установка зависимостей
Клонируйте репозиторий и установите пакеты.
:::
:::step[status=active] Настройка окружения
Создайте файл `.env` и заполните переменные.
:::
:::step[status=pending] Запуск в режиме разработки
Запустите `npm run dev`.
:::
:::step[status=pending] Сборка для продакшена
Выполните `npm run build && npm run start`.
:::
:::
```

Статусы шагов:

| Статус    | Описание                             |
|-----------|--------------------------------------|
| `done`    | Шаг завершён — зелёная галочка       |
| `active`  | Текущий шаг — фиолетовый акцент      |
| `pending` | Ожидает выполнения — приглушённый    |
| *(нет)*   | Нейтральный вид без статуса          |

---

## Диаграммы

Здесь собраны примеры основных типов диаграмм: простые схемы, средние графики и сложные архитектурные диаграммы.

## Простые схемы

### Линейный флоучарт

:::diagram
flowchart LR
    A[Начало] --> B[Обработка] --> C[Конец]
:::

```
:::diagram
flowchart LR
    A[Начало] --> B[Обработка] --> C[Конец]
:::
```

### Дерево решений

:::diagram[borderColor=#6366f1]
flowchart TD
    A{Есть ошибка?} -->|Да| B[Логировать]
    A -->|Нет| C[Продолжить]
    B --> D[Уведомить команду]
    C --> E[Завершить задачу]
:::

```
:::diagram[borderColor=#6366f1]
flowchart TD
    A{Есть ошибка?} -->|Да| B[Логировать]
    A -->|Нет| C[Продолжить]
    B --> D[Уведомить команду]
    C --> E[Завершить задачу]
:::
```

### Последовательность событий (простая)

:::diagram[color=#10b981]
sequenceDiagram
    participant U as Пользователь
    participant S as Сервер

    U->>S: GET /api/data
    S-->>U: 200 OK + JSON
:::

```
:::diagram[color=#10b981]
sequenceDiagram
    participant U as Пользователь
    participant S as Сервер

    U->>S: GET /api/data
    S-->>U: 200 OK + JSON
:::
```

---

## Средние схемы

### Пайплайн CI/CD

:::diagram[color=#f59e0b]
flowchart LR
    subgraph Dev[Разработка]
        A[Коммит] --> B[Lint & Tests]
    end
    subgraph CI[CI Pipeline]
        B --> C[Build Docker]
        C --> D{Тесты OK?}
    end
    subgraph CD[Деплой]
        D -->|Да| E[Staging]
        E --> F{QA?}
        F -->|Approve| G[Production]
        F -->|Reject| H[Rollback]
        D -->|Нет| I[Notify Dev]
    end

    style Dev fill:#1e1e2e,stroke:#6366f1,color:#e0e0e0
    style CI  fill:#1e1e2e,stroke:#f59e0b,color:#e0e0e0
    style CD  fill:#1e1e2e,stroke:#10b981,color:#e0e0e0
:::

```
:::diagram[color=#f59e0b]
flowchart LR
    subgraph Dev[Разработка]
        A[Коммит] --> B[Lint & Tests]
    end
    subgraph CI[CI Pipeline]
        B --> C[Build Docker]
        C --> D{Тесты OK?}
    end
    subgraph CD[Деплой]
        D -->|Да| E[Staging]
        E --> F{QA?}
        F -->|Approve| G[Production]
        F -->|Reject| H[Rollback]
        D -->|Нет| I[Notify Dev]
    end

    style Dev fill:#1e1e2e,stroke:#6366f1,color:#e0e0e0
    style CI  fill:#1e1e2e,stroke:#f59e0b,color:#e0e0e0
    style CD  fill:#1e1e2e,stroke:#10b981,color:#e0e0e0
:::
```

### Архитектура микросервисов

:::diagram[borderColor=#8b5cf6]
flowchart TD
    Client([🌐 Клиент])

    subgraph Gateway[API Gateway]
        GW[Nginx / Traefik]
        Auth[Auth Service]
    end

    subgraph Services[Микросервисы]
        US[Users Service]
        OS[Orders Service]
        NS[Notify Service]
    end

    subgraph Data[Хранилища]
        PG[(PostgreSQL)]
        RD[(Redis)]
        MQ[[RabbitMQ]]
    end

    Client --> GW
    GW --> Auth
    Auth -->|JWT| GW
    GW --> US & OS
    US --> PG
    OS --> PG & MQ
    MQ --> NS
    NS --> RD
:::

```
:::diagram[borderColor=#8b5cf6]
flowchart TD
    Client([🌐 Клиент])

    subgraph Gateway[API Gateway]
        GW[Nginx / Traefik]
        Auth[Auth Service]
    end

    subgraph Services[Микросервисы]
        US[Users Service]
        OS[Orders Service]
        NS[Notify Service]
    end

    subgraph Data[Хранилища]
        PG[(PostgreSQL)]
        RD[(Redis)]
        MQ[[RabbitMQ]]
    end

    Client --> GW
    GW --> Auth
    Auth -->|JWT| GW
    GW --> US & OS
    US --> PG
    OS --> PG & MQ
    MQ --> NS
    NS --> RD
:::
```

### Диаграмма классов

:::diagram[color=#ec4899]
classDiagram
    class User {
        +int id
        +string name
        +string email
        +login() bool
        +logout() void
    }

    class Order {
        +int id
        +float total
        +OrderStatus status
        +create() Order
        +cancel() void
    }

    class Product {
        +int id
        +string title
        +float price
        +int stock
    }

    class OrderItem {
        +int qty
        +float price
    }

    User "1" --> "0..*" Order : размещает
    Order "1" --> "1..*" OrderItem : содержит
    OrderItem "0..*" --> "1" Product : ссылается
:::

```
:::diagram[color=#ec4899]
classDiagram
    class User {
        +int id
        +string name
        +string email
        +login() bool
        +logout() void
    }

    class Order {
        +int id
        +float total
        +OrderStatus status
        +create() Order
        +cancel() void
    }

    class Product {
        +int id
        +string title
        +float price
        +int stock
    }

    class OrderItem {
        +int qty
        +float price
    }

    User "1" --> "0..*" Order : размещает
    Order "1" --> "1..*" OrderItem : содержит
    OrderItem "0..*" --> "1" Product : ссылается
:::
```

### Диаграмма состояний (State Machine)

:::diagram[borderColor=#f97316]
stateDiagram-v2
    [*] --> Draft : создан черновик

    Draft --> Review : отправлен на ревью
    Review --> Approved : ✅ одобрен
    Review --> Rejected : ❌ отклонён
    Rejected --> Draft : исправлен

    Approved --> Published : опубликован
    Published --> Archived : архивирован
    Archived --> [*]

    Published --> Draft : снят с публикации
:::

```
:::diagram[borderColor=#f97316]
stateDiagram-v2
    [*] --> Draft : создан черновик

    Draft --> Review : отправлен на ревью
    Review --> Approved : ✅ одобрен
    Review --> Rejected : ❌ отклонён
    Rejected --> Draft : исправлен

    Approved --> Published : опубликован
    Published --> Archived : архивирован
    Archived --> [*]

    Published --> Draft : снят с публикации
:::
```

### Git граф

:::diagram[color=#14b8a6]
gitGraph
    commit id: "init"
    branch develop
    checkout develop
    commit id: "feat: auth"
    commit id: "feat: api"

    branch feature/payments
    checkout feature/payments
    commit id: "add Stripe"
    commit id: "add webhooks"

    checkout develop
    merge feature/payments id: "merge payments"
    commit id: "fix: tests"

    checkout main
    merge develop id: "v1.0.0" tag: "v1.0.0"
    commit id: "hotfix: ssl"
:::

```
:::diagram[color=#14b8a6]
gitGraph
    commit id: "init"
    branch develop
    checkout develop
    commit id: "feat: auth"
    commit id: "feat: api"

    branch feature/payments
    checkout feature/payments
    commit id: "add Stripe"
    commit id: "add webhooks"

    checkout develop
    merge feature/payments id: "merge payments"
    commit id: "fix: tests"

    checkout main
    merge develop id: "v1.0.0" tag: "v1.0.0"
    commit id: "hotfix: ssl"
:::

```

---

## Сложные схемы

### Полная архитектура SaaS-приложения

:::diagram[color=#6366f1,borderColor=#4f46e5]
flowchart TD
    subgraph Internet[🌍 Интернет]
        User([👤 Пользователь])
        Mobile([📱 Мобильное приложение])
    end

    subgraph Edge[Edge / CDN]
        CDN[CloudFront CDN]
        WAF[Web Application Firewall]
    end

    subgraph LoadBalancer[Балансировщик]
        LB[AWS ALB]
    end

    subgraph AppLayer[Слой приложения — Kubernetes]
        API1[API Pod 1]
        API2[API Pod 2]
        API3[API Pod 3]
        Worker[Background Worker]
        Scheduler[Cron Scheduler]
    end

    subgraph DataLayer[Данные]
        direction LR
        Primary[(🐘 Postgres Primary)]
        Replica[(🐘 Postgres Replica)]
        Cache[(⚡ Redis Cluster)]
        Search[(🔍 Elasticsearch)]
        Blob[(☁️ S3 / Blob Storage)]
        Queue[[📨 Kafka]]
    end

    subgraph Observability[Мониторинг]
        Logs[Loki / ELK]
        Metrics[Prometheus + Grafana]
        Traces[Jaeger / Tempo]
    end

    User & Mobile --> CDN --> WAF --> LB
    LB --> API1 & API2 & API3
    API1 & API2 & API3 --> Primary
    API1 & API2 & API3 --> Cache
    Primary --> Replica
    API1 & API2 & API3 --> Queue
    Queue --> Worker
    Worker --> Search & Blob
    Scheduler --> Worker
    API1 & API2 & API3 -.-> Logs & Metrics & Traces
:::

```
:::diagram[color=#6366f1,borderColor=#4f46e5]
flowchart TD
    subgraph Internet[🌍 Интернет]
        User([👤 Пользователь])
        Mobile([📱 Мобильное приложение])
    end

    subgraph Edge[Edge / CDN]
        CDN[CloudFront CDN]
        WAF[Web Application Firewall]
    end

    subgraph LoadBalancer[Балансировщик]
        LB[AWS ALB]
    end

    subgraph AppLayer[Слой приложения — Kubernetes]
        API1[API Pod 1]
        API2[API Pod 2]
        API3[API Pod 3]
        Worker[Background Worker]
        Scheduler[Cron Scheduler]
    end

    subgraph DataLayer[Данные]
        direction LR
        Primary[(🐘 Postgres Primary)]
        Replica[(🐘 Postgres Replica)]
        Cache[(⚡ Redis Cluster)]
        Search[(🔍 Elasticsearch)]
        Blob[(☁️ S3 / Blob Storage)]
        Queue[[📨 Kafka]]
    end

    subgraph Observability[Мониторинг]
        Logs[Loki / ELK]
        Metrics[Prometheus + Grafana]
        Traces[Jaeger / Tempo]
    end

    User & Mobile --> CDN --> WAF --> LB
    LB --> API1 & API2 & API3
    API1 & API2 & API3 --> Primary
    API1 & API2 & API3 --> Cache
    Primary --> Replica
    API1 & API2 & API3 --> Queue
    Queue --> Worker
    Worker --> Search & Blob
    Scheduler --> Worker
    API1 & API2 & API3 -.-> Logs & Metrics & Traces
:::
```

### ER-диаграмма базы данных

:::diagram[borderColor=#10b981]
erDiagram
    USERS {
        uuid id PK
        string email UK
        string name
        string role
        timestamp created_at
    }

    ORGANIZATIONS {
        uuid id PK
        string name
        string slug UK
        string plan
        int seats
    }

    MEMBERSHIPS {
        uuid user_id FK
        uuid org_id FK
        string role
        timestamp joined_at
    }

    PROJECTS {
        uuid id PK
        uuid org_id FK
        string name
        string status
        timestamp deadline
    }

    TASKS {
        uuid id PK
        uuid project_id FK
        uuid assignee_id FK
        string title
        string priority
        string status
    }

    COMMENTS {
        uuid id PK
        uuid task_id FK
        uuid author_id FK
        text body
        timestamp created_at
    }

    USERS ||--o{ MEMBERSHIPS : "участвует"
    ORGANIZATIONS ||--o{ MEMBERSHIPS : "имеет"
    ORGANIZATIONS ||--o{ PROJECTS : "владеет"
    PROJECTS ||--o{ TASKS : "содержит"
    USERS ||--o{ TASKS : "назначен"
    TASKS ||--o{ COMMENTS : "получает"
    USERS ||--o{ COMMENTS : "пишет"
:::

```
:::diagram[borderColor=#10b981]
erDiagram
    USERS {
        uuid id PK
        string email UK
        string name
        string role
        timestamp created_at
    }

    ORGANIZATIONS {
        uuid id PK
        string name
        string slug UK
        string plan
        int seats
    }

    MEMBERSHIPS {
        uuid user_id FK
        uuid org_id FK
        string role
        timestamp joined_at
    }

    PROJECTS {
        uuid id PK
        uuid org_id FK
        string name
        string status
        timestamp deadline
    }

    TASKS {
        uuid id PK
        uuid project_id FK
        uuid assignee_id FK
        string title
        string priority
        string status
    }

    COMMENTS {
        uuid id PK
        uuid task_id FK
        uuid author_id FK
        text body
        timestamp created_at
    }

    USERS ||--o{ MEMBERSHIPS : "участвует"
    ORGANIZATIONS ||--o{ MEMBERSHIPS : "имеет"
    ORGANIZATIONS ||--o{ PROJECTS : "владеет"
    PROJECTS ||--o{ TASKS : "содержит"
    USERS ||--o{ TASKS : "назначен"
    TASKS ||--o{ COMMENTS : "получает"
    USERS ||--o{ COMMENTS : "пишет"
:::
```

### Временная шкала (Timeline)

:::diagram[color=#a855f7]
timeline
    title История развития веба
    section 1990-е
        1991 : HTML 1.0
             : Первый веб-сайт
        1995 : JavaScript (Netscape)
             : CSS 1.0
        1998 : Google основан
    section 2000-е
        2004 : Gmail, Ajax-революция
        2005 : YouTube
        2007 : iPhone / мобильный веб
        2009 : Node.js
    section 2010-е
        2013 : React.js
        2015 : ES6, GraphQL
        2017 : WebAssembly
        2019 : Svelte 3, Tailwind CSS
    section 2020-е
        2020 : Edge Functions, Deno
        2022 : TypeScript повсюду
        2024 : AI-ассистенты в IDE
:::

```
:::diagram[color=#a855f7]
timeline
    title История развития веба
    section 1990-е
        1991 : HTML 1.0
             : Первый веб-сайт
        1995 : JavaScript (Netscape)
             : CSS 1.0
        1998 : Google основан
    section 2000-е
        2004 : Gmail, Ajax-революция
        2005 : YouTube
        2007 : iPhone / мобильный веб
        2009 : Node.js
    section 2010-е
        2013 : React.js
        2015 : ES6, GraphQL
        2017 : WebAssembly
        2019 : Svelte 3, Tailwind CSS
    section 2020-е
        2020 : Edge Functions, Deno
        2022 : TypeScript повсюду
        2024 : AI-ассистенты в IDE
:::
```

### Круговая диаграмма (Pie)

:::diagram[borderColor=#f43f5e]
pie title Распределение трафика по источникам
    "Органический поиск" : 42.5
    "Прямые переходы"    : 23.1
    "Социальные сети"    : 15.8
    "Email-рассылка"     : 10.4
    "Реферальный"        : 8.2
:::

```

:::diagram[borderColor=#f43f5e]
pie title Распределение трафика по источникам
    "Органический поиск" : 42.5
    "Прямые переходы"    : 23.1
    "Социальные сети"    : 15.8
    "Email-рассылка"     : 10.4
    "Реферальный"        : 8.2
:::
```

### Квадрант-диаграмма (приоритизация задач)

:::diagram[color=#f59e0b]
quadrantChart
    title Матрица приоритизации задач
    x-axis Низкий усилия --> Высокий усилия
    y-axis Низкий импакт --> Высокий импакт

    quadrant-1 Сделать в первую очередь
    quadrant-2 Запланировать
    quadrant-3 Делегировать
    quadrant-4 Пересмотреть

    Онбординг: [0.2, 0.85]
    Авторизация OAuth: [0.4, 0.9]
    Dark mode: [0.25, 0.45]
    Экспорт в PDF: [0.55, 0.65]
    Аналитика: [0.7, 0.8]
    Рефакторинг auth: [0.8, 0.35]
    A/B тесты: [0.65, 0.5]
    Push-уведомления: [0.45, 0.7]
:::

```

:::diagram[color=#f59e0b]
quadrantChart
    title Матрица приоритизации задач
    x-axis Низкий усилия --> Высокий усилия
    y-axis Низкий импакт --> Высокий импакт

    quadrant-1 Сделать в первую очередь
    quadrant-2 Запланировать
    quadrant-3 Делегировать
    quadrant-4 Пересмотреть

    Онбординг: [0.2, 0.85]
    Авторизация OAuth: [0.4, 0.9]
    Dark mode: [0.25, 0.45]
    Экспорт в PDF: [0.55, 0.65]
    Аналитика: [0.7, 0.8]
    Рефакторинг auth: [0.8, 0.35]
    A/B тесты: [0.65, 0.5]
    Push-уведомления: [0.45, 0.7]
:::
```