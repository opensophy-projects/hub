import { useState, useEffect } from 'react';

const BREAKPOINT_MD = 768;

/**
 * Возвращает true, если ширина окна >= 768px (md breakpoint).
 * ВАЖНО: инициализируется false, чтобы не показывать sidebar на мобильных
 * во время hydration (SSR fallback был true — это вызывало баг).
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= BREAKPOINT_MD);
    check(); // сразу проверяем после mount
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  return isDesktop;
}

/**
 * Возвращает true, если ширина окна < 768px.
 */
export function useIsMobile(): boolean {
  return !useIsDesktop();
}