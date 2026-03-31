import React, { createContext, lazy, Suspense } from 'react';
import DOMPurify from 'isomorphic-dompurify';

import { CodeBlock } from '../components/CodeBlock';
import TableWithControls from '@/features/table/components/TableWithControls';
import Alert from '../components/Alert';
import ImageCard from '../components/ImageCard';

const LazyChartBlock = lazy(() => import('../components/ChartBlock'));

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

/** Разрешённые теги */
const ALLOWED_TAGS = [
  'p','br','strong','em','u','a','ul','ol','li','blockquote','code','pre',
  'img','table','tr','td','th','thead','tbody','div','span','hr'
];

/** Разрешённые атрибуты */
const ALLOWED_ATTR = [
  'href','src','alt','title','class','id',
  'data-*','style'
];

/** Санитизация HTML */
const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  });

/** Безопасный dangerouslySetInnerHTML */
const createHTML = (html: string) => ({
  __html: sanitize(html),
});

/** Обработка <pre><code> */
const renderCodeBlock = (el: Element, key: string) => {
  const code = el.querySelector('code')?.textContent || '';
  const lang =
    el.getAttribute('data-lang') ||
    el.querySelector('code')?.className.replace('language-', '') ||
    '';

  return <CodeBlock key={key} code={code.trim()} language={lang} />;
};

/** Обработка ссылок */
const renderLink = (el: Element, key: string) => {
  const href = el.getAttribute('href') || '#';

  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      dangerouslySetInnerHTML={createHTML(el.innerHTML)}
    />
  );
};

/** Обработка изображений */
const renderImage = (el: Element, key: string) => (
  <ImageCard
    key={key}
    src={el.getAttribute('src') || ''}
    alt={el.getAttribute('alt') || 'Image'}
    title={el.getAttribute('title') || undefined}
  />
);

/** Обработка таблицы */
const renderTable = (el: Element, key: string) => {
  const html = sanitize(el.outerHTML);

  return (
    <TableContext.Consumer key={key}>
      {({ onTableClick, isDark }) => (
        <TableWithControls
          tableHtml={html}
          isDark={isDark}
          onFullscreen={(h) => onTableClick?.(sanitize(h))}
        />
      )}
    </TableContext.Consumer>
  );
};

/** Обработка alert */
const renderAlert = (el: Element, key: string) => {
  const type = el.getAttribute('data-alert-type') as any;
  if (!type) return null;

  return (
    <Alert key={key} type={type}>
      {parseHtmlToReact(el.innerHTML)}
    </Alert>
  );
};

/** Обработка div с кастомными классами */
const renderDiv = (el: Element, key: string): React.ReactNode => {
  if (el.classList.contains('custom-alert')) {
    return renderAlert(el, key);
  }

  if (el.classList.contains('custom-chart')) {
    const data = JSON.parse(el.getAttribute('data-chart') || '[]');

    return (
      <Suspense key={key} fallback={<div style={{ height: 300 }} />}>
        <LazyChartBlock data={data} />
      </Suspense>
    );
  }

  return parseHtmlToReact(el.innerHTML);
};

/** Универсальный рендер */
const renderNode = (node: ChildNode, key: string): React.ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? <span key={key}>{text}</span> : null;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'pre': return renderCodeBlock(el, key);
    case 'a': return renderLink(el, key);
    case 'img': return renderImage(el, key);
    case 'table': return renderTable(el, key);
    case 'blockquote':
    case 'p':
    case 'ul':
    case 'ol':
      return (
        React.createElement(tag, {
          key,
          dangerouslySetInnerHTML: createHTML(el.innerHTML),
        })
      );

    case 'div':
      return <React.Fragment key={key}>{renderDiv(el, key)}</React.Fragment>;

    default:
      return parseHtmlToReact(el.innerHTML);
  }
};

/** Основной парсер */
export const parseHtmlToReact = (html: string): React.ReactNode[] => {
  const clean = sanitize(html);
  const doc = new DOMParser().parseFromString(clean, 'text/html');

  const result: React.ReactNode[] = [];

  doc.body.childNodes.forEach((node, i) => {
    const el = renderNode(node, `node-${i}`);
    if (el) result.push(el);
  });

  return result;
};