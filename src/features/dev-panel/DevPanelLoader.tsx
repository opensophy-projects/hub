/**
 * DevPanelLoader v2 — безопасная точка монтирования
 *
 * ❌ Production: import.meta.env.DEV === false → Vite tree-shakes весь код
 * ✅ Dev: динамический импорт → отдельный чанк, не в main bundle
 *
 * Использование в Layout.astro:
 *   const isDev = import.meta.env.DEV;
 *   let DevPanelIsland = null;
 *   if (isDev) {
 *     const mod = await import('@/features/dev-panel/DevPanelLoader');
 *     DevPanelIsland = mod.default;
 *   }
 *   ---
 *   {isDev && DevPanelIsland && <DevPanelIsland client:only="react" />}
 */

import { lazy, Suspense } from 'react';

// Dynamic import → Vite создаёт отдельный чанк
// В prod build этот чанк не создаётся (tree-shaking на import.meta.env.DEV)
const DevPanel = lazy(() => import('./DevPanel'));

export default function DevPanelLoader() {
  // Тройная защита
  if (typeof import.meta === 'undefined') return null;
  if (!import.meta.env?.DEV) return null;
  if (typeof window === 'undefined') return null;

  return (
    <Suspense fallback={null}>
      <DevPanel />
    </Suspense>
  );
}