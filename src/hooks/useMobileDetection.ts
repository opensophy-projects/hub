import { useState, useEffect } from 'react';

export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof globalThis.window === 'undefined') return false;
    return globalThis.window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof globalThis.window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(globalThis.window.innerWidth < 768);
    };

    checkMobile();
    globalThis.window.addEventListener('resize', checkMobile);

    return () => {
      globalThis.window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}
