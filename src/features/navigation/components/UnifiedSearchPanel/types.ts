export interface UnifiedSearchPanelProps {
  onClose: () => void;
}

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  typename?: string;
  category?: string;
  author?: string;
  date?: string;
  tags?: string[];
}

export type SortOption = 'date-desc' | 'date-asc';