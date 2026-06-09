import type { CustomPageDefinition, CustomPageMetadataModule, CustomPageModule } from './types';

const pageModules = import.meta.glob<CustomPageModule>('./*/Page.{tsx,jsx}', { eager: true });
const metadataModules = import.meta.glob<CustomPageMetadataModule>('./*/metadata.ts', { eager: true });

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^\w/-]/g, '')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^[-/]+|[-/]+$/g, '');
}

export function parseCustomPageFolderName(folderName: string): string {
  const match = folderName.match(/\{([^}]+)\}$/);
  const rawSlug = match?.[1]?.trim() || folderName.trim();
  return toSlug(rawSlug);
}

export const customPages: CustomPageDefinition[] = Object.entries(pageModules)
  .map(([modulePath, module]) => {
    const folderName = modulePath.split('/')[1] ?? '';
    const slug = parseCustomPageFolderName(folderName);
    const metadata = metadataModules[`./${folderName}/metadata.ts`]?.default;

    return {
      slug,
      folderName,
      component: module.default,
      metadata: metadata ?? { title: folderName },
    } satisfies CustomPageDefinition;
  })
  .filter((page) => page.slug && page.component)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export function getCustomPageBySlug(slug: string | undefined): CustomPageDefinition | null {
  if (!slug) return null;
  return customPages.find((page) => page.slug === slug) ?? null;
}
