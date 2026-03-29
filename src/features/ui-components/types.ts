import type React from 'react';

export type PropValue = string | number | boolean | string[] | undefined;

// ─── Component Config ─────────────────────────────────────────────────────────

export interface ComponentConfig {
  id: string;
  name: string;
  description: string;
  main?: string;
  files?: Array<{
    name: string;
    path: string;
    language: string;
  }>;
  props: PropDefinition[];
  specificProps?: string[];
  category?: string;
  tags?: string[];
  author?: string;
  version?: string;
}

export interface PropDefinition {
  name: string;
  type: string;
  default: PropValue;
  description: string;
  control: 'text' | 'number' | 'select' | 'checkbox' | 'color';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export type PropConfig = PropDefinition;

// ─── Loaded Component ─────────────────────────────────────────────────────────

export interface LoadedComponent {
  config: ComponentConfig;
  Component: React.ComponentType<Record<string, PropValue>>;
  fileContents: Record<string, string>;
}

// ─── Universal Props ──────────────────────────────────────────────────────────

export interface UniversalProps {
  color?: string;
  colorMode?: 'solid' | 'gradient' | 'original';
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  scale?: number;
  width?: string;
  height?: string;
  // Смещение компонента внутри контейнера (без 3D, без пиксельности)
  offsetX?: number;
  offsetY?: number;
  // rotateX/Y убраны — вызывали пиксельность через GPU compositing layer
  rotateZ?: number;
  perspective?: number;
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  animationSpeed?: number;
  opacity?: number;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  enableUniversalProps?: boolean;
}

export interface ComponentWithUniversalProps<T extends object = Record<string, PropValue>>
  extends UniversalProps {
  componentProps?: T;
}