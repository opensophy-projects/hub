import initialManifest from '../../../../public/data/docs/manifest.json';

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

const docsManifest = initialManifest as DocMetadata[];

export function useManifest(): UseManifestResult {
  return { manifest: docsManifest, loading: false, error: null };
}
