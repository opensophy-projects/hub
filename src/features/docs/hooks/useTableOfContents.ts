import { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react';

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

    items.push({ id: heading.id, text, level: Number.parseInt(heading.tagName[1], 10) });
  });

  return items;
}

// useLayoutEffect на клиенте, useEffect на сервере
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function useTableOfContents<T extends { id?: string; slug?: string; content?: string }>(
  dependency: T
): TableOfContentsItem[] {
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);

  // Стабильный ключ смены страницы — slug или id
  const pageKey = `${dependency?.id ?? ''}-${dependency?.slug ?? ''}`;
  const pageKeyRef = useRef('');
  const observerRef = useRef<MutationObserver | null>(null);

  const doScan = useCallback(() => {
    const found = scanHeadings();
    if (found.length > 0) {
      setToc(found);
      return true;
    }
    return false;
  }, []);

  const startObserver = useCallback(() => {
    // Отключаем предыдущий
    observerRef.current?.disconnect();

    const container = document.querySelector('[data-article-content]') ?? document.body;
    const observer = new MutationObserver(() => {
      if (doScan()) {
        observer.disconnect();
        observerRef.current = null;
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    observerRef.current = observer;
    return observer;
  }, [doScan]);

  // Основной эффект — срабатывает при смене страницы
  useIsomorphicLayoutEffect(() => {
    const isNewPage = pageKey !== pageKeyRef.current;
    if (isNewPage) {
      pageKeyRef.current = pageKey;
      setToc([]); // сразу сбрасываем старое оглавление
    }

    // Пробуем синхронный скан
    if (!doScan()) {
      startObserver();
    }

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  // Слушаем BroadcastChannel — когда dev panel обновляет контент,
  // нужно пересканировать заголовки
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const ch = new BroadcastChannel('hub-dev-preview');
    ch.onmessage = (e) => {
      if (e.data?.type !== 'preview') return;
      // Даём React время перерендерить новый HTML, потом сканируем
      setTimeout(() => {
        if (!doScan()) {
          startObserver();
        }
      }, 100);
    };

    return () => ch.close();
  }, [doScan, startObserver]);

  return toc;
}