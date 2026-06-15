import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { getHeaderOffset, scrollToElement } from './scrollUtils';

const dom = new JSDOM('<!doctype html><div id="target"></div>');
globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;

test('getHeaderOffset returns the fixed documentation header offset', () => {
  assert.equal(getHeaderOffset(), 80);
});

test('scrollToElement scrolls to an element minus header offset', () => {
  const target = document.getElementById('target')!;
  target.getBoundingClientRect = () => ({ top: 200, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 200, toJSON: () => ({}) });
  Object.defineProperty(window, 'pageYOffset', { value: 50, configurable: true });
  let scrolledTop = 0;
  window.scrollTo = (options?: ScrollToOptions) => { scrolledTop = options?.top ?? 0; };

  scrollToElement('target');
  assert.equal(scrolledTop, 170);
});
