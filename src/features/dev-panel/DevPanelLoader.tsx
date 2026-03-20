/**
 * DevPanelLoader
 *
 * Astro требует статический import для client:only — нельзя хранить компонент
 * в переменной frontmatter. Поэтому этот файл импортируется всегда,
 * но сам проверяет import.meta.env.DEV и возвращает null в production.
 *
 * Vite при сборке заменяет import.meta.env.DEV на false,
 * dead-code elimination убирает весь внутренний код → в prod-бандле
 * этот модуль превращается в `export default function(){return null}`.
 */

import { lazy, Suspense } from 'react';

// Динамический импорт тоже tree-shaking'ится когда условие статически false
const DevPanel = import.meta.env.DEV
  ? lazy(() => import('./DevPanel'))
  : null;

export default function DevPanelLoader() {
  // Двойная защита: проверка и в рантайме
  if (!import.meta.env.DEV || !DevPanel) return null;

  return (
    <Suspense fallback={null}>
      <DevPanel />
    </Suspense>
  );
}