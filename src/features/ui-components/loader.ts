import { registry } from './registry';
import type { ComponentConfig, LoadedComponent } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

type RegistryId = Parameters<typeof registry.getConfig>[0];
type PropValue = string | number | boolean | string[] | undefined;

// ─── Cache ────────────────────────────────────────────────────────────────────

const componentCache = new Map<string, LoadedComponent>();
const loadingPromises = new Map<string, Promise<LoadedComponent | null>>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Приводим произвольный string к типу реестра.
 * Используем честный каст через Parameters вместо `as any`,
 * чтобы не терять проверку типов в самом registry.
 */
function toRegistryId(id: string): RegistryId {
  return id as RegistryId;
}

function isComponentConfig(value: ComponentConfig | null | undefined): value is ComponentConfig {
  return value != null;
}

// ─── Internal loader ──────────────────────────────────────────────────────────

async function loadComponentInternal(componentId: string): Promise<LoadedComponent | null> {
  try {
    const registryId = toRegistryId(componentId);

    const config = registry.getConfig(registryId);
    if (!config) {
      console.warn('Component not found in registry:', componentId);
      return null;
    }

    const Component = await registry.loadComponent(registryId);
    if (!Component) {
      console.error('Failed to load component:', componentId);
      return null;
    }

    // fileContents намеренно пуст: файлы включены в бандл через static imports.
    // В dev-режиме можно использовать import.meta.glob при необходимости.
    const fileContents: Record<string, string> = {};

    return { config, Component, fileContents };
  } catch (error) {
    console.error('Failed to load component:', componentId, error);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Загрузить компонент из реестра с кешированием.
 * Повторные вызовы с тем же id вернут кешированный результат мгновенно.
 */
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

/**
 * Предзагрузить компонент (вызывать при hover и т.п.).
 */
export function preloadComponent(componentId: string): void {
  if (!componentCache.has(componentId)) {
    registry.preloadComponent(toRegistryId(componentId));
  }
}

/**
 * Получить дефолтные пропсы из конфига компонента.
 */
export function getDefaultProps(config: ComponentConfig): Record<string, PropValue> {
  const props: Record<string, PropValue> = {};
  config.props.forEach((prop) => {
    props[prop.name] = prop.default as PropValue;
  });
  return props;
}

/**
 * Получить все доступные компоненты (только конфиги, без загрузки).
 */
export function getAllComponents(): ComponentConfig[] {
  return registry.getAllIds()
    .map((id) => registry.getConfig(id))
    .filter(isComponentConfig);
}

/**
 * Очистить кеш (для разработки / тестов).
 */
export function clearCache(): void {
  componentCache.clear();
  loadingPromises.clear();
}
