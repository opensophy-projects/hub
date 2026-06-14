import React from 'react';

// Авто-обнаружение компонентов: любой .ts/.tsx файл внутри ui-components,
// кроме служебных файлов самого фреймворка вьюера.
const componentModules = import.meta.glob([
  '../**/*.{ts,tsx}',
  '!../registry/**',
  '!../loader.ts',
  '!../types.ts',
  '!../ComponentWrapper.tsx',
  '!../NewUIComponentViewer.tsx',
]);

// Исходники для вкладки "Код" (raw текст)
const sourceModules = import.meta.glob([
  '../**/*.{ts,tsx,js,jsx,css,html,json}',
  '!../registry/**',
  '!../loader.ts',
  '!../types.ts',
  '!../ComponentWrapper.tsx',
  '!../NewUIComponentViewer.tsx',
], { query: '?raw', import: 'default' });

type AnyComponent = React.ComponentType<Record<string, unknown>>;

const REACT_MEMO_TYPE   = Symbol.for('react.memo');
const REACT_FORWARD_REF = Symbol.for('react.forward_ref');
const REACT_ELEMENT_TYPE = Symbol.for('react.element');
const REACT_LAZY_TYPE   = Symbol.for('react.lazy');

function isReactComponent(value: unknown): value is AnyComponent {
  if (typeof value === 'function') return true;
  if (typeof value !== 'object' || value === null) return false;
  const typeOf = (value as { $$typeof?: symbol }).$$typeof;
  return (
    typeOf === REACT_MEMO_TYPE ||
    typeOf === REACT_FORWARD_REF ||
    typeOf === REACT_ELEMENT_TYPE ||
    typeOf === REACT_LAZY_TYPE ||
    typeOf !== undefined
  );
}

// Имя папки = последний сегмент директории, содержащей файл.
// '../texts/count-up/count-up-preview.tsx' -> 'count-up'
function folderNameFromPath(path: string): string {
  const parts = path.split('/');
  return parts.at(-2) ?? '';
}

// Базовая директория компонента — путь до папки с именем `id` (включительно)
function baseDirForId(id: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;
  const sample = candidates[0];
  const idx = sample.lastIndexOf(`/${id}/`);
  if (idx === -1) return null;
  return sample.slice(0, idx + id.length + 1);
}

// Возвращает все файлы, лежащие в любой папке с именем `id` (на любой глубине)
function candidatesForId(id: string): string[] {
  return Object.keys(componentModules).filter((p) => folderNameFromPath(p) === id);
}

// Сортирует кандидатов: index.ts(x) -> <id>-preview.tsx -> <id>.tsx -> остальное.
// preview-файл приоритетнее основного, т.к. часто именно он содержит
// самодостаточную демонстрацию (с дефолтными значениями, без внешних зависимостей).
function orderCandidates(id: string, candidates: string[]): string[] {
  const isIndex   = (p: string) => p.endsWith('/index.tsx') || p.endsWith('/index.ts');
  const isPreview = (p: string) => p.endsWith(`/${id}-preview.tsx`) || p.endsWith(`/${id}-preview.ts`);
  const isNamed   = (p: string) => p.endsWith(`/${id}.tsx`) || p.endsWith(`/${id}.ts`);

  const indexFiles   = candidates.filter(isIndex);
  const previewFiles = candidates.filter((p) => !isIndex(p) && isPreview(p));
  const namedFiles   = candidates.filter((p) => !isIndex(p) && !isPreview(p) && isNamed(p));
  const rest         = candidates.filter((p) => !isIndex(p) && !isPreview(p) && !isNamed(p));

  return [...indexFiles, ...previewFiles, ...namedFiles, ...rest];
}

// Категория компонента — определяется по пути (например '.../backgrounds/color-bends/...')
const KNOWN_CATEGORIES = new Set(['backgrounds', 'texts', 'buttons', 'cards', 'effects', 'loaders', 'inputs']);

function categoryFromPath(path: string): string | undefined {
  const parts = path.split('/');
  for (const part of parts) {
    if (KNOWN_CATEGORIES.has(part)) return part;
  }
  return undefined;
}

export const registry = {
  hasComponent(id: string): boolean {
    return candidatesForId(id).length > 0;
  },

  getCategory(id: string): string | undefined {
    const candidates = candidatesForId(id);
    if (candidates.length === 0) return undefined;
    return categoryFromPath(candidates[0]);
  },

  async loadComponent(id: string): Promise<AnyComponent | null> {
    const candidates = orderCandidates(id, candidatesForId(id));

    if (candidates.length === 0) {
      console.warn(`[registry] no folder found for id: ${id}`);
      return null;
    }

    for (const path of candidates) {
      const loader = componentModules[path];
      if (!loader) continue;
      try {
        const mod = await loader() as Record<string, unknown>;
        const component = isReactComponent(mod['default'])
          ? mod['default']
          : Object.values(mod).find(isReactComponent);
        if (component) return component as AnyComponent;
        console.warn(`[registry] %s loaded but no React component export found`, path);
      } catch (e) {
        console.warn('[registry] failed to load %s:', path, e);
      }
    }

    console.warn(`[registry] no component found for id: ${id} (checked ${candidates.length} file(s))`);
    return null;
  },

  // Возвращает содержимое всех файлов, лежащих в папке компонента (для вкладки "Код")
  async loadFileContents(id: string): Promise<Record<string, string>> {
    const candidates = candidatesForId(id);
    const baseDir = baseDirForId(id, candidates);
    if (!baseDir) return {};

    const allSourcePaths = Object.keys(sourceModules).filter((k) => k.startsWith(`${baseDir}/`) || k === baseDir);
    if (allSourcePaths.length === 0) return {};

    const ordered = orderCandidates(id, candidates).filter((p) => allSourcePaths.includes(p));
    const orderedPaths = [...new Set([...ordered, ...allSourcePaths])];

    try {
      const entries = await Promise.all(orderedPaths.map(async (path) => {
        const source = await sourceModules[path]() as string;
        const relativeName = path.replace(`${baseDir}/`, '');
        return [relativeName, source] as const;
      }));
      return Object.fromEntries(entries);
    } catch (error) {
      console.warn('[registry] Не удалось загрузить исходники компонента:', id, error);
      return {};
    }
  },
};
  const indexFiles   = candidates.filter(isIndex);
  const previewFiles = candidates.filter((p) => !isIndex(p) && isPreview(p));
  const namedFiles   = candidates.filter((p) => !isIndex(p) && !isPreview(p) && isNamed(p));
  const rest         = candidates.filter((p) => !isIndex(p) && !isPreview(p) && !isNamed(p));

  return [...indexFiles, ...previewFiles, ...namedFiles, ...rest];
}

// Категория компонента — определяется по пути (например '.../backgrounds/color-bends/...')
const KNOWN_CATEGORIES = ['backgrounds', 'texts', 'buttons', 'cards', 'effects', 'loaders', 'inputs'];

function categoryFromPath(path: string): string | undefined {
  const parts = path.split('/');
  for (const part of parts) {
    if (KNOWN_CATEGORIES.includes(part)) return part;
  }
  return undefined;
}

export const registry = {
  hasComponent(id: string): boolean {
    return candidatesForId(id).length > 0;
  },

  getCategory(id: string): string | undefined {
    const candidates = candidatesForId(id);
    if (candidates.length === 0) return undefined;
    return categoryFromPath(candidates[0]);
  },

  async loadComponent(id: string): Promise<AnyComponent | null> {
    const candidates = orderCandidates(id, candidatesForId(id));

    if (candidates.length === 0) {
      console.warn(`[registry] no folder found for id: ${id}`);
      return null;
    }

    for (const path of candidates) {
      const loader = componentModules[path];
      if (!loader) continue;
      try {
        const mod = await loader() as Record<string, unknown>;
        const component = isReactComponent(mod['default'])
          ? mod['default']
          : Object.values(mod).find(isReactComponent);
        if (component) return component as AnyComponent;
        console.warn(`[registry] %s loaded but no React component export found`, path);
      } catch (e) {
        console.warn('[registry] failed to load %s:', path, e);
      }
    }

    console.warn(`[registry] no component found for id: ${id} (checked ${candidates.length} file(s))`);
    return null;
  },

  // Возвращает содержимое всех файлов, лежащих в папке компонента (для вкладки "Код")
  async loadFileContents(id: string): Promise<Record<string, string>> {
    const candidates = candidatesForId(id);
    const baseDir = baseDirForId(id, candidates);
    if (!baseDir) return {};

    const allSourcePaths = Object.keys(sourceModules).filter((k) => k.startsWith(`${baseDir}/`) || k === baseDir);
    if (allSourcePaths.length === 0) return {};

    const ordered = orderCandidates(id, candidates).filter((p) => allSourcePaths.includes(p));
    const orderedPaths = [...new Set([...ordered, ...allSourcePaths])];

    try {
      const entries = await Promise.all(orderedPaths.map(async (path) => {
        const source = await sourceModules[path]() as string;
        const relativeName = path.replace(`${baseDir}/`, '');
        return [relativeName, source] as const;
      }));
      return Object.fromEntries(entries);
    } catch (error) {
      console.warn('[registry] Не удалось загрузить исходники компонента:', id, error);
      return {};
    }
  },
};