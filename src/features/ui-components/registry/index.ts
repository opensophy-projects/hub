import React from 'react';
import type { ComponentConfig } from '../types';
import { textRegistry, type TextComponentId } from './text';
// import { buttonRegistry, type ButtonComponentId } from './buttons';
// import { cardRegistry, type CardComponentId } from './cards';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComponentId = TextComponentId;

type AnyComponent = React.ComponentType<Record<string, unknown>>;
type ComponentLoader = () => Promise<Record<string, AnyComponent>>;

// ─── Aggregated registries ────────────────────────────────────────────────────

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

type LoaderKeys = keyof typeof allLoaders;

// ─── Registry ─────────────────────────────────────────────────────────────────

export const registry = {
  getAllIds(): ComponentId[] {
    return Object.keys(allLoaders) as ComponentId[];
  },

  getConfig(id: ComponentId): ComponentConfig | null {
    return allConfigs[id as LoaderKeys] ?? null;
  },

  async loadComponent(id: ComponentId): Promise<AnyComponent | null> {
    const loader = allLoaders[id as LoaderKeys] as ComponentLoader | undefined;

    if (!loader) {
      console.warn(`Component ${id} not found in registry`);
      return null;
    }

    try {
      const module = await loader();
      // Берём default-экспорт, либо первый экспортированный компонент
      return module.default ?? Object.values(module)[0] ?? null;
    } catch (error) {
      console.error(`Failed to load component ${id}:`, error);
      return null;
    }
  },

  preloadComponent(id: ComponentId): void {
    const loader = allLoaders[id as LoaderKeys] as ComponentLoader | undefined;
    if (loader) {
      loader().catch((error) => {
        console.warn(`Failed to preload component ${id}:`, error);
      });
    }
  },

  hasComponent(id: ComponentId): boolean {
    return id in allLoaders;
  },
};
