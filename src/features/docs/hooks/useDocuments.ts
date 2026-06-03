import { useState, useEffect } from 'react';

declare global {
  interface Window {
    __HUB_DOC_MANIFEST__?: DocMetadata[];
  }
}

export interface DocMetadata {
  id: string;
  title: string;
  slug: string;
  description: string;
  type?: string;
  typename?: string;
  category?: string;
  author?: string;
  date?: string;
  tags?: string[];
  keywords?: string;
  canonical?: string;
  robots?: string;
  lang?: string;
  icon?: string;
  navSlug?: string;
  navTitle?: string;
  navIcon?: string;
}

export interface UseManifestResult {
  manifest: DocMetadata[];
  loading: boolean;
  error: string | null;
}

function getPreloadedManifest(): DocMetadata[] {
  if (globalThis.window === undefined) return [];
  return Array.isArray(globalThis.window.__HUB_DOC_MANIFEST__)
    ? globalThis.window.__HUB_DOC_MANIFEST__
    : [];
}

export function useManifest(): UseManifestResult {
  const [manifest, setManifest] = useState<DocMetadata[]>(() => getPreloadedManifest());
  const [loading, setLoading]   = useState(() => getPreloadedManifest().length === 0);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (manifest.length > 0) return;

    fetch('/data/docs/manifest.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<DocMetadata[]>;
      })
      .then(data => {
        setManifest(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('[useManifest] Failed to load manifest:', err);
        setError(String(err));
        setLoading(false);
      });
  }, [manifest.length]);

  return { manifest, loading, error };
}