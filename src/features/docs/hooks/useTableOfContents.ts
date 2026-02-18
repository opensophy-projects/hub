import { useState, useEffect } from 'react';

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
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
      headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        items.push({
          id,
          text: heading.textContent || '',
          level: Number.parseInt(heading.tagName[1], 10),
        });
      });

      setToc(items);
    };

    const timer = setTimeout(generateTOC, 100);
    return () => clearTimeout(timer);
  }, [dependency]);

  return toc;
}
