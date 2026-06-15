import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { BREAKPOINT_MD, BREAKPOINT_NAV, useIsDesktop, useIsDesktopNav, useIsMobile } from './useBreakpoint';

const dom = new JSDOM('<!doctype html><div id="root"></div>', { pretendToBeVisual: true });
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });

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
  Object.defineProperty(globalThis.window, 'innerWidth', { value: 1200, writable: true, configurable: true });
  const root = createRoot(document.getElementById('root')!);
  await act(async () => { root.render(<Probe />); });
  assert.deepEqual(states.at(-1), { desktop: true, mobile: false, nav: true });

  Object.defineProperty(globalThis.window, 'innerWidth', { value: 500, writable: true, configurable: true });
  await act(async () => { globalThis.window.dispatchEvent(new dom.window.Event('resize')); });
  assert.deepEqual(states.at(-1), { desktop: false, mobile: true, nav: false });
  await act(async () => { root.unmount(); });
});
