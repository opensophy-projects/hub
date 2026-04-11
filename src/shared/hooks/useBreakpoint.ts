import { useState, useEffect } from 'react';

/** Для контентного layout */
export const BREAKPOINT_MD  = 768;
/** Для навигации (Navigation.tsx — rail vs bottom bar) */
export const BREAKPOINT_NAV = 1000;

function useBreakpoint(bp: number): boolean | null {
  const [above, setAbove] = useState<boolean | null>(() => {
    // Синхронная инициализация на клиенте — устраняет flash мобильной nav на десктопе.
    // На сервере (SSR) window недоступен → null, компонент не рендерится до гидратации.
    if (typeof window === 'undefined') return null;
    return window.innerWidth >= bp;
  });

  useEffect(() => {
    const check = () => setAbove(window.innerWidth >= bp);
    // На случай если размер изменился между SSR и гидратацией
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
  const v = useBreakpoint(BREAKPOINT_MD);
  return v ?? false;
}

/**
 * Desktop для навигации (≥1000px).
 * Возвращает null пока значение не определено (SSR / до гидратации).
 * Navigation.tsx должен рендерить null при null — это устраняет flash мобильной версии.
 */
export function useIsDesktopNav(): boolean | null {
  return useBreakpoint(BREAKPOINT_NAV);
}

export function useIsMobile(): boolean {
  return !useIsDesktop();
}