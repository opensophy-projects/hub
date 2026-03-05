import React, { createContext, useContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '../components/CodeBlock';
import TableWithControls from '@/features/table/components/TableWithControls';
import Alert from '../components/Alert';
import NewUIComponentViewer from '@/features/ui-components/NewUIComponentViewer';
import ImageCard from '../components/ImageCard';
import HeadingAnchor from '../components/HeadingAnchor';
import { CardWithContext, CardGridWithContext } from '../components/Card';
import { ColumnsWithContext } from '../components/Columns';
import { StepperWithContext } from '../components/Stepper';
import type { StepData, StepStatus } from '../components/Stepper';

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

// ─── Sanitize ──────────────────────────────────────────────────────────────────

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 'a',
  'ul', 'ol', 'li', 'blockquote', 'code',
  'pre', 'img', 'table', 'tr', 'td', 'th',
  'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption',
  'del', 'input', 'sub', 'sup', 'details', 'summary', 'mark',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'data-language', 'data-lang', 'data-alert-type',
  'data-cols', 'data-layout', 'data-status', 'data-title',
  'data-color', 'data-icon',
  'type', 'checked', 'disabled', 'open', 'style', 'align',
];

const sanitizeInnerHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  });
};

// ─── Heading slug (must match TOC logic) ──────────────────────────────────────

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Processors ───────────────────────────────────────────────────────────────

const processPreElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const codeElement = element.querySelector('code');
  if (codeElement) {
    const code = codeElement.textContent || '';
    const language =
      element.dataset.lang ||
      element.dataset.language ||
      codeElement.className.replace('language-', '') ||
      '';
    elements.push(React.createElement(CodeBlock, { key, code: code.trim(), language }));
  }
};

const processCodeElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  if (element.parentElement?.tagName.toLowerCase() !== 'pre') {
    elements.push(
      React.createElement(
        'code',
        { key, className: 'bg-slate-900 px-2 py-1 rounded text-slate-100 font-mono text-sm' },
        element.textContent
      )
    );
  }
};

const processHeadingElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const text = element.textContent || '';
  const id = element.id || slugifyHeading(text);
  const level = parseInt(tagName[1], 10);
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    React.createElement(HeadingAnchor, { key, id, level, html: sanitizedHTML })
  );
};

const processListElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  const hasTaskList = element.querySelector('input[type="checkbox"]');
  elements.push(
    React.createElement(tagName, {
      key,
      dangerouslySetInnerHTML: { __html: sanitizedHTML },
      className: hasTaskList ? 'task-list' : undefined,
    })
  );
};

const processLinkElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    React.createElement('a', {
      key,
      href: element.getAttribute('href') || '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      dangerouslySetInnerHTML: { __html: sanitizedHTML },
    })
  );
};

const processImageElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const src = element.getAttribute('src') || '';
  const alt = element.getAttribute('alt') || 'Image';
  const title = element.getAttribute('title') || undefined;
  elements.push(React.createElement(ImageCard, { key, src, alt, title }));
};

const processBlockquoteElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    React.createElement('blockquote', { key, dangerouslySetInnerHTML: { __html: sanitizedHTML } })
  );
};

const TableRenderer: React.FC<{
  tableHtml: string;
  onTableClick?: (html: string) => void;
  isDark: boolean;
}> = ({ tableHtml, onTableClick, isDark }) => {
  return React.createElement(TableWithControls, {
    tableHtml: sanitizeInnerHTML(tableHtml),
    isDark,
    onFullscreen: (html: string) => onTableClick?.(sanitizeInnerHTML(html)),
  });
};

const processTableElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const tableHtml = element.outerHTML;
  elements.push(
    React.createElement(
      TableContext.Consumer,
      { key },
      ({ onTableClick, isDark }: { onTableClick?: (html: string) => void; isDark: boolean }) =>
        React.createElement(TableRenderer, { tableHtml, onTableClick, isDark })
    )
  );
};

const processHrElement = (key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement('hr', { key }));
};

const processStrongElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement('strong', { key, dangerouslySetInnerHTML: { __html: sanitizeInnerHTML(element.innerHTML) } }));
};
const processEmElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement('em', { key, dangerouslySetInnerHTML: { __html: sanitizeInnerHTML(element.innerHTML) } }));
};
const processUnderlineElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement('u', { key, dangerouslySetInnerHTML: { __html: sanitizeInnerHTML(element.innerHTML) } }));
};
const processDeleteElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement('del', { key, dangerouslySetInnerHTML: { __html: sanitizeInnerHTML(element.innerHTML) } }));
};
const processSubElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement('sub', { key, dangerouslySetInnerHTML: { __html: sanitizeInnerHTML(element.innerHTML) } }));
};
const processSupElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement('sup', { key, dangerouslySetInnerHTML: { __html: sanitizeInnerHTML(element.innerHTML) } }));
};

const processDetailsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const isOpen = element.hasAttribute('open');
  const summary = element.querySelector('summary');
  const summaryText = summary?.textContent || 'Подробности';
  let contentHTML = element.innerHTML;
  if (summary) contentHTML = contentHTML.replace(summary.outerHTML, '');
  const contentElements = parseHtmlToReact(sanitizeInnerHTML(contentHTML));
  elements.push(
    React.createElement(
      'details',
      { key, open: isOpen, className: 'my-4' },
      React.createElement('summary', null, summaryText),
      React.createElement('div', { className: 'details-content pt-2 pb-3' }, ...contentElements)
    )
  );
};

const processAlertElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const alertType = element.dataset.alertType as 'note' | 'tip' | 'important' | 'warning' | 'caution';
  if (alertType) {
    const contentElements = parseHtmlToReact(sanitizeInnerHTML(element.innerHTML));
    elements.push(React.createElement(Alert, { key, type: alertType }, ...contentElements));
  }
};

// ─── Card processors ──────────────────────────────────────────────────────────

const processCardElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const color = element.dataset.color || undefined;
  const title = element.dataset.title || undefined;
  const icon = element.dataset.icon || undefined;
  const contentElements = parseHtmlToReact(sanitizeInnerHTML(element.innerHTML));
  elements.push(
    React.createElement(
      CardWithContext,
      { key, color: color || undefined, title: title || undefined, icon: icon || undefined },
      ...contentElements
    )
  );
};

const processCardGridElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const cols = parseInt(element.dataset.cols || '2', 10);
  const cardElements: React.ReactNode[] = [];

  Array.from(element.children).forEach((child, i) => {
    if (child.classList.contains('custom-card')) {
      processCardElement(child, `${key}-card-${i}`, cardElements);
    }
  });

  elements.push(
    React.createElement(CardGridWithContext, { key, cols }, ...cardElements)
  );
};

// ─── Columns processor ────────────────────────────────────────────────────────

const processColumnsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const layout = (element.dataset.layout || 'equal') as any;
  const colElements: React.ReactNode[] = [];

  Array.from(element.children).forEach((col, i) => {
    if (col.classList.contains('custom-col')) {
      const colContent = parseHtmlToReact(sanitizeInnerHTML(col.innerHTML));
      colElements.push(React.createElement('div', { key: `${key}-col-${i}` }, ...colContent));
    }
  });

  elements.push(
    React.createElement(ColumnsWithContext, { key, layout }, ...colElements)
  );
};

// ─── Steps processor ──────────────────────────────────────────────────────────

const processStepsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const steps: StepData[] = [];

  Array.from(element.children).forEach((stepEl) => {
    if (stepEl.classList.contains('custom-step')) {
      const title = stepEl.dataset.title || '';
      const status = (stepEl.dataset.status || 'default') as StepStatus;
      const contentNodes = parseHtmlToReact(sanitizeInnerHTML(stepEl.innerHTML));
      steps.push({
        title,
        status,
        content: React.createElement(React.Fragment, null, ...contentNodes),
      });
    }
  });

  elements.push(React.createElement(StepperWithContext, { key, steps }));
};

// ─── UIComponent processor ────────────────────────────────────────────────────

const processUIComponent = (
  element: Element,
  key: string,
  textContent: string,
  elements: React.ReactNode[]
): boolean => {
  const match = /\[uic:([a-z-]+)\]/.exec(textContent);
  if (!match) return false;
  elements.push(
    React.createElement('div', { key, className: 'my-6' },
      React.createElement(NewUIComponentViewer, { componentId: match[1] })
    )
  );
  return true;
};

const processTextNode = (node: ChildNode, key: string, elements: React.ReactNode[]) => {
  const text = node.textContent || '';
  if (text.trim()) elements.push(React.createElement('span', { key }, text));
};

// ─── Generic element dispatcher ───────────────────────────────────────────────

const processElement = (
  element: Element,
  tagName: string,
  key: string,
  elements: React.ReactNode[],
  processNodes: (nodes: NodeListOf<ChildNode>, parentKey: string) => void
) => {
  const handlers: Record<string, () => void> = {
    'pre':        () => processPreElement(element, key, elements),
    'code':       () => processCodeElement(element, key, elements),
    'ul':         () => processListElement(element, tagName, key, elements),
    'ol':         () => processListElement(element, tagName, key, elements),
    'a':          () => processLinkElement(element, key, elements),
    'img':        () => processImageElement(element, key, elements),
    'blockquote': () => processBlockquoteElement(element, key, elements),
    'table':      () => processTableElement(element, key, elements),
    'hr':         () => processHrElement(key, elements),
    'strong':     () => processStrongElement(element, key, elements),
    'em':         () => processEmElement(element, key, elements),
    'u':          () => processUnderlineElement(element, key, elements),
    'del':        () => processDeleteElement(element, key, elements),
    'sub':        () => processSubElement(element, key, elements),
    'sup':        () => processSupElement(element, key, elements),
    'details':    () => processDetailsElement(element, key, elements),
  };

  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    processHeadingElement(element, tagName, key, elements);
    return;
  }

  if (handlers[tagName]) {
    handlers[tagName]();
    return;
  }

  if (element.childNodes.length > 0) {
    processNodes(element.childNodes, key);
  }
};

// ─── Main parser ──────────────────────────────────────────────────────────────

export const parseHtmlToReact = (html: string): React.ReactNode[] => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOW_DATA_ATTR: true,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'text/html');
  const elements: React.ReactNode[] = [];

  const processNodes = (nodes: NodeListOf<ChildNode>, parentKey = '') => {
    Array.from(nodes).forEach((node, index) => {
      const key = `${parentKey}-${index}`;

      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node, key, elements);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // ── Custom blocks ──
      if (tagName === 'div') {
        if (element.classList.contains('custom-alert')) {
          processAlertElement(element, key, elements);
          return;
        }
        if (element.classList.contains('custom-cardgrid')) {
          processCardGridElement(element, key, elements);
          return;
        }
        if (element.classList.contains('custom-card')) {
          processCardElement(element, key, elements);
          return;
        }
        if (element.classList.contains('custom-columns')) {
          processColumnsElement(element, key, elements);
          return;
        }
        if (element.classList.contains('custom-steps')) {
          processStepsElement(element, key, elements);
          return;
        }
      }

      // ── Paragraph ──
      if (tagName === 'p') {
        const children = Array.from(element.childNodes).filter(
          (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim())
        );
        if (
          children.length === 1 &&
          (children[0] as Element).tagName?.toLowerCase() === 'img'
        ) {
          processImageElement(children[0] as Element, key, elements);
          return;
        }
        if (processUIComponent(element, key, element.textContent || '', elements)) return;
        elements.push(
          React.createElement('p', {
            key,
            dangerouslySetInnerHTML: { __html: sanitizeInnerHTML(element.innerHTML) },
          })
        );
        return;
      }

      processElement(element, tagName, key, elements, processNodes);
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};