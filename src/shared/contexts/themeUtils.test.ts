import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { applyTheme, applyThemeColorVars, persistTheme } from './themeUtils';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.document = dom.window.document;

test('applyTheme toggles dark class and color scheme', () => {
  applyTheme(true);
  assert.equal(document.documentElement.classList.contains('dark'), true);
  assert.equal(document.documentElement.style.colorScheme, 'dark');

  applyTheme(false);
  assert.equal(document.documentElement.classList.contains('dark'), false);
  assert.equal(document.documentElement.style.colorScheme, 'light');
});

test('persistTheme stores light and dark preference', () => {
  const values = new Map<string, string>();
  globalThis.localStorage = { setItem: (key: string, value: string) => { values.set(key, value); } } as Storage;
  persistTheme(true);
  assert.equal(values.get('theme'), 'dark');
  persistTheme(false);
  assert.equal(values.get('theme'), 'light');
});

test('applyThemeColorVars delegates safely', () => {
  assert.doesNotThrow(() => applyThemeColorVars());
});
