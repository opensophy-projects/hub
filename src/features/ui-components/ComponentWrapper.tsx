import React, { useMemo, CSSProperties } from 'react';
import type { UniversalProps } from './types';

interface ComponentWrapperProps extends UniversalProps {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
}

// Вычисляет CSS-трансформации на основе параметров позиции и поворота
function buildTransformParts(offsetX: number, offsetY: number, rotateZ: number): string[] {
  return [
    (offsetX !== 0 || offsetY !== 0) && `translate(${offsetX}px, ${offsetY}px)`,
    rotateZ !== 0 && `rotateZ(${rotateZ}deg)`,
  ].filter(Boolean) as string[];
}

// Вычисляет CSS-фильтры на основе параметров размытия, яркости, контраста и насыщенности
function buildFilterParts(blur: number, brightness: number, contrast: number, saturate: number): string[] {
  return [
    blur !== 0       && `blur(${blur}px)`,
    brightness !== 1 && `brightness(${brightness})`,
    contrast !== 1   && `contrast(${contrast})`,
    saturate !== 1   && `saturate(${saturate})`,
  ].filter(Boolean) as string[];
}

// Вычисляет стили цвета в зависимости от режима colorMode
function buildColorStyle(
  colorMode: string,
  color: string | undefined,
  gradientFrom: string | undefined,
  gradientTo: string | undefined,
  gradientAngle: number,
  isDark: boolean,
): CSSProperties {
  if (colorMode === 'solid' && color) {
    return { color };
  }

  if (colorMode === 'gradient' && gradientFrom && gradientTo) {
    return {
      background:           `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor:  'transparent',
      backgroundClip:       'text',
    };
  }

  // В режиме original ставим дефолтный цвет по теме —
  // иначе компонент наследует цвет от фона и становится невидимым
  return { color: isDark ? '#e8e8e8' : '#1a1a1a' };
}

// Базовые стили для сглаживания шрифта, общие для всех вариантов
const FONT_SMOOTHING: CSSProperties = {
  WebkitFontSmoothing: 'antialiased' as const,
  MozOsxFontSmoothing: 'grayscale'   as const,
};

export const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  children,
  className = '',
  enableUniversalProps = true,
  isDark = true,
  color,
  colorMode = 'original',
  gradientFrom,
  gradientTo,
  gradientAngle = 45,
  scale = 1,
  width,
  height,
  offsetX = 0,
  offsetY = 0,
  rotateZ = 0,
  justifyContent = 'center',
  alignItems = 'center',
  animationSpeed = 1,
  opacity = 1,
  blur = 0,
  brightness = 1,
  contrast = 1,
  saturate = 1,
}) => {
  const hasTransform = scale !== 1 || offsetX !== 0 || offsetY !== 0 || rotateZ !== 0;
  const hasFilter    = blur !== 0 || brightness !== 1 || contrast !== 1 || saturate !== 1;
  const hasOpacity   = opacity !== 1;
  const hasColor     = (colorMode === 'solid' && !!color) || (colorMode === 'gradient' && !!gradientFrom && !!gradientTo);

  const containerStyle = useMemo<CSSProperties>(() => ({
    display: 'flex',
    justifyContent,
    alignItems,
    width:  width  || '100%',
    height: height || '100%',
  }), [justifyContent, alignItems, width, height]);

  const contentStyle = useMemo<CSSProperties>(() => {
    if (!enableUniversalProps) return {};

    const colorStyle      = buildColorStyle(colorMode, color, gradientFrom, gradientTo, gradientAngle, isDark);
    const animationStyle  = animationSpeed !== 1 ? { '--animation-speed-multiplier': animationSpeed } as CSSProperties : {};

    // Если трансформации, фильтры и прозрачность не применяются — возвращаем только цвет
    if (!hasTransform && !hasFilter && !hasOpacity) {
      return { ...colorStyle, ...animationStyle, ...FONT_SMOOTHING };
    }

    const transformParts = buildTransformParts(offsetX, offsetY, rotateZ);
    const filterParts    = buildFilterParts(blur, brightness, contrast, saturate);

    return {
      ...(scale !== 1                ? { zoom:      scale                    } : {}),
      ...(transformParts.length > 0  ? { transform: transformParts.join(' ') } : {}),
      ...(filterParts.length > 0     ? { filter:    filterParts.join(' ')    } : {}),
      ...(hasOpacity                 ? { opacity                             } : {}),
      ...animationStyle,
      ...colorStyle,
      ...FONT_SMOOTHING,
    };
  }, [
    enableUniversalProps, isDark,
    hasTransform, hasFilter, hasOpacity, hasColor,
    scale, offsetX, offsetY, rotateZ,
    blur, brightness, contrast, saturate,
    opacity, animationSpeed,
    color, colorMode, gradientFrom, gradientTo, gradientAngle,
  ]);

  return (
    <div style={containerStyle} className={className}>
      <div style={contentStyle}>{children}</div>
    </div>
  );
};