/**
 * GeneralPageWrapper
 *
 * Isolated wrapper for the General landing page.
 * Uses its own internal theme state (isNegative dark/light toggle)
 * separate from Hub's global ThemeContext — the General page has
 * its own theme system built in.
 *
 * Must be used with client:only="react" in Astro.
 */
import { useEffect } from 'react';
import GeneralPage from './GeneralPage';

export default function GeneralPageWrapper() {
  useEffect(() => {
    document.documentElement.classList.add('app-hydrated');
  }, []);

  return <GeneralPage />;
}
