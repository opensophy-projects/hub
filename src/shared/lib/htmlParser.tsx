import React, { createContext, useContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '../components/CodeBlock';
import TableWithControls from '@/features/table/components/TableWithControls';
import Alert from '../components/Alert';
import NewUIComponentViewer from '@/features/ui-components/NewUIComponentViewer';
import ImageCard from '../components/ImageCard';

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

const processPreElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const codeElement = element.querySelector('code');
  if (codeElement) {
    const code = codeElement.textContent || '';
    const language =
      element.dataset.lang ||
      element.dataset.language ||
      codeElement.className.replace('language-', '') ||
      '';

    elements.push(
      <CodeBlock
        key={key}
        code={code.trim()}
        language={language}
      />
    );
  }
};

const processCodeElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  if (element.parentElement?.tagName.toLowerCase() !== 'pre') {
    elements.push(
      <code
        key={key}
        className="bg-slate-900 px-2 py-1 rounded text-slate-100 font-mono text-sm"
      >
        {element.textContent}
      </code>
    );
  }
};

const sanitizeInnerHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'a',
      'ul', 'ol', 'li', 'blockquote', 'code',
      'pre', 'img', 'table', 'tr', 'td', 'th',
      'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption',
      'del', 'input', 'sub', 'sup', 'details', 'summary', 'mark'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'data-language', 'data-lang', 'data-alert-type',
      'type', 'checked', 'disabled', 'open', 'style', 'align'
    ],
    ALLOW_DATA_ATTR: true,
  });
};

const processHeadingElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const HeadingTag = tagName as keyof JSX.IntrinsicElements;
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    <HeadingTag
      key={key}
      id={element.id}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

const processListElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const ListTag = tagName as keyof JSX.IntrinsicElements;
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  const hasTaskList = element.querySelector('input[type="checkbox"]');
  elements.push(
    <ListTag
      key={key}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      className={hasTaskList ? 'task-list' : undefined}
    />
  );
};

const processLinkElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    
      key={key}
      href={element.getAttribute('href') || '#'}
      target="_blank"
      rel="noopener noreferrer"
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

const processImageElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const src = element.getAttribute('src') || '';
  const alt = element.getAttribute('alt') || 'Image';
  const title = element.getAttribute('title') || undefined;

  elements.push(
    <ImageCard key={key} src={src} alt={alt} title={title} />
  );
};

const processBlockquoteElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    <blockquote key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
};

const TableRenderer: React.FC<{
  tableHtml: string;
  onTableClick?: (html: string) => void;
  isDark: boolean;
}> = ({ tableHtml, onTableClick, isDark }) => {
  const sanitizedTableHtml = sanitizeInnerHTML(tableHtml);
  return (
    <TableWithControls
      tableHtml={sanitizedTableHtml}
      isDark={isDark}
      onFullscreen={(html) => onTableClick?.(sanitizeInnerHTML(html))}
    />
  );
};

const processTableElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const tableHtml = element.outerHTML;
  elements.push(
    <TableContext.Consumer key={key}>
      {({ onTableClick, isDark }) => (
        <TableRenderer
          tableHtml={tableHtml}
          onTableClick={onTableClick}
          isDark={isDark}
        />
      )}
    </TableContext.Consumer>
  );
};

const processHrElement = (key: string, elements: React.ReactNode[]) => {
  elements.push(<hr key={key} />);
};

const processStrongElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(<strong key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />);
};

const processEmElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(<em key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />);
};

const processUnderlineElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(<u key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />);
};

const processDeleteElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(<del key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />);
};

const processSubElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(<sub key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />);
};

const processSupElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(<sup key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />);
};

const processDetailsElement = (
  element: Element,
  key: string,
  elements: React.ReactNode[]
) => {
  const isOpen = element.hasAttribute('open');
  const summary = element.querySelector('summary');
  const summaryText = summary?.textContent || 'Подробности';

  let contentHTML = element.innerHTML;
  if (summary) {
    contentHTML = contentHTML.replace(summary.outerHTML, '');
  }

  const sanitizedContent = sanitizeInnerHTML(contentHTML);
  const contentElements = parseHtmlToReact(sanitizedContent);

  elements.push(
    <details key={key} open={isOpen} className="my-4">
      <summary>{summaryText}</summary>
      <div className="details-content pt-2 pb-3">
        {contentElements}
      </div>
    </details>
  );
};

const processAlertElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const alertType = element.dataset.alertType as 'note' | 'tip' | 'important' | 'warning' | 'caution';
  if (alertType) {
    const sanitizedContent = sanitizeInnerHTML(element.innerHTML);
    const contentElements = parseHtmlToReact(sanitizedContent);
    elements.push(
      <Alert key={key} type={alertType}>
        {contentElements}
      </Alert>
    );
  }
};

const processTextNode = (node: ChildNode, key: string, elements: React.ReactNode[]) => {
  const text = node.textContent || '';
  if (text.trim()) {
    elements.push(<span key={key}>{text}</span>);
  }
};

const processUIComponent = (
  element: Element,
  key: string,
  textContent: string,
  elements: React.ReactNode[]
): boolean => {
  const match = /\[uic:([a-z-]+)\]/.exec(textContent);
  if (!match) return false;
  elements.push(
    <div key={key} className="my-6">
      <NewUIComponentViewer componentId={match[1]} />
    </div>
  );
  return true;
};

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

export const parseHtmlToReact = (html: string): React.ReactNode[] => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'a',
      'ul', 'ol', 'li', 'blockquote', 'code',
      'pre', 'img', 'table', 'tr', 'td', 'th',
      'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption',
      'del', 'input', 'sub', 'sup', 'details', 'summary', 'mark'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'data-language', 'data-lang', 'data-alert-type',
      'type', 'checked', 'disabled', 'open', 'style', 'align'
    ],
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

      if (tagName === 'div' && element.classList.contains('custom-alert')) {
        processAlertElement(element, key, elements);
        return;
      }

      if (tagName === 'p') {
        // Если внутри <p> только одна картинка — рендерим ImageCard напрямую
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

        if (processUIComponent(element, key, element.textContent || '', elements)) {
          return;
        }

        elements.push(
          <p key={key} dangerouslySetInnerHTML={{ __html: sanitizeInnerHTML(element.innerHTML) }} />
        );
        return;
      }

      processElement(element, tagName, key, elements, processNodes);
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};