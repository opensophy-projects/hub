import React from 'react';
import type { ComponentConfig } from '../types';

// ─── Auto-discovery via import.meta.glob ──────────────────────────────────────
// Добавить компонент = создать папку с config.json + ComponentName.tsx
// Никаких ручных импортов, никаких category файлов

const configModules = import.meta.glob('../*/config.json', { eager: true });
const componentModules = import.meta.glob('../*/*.tsx');

type AnyComponent = React.ComponentType<Record<string, unknown>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function idFromPath(path: string): string {
  // '../blur-text/config.json' → 'blur-text'
  return path.split('/').at(-2) ?? '';
}

function configFromModule(mod: unknown): ComponentConfig | null {
  const m = mod as { default?: ComponentConfig } | ComponentConfig;
  const cfg = 'default' in (m as object) ? (m as { default: ComponentConfig }).default : (m as ComponentConfig);
  if (!cfg?.id) return null;
  return cfg;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const registry = {
  getAllIds(): string[] {
    return Object.keys(configModules)
      .map(idFromPath)
      .filter(Boolean);
  },

  getConfig(id: string): ComponentConfig | null {
    const key = `../${id}/config.json`;
    const mod = configModules[key];
    if (!mod) return null;
    return configFromModule(mod);
  },

  getByCategory(category: string): ComponentConfig[] {
    return this.getAllIds()
      .map(id => this.getConfig(id))
      .filter((c): c is ComponentConfig => c?.category === category);
  },

  async loadComponent(id: string): Promise<AnyComponent | null> {
    const config = this.getConfig(id);
    if (!config) return null;

    // Ищем .tsx файл по id или по полю main в config
    const mainFile = (config as ComponentConfig & { main?: string }).main;
    const patterns = [
      `../${id}/${mainFile}`,
      `../${id}/index.ts`,
      `../${id}/index.tsx`,
    ];

    // Если нет main, ищем любой .tsx в папке
    const allTsx = Object.keys(componentModules).filter(k => k.startsWith(`../${id}/`));

    const candidates = [
      ...patterns.filter(p => !p.endsWith('undefined')),
      ...allTsx,
    ];

    for (const candidate of candidates) {
      const loader = componentModules[candidate];
      if (!loader) continue;
      try {
        const mod = await loader() as Record<string, unknown>;
        const component = mod.default ?? Object.values(mod).find(v => typeof v === 'function');
        if (component) return component as AnyComponent;
      } catch (e) {
        console.warn(`[registry] failed to load ${candidate}:`, e);
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

export type { ComponentConfig };