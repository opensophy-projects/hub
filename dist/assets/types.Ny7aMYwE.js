const n=`import type { Easing } from 'framer-motion';

export interface BlurTextProps {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, string | number>;
  animationTo?: Array<Record<string, string | number>>;
  easing?: Easing | ((t: number) => number);
  onAnimationComplete?: () => void;
  stepDuration?: number;
}
`;export{n as default};
