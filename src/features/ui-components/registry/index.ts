import React from 'react';
import type { ComponentConfig } from '../types';
import { componentMetadata } from '../componentMetadata';

// Авто-обнаружение компонентов без config.json.
// Добавить компонент = создать папку и главный React-файл внутри неё:
//   backgrounds/plasma-wave/plasma-wave.tsx
// Если имя файла не совпадает с id папки, registry возьмёт первый подходящий .tsx
// файл в этой папке, отдавая приоритет не-preview файлам. Связанные файлы могут
// лежать рядом и импортироваться компонентом обычными относительными импортами.
const componentModules = import.meta.glob([
  '../**/*.{ts,tsx}',
  '!../registry/**',
  '!../loader.ts',
  '!../types.ts',
  '!../ComponentWrapper.tsx',
  '!../NewUIComponentViewer.tsx',
  '!../componentMetadata.ts',
]);

type AnyComponent = React.ComponentType<Record<string, unknown>>;

type ComponentEntry = {
  id: string;
  baseDir: string;
  category?: string;
};

function isReactComponent(value: unknown): value is AnyComponent {
  if (typeof value === 'function') return true;
  return typeof value === 'object' && value !== null && '$$typeof' in value;
}

function segments(path: string): string[] {
  return path.replace(/^\.\.\//, '').split('/');
}

function isPreviewFile(path: string): boolean {
  return /(?:^|[-_.])preview\.(?:t|j)sx?$/.test(path);
}

function isRunnableComponentFile(path: string): boolean {
  return path.endsWith('.tsx') && !isPreviewFile(path);
}

function entryFromPath(path: string): ComponentEntry | null {
  if (!isRunnableComponentFile(path)) return null;

  const parts = segments(path);
  if (parts.length < 3) return null;

  const fileName = parts.at(-1);
  const id = parts.at(-2);
  if (!fileName || !id) return null;

  const baseDir = `../${parts.slice(0, -1).join('/')}`;
  const category = parts.length >= 4 ? parts.at(-3) : undefined;
  return { id, baseDir, category };
}

function entries(): ComponentEntry[] {
  const byId = new Map<string, ComponentEntry>();

  Object.keys(componentModules)
    .map(entryFromPath)
    .filter((entry): entry is ComponentEntry => entry !== null)
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((entry) => {
      if (!byId.has(entry.id)) byId.set(entry.id, entry);
    });

  return [...byId.values()];
}

function entryById(id: string): ComponentEntry | null {
  return entries().find(entry => entry.id === id) ?? null;
}

function titleFromId(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function configFromEntry(entry: ComponentEntry): ComponentConfig {
  const metadata = componentMetadata[entry.id as keyof typeof componentMetadata];
  return {
    id: entry.id,
    name: titleFromId(entry.id),
    description: '',
    category: entry.category,
    ...metadata,
  };
}

function findFileByName(files: string[], fileName: string): string | null {
  const normalized = fileName.toLowerCase();
  return files.find(path => path.split('/').at(-1)?.toLowerCase() === normalized) ?? null;
}

function candidatesForEntry(entry: ComponentEntry): string[] {
  const allFiles = Object.keys(componentModules)
    .filter(path => path.startsWith(`${entry.baseDir}/`));

  const metadata = componentMetadata[entry.id as keyof typeof componentMetadata];
  const explicitMain = metadata?.main ? findFileByName(allFiles, metadata.main) : null;

  const preferred = [
    explicitMain,
    `${entry.baseDir}/${entry.id}.tsx`,
    `${entry.baseDir}/index.tsx`,
    `${entry.baseDir}/index.ts`,
  ].filter((path): path is string => Boolean(path));

  const fallback = allFiles
    .filter(path => /\.tsx$/.test(path))
    .sort((a, b) => Number(isPreviewFile(a)) - Number(isPreviewFile(b)) || a.localeCompare(b));

  return [...new Set([...preferred, ...fallback])];
}

export const registry = {
  getAllIds(): string[] {
    return entries().map(entry => entry.id);
  },

  getConfig(id: string): ComponentConfig | null {
    const entry = entryById(id);
    return entry ? configFromEntry(entry) : null;
  },

  getByCategory(category: string): ComponentConfig[] {
    return entries()
      .filter(entry => entry.category === category)
      .map(configFromEntry);
  },

  async loadComponent(id: string): Promise<AnyComponent | null> {
    const entry = entryById(id);
    if (!entry) return null;

    for (const candidate of candidatesForEntry(entry)) {
      const loader = componentModules[candidate];
      if (!loader) continue;

      try {
        const mod = await loader() as Record<string, unknown>;
        const component = isReactComponent(mod.default)
          ? mod.default
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
    return entryById(id)?.baseDir ?? null;
  },

  hasComponent(id: string): boolean {
    return entryById(id) !== null;
  },
};

export type { ComponentConfig } from '../types';
