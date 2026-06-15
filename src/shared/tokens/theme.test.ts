import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_THEME_COLORS, THEME_COLOR_META, makeTokens, themed } from './theme';

test('makeTokens exposes themed colors and shadows for both modes', () => {
  const dark = makeTokens(true);
  const light = makeTokens(false);
  assert.equal(dark.bg, 'var(--hub-theme-dark-bg, #0a0a0a)');
  assert.equal(light.bg, 'var(--hub-theme-light-bg, #E8E7E3)');
  assert.ok(dark.shadow.includes('rgba'));
});

test('theme metadata covers all default dark theme keys', () => {
  for (const key of Object.keys(DEFAULT_THEME_COLORS.dark)) {
    assert.ok(key in THEME_COLOR_META, `${key} has metadata`);
  }
  assert.equal(themed(true, 'dark', 'light'), 'dark');
  assert.equal(themed(false, 'dark', 'light'), 'light');
});
