# BlurText - Анимированный текст

<uic-component id="blur-text" name="BlurText" />

## Основное использование

Этот компонент создает красивую анимацию текста с эффектом размытия.

### Примеры:

**По словам:**
```tsx
<BlurText
  text="Это красиво выглядит"
  delay={200}
  animateBy="words"
  direction="top"
/>
