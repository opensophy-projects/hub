import { useState, useEffect } from 'react';

export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (!globalThis.window) return false;
    return globalThis.window.innerWidth < 768;
  });

  useEffect(() => {
    if (!globalThis.window) return;

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
