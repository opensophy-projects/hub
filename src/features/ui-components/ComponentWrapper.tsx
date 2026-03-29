import React, { useMemo, CSSProperties } from 'react';
import type { UniversalProps } from './types';

interface ComponentWrapperProps extends UniversalProps {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
}

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
  const containerStyle = useMemo<CSSProperties>(() => ({
    display: 'flex',
    justifyContent,
    alignItems,
    width:  width  || '100%',
    height: height || '100%',
  }), [justifyContent, alignItems, width, height]);

  const contentStyle = useMemo<CSSProperties>(() => {
    if (!enableUniversalProps) return {};

    const transformParts = [
      scale !== 1   && `scale(${scale})`,
      (offsetX !== 0 || offsetY !== 0) && `translate(${offsetX}px, ${offsetY}px)`,
      rotateZ !== 0 && `rotateZ(${rotateZ}deg)`,
    ].filter(Boolean);

    const filterParts = [
      blur !== 0       && `blur(${blur}px)`,
      brightness !== 1 && `brightness(${brightness})`,
      contrast !== 1   && `contrast(${contrast})`,
      saturate !== 1   && `saturate(${saturate})`,
    ].filter(Boolean);

    const colorStyle: CSSProperties = {};
    if (colorMode === 'solid' && color) {
      colorStyle.color = color;
    } else if (colorMode === 'gradient' && gradientFrom && gradientTo) {
      colorStyle.background           = `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`;
      colorStyle.WebkitBackgroundClip = 'text';
      colorStyle.WebkitTextFillColor  = 'transparent';
      colorStyle.backgroundClip       = 'text';
    } else {
      // original mode — set theme-appropriate default so component is visible
      colorStyle.color = isDark ? '#e8e8e8' : '#1a1a1a';
    }

    return {
      ...(transformParts.length > 0 ? { transform: transformParts.join(' ') } : {}),
      ...(filterParts.length    > 0 ? { filter:    filterParts.join(' ')    } : {}),
      ...(opacity !== 1             ? { opacity                             } : {}),
      ...(animationSpeed !== 1      ? { '--animation-speed-multiplier': animationSpeed } as CSSProperties : {}),
      ...colorStyle,
      WebkitFontSmoothing: 'antialiased' as const,
      MozOsxFontSmoothing: 'grayscale'   as const,
    };
  }, [
    enableUniversalProps, isDark,
    scale, offsetX, offsetY, rotateZ,
    blur, brightness, contrast, saturate, opacity, animationSpeed,
    color, colorMode, gradientFrom, gradientTo, gradientAngle,
  ]);

  return (
    <div style={containerStyle} className={className}>
      <div style={contentStyle}>{children}</div>
    </div>
  );
};