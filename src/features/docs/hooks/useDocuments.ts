import { useState, useEffect } from 'react';

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

export function useManifest(): UseManifestResult {
  const [manifest, setManifest] = useState<DocMetadata[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  return { manifest, loading, error };
}