import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { JSDOM } from 'jsdom';
import { parseHtmlToReact, SANITIZE_ATTR, SANITIZE_TAGS, TableContext } from './htmlParser';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.Node = dom.window.Node;

test('sanitize allow-lists contain expected documentation tags and attributes', () => {
  assert.equal(SANITIZE_TAGS.includes('table'), true);
  assert.equal(SANITIZE_TAGS.includes('math'), true);
  assert.equal(SANITIZE_ATTR.includes('data-chart'), true);
});

test('parseHtmlToReact creates sanitized React nodes for headings, text and unsafe markup', () => {
  const nodes = parseHtmlToReact('<h2>Hello world!</h2><p>Safe <strong>text</strong><script>alert(1)</script></p>');
  assert.equal(nodes.length, 2);
  assert.equal(React.isValidElement(nodes[0]), true);
  assert.equal((nodes[0] as React.ReactElement).props.id, 'hello-world');
  assert.doesNotMatch(JSON.stringify((nodes[1] as React.ReactElement).props), /script/);
});

test('TableContext has a safe light-mode default', () => {
  assert.deepEqual(TableContext._currentValue, { isDark: false });
});
