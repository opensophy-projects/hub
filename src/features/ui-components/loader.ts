import { registry } from './registry';
import type { ComponentConfig, LoadedComponent } from '../types';

type PropValue = string | number | boolean | string[] | undefined;

// ─── Cache ────────────────────────────────────────────────────────────────────

const componentCache = new Map<string, LoadedComponent>();
const loadingPromises = new Map<string, Promise<LoadedComponent | null>>();

// ─── Internal loader ──────────────────────────────────────────────────────────

async function loadComponentInternal(componentId: string): Promise<LoadedComponent | null> {
  try {
    const config = registry.getConfig(componentId);
    if (!config) {
      console.warn('[loader] Component not found in registry:', componentId);
      return null;
    }

    const Component = await registry.loadComponent(componentId);
    if (!Component) {
      console.error('[loader] Failed to load component:', componentId);
      return null;
    }

    return { config, Component, fileContents: {} };
  } catch (error) {
    console.error('[loader] Failed to load component:', componentId, error);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function loadComponent(componentId: string): Promise<LoadedComponent | null> {
  const cached = componentCache.get(componentId);
  if (cached) return cached;

  const inFlight = loadingPromises.get(componentId);
  if (inFlight) return inFlight;

  const promise = loadComponentInternal(componentId);
  loadingPromises.set(componentId, promise);

  try {
    const result = await promise;
    if (result) componentCache.set(componentId, result);
    return result;
  } finally {
    loadingPromises.delete(componentId);
  }
}

export function preloadComponent(componentId: string): void {
  if (!componentCache.has(componentId)) {
    registry.preloadComponent(componentId);
  }
}

export function getDefaultProps(config: ComponentConfig): Record<string, PropValue> {
  const props: Record<string, PropValue> = {};
  config.props.forEach((prop) => {
    props[prop.name] = prop.default as PropValue;
  });
  return props;
}

export function getAllComponents(): ComponentConfig[] {
  return registry.getAllIds()
    .map(id => registry.getConfig(id))
    .filter((c): c is ComponentConfig => c !== null);
}

export function clearCache(): void {
  componentCache.clear();
  loadingPromises.clear();
}