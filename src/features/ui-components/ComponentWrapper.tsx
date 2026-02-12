import React, { useMemo, CSSProperties } from 'react';
import type { UniversalProps } from './types';

interface ComponentWrapperProps extends UniversalProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Обертка для применения универсальных пропсов к любому компоненту
 * Применяет трансформации, цвета, размеры без изменения самого компонента
 */
export const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  children,
  className = '',
  enableUniversalProps = true,
  // Цвет
  color,
  colorMode = 'original',
  gradientFrom,
  gradientTo,
  gradientAngle = 45,
  // Размер
  scale = 1,
  width,
  height,
  // Вращение
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  perspective = 1000,
  // Позиционирование
  justifyContent = 'center',
  alignItems = 'center',
  // Скорость (передается через CSS переменную)
  animationSpeed = 1,
  // Прозрачность
  opacity = 1,
  // Фильтры
  blur = 0,
  brightness = 1,
  contrast = 1,
  saturate = 1,
}) => {
  const containerStyle = useMemo<CSSProperties>(() => {
    return {
      display: 'flex',
      justifyContent,
      alignItems,
      width: width || '100%',
      height: height || '100%',
      perspective: perspective ? `${perspective}px` : undefined,
    };
  }, [
    justifyContent,
    alignItems,
    width,
    height,
    perspective,
  ]);

  const contentStyle = useMemo<CSSProperties>(() => {
    if (!enableUniversalProps) {
      return {};
    }

    // Вычисляем transform только один раз
    const transformParts = [
      scale === 1 ? '' : `scale(${scale})`,
      rotateX === 0 ? '' : `rotateX(${rotateX}deg)`,
      rotateY === 0 ? '' : `rotateY(${rotateY}deg)`,
      rotateZ === 0 ? '' : `rotateZ(${rotateZ}deg)`,
    ].filter(Boolean);

    // Вычисляем filters только один раз
    const filterParts = [
      blur === 0 ? '' : `blur(${blur}px)`,
      brightness === 1 ? '' : `brightness(${brightness})`,
      contrast === 1 ? '' : `contrast(${contrast})`,
      saturate === 1 ? '' : `saturate(${saturate})`,
    ].filter(Boolean);

    // Применение цвета
    let colorStyle: CSSProperties = {};
    if (colorMode === 'solid' && color) {
      colorStyle.color = color;
    } else if (colorMode === 'gradient' && gradientFrom && gradientTo) {
      colorStyle.background = `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`;
      colorStyle.WebkitBackgroundClip = 'text';
      colorStyle.WebkitTextFillColor = 'transparent';
      colorStyle.backgroundClip = 'text';
    }

    return {
      transform: transformParts.length > 0 ? transformParts.join(' ') : undefined,
      filter: filterParts.length > 0 ? filterParts.join(' ') : undefined,
      opacity,
      transition: 'all 0.3s ease-out',
      // @ts-ignore - CSS переменная для управления скоростью анимации
      '--animation-speed-multiplier': animationSpeed,
      ...colorStyle,
    };
  }, [
    enableUniversalProps,
    scale,
    rotateX,
    rotateY,
    rotateZ,
    blur,
    brightness,
    contrast,
    saturate,
    opacity,
    animationSpeed,
    color,
    colorMode,
    gradientFrom,
    gradientTo,
    gradientAngle,
  ]);

  return (
    <div style={containerStyle} className={className}>
      <div style={contentStyle}>{children}</div>
    </div>
  );
};