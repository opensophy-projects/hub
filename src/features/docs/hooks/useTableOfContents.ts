import { useState, useEffect, useLayoutEffect } from 'react';

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

function scanHeadings(): TableOfContentsItem[] {
  const articleContent = document.querySelector('[data-article-content]');
  if (!articleContent) return [];

  const headings = articleContent.querySelectorAll(
    'h2:not([data-banner-content] h2), h3:not([data-banner-content] h3), h4:not([data-banner-content] h4)'
  );
  const items: TableOfContentsItem[] = [];
  const usedIds = new Map<string, number>();

  headings.forEach((heading) => {
    const text = heading.textContent?.trim() || '';
    if (!text) return;

    let id = slugifyHeading(text);

    if (usedIds.has(id)) {
      const count = usedIds.get(id)! + 1;
      usedIds.set(id, count);
      id = `${id}-${count}`;
    } else {
      usedIds.set(id, 0);
    }

    if (!heading.id || heading.id !== id) {
      heading.id = id;
    }

    items.push({
      id: heading.id,
      text,
      level: Number.parseInt(heading.tagName[1], 10),
    });
  });

  return items;
}

// useLayoutEffect on client, useEffect on server (SSR safety)
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useTableOfContents<T>(dependency: T): TableOfContentsItem[] {
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);

  // Synchronous scan after DOM paint — no setTimeout, no delay, no flash
  useIsomorphicLayoutEffect(() => {
    // First attempt: synchronous, runs before browser paint
    const items = scanHeadings();
    if (items.length > 0) {
      setToc(items);
      return;
    }

    // Fallback: content not yet in DOM (e.g. lazy-loaded), use MutationObserver
    const observer = new MutationObserver(() => {
      const found = scanHeadings();
      if (found.length > 0) {
        setToc(found);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [dependency]);

  return toc;
}