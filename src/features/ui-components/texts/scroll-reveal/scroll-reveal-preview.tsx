import React, { useRef } from 'react';
import ScrollReveal from './scroll-reveal';

interface ScrollRevealPreviewProps {
  children?: string;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  containerClassName?: string;
  textClassName?: string;
}

const ScrollRevealPreview: React.FC<ScrollRevealPreviewProps> = ({
  children = 'Текст появляется по мере того как вы прокручиваете страницу вниз.',
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  containerClassName = '',
  textClassName = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ width: '100%' }}>
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

      <div
        ref={scrollRef}
        style={{
          height: 340,
          overflowY: 'scroll',
          border: '1px solid rgba(128,128,128,0.15)',
          borderRadius: 10,
          scrollbarWidth: 'thin',
        }}
      >
        <div style={{ height: 280 }} />

        <div style={{ padding: '0 28px' }}>
          <ScrollReveal
            scrollContainerRef={scrollRef as React.RefObject<HTMLElement>}
            enableBlur={enableBlur}
            baseOpacity={baseOpacity}
            baseRotation={baseRotation}
            blurStrength={blurStrength}
            rotationEnd={rotationEnd}
            wordAnimationEnd={wordAnimationEnd}
            containerClassName={containerClassName}
            textClassName={textClassName}
          >
            {children}
          </ScrollReveal>
        </div>

        <div style={{ height: 220 }} />
      </div>
    </div>
  );
};

export default ScrollRevealPreview;