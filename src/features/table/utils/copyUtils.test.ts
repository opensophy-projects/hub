import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parseTableForCopy, toMd, toTsv } from './copyUtils';

globalThis.DOMParser = new JSDOM('').window.DOMParser;

test('parseTableForCopy extracts plain text headers and rows', () => {
  assert.deepEqual(parseTableForCopy('<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td><b>x</b></td><td> y </td></tr></tbody></table>'), { headers: ['A', 'B'], rows: [['x', 'y']] });
});

test('toMd escapes pipes and toTsv uses tab-separated values', () => {
  assert.equal(toMd(['A|B'], [['x|y']]), '| A\\|B |\n| --- |\n| x\\|y |');
  assert.equal(toTsv(['A', 'B'], [['x', 'y']]), 'A\tB\nx\ty');
  assert.equal(toMd([], []), '');
  assert.equal(toTsv([], []), '');
});
