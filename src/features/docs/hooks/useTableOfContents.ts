import { useState, useEffect } from 'react';

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

// Must match slugifyHeading in htmlParser.tsx
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function useTableOfContents<T>(dependency: T): TableOfContentsItem[] {
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);

  useEffect(() => {
    const generateTOC = () => {
      const articleContent = document.querySelector('[data-article-content]');
      if (!articleContent) return;

      const headings = articleContent.querySelectorAll(
        'h2:not([data-banner-content] h2), h3:not([data-banner-content] h3), h4:not([data-banner-content] h4)'
      );
      const items: TableOfContentsItem[] = [];
      const usedIds = new Map<string, number>();

      headings.forEach((heading) => {
        // Use data-heading-text if available (set by HeadingAnchor) to avoid
        // picking up the "#" anchor character from textContent
        const text =
          (heading as HTMLElement).dataset.headingText ||
          heading.textContent?.replace(/#\s*$/, '').trim() ||
          '';

        let id = slugifyHeading(text);

        // Deduplicate ids
        if (usedIds.has(id)) {
          const count = usedIds.get(id)! + 1;
          usedIds.set(id, count);
          id = `${id}-${count}`;
        } else {
          usedIds.set(id, 0);
        }

        if (!heading.id) heading.id = id;

        items.push({
          id: heading.id,
          text,
          level: parseInt(heading.tagName[1], 10),
        });
      });

      setToc(items);
    };

    const timer = setTimeout(generateTOC, 100);
    return () => clearTimeout(timer);
  }, [dependency]);

  return toc;
}