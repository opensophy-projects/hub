import { registry } from './registry';

type AnyComponent = React.ComponentType<Record<string, unknown>>;

// ─── Кэш ──────────────────────────────────────────────────────────────────────
const componentCache  = new Map<string, AnyComponent | null>();
const loadingPromises = new Map<string, Promise<AnyComponent | null>>();

// Загружает компонент с кэшированием и дедупликацией параллельных запросов
export async function loadComponent(componentId: string): Promise<AnyComponent | null> {
  if (componentCache.has(componentId)) return componentCache.get(componentId) ?? null;

  const inFlight = loadingPromises.get(componentId);
  if (inFlight !== undefined) return inFlight;

  const promise = registry.loadComponent(componentId);
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