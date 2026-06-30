import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_THEME_COLORS, THEME_LAYER_META, makeTokens, themed } from './theme';

test('makeTokens exposes themed colors and shadows for both modes', () => {
  const dark = makeTokens(true);
  const light = makeTokens(false);
  assert.equal(dark.bg, 'var(--hub-theme-dark-layer1, #0a0a0a)');
  assert.equal(light.bg, 'var(--hub-theme-light-layer1, #E8E7E3)');
  assert.ok(dark.shadow.includes('rgba'));
});

test('theme metadata covers all default dark theme keys', () => {
  for (const key of ['layer1', 'layer2', 'layer3', 'layer4']) {
    assert.ok(key in THEME_LAYER_META, `${key} has metadata`);
    assert.ok(key in DEFAULT_THEME_COLORS.dark, `${key} has default`);
  }
  assert.equal(themed(true, 'dark', 'light'), 'dark');
  assert.equal(themed(false, 'dark', 'light'), 'light');
});
