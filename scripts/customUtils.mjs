import fs from 'node:fs';
import path from 'node:path';

function toSlug(value) {
  return value
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^\w/-]/g, '')
    .replaceAll(/-+/g, '-')
    .replace(/^[-/]+/, '')
    .replace(/[-/]+$/, '');
}

export function parseCustomPageFolderName(folderName) {
  const match = folderName.match(/\{([^}]+)\}$/);
  const rawSlug = match?.[1]?.trim() || folderName.trim();
  return toSlug(rawSlug);
}

export function scanCustomPages(customDir) {
  if (!fs.existsSync(customDir)) return [];
  return fs.readdirSync(customDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const pagePathTsx = path.join(customDir, entry.name, 'Page.tsx');
      const pagePathJsx = path.join(customDir, entry.name, 'Page.jsx');
      const hasPage = fs.existsSync(pagePathTsx) || fs.existsSync(pagePathJsx);
      if (!hasPage) return null;
      return {
        folderName: entry.name,
        slug: parseCustomPageFolderName(entry.name),
      };
    })
    .filter(Boolean)
    .filter((page) => page.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// custom: resume -> 'resume', не задано -> null
export function resolveCustomSlug(value) {
  if (!value) return null;
  const v = String(value).trim();
  return v || null;
}
