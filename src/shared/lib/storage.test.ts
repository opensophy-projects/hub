import test from 'node:test';
import assert from 'node:assert/strict';
import { storageGet, storageRemove, storageSet } from './storage';

test('storage helpers read, write and remove localStorage values', () => {
  const data = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    clear: () => data.clear(),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    get length() { return data.size; },
  };

  storageSet('theme', 'dark');
  assert.equal(storageGet('theme'), 'dark');
  storageRemove('theme');
  assert.equal(storageGet('theme'), null);
});

test('storageGet returns null when localStorage throws', () => {
  globalThis.localStorage = { getItem: () => { throw new Error('blocked'); } } as Storage;
  assert.equal(storageGet('x'), null);
});
