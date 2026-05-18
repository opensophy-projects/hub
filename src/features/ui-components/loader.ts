import { registry } from './registry';
import type { ComponentConfig, LoadedComponent } from '../types';

const sourceModules = import.meta.glob('../*/*.{ts,tsx}', { query: '?raw', import: 'default' });

type PropValue = string | number | boolean | string[] | undefined;

// ─── Кэш ──────────────────────────────────────────────────────────────────────
const componentCache = new Map<string, LoadedComponent>();
const loadingPromises = new Map<string, Promise<LoadedComponent | null>>();



function pickMainSourcePath(componentId: string, config: ComponentConfig): string | null {
  const mainFile = (config as ComponentConfig & { main?: string }).main;

  const preferred = [
    mainFile && `../${componentId}/${mainFile}`,
    `../${componentId}/${componentId}.tsx`,
    `../${componentId}/index.tsx`,
    `../${componentId}/index.ts`,
  ].filter((p): p is string => !!p && !p.endsWith('undefined'));

  const allSourceFiles = Object.keys(sourceModules).filter(k => k.startsWith(`../${componentId}/`));
  const candidates = [...new Set([...preferred, ...allSourceFiles])];

  for (const candidate of candidates) {
    if (sourceModules[candidate]) return candidate;
  }

  return null;
}

async function loadFileContents(componentId: string, config: ComponentConfig): Promise<Record<string, string>> {
  const sourcePath = pickMainSourcePath(componentId, config);
  const allSourcePaths = Object.keys(sourceModules).filter(k => k.startsWith(`../${componentId}/`));
  if (!sourcePath && allSourcePaths.length === 0) return {};

  const orderedPaths = sourcePath
    ? [sourcePath, ...allSourcePaths.filter(path => path !== sourcePath)]
    : allSourcePaths;

  try {
    const entries = await Promise.all(orderedPaths.map(async (path) => {
      const source = await sourceModules[path]() as string;
      const relativeName = path.replace(`../${componentId}/`, '');
      return [relativeName, source] as const;
    }));
    return Object.fromEntries(entries);
  } catch (error) {
    console.warn('[loader] Не удалось загрузить исходник компонента:', componentId, error);
    return {};
  }
}
// ─── Внутренний загрузчик ─────────────────────────────────────────────────────
async function loadComponentInternal(componentId: string): Promise<LoadedComponent | null> {
  try {
    const config = registry.getConfig(componentId);
    if (!config) {
      console.warn('[loader] Компонент не найден в реестре:', componentId);
      return null;
    }

    const Component = await registry.loadComponent(componentId);
    if (!Component) {
      console.error('[loader] Не удалось загрузить компонент:', componentId);
      return null;
    }

    const fileContents = await loadFileContents(componentId, config);
    return { config, Component, fileContents };
  } catch (error) {
    console.error('[loader] Ошибка при загрузке компонента:', componentId, error);
    return null;
  }
}

// ─── Публичное API ────────────────────────────────────────────────────────────

// Загружает компонент с кэшированием и дедупликацией параллельных запросов
export async function loadComponent(componentId: string): Promise<LoadedComponent | null> {
  const cached = componentCache.get(componentId);
  if (cached) return cached;

  const inFlight = loadingPromises.get(componentId);
  if (inFlight !== undefined) return inFlight;

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

// Предзагружает компонент в фоне если он ещё не закэширован
export function preloadComponent(componentId: string): void {
  if (!componentCache.has(componentId)) {
    registry.preloadComponent(componentId);
  }
}

// Возвращает дефолтные пропсы из конфига компонента
export function getDefaultProps(config: ComponentConfig): Record<string, PropValue> {
  const props: Record<string, PropValue> = {};
  config.props.forEach((prop) => {
    props[prop.name] = prop.default as PropValue;
  });
  return props;
}

// Возвращает конфиги всех зарегистрированных компонентов
export function getAllComponents(): ComponentConfig[] {
  return registry
    .getAllIds()
    .map((id) => registry.getConfig(id))
    .filter((c): c is ComponentConfig => c !== null);
}

// Сбрасывает кэш компонентов и активных промисов
export function clearCache(): void {
  componentCache.clear();
  loadingPromises.clear();
}
