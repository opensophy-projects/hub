import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { filterAndSortRows, stripHtmlNormalize } from './tableFiltering';
import type { TableControlsState } from '../types/table';

const dom = new JSDOM('<!doctype html><table><tbody><tr><td align="center"><strong>Alpha</strong></td><td>20</td></tr><tr><td style="text-align:right">Beta</td><td>10</td></tr><tr><td>Gamma</td><td>30</td></tr></tbody></table>');
globalThis.DOMParser = dom.window.DOMParser;
const rows = Array.from(dom.window.document.querySelectorAll('tr'));
const baseState: TableControlsState = { searchQuery: '', sortColumn: null, sortDirection: 'none', filters: new Map(), visibleColumns: new Set([0, 1]) };

test('stripHtmlNormalize removes tags and collapses whitespace', () => {
  assert.equal(stripHtmlNormalize('<span> hello </span>  <b>world</b>'), 'hello world');
});

test('filterAndSortRows filters by selected column values and search query', () => {
  const result = filterAndSortRows(rows, { ...baseState, filters: new Map([[0, new Set(['Alpha'])]]), searchQuery: 'alp' });
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].alignments, ['center', null]);
  assert.equal(stripHtmlNormalize(result[0].cells[0]), 'Alpha');
});

test('filterAndSortRows sorts a copied result without mutating parsed rows order', () => {
  const result = filterAndSortRows(rows, { ...baseState, sortColumn: 1, sortDirection: 'desc' });
  assert.deepEqual(result.map((row) => stripHtmlNormalize(row.cells[0])), ['Gamma', 'Alpha', 'Beta']);
});
