import { registry } from './registry';
import type { ComponentConfig, LoadedComponent } from './types';

// Кеш загруженных компонентов
const componentCache = new Map<string, LoadedComponent>();

// Кеш промисов загрузки (для предотвращения дублирования запросов)
const loadingPromises = new Map<string, Promise<LoadedComponent | null>>();

/**
 * Загрузить компонент из реестра
 * Использует кеширование для мгновенной загрузки при повторном обращении
 */
export async function loadComponent(componentId: string): Promise<LoadedComponent | null> {
  // Проверка кеша
  if (componentCache.has(componentId)) {
    return componentCache.get(componentId)!;
  }

  // Проверка активной загрузки
  if (loadingPromises.has(componentId)) {
    return loadingPromises.get(componentId)!;
  }

  // Создание нового промиса загрузки
  const loadingPromise = loadComponentInternal(componentId);
  loadingPromises.set(componentId, loadingPromise);

  try {
    const result = await loadingPromise;
    if (result) {
      componentCache.set(componentId, result);
    }
    return result;
  } finally {
    loadingPromises.delete(componentId);
  }
}

/**
 * Внутренняя функция загрузки
 */
async function loadComponentInternal(componentId: string): Promise<LoadedComponent | null> {
  try {
    // Получение конфига (мгновенно, уже импортирован)
    const config = registry.getConfig(componentId as any);
    if (!config) {
      console.warn('Component not found in registry:', componentId);
      return null;
    }

    // Загрузка компонента (lazy)
    const Component = await registry.loadComponent(componentId as any);
    if (!Component) {
      console.error('Failed to load component:', componentId);
      return null;
    }

    // Для файлов используем статические импорты в production
    // В dev режиме можно использовать import.meta.glob
    const fileContents: Record<string, string> = {};

    // Примечание: файлы кода теперь не загружаются динамически
    // Они уже включены в бандл через static imports
    // Если нужно показывать код - используй import.meta.glob в dev режиме

    return {
      config,
      Component,
      fileContents,
    };
  } catch (error) {
    console.error('Failed to load component:', componentId, error);
    return null;
  }
}

/**
 * Preload компонента для улучшения UX
 * Вызывается при hover или других событиях
 */
export function preloadComponent(componentId: string): void {
  if (!componentCache.has(componentId)) {
    registry.preloadComponent(componentId as any);
  }
}

/**
 * Получить дефолтные пропсы из конфига
 */
export function getDefaultProps(config: ComponentConfig): Record<string, any> {
  const props: Record<string, any> = {};
  config.props.forEach(prop => {
    props[prop.name] = prop.default;
  });
  return props;
}

/**
 * Type guard для проверки ComponentConfig
 */
function isComponentConfig(value: ComponentConfig | null | undefined): value is ComponentConfig {
  return value !== null && value !== undefined;
}

/**
 * Получить все доступные компоненты (только конфиги, без загрузки)
 */
export function getAllComponents(): ComponentConfig[] {
  return registry.getAllIds()
    .map(id => registry.getConfig(id))
    .filter(isComponentConfig);
}

/**
 * Очистить кеш (для разработки)
 */
export function clearCache(): void {
  componentCache.clear();
  loadingPromises.clear();
}