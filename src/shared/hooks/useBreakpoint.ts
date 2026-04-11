import { useState, useEffect } from 'react';

/** Для контентного layout */
export const BREAKPOINT_MD  = 768;

/** Для навигации (Navigation.tsx — rail vs bottom bar) */
export const BREAKPOINT_NAV = 1000;

function useBreakpoint(bp: number): boolean {
  // Initialize with actual window width if available (avoids flash on first render)
  const [above, setAbove] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= bp;
    }
    return false;
  });

  useEffect(() => {
    const check = () => setAbove(window.innerWidth >= bp);
    // Run immediately to sync if window size changed between SSR and mount
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