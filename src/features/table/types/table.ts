export type TableControlsState = {
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  filters: Map<number, Set<string>>;
  visibleColumns: Set<number>;
};

export type ParsedRow = {
  element: Element;
  cells: string[];
  alignments: Array<'left' | 'center' | 'right' | null>;
};

export type ParsedTable = {
  headers: string[];
  rows: Element[];
  headerAlignments: Array<'left' | 'center' | 'right' | null>;
};
