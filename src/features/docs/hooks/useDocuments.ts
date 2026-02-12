import { useState, useEffect, useCallback } from 'react';

interface DocMetadata {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  category?: string;
  bannercolor?: string;
  bannertext?: string;
  author?: string;
  date?: string;
  tags?: string[];
  keywords?: string;
  canonical?: string;
  robots?: string;
  lang?: string;
}

interface DocWithContent extends DocMetadata {
  content: string;
}

export function useDocuments() {
  const [manifest, setManifest] = useState<DocMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/docs/manifest.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setManifest(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load manifest:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const loadDocument = useCallback(async (slug: string): Promise<DocWithContent | null> => {
    try {
      const response = await fetch(`/data/docs/${slug}.json`);
      if (!response.ok) {
        throw new Error(`Document not found: ${slug}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`Failed to load document ${slug}:`, err);
      return null;
    }
  }, []);

  return {
    manifest,
    loading,
    error,
    loadDocument,
  };
}
