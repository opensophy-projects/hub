import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parseTableHtml } from './tableParser';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;

test('parseTableHtml extracts headers, body rows and header alignments', () => {
  const parsed = parseTableHtml(`
    <table>
      <thead><tr><th align="left">Name</th><th style="text-align: right">Score</th></tr></thead>
      <tbody><tr><td>Alice</td><td>10</td></tr><tr><td>Bob</td><td>7</td></tr></tbody>
    </table>
  `);

  assert.deepEqual(parsed.headers, ['Name', 'Score']);
  assert.deepEqual(parsed.headerAlignments, ['left', 'right']);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].textContent?.trim(), 'Alice10');
});

test('parseTableHtml returns empty parsed table when markup has no table', () => {
  assert.deepEqual(parseTableHtml('<p>No table</p>'), { headers: [], rows: [], headerAlignments: [] });
});
