import React from 'react';

// Авто-обнаружение компонентов: любой .ts/.tsx файл внутри ui-components,
// кроме служебных файлов самого фреймворка вьюера.
const componentModules = import.meta.glob([
  '../**/*.{ts,tsx}',
  '!../registry/**',
  '!../loader.ts',
  '!../types.ts',
  '!../NewUIComponentViewer.tsx',
]);

type AnyComponent = React.ComponentType<Record<string, unknown>>;

function isReactComponent(value: unknown): value is AnyComponent {
  if (typeof value === 'function') return true;
  return typeof value === 'object' && value !== null && '$$typeof' in value;
}

// Имя папки = последний сегмент директории, содержащей файл.
// Например '../texts/count-up/count-up-preview.tsx' -> 'count-up'
function folderNameFromPath(path: string): string {
  const parts = path.split('/');
  return parts.at(-2) ?? '';
}

// Возвращает все файлы, лежащие в любой папке с именем `id` (на любой глубине)
function candidatesForId(id: string): string[] {
  return Object.keys(componentModules).filter((p) => folderNameFromPath(p) === id);
}

// Сортирует кандидатов: index.ts(x) -> <id>.tsx -> остальное
function orderCandidates(id: string, candidates: string[]): string[] {
  const isIndex = (p: string) => /\/index\.tsx?$/.test(p);
  const isNamed = (p: string) => new RegExp(`/${id}\\.tsx?$`).test(p);

  const indexFiles = candidates.filter(isIndex);
  const namedFiles = candidates.filter((p) => !isIndex(p) && isNamed(p));
  const rest       = candidates.filter((p) => !isIndex(p) && !isNamed(p));

  return [...indexFiles, ...namedFiles, ...rest];
}

export const registry = {
  hasComponent(id: string): boolean {
    return candidatesForId(id).length > 0;
  },

  async loadComponent(id: string): Promise<AnyComponent | null> {
    const candidates = orderCandidates(id, candidatesForId(id));

    for (const path of candidates) {
      const loader = componentModules[path];
      if (!loader) continue;
      try {
        const mod = await loader() as Record<string, unknown>;
        const component = isReactComponent(mod['default'])
          ? mod['default']
          : Object.values(mod).find(isReactComponent);
        if (component) return component as AnyComponent;
      } catch (e) {
        console.warn('[registry] failed to load %s:', path, e);
      }
    }

    console.warn(`[registry] no component found for id: ${id}`);
    return null;
  },
};