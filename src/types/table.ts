export interface TableControlsState {
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  filters: Map<number, Set<string>>;
  visibleColumns: Set<number>;
}

export interface ParsedRow {
  element: Element;
  cells: string[];
}

export interface ParsedTable {
  headers: string[];
  rows: Element[];
}

export { TableControlsState, ParsedRow, ParsedTable };
