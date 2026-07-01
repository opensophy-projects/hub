export type PropValue = string | number | boolean | string[] | undefined;


export interface UniversalProps {
  color?: string;
  colorMode?: 'solid' | 'gradient' | 'original';
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  scale?: number;
  width?: string;
  height?: string;
  offsetX?: number;
  offsetY?: number;
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