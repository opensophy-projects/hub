/**
 * DevPanelLoader — безопасная обёртка над DevPanel
 *
 * import.meta.env.DEV == false на билде → Vite tree-shakes весь этот чанк
 * Dynamic import → отдельный JS чанк, не попадает в main bundle
 *
 * Использование в Layout.astro:
 *   {import.meta.env.DEV && <DevPanelLoader client:only="react" />}
 */

import { lazy, Suspense } from 'react';

// Динамический импорт — Vite создаст отдельный чанк
// и в production-билде он НЕ будет включён благодаря tree-shaking
const DevPanel = lazy(() => import('./DevPanel'));

export default function DevPanelLoader() {
  // Двойная проверка — на случай если условие в Layout.astro
  // не сработало по какой-то причине
  if (!import.meta.env.DEV) return null;

  return (
    <Suspense fallback={null}>
      <DevPanel />
    </Suspense>
  );
}