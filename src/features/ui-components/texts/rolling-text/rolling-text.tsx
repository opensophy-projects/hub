import { motion, type Transition, type UseInViewOptions, useInView } from 'framer-motion';
import * as React from 'react';

const ENTRY_ANIMATION = {
  initial: { rotateX: 0 },
  animate: { rotateX: 90 },
};

const EXIT_ANIMATION = {
  initial: { rotateX: 90 },
  animate: { rotateX: 0 },
};

const formatCharacter = (char: string) => (char === ' ' ? '\u00A0' : char);

type RollingTextProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  transition?: Transition;
  inView?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
  inViewOnce?: boolean;
  text: string;
};

function RollingText({
  ref,
  transition = { duration: 0.5, delay: 0.1, ease: 'easeOut' },
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  text,
  ...props
}: RollingTextProps) {
  const localRef = React.useRef<HTMLSpanElement>(null);
  React.useImperativeHandle(ref as React.Ref<HTMLSpanElement>, () => localRef.current!);

  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  });

  const isInView   = !inView || inViewResult;
  const characters = React.useMemo(() => text.split(''), [text]);

  return (
    <span data-slot="rolling-text" {...(props as React.HTMLAttributes<HTMLSpanElement>)} ref={localRef}>
      {characters.map((char, idx) => (
        <span
          aria-hidden="true"
          className="relative inline-block w-auto"
          key={idx}
          style={{ perspective: '9999999px', transformStyle: 'preserve-3d' }}
        >
          {/* Входящая буква — переворачивается из 0° в 90° (уходит «назад») */}
          <motion.span
            animate={isInView ? ENTRY_ANIMATION.animate : undefined}
            className="absolute inline-block"
            initial={ENTRY_ANIMATION.initial}
            style={{
              backfaceVisibility: 'hidden',
              transformOrigin: '50% 25%',
            }}
            transition={{
              ...transition,
              delay: idx * ((transition?.delay as number) ?? 0),
            }}
          >
            {formatCharacter(char)}
          </motion.span>

          {/* Выходящая буква — приходит из 90° в 0° (появляется «спереди») */}
          <motion.span
            animate={isInView ? EXIT_ANIMATION.animate : undefined}
            className="absolute inline-block"
            initial={EXIT_ANIMATION.initial}
            style={{
              backfaceVisibility: 'hidden',
              transformOrigin: '50% 100%',
            }}
            transition={{
              ...transition,
              delay: idx * ((transition?.delay as number) ?? 0) + 0.3,
            }}
          >
            {formatCharacter(char)}
          </motion.span>

          {/* Невидимая буква резервирует место */}
          <span className="invisible">{formatCharacter(char)}</span>
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </span>
  );
}

export { RollingText, type RollingTextProps };
export default RollingText;