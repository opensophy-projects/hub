import { useState, useLayoutEffect, useEffect, useRef } from 'react';

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
      const count = (usedIds.get(id) ?? 0) + 1;
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

// useLayoutEffect на клиенте, useEffect на сервере (SSR-безопасность)
const useIsomorphicLayoutEffect =
  globalThis.window === undefined ? useEffect : useLayoutEffect;

export function useTableOfContents<T extends { id?: string; slug?: string; content?: string }>(
  dependency: T
): TableOfContentsItem[] {
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);

  // Используем slug + content как ключ зависимости для точного обнаружения смены страницы
  const depKey = `${dependency?.id ?? ''}-${dependency?.slug ?? ''}`;
  const depKeyRef = useRef('');

  useIsomorphicLayoutEffect(() => {
    // Сброс TOC при смене страницы (slug изменился)
    if (depKey !== depKeyRef.current) {
      depKeyRef.current = depKey;
      setToc([]);
    }

    // Синхронный скан до отрисовки браузером
    const items = scanHeadings();
    if (items.length > 0) {
      setToc(items);
      return;
    }

    // Фолбэк: наблюдаем за [data-article-content], отключаемся после первого успешного скана
    const container = document.querySelector('[data-article-content]') ?? document.body;

    let disconnected = false;

    const observer = new MutationObserver(() => {
      if (disconnected) return;
      const found = scanHeadings();
      if (found.length > 0) {
        setToc(found);
        observer.disconnect();
        disconnected = true;
      }
    });

    observer.observe(container, { childList: true, subtree: true });
    return () => {
      disconnected = true;
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  return toc;
}