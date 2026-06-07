import { type MotionProps, motion } from 'framer-motion';
import type * as React from 'react';

interface LineShadowTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>,
    MotionProps {
  shadowColor?: string;
  as?: React.ElementType;
}

function LineShadowText({
  children,
  shadowColor = 'black',
  className = '',
  as: Component = 'span',
  ...props
}: LineShadowTextProps) {
  const MotionComponent = motion.create(Component as React.ElementType);

  const content = typeof children === 'string' ? children : null;
  if (!content) {
    throw new Error('LineShadowText only accepts string content');
  }

  return (
    <MotionComponent
      className={`relative z-0 inline-flex line-shadow-text ${className}`}
      data-text={content}
      style={
        {
          '--shadow-color': shadowColor,
          position: 'relative',
          display: 'inline-flex',
          zIndex: 0,
        } as React.CSSProperties
      }
      {...(props as MotionProps)}
    >
      {content}
      {/* Псевдоэлемент через реальный span, т.к. CSS ::after не читает CSS-переменные в bg-clip-text без конфигурации */}
      <span
        aria-hidden="true"
        data-shadow={content}
        style={{
          position: 'absolute',
          left: '0.04em',
          top: '0.04em',
          zIndex: -1,
          content: `attr(data-shadow)`,
          backgroundImage: `linear-gradient(45deg, transparent 45%, ${shadowColor} 45%, ${shadowColor} 55%, transparent 0)`,
          backgroundSize: '0.06em 0.06em',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          pointerEvents: 'none',
          userSelect: 'none',
          animation: 'line-shadow 3s linear infinite',
        }}
      >
        {content}
      </span>
    </MotionComponent>
  );
}

export { LineShadowText, type LineShadowTextProps };
export default LineShadowText;