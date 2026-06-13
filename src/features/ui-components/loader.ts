import { registry } from './registry';
import type { LoadedComponent } from './types';

type AnyComponent = LoadedComponent['Component'];

// ─── Кэш ──────────────────────────────────────────────────────────────────────
const componentCache  = new Map<string, LoadedComponent | null>();
const loadingPromises = new Map<string, Promise<LoadedComponent | null>>();

async function loadComponentInternal(componentId: string): Promise<LoadedComponent | null> {
  const Component = await registry.loadComponent(componentId) as AnyComponent | null;
  if (!Component) return null;
  return { Component };
}

// Загружает компонент с кэшированием и дедупликацией параллельных запросов
export async function loadComponent(componentId: string): Promise<LoadedComponent | null> {
  if (componentCache.has(componentId)) return componentCache.get(componentId) ?? null;

  const inFlight = loadingPromises.get(componentId);
  if (inFlight !== undefined) return inFlight;

  const promise = loadComponentInternal(componentId);
  loadingPromises.set(componentId, promise);

  try {
    const result = await promise;
    componentCache.set(componentId, result);
    return result;
  } finally {
    loadingPromises.delete(componentId);
  }
}

// Сбрасывает кэш компонентов и активных промисов
export function clearCache(): void {
  componentCache.clear();
  loadingPromises.clear();
}