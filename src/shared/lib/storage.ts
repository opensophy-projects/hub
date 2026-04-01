/**
 * Безопасная обёртка над localStorage.
 * Не бросает исключений — логирует предупреждение в dev-режиме.
 */

function warn(action: string, key: string, err: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[storage] %s key "%s" failed:', action, key, err);
  }
}

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    warn('get', key, err);
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    warn('set', key, err);
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    warn('remove', key, err);
  }
}