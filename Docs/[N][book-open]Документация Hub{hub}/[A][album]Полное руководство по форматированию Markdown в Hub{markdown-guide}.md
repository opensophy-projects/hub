---
title: Полное руководство по форматированию Markdown в Hub
description: "Справочник по всем доступным вариантам форматирования текста, кода, таблиц и компонентов в документации Hub."
date: 2026-02-16
updated: 2026-03-07
tags: "markdown, форматирование, руководство, синтаксис, документация, ui"
icon: album
lang: ru
robots: "index, follow"
---

Это полное руководство по использованию Markdown в проекте Hub. Здесь вы найдете все доступные варианты форматирования с примерами синтаксиса и результатами отображения.

# Заголовки

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

## Блоки уведомления

Hub поддерживает специальные блоки уведомлений.

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

## Вкладки

:::tabs
:::tab[Пример 1]
```javascript
const x = 1;
```
:::
:::tab[Пример 2]
```typescript
const x: number = 1;
```
:::
:::

````markdown
:::tabs
:::tab[Пример 1]
```javascript
const x = 1;
```
:::
:::tab[Пример 2]
```typescript
const x: number = 1;
```
:::
:::
````

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

:::card
[image]/assets/image.png
[title]Заголовок
[icon]image
Описание карточки.
:::

```markdown
:::card
[image]/assets/image.png
[title]Заголовок
[icon]image
Описание карточки.
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

Компонент `:::steps` позволяет оформлять пошаговые инструкции, туториалы и процессы с визуальной индикацией прогресса.

## Базовый синтаксис

```
:::steps
:::step Первый шаг
Содержимое первого шага.
:::

:::step Второй шаг
Содержимое второго шага.
:::

:::step Третий шаг
Содержимое третьего шага.
:::
:::
```

:::steps
:::step Первый шаг
Содержимое первого шага.
:::

:::step Второй шаг
Содержимое второго шага.
:::

:::step Третий шаг
Содержимое третьего шага.
:::
:::

---

## Статусы шагов

Каждый шаг может иметь статус через параметр `status`:

| Статус | Описание |
|---|---|
| `default` | Обычный шаг без акцента (по умолчанию) |
| `active` | Текущий активный шаг — фиолетовый акцент |
| `done` | Завершённый шаг — зелёный кружок с галочкой |
| `pending` | Будущий шаг — приглушённый, ожидает очереди |

```
:::steps
:::step[status=done] Установка зависимостей
Запустите `npm install` в корне проекта.
:::

:::step[status=active] Настройка конфига
Заполните файл `.env` на основе `.env.example`.
:::

:::step[status=pending] Запуск сервера
Выполните `npm run dev` и откройте `http://localhost:4321`.
:::
:::
```

:::steps
:::step[status=done] Установка зависимостей
Запустите `npm install` в корне проекта.
:::

:::step[status=active] Настройка конфига
Заполните файл `.env` на основе `.env.example`.
:::

:::step[status=pending] Запуск сервера
Выполните `npm run dev` и откройте `http://localhost:4321`.
:::
:::

---

## Кастомный цвет шага

Параметр `color` задаёт акцентный цвет кружка и линии для конкретного шага. Принимает любое валидное CSS-значение цвета.

```
:::steps
:::step[status=done,color=#f59e0b] Подготовка
Соберите все необходимые данные.
:::

:::step[status=active,color=#3b82f6] Обработка
Запустите скрипт обработки данных.
:::

:::step[status=pending,color=#8b5cf6] Публикация
Разверните результат на сервере.
:::
:::
```

:::steps
:::step[status=done,color=#f59e0b] Подготовка
Соберите все необходимые данные.
:::

:::step[status=active,color=#3b82f6] Обработка
Запустите скрипт обработки данных.
:::

:::step[status=pending,color=#8b5cf6] Публикация
Разверните результат на сервере.
:::
:::

:::note
Для статуса `pending` цвет намеренно не применяется — шаг остаётся приглушённым, так как он ещё не активен.
:::

---

## Форматы цвета

`color` принимает любой CSS-цвет:

```
:::steps
:::step[status=done,color=#22c55e] HEX
Стандартный шестнадцатеричный формат.
:::

:::step[status=active,color=rgb(239,68,68)] RGB
Функциональная нотация RGB.
:::

:::step[status=default,color=oklch(70%_0.2_270)] OKLCH
Современный цветовой формат с широким охватом.
:::
:::
```

---

## Содержимое шагов

Внутри шага поддерживается любой Markdown — текст, код, списки, алерты:

```
:::steps
:::step[status=done] Клонировать репозиторий

Скопируйте команду и выполните в терминале:

`git clone https://github.com/opensophy/hub.git`

Убедитесь, что у вас установлен Git версии 2.30+.
:::

:::step[status=active] Установить зависимости

Проект использует следующие менеджеры пакетов:

- **npm** — рекомендуется
- **pnpm** — поддерживается
- **yarn** — поддерживается

`npm install`
:::

:::step[status=pending] Запустить проект

После установки запустите dev-сервер:

`npm run dev`
:::
:::
```

:::steps
:::step[status=done] Клонировать репозиторий

Скопируйте команду и выполните в терминале:

`git clone https://github.com/opensophy/hub.git`

Убедитесь, что у вас установлен Git версии 2.30+.
:::

:::step[status=active] Установить зависимости

Проект использует следующие менеджеры пакетов:

- **npm** — рекомендуется
- **pnpm** — поддерживается
- **yarn** — поддерживается

`npm install`
:::

:::step[status=pending] Запустить проект

После установки запустите dev-сервер:

`npm run dev`
:::
:::

---

## Все параметры

```
:::step[status=active,color=#7234ff] Заголовок шага
Содержимое шага.
:::
```

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `status` | `done` \| `active` \| `pending` \| `default` | нет | Визуальный статус шага |
| `color` | CSS-цвет | нет | Кастомный цвет кружка и линии |
| Заголовок | строка | да | Текст после закрывающей `]` |

---

## KaTeX формулы(математические формулы)

### Инлайн — прямо в тексте ($...$)

Масса-энергетический эквивалент: $E = mc^2$ — формула прямо в строке.

Теорема Пифагора: в прямоугольном треугольнике $a^2 + b^2 = c^2$ всегда верна.

Квадратное уравнение $ax^2 + bx + c = 0$ имеет дискриминант $D = b^2 - 4ac$.

Сложность алгоритма — $O(n \log n)$ в среднем и $O(n^2)$ в худшем случае.

Закон тяготения: $F = G\dfrac{m_1 m_2}{r^2}$, где $G$ — гравитационная постоянная.

```markdown
Масса-энергетический эквивалент: $E = mc^2$ — формула прямо в строке.

Теорема Пифагора: в прямоугольном треугольнике $a^2 + b^2 = c^2$ всегда верна.

Квадратное уравнение $ax^2 + bx + c = 0$ имеет дискриминант $D = b^2 - 4ac$.

Сложность алгоритма — $O(n \log n)$ в среднем и $O(n^2)$ в худшем случае.

Закон тяготения: $F = G\dfrac{m_1 m_2}{r^2}$, где $G$ — гравитационная постоянная.
```

### Инлайн — через :::math (отдельный абзац, без рамки)

Формула энергии:

:::math
E = mc^2
:::

Теорема Пифагора:

:::math
a^2 + b^2 = c^2
:::

Энтропия Шеннона:

:::math
H = -\sum_{i} p_i \log_2 p_i
:::

```markdown
Формула энергии:

:::math
E = mc^2
:::

Теорема Пифагора:

:::math
a^2 + b^2 = c^2
:::

Энтропия Шеннона:

:::math
H = -\sum_{i} p_i \log_2 p_i
:::
```

### Блочные — :::math[display] (с рамкой, по центру)

Корни квадратного уравнения:

:::math[display]
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
:::

Интеграл Гаусса:

:::math[display]
\int_{-\infty}^{+\infty} e^{-x^2} \, dx = \sqrt{\pi}
:::

Формула Эйлера:

:::math[display]
e^{i\pi} + 1 = 0
:::

Ряд Тейлора:

:::math[display]
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!}
:::

Матрица 3×3:

:::math[display]
A = \begin{pmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{pmatrix}
:::

Уравнение Шрёдингера:

:::math[display]
i\hbar \frac{\partial \Psi}{\partial t} = -\frac{\hbar^2}{2m} \nabla^2 \Psi + V\Psi
:::

```markdown
Корни квадратного уравнения:

:::math[display]
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
:::

Интеграл Гаусса:

:::math[display]
\int_{-\infty}^{+\infty} e^{-x^2} \, dx = \sqrt{\pi}
:::

Формула Эйлера:

:::math[display]
e^{i\pi} + 1 = 0
:::

Ряд Тейлора:

:::math[display]
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!}
:::

Матрица 3×3:

:::math[display]
A = \begin{pmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{pmatrix}
:::

Уравнение Шрёдингера:

:::math[display]
i\hbar \frac{\partial \Psi}{\partial t} = -\frac{\hbar^2}{2m} \nabla^2 \Psi + V\Psi
:::
```

### Итоговое сравнение

| Вариант | Синтаксис | Результат |
|---|---|---|
| Инлайн в тексте | `$E = mc^2$` | Формула течёт с текстом |
| Инлайн абзац | `:::math` | Отдельная строка, без рамки |
| Блочный | `:::math[display]` | По центру, с рамкой |

:::tip
Для формул **прямо в предложении** используй `$...$` — это самый компактный вариант. `:::math` — когда формула стоит отдельным абзацем но без акцента. `:::math[display]` — когда формула важная и должна выделяться.
:::

## Графики

Базовый формат:

```md
:::chart
[title]Заголовок
[type]bar
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]gradient
[background]grid
[tooltip]frosted
[legend]rounded-square
[curve]monotoneX

| Период | Значение A | Значение B |
|--------|------------|------------|
| Q1     | 120        | 90         |
| Q2     | 160        | 130        |
:::
```

### Поддерживаемые параметры графиков

| Параметр | Значения | Где применяется |
|----------|----------|-----------------|
| `[type]` | `area`, `area-stacked`, `area-expanded`, `line`, `bar`, `bar-stacked`, `bar-percent`, `bar-horizontal`, `pie`, `pie-donut`, `radar` | Выбор типа графика |
| `[design]` | `default`, `gradient`, `hatched`, `duotone`, `duotone-reverse`, `stripped`, `solid`, `dotted`, `lines`, `glowing` | Вариант отрисовки серии |
| `[style]` или `[variant]` | те же значения, что у `[design]` | Алиасы для `[design]` |
| `[background]` | `dots`, `grid`, `cross-hatch`, `diagonal-lines`, `tiny-checkers`, `plus`, `bubbles`, `wiggle-lines`, `falling-triangles`, `overlapping-circles`, `4-pointed-star` | Фоновый паттерн |
| `[tooltip]` | `default`, `glass`, `frosted`, `minimal` | Дизайн tooltip |
| `[legend]` | `circle`, `square`, `rounded-square`, `circle-outline`, `rounded-square-outline` | Дизайн legend-маркеров |
| `[curve]` | `linear`, `monotone`, `monotoneX`, `step`, `bump` | Кривая line/area |
| `[colors]` | список цветов через запятую | Палитра серий |

## Все типы графиков

### Area

:::chart
[title]Area · gradient · monotoneX
[type]area
[colors]#8b5cf6, #22d3ee
[design]gradient
[curve]monotoneX
[tooltip]frosted
[legend]rounded-square

| Месяц | Визиты | Уники |
|-------|--------|-------|
| Янв   | 4200   | 3100  |
| Фев   | 5100   | 3600  |
| Мар   | 4700   | 3350  |
| Апр   | 6200   | 4100  |
:::

```markdown
:::chart
[title]Area · gradient · monotoneX
[type]area
[colors]#8b5cf6, #22d3ee
[design]gradient
[curve]monotoneX
[tooltip]frosted
[legend]rounded-square

| Месяц | Визиты | Уники |
|-------|--------|-------|
| Янв   | 4200   | 3100  |
| Фев   | 5100   | 3600  |
| Мар   | 4700   | 3350  |
| Апр   | 6200   | 4100  |
:::
```

### Area stacked

:::chart
[title]Area Stacked · solid
[type]area-stacked
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]solid
[curve]linear
[tooltip]default
[legend]circle

| Месяц | Органика | Реклама | Прямой |
|-------|----------|---------|--------|
| Янв   | 2100     | 800     | 500    |
| Фев   | 2400     | 920     | 620    |
| Мар   | 2200     | 1100    | 700    |
| Апр   | 2800     | 1320    | 810    |
:::

```markdown
:::chart
[title]Area Stacked · solid
[type]area-stacked
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]solid
[curve]linear
[tooltip]default
[legend]circle

| Месяц | Органика | Реклама | Прямой |
|-------|----------|---------|--------|
| Янв   | 2100     | 800     | 500    |
| Фев   | 2400     | 920     | 620    |
| Мар   | 2200     | 1100    | 700    |
| Апр   | 2800     | 1320    | 810    |
:::
```

### Area expanded

:::chart
[title]Area Expanded · dotted
[type]area-expanded
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]dotted
[curve]bump
[tooltip]minimal
[legend]rounded-square-outline

| Месяц | Органика | Реклама | Прямой |
|-------|----------|---------|--------|
| Янв   | 45       | 35      | 20     |
| Фев   | 50       | 30      | 20     |
| Мар   | 42       | 38      | 20     |
| Апр   | 48       | 32      | 20     |
:::

```markdown
:::chart
[title]Area Expanded · dotted
[type]area-expanded
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]dotted
[curve]bump
[tooltip]minimal
[legend]rounded-square-outline

| Месяц | Органика | Реклама | Прямой |
|-------|----------|---------|--------|
| Янв   | 45       | 35      | 20     |
| Фев   | 50       | 30      | 20     |
| Мар   | 42       | 38      | 20     |
| Апр   | 48       | 32      | 20     |
:::
```

### Line

:::chart
[title]Line · glowing · grid
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]grid
[curve]monotoneX
[tooltip]frosted
[legend]circle-outline

| День | Desktop | Mobile |
|------|---------|--------|
| Пн   | 120     | 180    |
| Вт   | 150     | 220    |
| Ср   | 130     | 260    |
| Чт   | 190     | 300    |
| Пт   | 240     | 340    |
:::

```markdown
:::chart
[title]Line · glowing · grid
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]grid
[curve]monotoneX
[tooltip]frosted
[legend]circle-outline

| День | Desktop | Mobile |
|------|---------|--------|
| Пн   | 120     | 180    |
| Вт   | 150     | 220    |
| Ср   | 130     | 260    |
| Чт   | 190     | 300    |
| Пт   | 240     | 340    |
:::
```

### Bar

:::chart
[title]Bar · duotone · dots
[type]bar
[colors]#8b5cf6, #22d3ee
[design]duotone
[background]dots
[tooltip]frosted
[legend]square

| Квартал | Север | Юг |
|---------|-------|----|
| Q1      | 1200  | 900 |
| Q2      | 1600  | 1100 |
| Q3      | 1350  | 1250 |
| Q4      | 1900  | 1550 |
:::

```markdown
:::chart
[title]Bar · duotone · dots
[type]bar
[colors]#8b5cf6, #22d3ee
[design]duotone
[background]dots
[tooltip]frosted
[legend]square

| Квартал | Север | Юг |
|---------|-------|----|
| Q1      | 1200  | 900 |
| Q2      | 1600  | 1100 |
| Q3      | 1350  | 1250 |
| Q4      | 1900  | 1550 |
:::
```

### Bar stacked

:::chart
[title]Bar Stacked · hatched
[type]bar-stacked
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]hatched
[background]cross-hatch
[tooltip]default
[legend]rounded-square

| Месяц | Зарплаты | Инфра | Маркетинг |
|-------|----------|-------|-----------|
| Янв   | 3200     | 800   | 450       |
| Фев   | 3400     | 900   | 520       |
| Мар   | 3300     | 980   | 610       |
:::

```markdown
:::chart
[title]Bar Stacked · hatched
[type]bar-stacked
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]hatched
[background]cross-hatch
[tooltip]default
[legend]rounded-square

| Месяц | Зарплаты | Инфра | Маркетинг |
|-------|----------|-------|-----------|
| Янв   | 3200     | 800   | 450       |
| Фев   | 3400     | 900   | 520       |
| Мар   | 3300     | 980   | 610       |
:::
```

### Bar percent

:::chart
[title]Bar Percent · stripped
[type]bar-percent
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]stripped
[background]diagonal-lines
[tooltip]minimal
[legend]circle

| Канал | Awareness | Consideration | Purchase |
|-------|-----------|---------------|----------|
| SEO   | 45        | 35            | 20       |
| Ads   | 35        | 40            | 25       |
| Email | 20        | 45            | 35       |
:::

```markdown
:::chart
[title]Bar Percent · stripped
[type]bar-percent
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]stripped
[background]diagonal-lines
[tooltip]minimal
[legend]circle

| Канал | Awareness | Consideration | Purchase |
|-------|-----------|---------------|----------|
| SEO   | 45        | 35            | 20       |
| Ads   | 35        | 40            | 25       |
| Email | 20        | 45            | 35       |
:::
```

### Bar horizontal

:::chart
[title]Bar Horizontal · glowing
[type]bar-horizontal
[colors]#8b5cf6, #22d3ee
[design]glowing
[tooltip]frosted
[legend]circle-outline

| Язык       | Доля |
|------------|------|
| TypeScript | 42   |
| Python     | 28   |
| Go         | 18   |
| Rust       | 12   |
:::

```markdown
:::chart
[title]Bar Horizontal · glowing
[type]bar-horizontal
[colors]#8b5cf6, #22d3ee
[design]glowing
[tooltip]frosted
[legend]circle-outline

| Язык       | Доля |
|------------|------|
| TypeScript | 42   |
| Python     | 28   |
| Go         | 18   |
| Rust       | 12   |
:::
```

### Pie

:::chart
[title]Pie · gradient · bubbles
[type]pie
[colors]#8b5cf6, #22d3ee, #f59e0b, #34d399
[design]gradient
[background]bubbles
[tooltip]frosted
[legend]rounded-square

| Источник | Доля |
|----------|------|
| Органика | 42   |
| Прямой   | 28   |
| Реклама  | 20   |
| Email    | 10   |
:::

```markdown
:::chart
[title]Pie · gradient · bubbles
[type]pie
[colors]#8b5cf6, #22d3ee, #f59e0b, #34d399
[design]gradient
[background]bubbles
[tooltip]frosted
[legend]rounded-square

| Источник | Доля |
|----------|------|
| Органика | 42   |
| Прямой   | 28   |
| Реклама  | 20   |
| Email    | 10   |
:::
```

### Pie donut

:::chart
[title]Pie Donut · gradient · cross-hatch
[type]pie-donut
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]gradient
[background]cross-hatch
[tooltip]default
[legend]circle

| Браузер | Доля |
|---------|------|
| Chrome  | 63   |
| Firefox | 10   |
| Safari  | 27   |
:::

```markdown
:::chart
[title]Pie Donut · gradient · cross-hatch
[type]pie-donut
[colors]#8b5cf6, #22d3ee, #f59e0b
[design]gradient
[background]cross-hatch
[tooltip]default
[legend]circle

| Браузер | Доля |
|---------|------|
| Chrome  | 63   |
| Firefox | 10   |
| Safari  | 27   |
:::
```

### Radar

:::chart
[title]Radar · lines · dots
[type]radar
[colors]#8b5cf6, #22d3ee
[design]lines
[background]dots
[tooltip]frosted
[legend]rounded-square

| Навык | Frontend | Backend |
|-------|----------|---------|
| TS    | 90       | 60      |
| Python| 40       | 95      |
| UI    | 88       | 42      |
| DB    | 55       | 85      |
:::

```markdown
:::chart
[title]Radar · lines · dots
[type]radar
[colors]#8b5cf6, #22d3ee
[design]lines
[background]dots
[tooltip]frosted
[legend]rounded-square

| Навык | Frontend | Backend |
|-------|----------|---------|
| TS    | 90       | 60      |
| Python| 40       | 95      |
| UI    | 88       | 42      |
| DB    | 55       | 85      |
:::
```

## Все дизайны серий `[design]`

### default

:::chart
[title]Design default
[type]bar
[colors]#8b5cf6, #22d3ee
[design]default

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design default
[type]bar
[colors]#8b5cf6, #22d3ee
[design]default

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

### gradient

:::chart
[title]Design gradient
[type]area
[colors]#8b5cf6, #22d3ee
[design]gradient
[curve]monotoneX

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design gradient
[type]area
[colors]#8b5cf6, #22d3ee
[design]gradient
[curve]monotoneX

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

### hatched

:::chart
[title]Design hatched
[type]bar
[colors]#8b5cf6, #22d3ee
[design]hatched

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design hatched
[type]bar
[colors]#8b5cf6, #22d3ee
[design]hatched

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

### duotone

:::chart
[title]Design duotone
[type]bar
[colors]#8b5cf6, #22d3ee
[design]duotone

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design duotone
[type]bar
[colors]#8b5cf6, #22d3ee
[design]duotone

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

### duotone-reverse

:::chart
[title]Design duotone-reverse
[type]bar
[colors]#8b5cf6, #22d3ee
[design]duotone-reverse

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design duotone-reverse
[type]bar
[colors]#8b5cf6, #22d3ee
[design]duotone-reverse

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

### stripped

:::chart
[title]Design stripped
[type]bar
[colors]#8b5cf6, #22d3ee
[design]stripped

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design stripped
[type]bar
[colors]#8b5cf6, #22d3ee
[design]stripped

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

### solid

:::chart
[title]Design solid
[type]area
[colors]#8b5cf6, #22d3ee
[design]solid

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design solid
[type]area
[colors]#8b5cf6, #22d3ee
[design]solid

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

### dotted

:::chart
[title]Design dotted
[type]area
[colors]#8b5cf6, #22d3ee
[design]dotted

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design dotted
[type]area
[colors]#8b5cf6, #22d3ee
[design]dotted

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

### lines

:::chart
[title]Design lines
[type]radar
[colors]#8b5cf6, #22d3ee
[design]lines

| Метрика | A | B |
|---------|---|---|
| UX      | 82| 76|
| API     | 68| 88|
| DX      | 90| 72|
:::

```markdown
:::chart
[title]Design lines
[type]radar
[colors]#8b5cf6, #22d3ee
[design]lines

| Метрика | A | B |
|---------|---|---|
| UX      | 82| 76|
| API     | 68| 88|
| DX      | 90| 72|
:::
```

### glowing

:::chart
[title]Design glowing
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[curve]monotoneX

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::

```markdown
:::chart
[title]Design glowing
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[curve]monotoneX

| Период | A | B |
|--------|---|---|
| Q1     | 32| 24|
| Q2     | 48| 36|
| Q3     | 41| 52|
:::
```

## Все фоны `[background]`

### dots

:::chart
[title]Background dots
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]dots

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background dots
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]dots

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### grid

:::chart
[title]Background grid
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]grid

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background grid
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]grid

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### cross-hatch

:::chart
[title]Background cross-hatch
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]cross-hatch

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background cross-hatch
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]cross-hatch

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### diagonal-lines

:::chart
[title]Background diagonal-lines
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]diagonal-lines

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background diagonal-lines
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]diagonal-lines

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### tiny-checkers

:::chart
[title]Background tiny-checkers
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]tiny-checkers

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background tiny-checkers
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]tiny-checkers

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### plus

:::chart
[title]Background plus
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]plus

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background plus
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]plus

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### bubbles

:::chart
[title]Background bubbles
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]bubbles

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background bubbles
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]bubbles

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### wiggle-lines

:::chart
[title]Background wiggle-lines
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]wiggle-lines

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background wiggle-lines
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]wiggle-lines

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### falling-triangles

:::chart
[title]Background falling-triangles
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]falling-triangles

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background falling-triangles
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]falling-triangles

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### overlapping-circles

:::chart
[title]Background overlapping-circles
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]overlapping-circles

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background overlapping-circles
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]overlapping-circles

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

### 4-pointed-star

:::chart
[title]Background 4-pointed-star
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]4-pointed-star

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::

```markdown
:::chart
[title]Background 4-pointed-star
[type]line
[colors]#8b5cf6, #22d3ee
[design]glowing
[background]4-pointed-star

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
| Ср   | 15| 24|
:::
```

## Tooltip variants

### default

:::chart
[title]Tooltip default
[type]bar
[colors]#8b5cf6, #22d3ee
[tooltip]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Tooltip default
[type]bar
[colors]#8b5cf6, #22d3ee
[tooltip]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

### glass

:::chart
[title]Tooltip glass
[type]bar
[colors]#8b5cf6, #22d3ee
[tooltip]glass

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Tooltip glass
[type]bar
[colors]#8b5cf6, #22d3ee
[tooltip]glass

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

### frosted

:::chart
[title]Tooltip frosted
[type]bar
[colors]#8b5cf6, #22d3ee
[tooltip]frosted

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Tooltip frosted
[type]bar
[colors]#8b5cf6, #22d3ee
[tooltip]frosted

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

### minimal

:::chart
[title]Tooltip minimal
[type]bar
[colors]#8b5cf6, #22d3ee
[tooltip]minimal

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Tooltip minimal
[type]bar
[colors]#8b5cf6, #22d3ee
[tooltip]minimal

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

## Legend variants

### circle

:::chart
[title]Legend circle
[type]line
[colors]#8b5cf6, #22d3ee
[legend]circle
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Legend circle
[type]line
[colors]#8b5cf6, #22d3ee
[legend]circle
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

### square

:::chart
[title]Legend square
[type]line
[colors]#8b5cf6, #22d3ee
[legend]square
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Legend square
[type]line
[colors]#8b5cf6, #22d3ee
[legend]square
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

### rounded-square

:::chart
[title]Legend rounded-square
[type]line
[colors]#8b5cf6, #22d3ee
[legend]rounded-square
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Legend rounded-square
[type]line
[colors]#8b5cf6, #22d3ee
[legend]rounded-square
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

### circle-outline

:::chart
[title]Legend circle-outline
[type]line
[colors]#8b5cf6, #22d3ee
[legend]circle-outline
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Legend circle-outline
[type]line
[colors]#8b5cf6, #22d3ee
[legend]circle-outline
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

### rounded-square-outline

:::chart
[title]Legend rounded-square-outline
[type]line
[colors]#8b5cf6, #22d3ee
[legend]rounded-square-outline
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::

```markdown
:::chart
[title]Legend rounded-square-outline
[type]line
[colors]#8b5cf6, #22d3ee
[legend]rounded-square-outline
[design]glowing

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 18| 20|
:::
```

## Curve variants

### linear

:::chart
[title]Curve linear
[type]line
[colors]#8b5cf6, #22d3ee
[curve]linear
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::

```markdown
:::chart
[title]Curve linear
[type]line
[colors]#8b5cf6, #22d3ee
[curve]linear
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::
```

### monotone

:::chart
[title]Curve monotone
[type]line
[colors]#8b5cf6, #22d3ee
[curve]monotone
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::

```markdown
:::chart
[title]Curve monotone
[type]line
[colors]#8b5cf6, #22d3ee
[curve]monotone
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::
```

### monotoneX

:::chart
[title]Curve monotoneX
[type]line
[colors]#8b5cf6, #22d3ee
[curve]monotoneX
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::

```markdown
:::chart
[title]Curve monotoneX
[type]line
[colors]#8b5cf6, #22d3ee
[curve]monotoneX
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::
```

### step

:::chart
[title]Curve step
[type]line
[colors]#8b5cf6, #22d3ee
[curve]step
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::

```markdown
:::chart
[title]Curve step
[type]line
[colors]#8b5cf6, #22d3ee
[curve]step
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::
```

### bump

:::chart
[title]Curve bump
[type]line
[colors]#8b5cf6, #22d3ee
[curve]bump
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::

```markdown
:::chart
[title]Curve bump
[type]line
[colors]#8b5cf6, #22d3ee
[curve]bump
[design]default

| День | A | B |
|------|---|---|
| Пн   | 12| 16|
| Вт   | 24| 20|
| Ср   | 16| 28|
:::
```