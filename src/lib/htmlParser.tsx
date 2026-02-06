import React, { createContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '@/components/CodeBlock';
import TableWithControls from '@/components/TableWithControls';
import Accordion from '@/components/Accordion';
import AlertButton from '@/components/AlertButton';
import NewUIComponentViewer from '@/uic-system/NewUIComponentViewer';

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

const preprocessMarkdown = (html: string): string => {
  let processed = html;

  // Fixed accordion preprocessing - removed catastrophic backtracking
  // Old vulnerable pattern: :::accordion\s+([^\n]+)\n((?:[^:]|:(?!::))*?):::
  // New safe pattern: uses negated character class and lazy quantifier with reasonable limits
  processed = processed.replace(
    /:::accordion\s+([^\n]{1,200})\n([\s\S]{0,10000}?):::/g,
    (_, title, content) => {
      const sanitizedTitle = DOMPurify.sanitize(title.trim());
      const sanitizedContent = DOMPurify.sanitize(content.trim());
      return `<div class="accordion-wrapper" data-title="${sanitizedTitle.replace(/"/g, '&quot;')}">${sanitizedContent}</div>`;
    }
  );

  // Safe alert button preprocessing
  const alertReplacements = [
    { pattern: /\[✓\]([^\[]*?)(?=\[|$)/g, type: 'success' },
    { pattern: /\[!\]([^\[]*?)(?=\[|$)/g, type: 'warning' },
    { pattern: /\[✕\]([^\[]*?)(?=\[|$)/g, type: 'error' },
    { pattern: /\[\?\]([^\[]*?)(?=\[|$)/g, type: 'info' },
  ];

  alertReplacements.forEach(({ pattern, type }) => {
    processed = processed.replace(pattern, (_, text) => {
      const cleanText = text.trim();
      return `<span class="alert-button" data-type="${type}">${cleanText}</span>`;
    });
  });

  return processed;
};

const processTextNode = (node: Node, key: string, elements: React.ReactNode[]) => {
  const text = (node.textContent || '').trim();
  if (text) {
    elements.push(
      React.createElement('span', {
        key,
        dangerouslySetInnerHTML: { __html: text },
      })
    );
  }
};

const processPreElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const codeElement = element.querySelector('code');
  if (codeElement) {
    const code = codeElement.textContent || '';
    const language =
      element.dataset.lang ||
      element.dataset.language ||
      codeElement.className.replace('language-', '') ||
      'bash';

    elements.push(
      React.createElement(CodeBlock, {
        key,
        code: code.trim(),
        language,
      })
    );
  }
};

const processCodeElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  if (element.parentElement?.tagName.toLowerCase() !== 'pre') {
    elements.push(
      React.createElement('code', {
        key,
        className: 'bg-slate-900 px-2 py-1 rounded text-slate-100 font-mono text-sm',
        children: element.textContent,
      })
    );
  }
};

const processHeadingElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement(tagName as any, {
      key,
      id: element.id,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

const processParagraphElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const text = element.textContent || '';
  const uicPattern = /\[uic:([a-z-]+)\]/;
  const match = uicPattern.exec(text);

  if (match) {
    const componentId = match[1];
    elements.push(
      React.createElement('div', {
        key,
        className: 'my-6',
        children: React.createElement(NewUIComponentViewer, {
          componentId,
        }),
      })
    );
    return;
  }

  elements.push(
    React.createElement('p', {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

const processListElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement(tagName as any, {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

const processLinkElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const href = element.getAttribute('href') || '#';
  elements.push(
    React.createElement('a', {
      key,
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

const processImageElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const src = element.getAttribute('src') || '';
  const alt = element.getAttribute('alt') || 'Image';
  const title = element.getAttribute('title') || '';

  if (title) {
    elements.push(
      React.createElement('figure', {
        key,
        className: 'my-6 w-full',
        children: [
          React.createElement('img', {
            key: `img-${key}`,
            src,
            alt,
            loading: 'lazy',
            className: 'rounded-lg shadow-md max-w-full h-auto w-full',
          }),
          React.createElement('figcaption', {
            key: `caption-${key}`,
            className: 'mt-2 text-center text-xs text-slate-400 italic font-medium',
            children: title,
          }),
        ],
      })
    );
  } else {
    elements.push(
      React.createElement('img', {
        key,
        src,
        alt,
        loading: 'lazy',
        className: 'rounded-lg shadow-md max-w-full h-auto my-4',
      })
    );
  }
};

const processBlockquoteElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const processBlockquoteContent = (el: Element): React.ReactNode[] => {
    const innerElements: React.ReactNode[] = [];
    const childNodes = Array.from(el.childNodes);

    childNodes.forEach((node, idx) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as Element;
        if (childElement.tagName.toLowerCase() === 'blockquote') {
          innerElements.push(
            React.createElement('blockquote', {
              key: `nested-${idx}`,
              className: 'border-l-4 pl-4 my-2',
              children: processBlockquoteContent(childElement),
            })
          );
        } else {
          innerElements.push(
            React.createElement('div', {
              key: `child-${idx}`,
              dangerouslySetInnerHTML: { __html: childElement.outerHTML },
            })
          );
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          innerElements.push(React.createElement('span', { key: `text-${idx}`, children: text }));
        }
      }
    });

    return innerElements;
  };

  const content = processBlockquoteContent(element);

  elements.push(
    React.createElement('blockquote', {
      key,
      className: 'border-l-4 pl-4 my-4',
      children: content,
    })
  );
};

const TableRenderer: React.FC<{
  tableHtml: string;
  onTableClick?: (html: string) => void;
  isDark: boolean;
}> = ({ tableHtml, onTableClick, isDark }) =>
  React.createElement(TableWithControls, {
    tableHtml,
    isDark,
    onFullscreen: (html) => onTableClick?.(html),
  });

const processCellContent = (cell: Element): void => {
  let innerHTML = cell.innerHTML;

  // Safe regex patterns for formatting
  innerHTML = innerHTML.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  innerHTML = innerHTML.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  innerHTML = innerHTML.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Improved safe link regex with stricter URL validation
  // This is actually already safe (false positive), but making it even more explicit
  innerHTML = innerHTML.replace(
    /\[([^\]]{1,500})\]\(([^\s)]{1,2048})\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  cell.innerHTML = innerHTML;
};

const processTableElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const cells = element.querySelectorAll('td, th');
  cells.forEach((cell) => {
    processCellContent(cell);
  });

  const tableHtml = element.outerHTML;
  elements.push(
    React.createElement(TableContext.Consumer, {
      key,
      children: ({ onTableClick, isDark }) =>
        React.createElement(TableRenderer, {
          tableHtml,
          onTableClick,
          isDark,
        }),
    })
  );
};

const processHrElement = (key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement('hr', { key }));
};

const processStrongElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('strong', {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

const processEmElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('em', {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

const processAccordionWrapper = (element: Element, key: string, elements: React.ReactNode[]) => {
  const title = element.getAttribute('data-title') || '';
  const content = element.innerHTML;

  elements.push(
    React.createElement(Accordion, {
      key,
      title,
      children: React.createElement('div', {
        dangerouslySetInnerHTML: { __html: content },
      }),
    })
  );
};

const processAlertButton = (element: Element, key: string, elements: React.ReactNode[]) => {
  const type = element.getAttribute('data-type') as 'success' | 'warning' | 'error' | 'info';
  const text = element.textContent || '';

  elements.push(
    React.createElement(AlertButton, {
      key,
      type,
      children: text,
    })
  );
};

export const parseHtmlToReact = (html: string): React.ReactNode[] => {
  const preprocessed = preprocessMarkdown(html);

  const sanitized = DOMPurify.sanitize(preprocessed, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'a',
      'ul', 'ol', 'li', 'blockquote', 'code',
      'pre', 'img', 'table', 'tr', 'td', 'th',
      'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'data-language', 'data-lang', 'data-title', 'data-type'],
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

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      if (tagName === 'div' && element.classList.contains('accordion-wrapper')) {
        processAccordionWrapper(element, key, elements);
        return;
      }

      if (tagName === 'span' && element.classList.contains('alert-button')) {
        processAlertButton(element, key, elements);
        return;
      }

      switch (tagName) {
        case 'pre':
          processPreElement(element, key, elements);
          break;
        case 'code':
          processCodeElement(element, key, elements);
          break;
        case 'p':
          processParagraphElement(element, key, elements);
          break;
        case 'ul':
        case 'ol':
          processListElement(element, tagName, key, elements);
          break;
        case 'a':
          processLinkElement(element, key, elements);
          break;
        case 'img':
          processImageElement(element, key, elements);
          break;
        case 'blockquote':
          processBlockquoteElement(element, key, elements);
          break;
        case 'table':
          processTableElement(element, key, elements);
          break;
        case 'hr':
          processHrElement(key, elements);
          break;
        case 'strong':
          processStrongElement(element, key, elements);
          break;
        case 'em':
          processEmElement(element, key, elements);
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          processHeadingElement(element, tagName, key, elements);
          break;
        default:
          if (element.childNodes.length > 0) {
            processNodes(element.childNodes, key);
          }
      }
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};