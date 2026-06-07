import React from 'react';
import type { ComponentConfig } from '../types';

// Авто-обнаружение компонентов через import.meta.glob
// Добавить компонент = создать папку с config.json + ComponentName.tsx
const configModules = import.meta.glob('../**/config.json', { eager: true });
const componentModules = import.meta.glob([
  '../**/*.{ts,tsx}',
  '!../registry/**',
  '!../loader.ts',
  '!../types.ts',
  '!../ComponentWrapper.tsx',
  '!../NewUIComponentViewer.tsx',
]);

type AnyComponent = React.ComponentType<Record<string, unknown>>;

function isReactComponent(value: unknown): value is AnyComponent {
  if (typeof value === 'function') return true;
  return typeof value === 'object' && value !== null && '$$typeof' in value;
}


// Извлекает id компонента из конфига, чтобы компоненты можно было вкладывать
// в папки вида backgrounds/component/config.json без изменения публичного id.
function idFromConfigPath(path: string): string {
  const cfg = configFromModule(configModules[path]);
  return cfg?.id || path.split('/').at(-2) || '';
}

function baseDirFromConfigPath(path: string): string {
  return path.replace(/\/config\.json$/, '');
}

function configPathById(id: string): string | null {
  return Object.keys(configModules).find(path => idFromConfigPath(path) === id) ?? null;
}

// Нормализует модуль конфига — поддерживает default-экспорт и прямой объект
function configFromModule(mod: unknown): ComponentConfig | null {
  const m = mod as Record<string, unknown>;
  const cfg = (m['default'] ?? m) as ComponentConfig;
  return cfg?.id ? cfg : null;
}

export const registry = {
  getAllIds(): string[] {
    return Object.keys(configModules).map(idFromConfigPath).filter(Boolean);
  },

  getConfig(id: string): ComponentConfig | null {
    const path = configPathById(id);
    const mod = path ? configModules[path] : null;
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
    const configPath = configPathById(id);
    const baseDir = configPath ? baseDirFromConfigPath(configPath) : `../${id}`;

    // Приоритетные кандидаты: явный main, затем index-файлы, затем все .tsx в папке
    const preferred = [
      mainFile && `${baseDir}/${mainFile}`,
      `${baseDir}/index.ts`,
      `${baseDir}/index.tsx`,
    ].filter((p): p is string => !!p && !p.endsWith('undefined'));

    const allTsx = Object.keys(componentModules).filter(k => k.startsWith(`${baseDir}/`));
    const candidates = [...new Set([...preferred, ...allTsx])];

    for (const candidate of candidates) {
      const loader = componentModules[candidate];
      if (!loader) continue;
      try {
        const mod = await loader() as Record<string, unknown>;
        const component = isReactComponent(mod['default'])
          ? mod['default']
          : Object.values(mod).find(isReactComponent);
        if (component) return component;
      } catch (e) {
        console.warn('[registry] failed to load %s:', candidate, e);
      }
    }

    console.warn(`[registry] no component found for id: ${id}`);
    return null;
  },

  preloadComponent(id: string): void {
    this.loadComponent(id).catch(e => console.warn('[registry] preload failed: %s', id, e));
  },

  getBaseDir(id: string): string | null {
    const path = configPathById(id);
    return path ? baseDirFromConfigPath(path) : null;
  },

  hasComponent(id: string): boolean {
    return configPathById(id) !== null;
  },
};

export type { ComponentConfig } from '../types';