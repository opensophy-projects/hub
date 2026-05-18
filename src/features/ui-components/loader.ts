import { registry } from './registry';
import type { ComponentConfig, LoadedComponent } from './types';

const sourceModules = import.meta.glob('./*/*.tsx', { eager: true, query: '?raw', import: 'default' });

type PropValue = string | number | boolean | string[] | undefined;

// ─── Кэш ──────────────────────────────────────────────────────────────────────
const componentCache = new Map<string, LoadedComponent>();
const loadingPromises = new Map<string, Promise<LoadedComponent | null>>();



function pickMainSourcePath(componentId: string, config: ComponentConfig): string | null {
  const mainFile = (config as ComponentConfig & { main?: string }).main;

  const preferred = [
    mainFile && `./${componentId}/${mainFile}`,
    `./${componentId}/${componentId}.tsx`,
    `./${componentId}/index.tsx`,
    `./${componentId}/index.ts`,
  ].filter((p): p is string => !!p && !p.endsWith('undefined'));

  const allTsx = Object.keys(sourceModules).filter(k => k.startsWith(`./${componentId}/`));
  const candidates = [...new Set([...preferred, ...allTsx])];

  for (const candidate of candidates) {
    if (sourceModules[candidate]) return candidate;
  }

  return null;
}

function resolveConfigFilePath(componentId: string, configPath: string): string | null {
  if (configPath.startsWith('./') || configPath.startsWith('../')) return configPath;
  if (configPath.startsWith(`${componentId}/`)) return `./${configPath}`;
  return `./${componentId}/${configPath}`;
}

function loadFileContents(componentId: string, config: ComponentConfig): Record<string, string> {
  const entries: Record<string, string> = {};
  const requested = new Set<string>();

  const mainPath = pickMainSourcePath(componentId, config);
  if (mainPath) requested.add(mainPath);

  config.files?.forEach((file) => {
    if (file.path) requested.add(resolveConfigFilePath(componentId, file.path) ?? '');
  });

  Object.keys(sourceModules)
    .filter((k) => k.startsWith(`./${componentId}/`))
    .forEach((k) => requested.add(k));

  for (const sourcePath of requested) {
    if (!sourcePath) continue;
    const source = sourceModules[sourcePath];
    if (typeof source !== 'string') continue;
    const fileName = sourcePath.split('/').at(-1) ?? `${componentId}.tsx`;
    entries[fileName] = source;
  }

  return entries;
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

    const fileContents = loadFileContents(componentId, config);
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
