/**
 * DevPanelLoader
 *
 * Astro requires a static default export for client:only —
 * the component reference must NOT be derived from a variable or conditional.
 *
 * Fix: always import DevPanel statically. The component itself returns null
 * in production because import.meta.env.DEV is replaced with `false` by Vite
 * at build time, and dead-code elimination removes the inner logic entirely.
 *
 * Fix 2: removed Suspense wrapper — it caused navigation issues in SPA mode
 * because Suspense boundary would intercept Astro ClientRouter transitions.
 */

import DevPanel from './DevPanel';

export default function DevPanelLoader() {
  if (!import.meta.env.DEV) return null;

  return <DevPanel />;
}