import type React from 'react';

// ─── Shared primitive ─────────────────────────────────────────────────────────

/** Возможные значения пропсов компонента */
export type PropValue = string | number | boolean | string[] | undefined;

// ─── Component Config ─────────────────────────────────────────────────────────

export interface ComponentConfig {
  id: string;
  name: string;
  description: string;
  files: Array<{
    name: string;
    path: string;
    language: string;
  }>;
  props: PropDefinition[];
  /** Какие пропсы показывать в «Специфические настройки».
   *  Если не указано — показываем все из props[]. */
  specificProps?: string[];
  category?: 'text' | 'button' | 'card' | 'background' | 'animation' | 'other';
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

// PropConfig — алиас для обратной совместимости
export type PropConfig = PropDefinition;

// ─── Loaded Component ─────────────────────────────────────────────────────────

export interface LoadedComponent {
  config: ComponentConfig;
  Component: React.ComponentType<Record<string, PropValue>>;
  fileContents: Record<string, string>;
}

// ─── Universal Props ──────────────────────────────────────────────────────────

/**
 * Общие пропсы для всех компонентов.
 * Применяются через ComponentWrapper.
 */
export interface UniversalProps {
  // Цвет
  color?: string;
  colorMode?: 'solid' | 'gradient' | 'original';
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  // Размер
  scale?: number;
  width?: string;
  height?: string;
  // Вращение (3D)
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  // Позиционирование
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  // Анимация
  animationSpeed?: number;
  // Прозрачность
  opacity?: number;
  // Фильтры
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  // Включение/выключение кастомизации
  enableUniversalProps?: boolean;
}

/**
 * Комбинированные пропсы: универсальные + специфические.
 * T ограничен object, чтобы избежать any.
 */
export interface ComponentWithUniversalProps<T extends object = Record<string, PropValue>>
  extends UniversalProps {
  componentProps?: T;
}
