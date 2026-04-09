---
title: "Печатание текста"
description: Эффект печатающей машинки на GSAP. Поддерживает массив строк, удаление, переменную скорость, цвета и кастомный курсор.
author: davidhdev
date: 2026-03-22
tags: разработка, ui, ui-компоненты
keywords: typewriter effect, typing animation, gsap cursor
robots: index, follow
lang: ru
---

[uic:text-type]

Эффект печатающей машинки. Печатает текст посимвольно, делает паузу, удаляет и переходит к следующей строке. Курсор мигает через GSAP. Поддерживает массив строк, переменную скорость и запуск по IntersectionObserver.

---

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `gsap` | `^3.12` | Анимация мигания курсора |
| `react` | `^18` или `^19` | Базовый фреймворк |

```bash
npm install gsap
```

---

## Использование

```tsx
import TextType from '@/features/ui-components/text-type/TextType';

// Одна строка
<TextType text="Привет, мир!" typingSpeed={60} />

// Массив строк с зацикливанием
<TextType
  text={['Разработчик', 'Дизайнер', 'Творец']}
  typingSpeed={80}
  deletingSpeed={40}
  pauseDuration={1500}
  loop
/>

// Кастомный курсор без мигания во время печати
<TextType
  text="Печатаю текст..."
  cursorCharacter="_"
  hideCursorWhileTyping
  className="text-2xl font-mono"
/>

// Запуск при появлении в области видимости
<TextType
  text="Появляюсь при скролле"
  startOnVisible
  initialDelay={300}
/>
```

## Оригинальный код

```tsx
'use client';

import { ElementType, useEffect, useRef, useState, createElement, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';

interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string | React.ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
}

const TextType = ({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: TextTypeProps & React.HTMLAttributes<HTMLElement>) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return 'inherit';
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout>;

    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return;
          }

          if (onSentenceComplete) {
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          }

          setCurrentTextIndex(prev => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText(prev => prev + processedText[currentCharIndex]);
              setCurrentCharIndex(prev => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed
          );
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping && (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `inline-block whitespace-pre-wrap tracking-tight ${className}`,
      ...props
    },
    <span className="inline" style={{ color: getCurrentTextColor() || 'inherit' }}>
      {displayedText}
    </span>,
    showCursor && (
      <span
        ref={cursorRef}
        className={`ml-1 inline-block opacity-100 ${shouldHideCursor ? 'hidden' : ''} ${cursorClassName}`}
      >
        {cursorCharacter}
      </span>
    )
  );
};

export default TextType;
```


## Адаптированный код под проекты opensophy

```tsx
import { ElementType, useEffect, useRef, useState, createElement, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';

interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  text?: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
}

const TextType = ({
  text = 'Привет, мир!',
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: TextTypeProps & React.HTMLAttributes<HTMLElement>) => {
  const [displayedText, setDisplayedText]       = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting]             = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible]               = useState(!startOnVisible);
  const cursorRef    = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return 'inherit';
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;
    const observer = new IntersectionObserver(
      entries => { entries.forEach(entry => { if (entry.isIntersecting) setIsVisible(true); }); },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout>;

    const currentText    = textArray[currentTextIndex];
    const processedText  = reverseMode ? currentText.split('').reverse().join('') : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) return;
          if (onSentenceComplete) onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          setCurrentTextIndex(prev => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev + processedText[currentCharIndex]);
            setCurrentCharIndex(prev => prev + 1);
          }, variableSpeed ? getRandomSpeed() : typingSpeed);
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => { setIsDeleting(true); }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
  }, [
    currentCharIndex, displayedText, isDeleting,
    typingSpeed, deletingSpeed, pauseDuration,
    textArray, currentTextIndex, loop, initialDelay,
    isVisible, reverseMode, variableSpeed, onSentenceComplete,
    getRandomSpeed,
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping && (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `inline-block whitespace-pre-wrap tracking-tight ${className}`,
      ...props,
    },
    <span className="inline" style={{ color: getCurrentTextColor() || 'inherit' }}>
      {displayedText}
    </span>,
    showCursor && (
      <span
        ref={cursorRef}
        className={`ml-1 inline-block opacity-100 ${shouldHideCursor ? 'hidden' : ''} ${cursorClassName}`}
      >
        {cursorCharacter}
      </span>
    )
  );
};

export default TextType;
```


---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `text` | `string \| string[]` | `'Привет, мир!'` | Текст или массив строк |
| `typingSpeed` | `number` | `50` | Скорость печати в мс на символ |
| `deletingSpeed` | `number` | `30` | Скорость удаления в мс на символ |
| `pauseDuration` | `number` | `2000` | Пауза после завершения строки в мс |
| `initialDelay` | `number` | `0` | Задержка перед началом в мс |
| `loop` | `boolean` | `true` | Зациклить анимацию |
| `showCursor` | `boolean` | `true` | Показывать курсор |
| `cursorCharacter` | `string` | `'\|'` | Символ курсора |
| `cursorBlinkDuration` | `number` | `0.5` | Скорость мигания курсора в секундах |
| `hideCursorWhileTyping` | `boolean` | `false` | Скрывать курсор во время печати |
| `cursorClassName` | `string` | `''` | CSS классы для курсора |
| `reverseMode` | `boolean` | `false` | Печатать текст задом наперёд |
| `startOnVisible` | `boolean` | `false` | Запускать при попадании в область видимости |
| `textColors` | `string[]` | `[]` | Цвет для каждой строки по очереди |
| `variableSpeed` | `{ min: number; max: number }` | — | Случайная скорость печати в диапазоне |
| `as` | `ElementType` | `'div'` | HTML тег обёртки |
| `className` | `string` | `''` | CSS классы |
| `onSentenceComplete` | `(sentence, index) => void` | — | Колбэк после завершения строки |