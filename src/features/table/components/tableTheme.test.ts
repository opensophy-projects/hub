import test from 'node:test';
import assert from 'node:assert/strict';
import { getTableStyles } from './tableStyles';
import { getTableUiTokens } from './tableUiTheme';

test('getTableStyles emits core table and inline-content rules', () => {
  const css = getTableStyles(false);
  assert.match(css, /width: 100%/);
  assert.match(css, /td code/);
  assert.match(css, /td mark/);
});

test('getTableUiTokens returns different light and dark modal/button colors', () => {
  const light = getTableUiTokens(false);
  const dark = getTableUiTokens(true);
  assert.notEqual(light.modalBg, dark.modalBg);
  assert.notEqual(light.btnBg, dark.btnBg);
  assert.equal(typeof light.dangerClr, 'string');
});
