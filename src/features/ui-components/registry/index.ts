import type { ComponentConfig } from '../types';
import { textRegistry, type TextComponentId } from './text';

// import { buttonRegistry, type ButtonComponentId } from './buttons';
// import { cardRegistry, type CardComponentId } from './cards';
// Пока используем только text, так как buttons и cards пусты

export type ComponentId = TextComponentId;

const allLoaders = {
  ...textRegistry.loaders,
  // ...buttonRegistry.loaders,
  // ...cardRegistry.loaders,
} as const;

const allConfigs = {
  ...textRegistry.configs,
  // ...buttonRegistry.configs,
  // ...cardRegistry.configs,
} as const;

// Создаем тип на основе ключей реального объекта
type LoaderKeys = keyof typeof allLoaders;

export const registry = {
  getAllIds(): ComponentId[] {
    return Object.keys(allLoaders) as ComponentId[];
  },

  getConfig(id: ComponentId): ComponentConfig | null {
    return allConfigs[id as LoaderKeys] || null;
  },

  async loadComponent(id: ComponentId): Promise<React.ComponentType<any> | null> {
    const loader = allLoaders[id as LoaderKeys];
    
    if (!loader) {
      console.warn(`Component ${id} not found in registry`);
      return null;
    }

    try {
      return await (loader as () => Promise<{ [key: string]: React.ComponentType<any> }>)();
    } catch (error) {
      console.error(`Failed to load component ${id}:`, error);
      return null;
    }
  },

  preloadComponent(id: ComponentId): void {
    const loader = allLoaders[id as LoaderKeys];
    if (loader) {
      (loader as () => Promise<any>)();
    }
  },

  hasComponent(id: ComponentId): boolean {
    return id in allLoaders;
  }
};
