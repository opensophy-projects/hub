import { useEffect, useState } from 'react';

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
  frontmatter?: Record<string, unknown>;
}

export interface UseManifestResult {
  manifest: DocMetadata[];
  loading: boolean;
  error: string | null;
}

const MANIFEST_URL = '/data/docs/manifest.json';

let cachedManifest: DocMetadata[] | null = null;
let manifestRequest: Promise<DocMetadata[]> | null = null;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load docs manifest';
}

function loadManifest(): Promise<DocMetadata[]> {
  if (cachedManifest) return Promise.resolve(cachedManifest);

  manifestRequest ??= fetch(MANIFEST_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load docs manifest: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<DocMetadata[]>;
    })
    .then((manifest) => {
      cachedManifest = manifest;
      return manifest;
    })
    .catch((error: unknown) => {
      manifestRequest = null;
      throw error;
    });

  return manifestRequest;
}

export function useManifest(): UseManifestResult {
  const [manifest, setManifest] = useState<DocMetadata[]>(() => cachedManifest ?? []);
  const [loading, setLoading]   = useState(() => cachedManifest === null);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadManifest()
      .then((loadedManifest) => {
        if (cancelled) return;
        setManifest(loadedManifest);
        setError(null);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(loadError));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { manifest, loading, error };
}
