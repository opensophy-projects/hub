import { useState, useEffect } from 'react';

const BREAKPOINT_MD = 768;

/**
 * Возвращает true, если ширина окна >= 768px (md breakpoint).
 * Реагирует на resize.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINT_MD : true
  );

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= BREAKPOINT_MD);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  return isDesktop;
}

/**
 * Возвращает true, если ширина окна < 768px.
 * Реагирует на resize.
 */
export function useIsMobile(): boolean {
  return !useIsDesktop();
}