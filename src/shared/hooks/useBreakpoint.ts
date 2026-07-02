import { useState, useEffect } from 'react';

/** Для контентного layout */
export const BREAKPOINT_MD  = 768;
/** Для навигации (Navigation.tsx — rail vs bottom bar) */
export const BREAKPOINT_NAV = 1000;

function useBreakpoint(bp: number, serverDefault = false): boolean {
  const [above, setAbove] = useState<boolean>(() => {
    // Синхронная инициализация на клиенте; на сервере отдаём стабильный
    // статический вариант, чтобы навигация была в HTML сразу, без пустого этапа.
    if (globalThis.window === undefined) return serverDefault;
    return globalThis.window.innerWidth >= bp;
  });

  useEffect(() => {
    const check = () => setAbove(globalThis.window.innerWidth >= bp);
    // На случай если размер изменился между SSR и гидратацией
    check();
    globalThis.window.addEventListener('resize', check, { passive: true });
    document.addEventListener('astro:after-swap', check);
    document.addEventListener('astro:page-load', check);
    return () => {
      globalThis.window.removeEventListener('resize', check);
      document.removeEventListener('astro:after-swap', check);
      document.removeEventListener('astro:page-load', check);
    };
  }, [bp]);

  return above;
}

/** Desktop для контента (≥768px) */
export function useIsDesktop(): boolean {
  return useBreakpoint(BREAKPOINT_MD, false);
}

/**
 * Desktop для навигации (≥1000px).
 * На сервере возвращает desktop-вариант, чтобы статическая навигация была
 * в первом HTML и не ждала JS/fetch на медленном соединении.
 */
export function useIsDesktopNav(): boolean {
  return useBreakpoint(BREAKPOINT_NAV, true);
}

export function useIsMobile(): boolean {
  return !useIsDesktop();
}