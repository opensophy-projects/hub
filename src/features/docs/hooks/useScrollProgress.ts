import { useEffect, useRef } from 'react';

/**
 * Directly mutates the progress bar's style.width via a ref —
 * no setState, no re-renders of the parent component on every scroll event.
 *
 * Usage:
 *   const progressRef = useScrollProgress();
 *   <div ref={progressRef} className="fixed top-0 left-0 h-1 bg-white" style={{ width: '0%', zIndex: 999 }} />
 */
export function useScrollProgress(): React.RefObject<HTMLDivElement> {
  const barRef = useRef<HTMLDivElement>(null);
  const rafId  = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      const pct   = total > 0 ? (scrollTop / total) * 100 : 0;
      if (barRef.current) {
        barRef.current.style.width = `${pct}%`;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    };

    // Run once on mount to set initial value
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return barRef;
}