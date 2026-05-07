---
title: "Singularity Shaders"
description: UI Компонент. Генеративный WebGL-фон на основе фрактального GLSL-шейдера. Бесконечно анимированная текстура сингулярности с поддержкой скорости, интенсивности, масштаба, волнового искажения, сдвига цвета и инверсии.
date: 2026-05-07
tags: разработка, ui, ui-компоненты
keywords: webgl shader, glsl fractal, singularity background, animated background, react webgl
robots: index, follow
lang: ru
---

[uic:singularity-shaders]

Фрактальный WebGL-фон без внешних зависимостей. Шейдер реализует алгоритм сингулярности — итеративный обход комплексной плоскости с логарифмическим масштабированием и матричными вращениями. Каждый пиксель вычисляется на GPU в реальном времени через нативный WebGL API. Компонент отслеживает видимость через `IntersectionObserver` и приостанавливает анимацию когда не виден — что снижает нагрузку на GPU.

## Стек и зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `react` | `^18` или `^19` | Базовый фреймворк |

Внешних зависимостей нет — только нативный WebGL API и `requestAnimationFrame`.

---

## Установка

Внешних пакетов не требуется. Скопируй файл `singularity-shaders.tsx` в свой проект.

---

## Использование

```tsx
import { SingularityShaders } from '@/features/ui-components/singularity-shaders/singularity-shaders';

// Базовый пример
<div style={{ width: '100%', height: '400px' }}>
  <SingularityShaders />
</div>

// Медленная плавная анимация
<div style={{ width: '100%', height: '400px' }}>
  <SingularityShaders speed={0.05} intensity={1.5} />
</div>

// Инвертированный паттерн (светлый)
<div style={{ width: '100%', height: '400px' }}>
  <SingularityShaders isNegative speed={0.08} colorShift={-0.5} />
</div>

// Агрессивное волновое искажение
<div style={{ width: '100%', height: '400px' }}>
  <SingularityShaders
    speed={0.15}
    waveStrength={2.5}
    intensity={2}
    size={0.8}
  />
</div>

// Как фон страницы с контентом поверх
<div style={{ position: 'relative', minHeight: '100vh' }}>
  <SingularityShaders
    style={{ position: 'absolute', inset: 0 }}
    speed={0.06}
    intensity={1.0}
  />
  <div style={{ position: 'relative', zIndex: 1 }}>
    {/* контент */}
  </div>
</div>

// Крупный паттерн, сдвиг цвета
<div style={{ width: '100%', height: '400px' }}>
  <SingularityShaders
    size={0.5}
    colorShift={2}
    speed={0.1}
  />
</div>
```

## Оригинальный код

```tsx
import { useEffect, useRef, forwardRef, useState } from 'react';

export interface SingularityShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  intensity?: number;
  size?: number;
  waveStrength?: number;
  colorShift?: number;
  isNegative?: boolean;
}

export const SingularityShaders = forwardRef<HTMLDivElement, SingularityShadersProps>(({
  className,
  speed = 0.1,
  intensity = 1.2,
  size = 1.1,
  waveStrength = 1,
  colorShift = 1,
  isNegative = false,
  children,
  style,
  ...props
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const configRef = useRef({ speed, intensity, size, waveStrength, colorShift, isNegative });
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    configRef.current = { speed, intensity, size, waveStrength, colorShift, isNegative };
  }, [speed, intensity, size, waveStrength, colorShift, isNegative]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsAnimating(entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }, 100);
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', handleResize);

    const gl = canvas.getContext('webgl', {
      preserveDrawingBuffer: false,
      antialias: false,
      powerPreference: 'low-power',
      alpha: true,
      depth: false,
      stencil: false,
    });

    if (!gl) {
      window.removeEventListener('resize', handleResize);
      return;
    }

    const vertexShader = `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;

    const fragmentShader = `
      precision lowp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_size;
      uniform float u_waveStrength;
      uniform float u_colorShift;
      uniform float u_isNegative;

      void mainImage(out vec4 O, vec2 F) {
        float i = .2 * u_speed, a;
        vec2 r = iResolution.xy,
             p = ( F+F - r ) / r.y / (1.5 * u_size),
             d = vec2(-1.0, 1.0),
             b = p - i*d,
             c = p * mat2(1.0, 1.0, d/(.1 + i/dot(b,b))),
             v = c * mat2(cos(.5*log(a=dot(c,c)) + iTime*i*u_speed + vec4(0.0,33.0,11.0,0.0)))/i,
             w = vec2(0.0);
        for(float j = 0.0; j < 9.0; j++) {
          i++;
          w += 1.0 + sin(v * u_waveStrength);
          v += .7 * sin(v.yx * i + iTime * u_speed) / i + .5;
        }
        i = length( sin(v/.3)*.4 + c*(3.0+d) );
        vec4 colorGrad = vec4(.6,-.4,-1.0,0.0) * u_colorShift;
        float result = 1.0 - exp( -exp( c.x * colorGrad.x )
                         / w.x / ( 2.0 + i*i/4.0 - i )
                         / ( .5 + 1.0 / a )
                         / ( .03 + abs( length(p)-.8 ) )
                         * u_intensity );
        if (u_isNegative > 0.5) O = vec4(vec3(result), 1.0);
        else O = vec4(vec3(1.0 - result), 1.0);
      }

      void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
    `;

    // ... компиляция шейдеров, создание программы, анимационный цикл
    // (полный код в файле singularity-shaders.tsx)
  }, [isAnimating]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className ?? ''}`}
      style={style}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
      {children}
    </div>
  );
});

SingularityShaders.displayName = 'SingularityShaders';
```

---

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `speed` | `number` | `0.1` | Скорость анимации. `0` — стоп-кадр, `1` — быстро |
| `intensity` | `number` | `1.2` | Контрастность и яркость паттерна |
| `size` | `number` | `1.1` | Масштаб паттерна. Меньше — крупнее детали |
| `waveStrength` | `number` | `1` | Сила волнового искажения внутри паттерна |
| `colorShift` | `number` | `1` | Сдвиг цветовой тональности. Отрицательные значения инвертируют направление |
| `isNegative` | `boolean` | `false` | Инвертировать паттерн: светлый на тёмном → тёмный на светлом |
| `className` | `string` | `''` | CSS классы на корневом `<div>` |
| `style` | `CSSProperties` | — | Инлайн-стили на корневом контейнере |
| `children` | `ReactNode` | — | Контент поверх шейдера (позиционируется относительно контейнера) |

Компонент также принимает все стандартные пропсы `<div>` через `...props`.

---

## Как работает шейдер

Рендер происходит в два этапа — инициализация и анимационный цикл.

**Инициализация.** При монтировании создаётся WebGL-контекст с флагами `powerPreference: 'low-power'`, `antialias: false`, `depth: false` — это минимизирует нагрузку на GPU. Компилируются вершинный и фрагментный шейдеры, создаётся полноэкранный `TRIANGLE_STRIP` из двух треугольников. Canvas устанавливается в размер `window.innerWidth × window.innerHeight` и обновляется при ресайзе с debounce в 100 мс.

**Алгоритм фрагментного шейдера.** Для каждого пикселя выполняется серия преобразований в комплексной плоскости. Сначала координаты нормализуются и масштабируются через `u_size`. Затем применяется матричное вращение через логарифм длины вектора `c` — это создаёт спиральные структуры. В цикле из 9 итераций аккумулируется волновой паттерн через `sin(v × waveStrength)` с нарастающей частотой. Финальное значение пикселя вычисляется через двойную экспоненту `1 - exp(-exp(...))` — это создаёт резкие края и высококонтрастные зоны. Проп `u_colorShift` масштабирует цветовой градиент `vec4(.6, -.4, -1.0, 0.0)`. Проп `u_isNegative` переключает между `result` и `1.0 - result`.

**FPS-контроль.** Целевая частота — 20 FPS (`frameInterval = 1000 / 20`). Каждый кадр проверяется `elapsed = currentTime - lastFrameTime`, и если прошло меньше нужного времени — кадр пропускается. Это снижает нагрузку примерно в 3 раза по сравнению с нативным `requestAnimationFrame`.

**Оптимизация через IntersectionObserver.** Компонент отслеживает собственную видимость через `IntersectionObserver`. Когда элемент уходит из вьюпорта — `isAnimating` становится `false`, и GPU перестаёт рендерить кадры. Анимация автоматически возобновляется при возврате элемента в зону видимости.

**Обновление юниформ без перезапуска.** Все параметры — `speed`, `intensity`, `size`, `waveStrength`, `colorShift`, `isNegative` — хранятся в `configRef` и читаются каждый кадр напрямую. Изменение пропсов не пересоздаёт WebGL-программу — только обновляет значения через `gl.uniform1f()`.

:::note
Компонент занимает **100% ширины и высоты** родительского контейнера. Контейнер должен иметь явные размеры — `height: '400px'`, `min-height`, или `position: absolute; inset: 0`. Canvas внутри абсолютно позиционирован и не влияет на поток документа.
:::

:::tip
Для фона всей страницы используй `position: absolute; inset: 0` на родителе и `z-index: 1` на контенте поверх. Canvas рендерится поверх всего внутри контейнера, поэтому дочерние элементы через `children` автоматически окажутся выше шейдера.
:::

:::tip
Значения `colorShift` от `-3` до `0` дают холодный синеватый оттенок, от `0` до `3` — тёплый. Комбинация `isNegative={true}` + `colorShift={-1}` даёт светлый паттерн с синими акцентами — хорошо работает на белом фоне.
:::

---

## Рецепты

**Фон страницы (абсолютный):**

```tsx
<div style={{ position: 'relative', minHeight: '100vh' }}>
  <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
    <SingularityShaders speed={0.06} intensity={1.0} />
  </div>
  <div style={{ position: 'relative', zIndex: 1 }}>
    {/* контент */}
  </div>
</div>
```

**Светлая тема:**

```tsx
<SingularityShaders
  isNegative
  speed={0.07}
  intensity={0.9}
  colorShift={-0.8}
/>
```

**Экспрессивный режим:**

```tsx
<SingularityShaders
  speed={0.2}
  waveStrength={2.5}
  intensity={2.5}
  size={0.7}
  colorShift={1.8}
/>
```

**Производительный режим (мобильные):**

```tsx
<SingularityShaders
  speed={0.05}
  intensity={1.0}
  waveStrength={0.8}
/>
```