/**
 * ScrollFloatPreview — обёртка для UIComponentViewer.
 *
 * Проблема: ScrollTrigger привязывается к window, но в PreviewPanel
 * элемент уже в видимой зоне и scrub: true без реального скролла ничего не делает.
 *
 * Решение: обёртка создаёт внутренний скролл-контейнер с достаточной
 * высотой чтобы компонент можно было проскроллить до нужного места.
 * Передаём ref этого контейнера в ScrollFloat.
 */

import React, { useRef } from 'react';
import ScrollFloat from './scroll-float';

interface ScrollFloatPreviewProps {
  children?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
  containerClassName?: string;
  textClassName?: string;
}

const ScrollFloatPreview: React.FC<ScrollFloatPreviewProps> = ({
  children = 'Scroll Float',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  containerClassName = '',
  textClassName = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Подсказка */}
      <div style={{
        fontSize: 11,
        color: 'rgba(128,128,128,0.7)',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'ui-monospace, monospace',
        letterSpacing: '0.04em',
      }}>
        ↓ прокрути внутри блока
      </div>

      {/* Скролл-контейнер */}
      <div
        ref={scrollRef}
        style={{
          height: 320,
          overflowY: 'scroll',
          border: '1px solid rgba(128,128,128,0.15)',
          borderRadius: 10,
          position: 'relative',
          /* Тонкий скроллбар */
          scrollbarWidth: 'thin',
        }}
      >
        {/* Паддинг сверху чтобы компонент был изначально скрыт */}
        <div style={{ height: 260 }} />

        <div style={{ padding: '0 32px' }}>
          <ScrollFloat
            scrollContainerRef={scrollRef as React.RefObject<HTMLElement>}
            animationDuration={animationDuration}
            ease={ease}
            scrollStart={scrollStart}
            scrollEnd={scrollEnd}
            stagger={stagger}
            containerClassName={containerClassName}
            textClassName={textClassName}
          >
            {children}
          </ScrollFloat>
        </div>

        {/* Паддинг снизу */}
        <div style={{ height: 180 }} />
      </div>
    </div>
  );
};

export default ScrollFloatPreview;