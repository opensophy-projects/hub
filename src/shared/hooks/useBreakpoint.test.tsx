import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { BREAKPOINT_MD, BREAKPOINT_NAV, useIsDesktop, useIsDesktopNav, useIsMobile } from './useBreakpoint';

const dom = new JSDOM('<!doctype html><div id="root"></div>', { pretendToBeVisual: true });
globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;

test('breakpoint constants match layout thresholds', () => {
  assert.equal(BREAKPOINT_MD, 768);
  assert.equal(BREAKPOINT_NAV, 1000);
});

test('useIsDesktop, useIsMobile and useIsDesktopNav react to resize', async () => {
  const states: Array<{ desktop: boolean; mobile: boolean; nav: boolean | null }> = [];
  function Probe() {
    states.push({ desktop: useIsDesktop(), mobile: useIsMobile(), nav: useIsDesktopNav() });
    return null;
  }
  Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
  const root = createRoot(document.getElementById('root')!);
  await act(async () => { root.render(<Probe />); });
  assert.deepEqual(states.at(-1), { desktop: true, mobile: false, nav: true });

  Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
  await act(async () => { window.dispatchEvent(new dom.window.Event('resize')); });
  assert.deepEqual(states.at(-1), { desktop: false, mobile: true, nav: false });
  await act(async () => { root.unmount(); });
});
