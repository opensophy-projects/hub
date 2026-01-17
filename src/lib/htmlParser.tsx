import React from 'react';
import { Maximize2 } from 'lucide-react';

interface HtmlNode {
  type: 'text' | 'element';
  tag?: string;
  children?: (HtmlNode | string)[];
  attrs?: Record<string, string>;
  text?: string;
}

interface TableContextType {
  onTableClick?: (tableHtml: string) => void;
  isNegative?: boolean;
}

export const TableContext = React.createContext<TableContextType>({});

const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 'del', 'code', 'pre',
  'ul', 'ol', 'li', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'a', 'img', 'div', 'span', 'hr',
  'section', 'article', 'main'
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  'a': new Set(['href', 'title', 'target', 'rel']),
  'img': new Set(['src', 'alt', 'title', 'width', 'height', 'style', 'loading']),
  '*': new Set(['class', 'data-table-index', 'data-line', 'id', 'style'])
};

function isAllowedAttribute(tag: string, attr: string): boolean {
  const tagAttrs = ALLOWED_ATTRS[tag];
  const globalAttrs = ALLOWED_ATTRS['*'];
  return (tagAttrs && tagAttrs.has(attr)) || (globalAttrs && globalAttrs.has(attr));
}

function parseHtmlString(html: string): HtmlNode[] {
  const nodes: HtmlNode[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function traverse(element: Element | Node): HtmlNode | null {
    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent?.trim();
      if (text) {
        return { type: 'text', text };
      }
      return null;
    }

    if (element.nodeType === Node.ELEMENT_NODE) {
      const el = element as Element;
      const tag = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) {
        return null;
      }

      const attrs: Record<string, string> = {};
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (isAllowedAttribute(tag, attr.name)) {
          attrs[attr.name] = attr.value;
        }
      }

      const children: (HtmlNode | string)[] = [];
      for (let i = 0; i < el.childNodes.length; i++) {
        const child = traverse(el.childNodes[i]);
        if (child) {
          children.push(child);
        }
      }

      return {
        type: 'element',
        tag,
        attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
        children: children.length > 0 ? children : undefined
      };
    }

    return null;
  }

  for (let i = 0; i < doc.body.childNodes.length; i++) {
    const node = traverse(doc.body.childNodes[i]);
    if (node) {
      nodes.push(node);
    }
  }

  return nodes;
}

function nodeToReact(node: HtmlNode | string, key: string | number): React.ReactNode {
  if (typeof node === 'string') {
    return node;
  }

  if (node.type === 'text') {
    return node.text;
  }

  if (node.type === 'element' && node.tag) {
    if (node.tag === 'table') {
      return React.createElement(TableWrapper, { key, node });
    }

    if (node.tag === 'img') {
      return React.createElement(ImageWrapper, { key, node });
    }

    const props: Record<string, any> = {
      key,
      ...node.attrs
    };

    if (['h1', 'h2'].includes(node.tag)) {
      const textContent = extractTextFromChildren(node.children);
      const headingId = textContent
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      
      props.id = headingId;
      props.style = { scrollMarginTop: '100px' };
      
      const children = React.createElement('span', {}, textContent);
      return React.createElement(node.tag, props, children);
    }

    const children = node.children?.map((child, idx) => nodeToReact(child, idx));

    return React.createElement(node.tag, props, children);
  }

  return null;
}

function extractTextFromChildren(children?: (HtmlNode | string)[]): string {
  if (!children) return '';
  
  return children
    .map(child => {
      if (typeof child === 'string') return child;
      if (child.type === 'text') return child.text || '';
      if (child.type === 'element' && child.children) {
        return extractTextFromChildren(child.children);
      }
      return '';
    })
    .join('');
}

const ImageWrapper = ({ node }: { node: HtmlNode }) => {
  const { isNegative } = React.useContext(TableContext);
  const attrs = node.attrs || {};
  
  const imgProps: Record<string, any> = {
    src: attrs.src || '',
    alt: attrs.alt || '',
    loading: attrs.loading || 'lazy',
    style: {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '8px',
      margin: '16px 0',
      display: 'block',
      border: isNegative ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
    }
  };

  if (attrs.width) {
    imgProps.width = attrs.width;
  }
  if (attrs.height) {
    imgProps.height = attrs.height;
  }
  if (attrs.title) {
    imgProps.title = attrs.title;
  }

  return React.createElement('img', imgProps);
};

const TableWrapper = ({ node }: { node: HtmlNode }) => {
  const { onTableClick, isNegative } = React.useContext(TableContext);
  const tableRef = React.useRef<HTMLTableElement>(null);

  const handleTableClick = () => {
    if (!onTableClick || !tableRef.current) return;
    const tableHtml = tableRef.current.outerHTML;
    onTableClick(tableHtml);
  };

  const button = React.createElement(
    'button',
    {
      onClick: handleTableClick,
      className: `absolute top-2 right-2 z-10 p-2 rounded transition-all opacity-0 group-hover:opacity-100 ${
        isNegative
          ? 'bg-white/10 hover:bg-white/20 text-white'
          : 'bg-black/10 hover:bg-black/20 text-black'
      }`,
      title: 'Открыть таблицу на весь экран'
    },
    React.createElement(Maximize2, { className: 'w-4 h-4' })
  );

  const tableElement = React.createElement(
    'div',
    {
      className: 'relative group overflow-x-auto',
    },
    button,
    React.createElement(
      'table',
      {
        ref: tableRef,
        ...node.attrs,
        key: 0
      },
      node.children?.map((child, idx) => nodeToReactInternal(child, idx))
    )
  );

  return tableElement;
};

function nodeToReactInternal(node: HtmlNode | string, key: string | number): React.ReactNode {
  if (typeof node === 'string') {
    return node;
  }

  if (node.type === 'text') {
    return node.text;
  }

  if (node.type === 'element' && node.tag) {
    if (node.tag === 'img') {
      return React.createElement(ImageWrapper, { key, node });
    }

    const props: Record<string, any> = {
      key,
      ...node.attrs
    };

    const children = node.children?.map((child, idx) => nodeToReactInternal(child, idx));

    return React.createElement(node.tag, props, children);
  }

  return null;
}

export function parseHtmlToReact(html: string): React.ReactNode[] {
  const nodes = parseHtmlString(html);
  return nodes.map((node, idx) => nodeToReact(node, idx));
}
