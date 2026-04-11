import { useState, useEffect } from 'react';

/** Для контентного layout */
export const BREAKPOINT_MD  = 768;

/** Для навигации (Navigation.tsx — rail vs bottom bar) */
export const BREAKPOINT_NAV = 1000;

function useBreakpoint(bp: number): boolean {
  const [above, setAbove] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= bp;
  });
  useEffect(() => {
    const check = () => setAbove(window.innerWidth >= bp);
    check();
    window.addEventListener('resize', check, { passive: true });
    document.addEventListener('astro:after-swap', check);
    document.addEventListener('astro:page-load', check);
    return () => {
      window.removeEventListener('resize', check);
      document.removeEventListener('astro:after-swap', check);
      document.removeEventListener('astro:page-load', check);
    };
  }, [bp]);
  return above;
}

/** Desktop для контента (≥768px) */
export function useIsDesktop(): boolean {
  return useBreakpoint(BREAKPOINT_MD);
}

/** Desktop для навигации (≥1000px) */
export function useIsDesktopNav(): boolean {
  return useBreakpoint(BREAKPOINT_NAV);
}

export function useIsMobile(): boolean {
  return !useIsDesktop();
}
