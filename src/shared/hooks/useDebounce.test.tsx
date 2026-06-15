import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { useDebounce } from './useDebounce';

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });

test('useDebounce updates value after the requested delay', async () => {
  const seen: string[] = [];
  function Probe({ value }: { value: string }) {
    seen.push(useDebounce(value, 20));
    return null;
  }

  const root = createRoot(document.getElementById('root')!);
  await act(async () => { root.render(<Probe value="first" />); });
  await act(async () => { root.render(<Probe value="second" />); });
  assert.equal(seen.at(-1), 'first');
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
  assert.equal(seen.at(-1), 'second');
  await act(async () => { root.unmount(); });
});
