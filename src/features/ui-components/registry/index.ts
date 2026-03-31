import React from 'react';
import type { ComponentConfig } from '../types';

// Авто-обнаружение компонентов через import.meta.glob
// Добавить компонент = создать папку с config.json + ComponentName.tsx
const configModules = import.meta.glob('../*/config.json', { eager: true });
const componentModules = import.meta.glob('../*/*.tsx');

type AnyComponent = React.ComponentType<Record<string, unknown>>;

// Извлекает id компонента из пути к config.json
function idFromPath(path: string): string {
  return path.split('/').at(-2) ?? '';
}

// Нормализует модуль конфига — поддерживает default-экспорт и прямой объект
function configFromModule(mod: unknown): ComponentConfig | null {
  const m = mod as Record<string, unknown>;
  const cfg = (m['default'] ?? m) as ComponentConfig;
  return cfg?.id ? cfg : null;
}

export const registry = {
  getAllIds(): string[] {
    return Object.keys(configModules).map(idFromPath).filter(Boolean);
  },

  getConfig(id: string): ComponentConfig | null {
    const mod = configModules[`../${id}/config.json`];
    return mod ? configFromModule(mod) : null;
  },

  getByCategory(category: string): ComponentConfig[] {
    return this.getAllIds()
      .map(id => this.getConfig(id))
      .filter((c): c is ComponentConfig => c?.category === category);
  },

  async loadComponent(id: string): Promise<AnyComponent | null> {
    const config = this.getConfig(id);
    if (!config) return null;

    const mainFile = (config as ComponentConfig & { main?: string }).main;

    // Приоритетные кандидаты: явный main, затем index-файлы, затем все .tsx в папке
    const preferred = [
      mainFile && `../${id}/${mainFile}`,
      `../${id}/index.ts`,
      `../${id}/index.tsx`,
    ].filter((p): p is string => !!p && !p.endsWith('undefined'));

    const allTsx = Object.keys(componentModules).filter(k => k.startsWith(`../${id}/`));
    const candidates = [...new Set([...preferred, ...allTsx])];

    for (const candidate of candidates) {
      const loader = componentModules[candidate];
      if (!loader) continue;
      try {
        const mod = await loader() as Record<string, unknown>;
        const component = mod['default'] ?? Object.values(mod).find(v => typeof v === 'function');
        if (component) return component as AnyComponent;
      } catch (e) {
        console.warn('[registry] failed to load %s:', candidate, e);
      }
    }

    console.warn(`[registry] no component found for id: ${id}`);
    return null;
  },

  preloadComponent(id: string): void {
    this.loadComponent(id).catch(e => console.warn(`[registry] preload failed: ${id}`, e));
  },

  hasComponent(id: string): boolean {
    return !!configModules[`../${id}/config.json`];
  },
};

export type { ComponentConfig } from '../types';