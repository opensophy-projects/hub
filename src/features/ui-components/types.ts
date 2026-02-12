export interface ComponentConfig {
  id: string;
  name: string;
  description: string;
  files: Array<{
    name: string;
    path: string;
    language: string;
  }>;
  props: Array<PropConfig>;
  // Новое поле: какие пропсы показывать в "Специфические настройки"
  // Если не указано - показываем все пропсы из props[]
  specificProps?: string[];
  // Категория компонента
  category?: 'text' | 'button' | 'card' | 'background' | 'animation' | 'other';
  // Теги для поиска
  tags?: string[];
  // Автор
  author?: string;
  // Версия
  version?: string;
}

export interface PropConfig {
  name: string;
  type: string;
  default: any;
  description: string;
  control: 'text' | 'number' | 'select' | 'checkbox' | 'color';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface LoadedComponent {
  config: ComponentConfig;
  Component: React.ComponentType<any>;
  fileContents: Record<string, string>;
}

// ============= ТИПЫ ДЛЯ ОБЩИХ ПРОПСОВ =============

/**
 * Общие пропсы для всех компонентов
 * Применяются через ComponentWrapper
 */
export interface UniversalProps {
  // === Цвет ===
  color?: string;
  colorMode?: 'solid' | 'gradient' | 'original';
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;

  // === Размер ===
  scale?: number;
  width?: string;
  height?: string;

  // === Вращение (3D) ===
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;

  // === Позиционирование ===
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';

  // === Скорость анимации ===
  animationSpeed?: number;

  // === Прозрачность ===
  opacity?: number;

  // === Фильтры ===
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;

  // === Включение/выключение кастомизации ===
  enableUniversalProps?: boolean;
}

/**
 * Комбинированные пропсы: универсальные + специфические
 */
export interface ComponentWithUniversalProps<T = any> extends UniversalProps {
  componentProps?: T;
}
