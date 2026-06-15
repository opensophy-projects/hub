import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { useTableControls } from './useTableControls';

const dom = new JSDOM('<!doctype html><div id="root"></div><table><tbody><tr><td>Beta</td><td>2</td></tr><tr><td>Alpha</td><td>1</td></tr></tbody></table>');
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
globalThis.DOMParser = dom.window.DOMParser;

test('useTableControls exposes filtering, sorting and visibility operations', async () => {
  const rows = Array.from(document.querySelectorAll('tr'));
  let api: ReturnType<typeof useTableControls> | undefined;
  function Probe() {
    api = useTableControls(rows, ['Name', 'Value']);
    return null;
  }

  const root = createRoot(document.getElementById('root')!);
  await act(async () => { root.render(<Probe />); });
  assert.deepEqual(api?.getUniqueValuesForColumn(0), ['Alpha', 'Beta']);

  await act(async () => { api?.handleSort(0); });
  assert.deepEqual(api?.filteredAndSortedRows.map((row) => row.cells[0]), ['Alpha', 'Beta']);

  await act(async () => { api?.toggleFilter(0, 'Alpha'); });
  assert.equal(api?.activeFilterCount, 1);
  assert.deepEqual(api?.filteredAndSortedRows.map((row) => row.cells[0]), ['Alpha']);

  await act(async () => { api?.toggleColumnVisibility(1); });
  assert.equal(api?.state.visibleColumns.has(1), false);

  await act(async () => { api?.resetFilters(); });
  assert.equal(api?.activeFilterCount, 0);
  await act(async () => { root.unmount(); });
});
