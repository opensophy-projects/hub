---
title: "BlurText Component - Анимированный текст с эффектом размытия"
description: Open-source React компонент для создания красивой анимации текста с эффектом размытия и появления. Поддержка TypeScript, Framer Motion и гибкая настройка.
type: docs
category: UI Components
author: veilosophy
date: 2026-02-06
tags: React, UI, компоненты, анимация, TypeScript, Framer Motion, BlurText
keywords: React компоненты, анимация текста, blur эффект, UI компоненты, Framer Motion, TypeScript
bannercolor: #6366f1
bannertext: BlurText Component
canonical: null
robots: index, follow
lang: ru
---

## Введение

**BlurText** — это мощный React компонент для создания впечатляющей анимации текста с эффектом размытия и плавного появления. Компонент идеально подходит для создания современных веб-интерфейсов с динамичными заголовками и текстовыми блоками.

## Ключевые особенности

- ✨ **Плавная анимация** — текст появляется с эффектом размытия
- 🎯 **Два режима анимации** — по словам или по буквам
- 👁️ **IntersectionObserver** — анимация запускается при появлении в зоне видимости
- 🎨 **Гибкая настройка** — направление, эазинг, задержки
- 📦 **TypeScript** — полная типизация из коробки
- ⚡ **Легковесный** — использует Framer Motion
- 🔄 **Callback поддержка** — отслеживание завершения анимации

---

## Демонстрация компонента

> **Интерактивный просмотр**
> Ниже вы можете увидеть компонент в действии, просмотреть его код и файлы.

[uic:blur-text]

---

## Установка

Компонент использует **Framer Motion** для анимаций. Убедитесь, что библиотека установлена:

```bash
npm install framer-motion
```

Затем скопируйте файлы компонента в ваш проект:

```
src/components/BlurText/
  ├── BlurText.tsx
  └── types.ts
```

---

## Основное использование

### Простой пример

```tsx
import BlurText from '@/components/BlurText/BlurText';

export default function Hero() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <BlurText
        text="Добро пожаловать в будущее веб-дизайна"
        className="text-4xl font-bold"
      />
    </div>
  );
}
```

### Анимация по буквам

```tsx
<BlurText
  text="Hello World"
  animateBy="letters"
  delay={50}
  className="text-6xl font-extrabold"
/>
```

### Анимация снизу вверх

```tsx
<BlurText
  text="Впечатляющий текст"
  direction="bottom"
  delay={150}
  className="text-3xl"
/>
```

---

## Props (Свойства)

| Свойство | Тип | По умолчанию | Описание |
| :--- | :--- | :--- | :--- |
| **text** | `string` | `''` | Текст для анимации |
| **delay** | `number` | `200` | Задержка между элементами (мс) |
| **className** | `string` | `''` | CSS классы для стилизации |
| **animateBy** | `'words' \| 'letters'` | `'words'` | Режим анимации: по словам или буквам |
| **direction** | `'top' \| 'bottom'` | `'top'` | Направление появления текста |
| **threshold** | `number` | `0.1` | Порог видимости для запуска (0-1) |
| **rootMargin** | `string` | `'0px'` | Отступ для IntersectionObserver |
| **animationFrom** | `Record<string, string \| number>` | `undefined` | Начальное состояние анимации |
| **animationTo** | `Array<Record<string, string \| number>>` | `undefined` | Промежуточные состояния |
| **easing** | `Easing \| Easing[]` | `linear` | Функция плавности анимации |
| **onAnimationComplete** | `() => void` | `undefined` | Callback при завершении |
| **stepDuration** | `number` | `0.35` | Длительность одного шага (сек) |

---

## Продвинутые примеры

### Кастомная анимация

```tsx
<BlurText
  text="Кастомный эффект"
  animationFrom={{
    filter: 'blur(20px)',
    opacity: 0,
    scale: 0.8
  }}
  animationTo={[
    { filter: 'blur(10px)', opacity: 0.5, scale: 0.9 },
    { filter: 'blur(0px)', opacity: 1, scale: 1 }
  ]}
  easing={[0.22, 1, 0.36, 1]}
  className="text-5xl font-black"
/>
```

### С callback функцией

```tsx
<BlurText
  text="Анимация с событием"
  onAnimationComplete={() => {
    console.log('Анимация завершена!');
    // Ваша логика здесь
  }}
  className="text-3xl"
/>
```

### Медленная анимация по буквам

```tsx
<BlurText
  text="Медленная красота"
  animateBy="letters"
  delay={100}
  stepDuration={0.5}
  className="text-4xl tracking-wider"
/>
```

---

## Технические детали

### Как работает компонент?

1. **IntersectionObserver** отслеживает появление элемента в viewport
2. При достижении порога видимости запускается анимация
3. Текст разбивается на слова или буквы (в зависимости от `animateBy`)
4. Каждый элемент анимируется с заданной задержкой
5. Используется **Framer Motion** для плавных переходов

### Оптимизация производительности

Компонент использует:
- `willChange` для оптимизации GPU
- `IntersectionObserver` для ленивой загрузки анимации
- `useMemo` для мемоизации конфигурации
- Автоматическое отключение observer после срабатывания

---

## Частые вопросы

### Как изменить скорость анимации?

Используйте комбинацию `delay` (задержка между элементами) и `stepDuration` (длительность перехода):

```tsx
<BlurText
  text="Быстрая анимация"
  delay={50}        // быстрее запускаются элементы
  stepDuration={0.2} // быстрее выполняется переход
/>
```

### Можно ли использовать с Tailwind CSS?

Да! Компонент полностью совместим с Tailwind:

```tsx
<BlurText
  text="Styled with Tailwind"
  className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
/>
```

### Как сделать анимацию только один раз?

Компонент автоматически анимируется только при первом появлении благодаря `observer.unobserve()` после срабатывания.

---

## Совместимость

| Технология | Версия | Статус |
| :--- | :--- | :--- |
| React | 18+ | ✅ Полностью поддерживается |
| TypeScript | 4.5+ | ✅ Полная типизация |
| Framer Motion | 10+ | ✅ Требуется |
| Next.js | 13+ | ✅ App Router & Pages |

---

## Лицензия

Компонент распространяется как **open-source** под лицензией MIT. Вы можете свободно использовать его в коммерческих и некоммерческих проектах.

---

## Заключение

**BlurText** — это простой, но мощный компонент для создания впечатляющих текстовых анимаций. Он идеально подходит для:

- Заголовков на landing pages
- Героических секций
- Презентаций и портфолио
- Интерактивных веб-приложений

Попробуйте компонент в своих проектах и создавайте захватывающие пользовательские интерфейсы! 🚀
