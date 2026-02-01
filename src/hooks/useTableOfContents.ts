import { useState, useEffect, RefObject } from 'react';

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

export function useTableOfContents(
  contentRef: RefObject<HTMLDivElement>,
  dependency: any
): TableOfContentsItem[] {
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);

  useEffect(() => {
    const generateTOC = () => {
      if (!contentRef.current) return;

      const headings = contentRef.current.querySelectorAll('h2, h3, h4');
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
  }, [contentRef, dependency]);

  return toc;
}
