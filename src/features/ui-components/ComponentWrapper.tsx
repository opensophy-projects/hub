import React, { useMemo, CSSProperties } from 'react';
import type { UniversalProps } from './types';

interface ComponentWrapperProps extends UniversalProps {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
  layoutMode?: 'fill' | 'content';
}

const isString = (x: string | false): x is string => x !== false;

function buildTransformParts(scale: number, offsetX: number, offsetY: number, rotateZ: number): string[] {
  return [
    (offsetX !== 0 || offsetY !== 0) && `translate(${offsetX}px, ${offsetY}px)`,
    rotateZ !== 0 && `rotateZ(${rotateZ}deg)`,
    scale !== 1 && `scale(${scale})`,
  ].filter(isString);
}

function buildFilterParts(blur: number, brightness: number, contrast: number, saturate: number): string[] {
  return [
    blur !== 0       && `blur(${blur}px)`,
    brightness !== 1 && `brightness(${brightness})`,
    contrast !== 1   && `contrast(${contrast})`,
    saturate !== 1   && `saturate(${saturate})`,
  ].filter(isString);
}

function buildColorStyle(
  colorMode: string,
  color: string | undefined,
  gradientFrom: string | undefined,
  gradientTo: string | undefined,
  gradientAngle: number,
  isDark: boolean,
): CSSProperties {
  if (colorMode === 'solid' && color) return { color };
  if (colorMode === 'gradient' && gradientFrom && gradientTo) {
    return {
      background:           `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor:  'transparent',
      backgroundClip:       'text',
    };
  }
  return { color: isDark ? '#e8e8e8' : '#1a1a1a' };
}

const FONT_SMOOTHING: CSSProperties = {
  WebkitFontSmoothing: 'antialiased' as const,
  MozOsxFontSmoothing: 'grayscale'   as const,
};

export const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  children,
  className = '',
  enableUniversalProps = true,
  isDark = true,
  layoutMode = 'content',
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

  // Внешний контейнер — flex-центрирование, без ограничений overflow
  const containerStyle = useMemo<CSSProperties>(() => ({
    position: 'relative',
    display: 'flex',
    justifyContent,
    alignItems,
    width:  width  || '100%',
    height: height || '100%',
    // Без overflow: hidden — контент может выходить за границы при scale > 1
    overflow: 'visible',
  }), [justifyContent, alignItems, width, height]);

  // fill-режим: компонент занимает весь контейнер (фоны, canvas-анимации)
  // content-режим: компонент по своему размеру, без ограничений
  const baseContentStyle = useMemo<CSSProperties>(() => (layoutMode === 'fill' ? {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'visible',
    flex: '0 0 100%',
    transformOrigin: 'center center',
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Никаких maxWidth/maxHeight — компонент растёт свободно
    position: 'relative',
    overflow: 'visible',
    flex: '0 0 auto',
    transformOrigin: 'center center',
  }), [layoutMode]);

  const contentStyle = useMemo<CSSProperties>(() => {
    if (!enableUniversalProps) return {};

    const colorStyle     = buildColorStyle(colorMode, color, gradientFrom, gradientTo, gradientAngle, isDark);
    const animationStyle = animationSpeed === 1 ? {} : { '--animation-speed-multiplier': animationSpeed } as CSSProperties;

    if (!hasTransform && !hasFilter && !hasOpacity) {
      return { ...colorStyle, ...animationStyle, ...FONT_SMOOTHING };
    }

    const transformParts = buildTransformParts(scale, offsetX, offsetY, rotateZ);
    const filterParts    = buildFilterParts(blur, brightness, contrast, saturate);

    return {
      ...(transformParts.length > 0 ? { transform: transformParts.join(' ') } : {}),
      ...(filterParts.length > 0    ? { filter:    filterParts.join(' ')    } : {}),
      ...(hasOpacity                ? { opacity                             } : {}),
      ...animationStyle,
      ...colorStyle,
      ...FONT_SMOOTHING,
    };
  }, [
    enableUniversalProps, isDark,
    hasTransform, hasFilter, hasOpacity,
    scale, offsetX, offsetY, rotateZ,
    blur, brightness, contrast, saturate,
    opacity, animationSpeed,
    color, colorMode, gradientFrom, gradientTo, gradientAngle,
  ]);

  return (
    <div style={containerStyle} className={className}>
      <div style={{ ...baseContentStyle, ...contentStyle }}>
        {children}
      </div>
    </div>
  );
};