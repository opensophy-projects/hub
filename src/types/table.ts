export interface TableControlsState {
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  filters: Map<number, Set<string>>;
  visibleColumns: Set<number>;
}

export interface ParsedRow {
  element: Element;
  cells: string[]; // Теперь хранит HTML, а не только текст
}

export interface ParsedTable {
  headers: string[];
  rows: Element[];
}
