import { useState, useEffect } from 'react';

const BREAKPOINT_MD = 768;

/**
 * Возвращает true если ширина >= 768px.
 * Инициализируется false чтобы не показывать sidebar на мобильных при hydration.
 * Слушает astro:after-swap для корректной работы после SPA-навигации.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= BREAKPOINT_MD);
    
    // Проверяем сразу
    check();
    
    // Слушаем resize
    window.addEventListener('resize', check, { passive: true });
    
    // После SPA-навигации Astro пересоздаёт острова — нужно перепроверить
    document.addEventListener('astro:after-swap', check);
    document.addEventListener('astro:page-load', check);
    
    return () => {
      window.removeEventListener('resize', check);
      document.removeEventListener('astro:after-swap', check);
      document.removeEventListener('astro:page-load', check);
    };
  }, []);

  return isDesktop;
}

export function useIsMobile(): boolean {
  return !useIsDesktop();
}