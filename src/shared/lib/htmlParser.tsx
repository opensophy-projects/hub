import React, { createContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '../components/CodeBlock';
import TableWithControls from '@/features/table/components/TableWithControls';
import Accordion from '../components/Accordion';
import NewUIComponentViewer from '@/features/ui-components/NewUIComponentViewer';

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
      'bash';

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
      'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'data-language', 'data-lang'],
    ALLOW_DATA_ATTR: false,
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
  elements.push(
    <ListTag key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
};

const processLinkElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    <a
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
  const title = element.getAttribute('title') || '';

  if (title) {
    elements.push(
      <figure key={key} className="my-6 w-full">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="rounded-lg shadow-md max-w-full h-auto w-full"
        />
        <figcaption className="mt-2 text-center text-xs text-slate-400 italic font-medium">
          {title}
        </figcaption>
      </figure>
    );
  } else {
    elements.push(
      <img
        key={key}
        src={src}
        alt={alt}
        loading="lazy"
        className="rounded-lg shadow-md max-w-full h-auto my-4"
      />
    );
  }
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
  elements.push(
    <strong key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
};

const processEmElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    <em key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
};

const processTextNode = (node: ChildNode, key: string, elements: React.ReactNode[]) => {
  const text = node.textContent || '';
  const trimmedText = text.trim();
  if (trimmedText) {
    elements.push(
      <span key={key}>{text}</span>
    );
  }
};

const processAccordion = (
  element: Element,
  key: string,
  textContent: string,
  nodeArray: Element[],
  index: number,
  elements: React.ReactNode[]
): number => {
  const accordionRegex = /^:::accordion\s+(.+)/;
  const titleMatch = accordionRegex.exec(textContent);

  if (!titleMatch) {
    return index;
  }

  const title = titleMatch[1].trim();
  const accordionContent: React.ReactNode[] = [];

  let nextIndex = index + 1;
  while (nextIndex < nodeArray.length) {
    const nextNode = nodeArray[nextIndex];
    const nextText = nextNode.textContent || '';

    if (nextText.trim().startsWith(':::accordion')) {
      break;
    }

    const sanitizedHTML = sanitizeInnerHTML(nextNode.innerHTML);
    accordionContent.push(
      <div key={`acc-content-${nextIndex}`} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
    );
    nextIndex++;
  }

  elements.push(
    <Accordion key={key} title={title}>
      <div>{accordionContent}</div>
    </Accordion>
  );

  return nextIndex - 1;
};

const processUIComponent = (
  element: Element,
  key: string,
  textContent: string,
  elements: React.ReactNode[]
): boolean => {
  const uicPattern = /\[uic:([a-z-]+)\]/;
  const match = uicPattern.exec(textContent);

  if (!match) {
    return false;
  }

  const componentId = match[1];
  elements.push(
    <div key={key} className="my-6">
      <NewUIComponentViewer componentId={componentId} />
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
    'pre': () => processPreElement(element, key, elements),
    'code': () => processCodeElement(element, key, elements),
    'ul': () => processListElement(element, tagName, key, elements),
    'ol': () => processListElement(element, tagName, key, elements),
    'a': () => processLinkElement(element, key, elements),
    'img': () => processImageElement(element, key, elements),
    'blockquote': () => processBlockquoteElement(element, key, elements),
    'table': () => processTableElement(element, key, elements),
    'hr': () => processHrElement(key, elements),
    'strong': () => processStrongElement(element, key, elements),
    'em': () => processEmElement(element, key, elements),
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
      'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'data-language', 'data-lang'],
    ALLOW_DATA_ATTR: true,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'text/html');
  const elements: React.ReactNode[] = [];

  const processNodes = (nodes: NodeListOf<ChildNode>, parentKey = '') => {
    const nodeArray = Array.from(nodes) as ChildNode[];
    let skipUntilIndex = -1;

    nodeArray.forEach((node, index) => {
      if (skipUntilIndex >= index) {
        return;
      }

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
      const textContent = element.textContent || '';

      if (tagName === 'p') {
        if (textContent.trim().startsWith(':::accordion')) {
          skipUntilIndex = processAccordion(element, key, textContent, nodeArray as Element[], index, elements);
          return;
        }

        if (processUIComponent(element, key, textContent, elements)) {
          return;
        }

        const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
        elements.push(
          <p key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
        );
        return;
      }

      processElement(element, tagName, key, elements, processNodes);
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};
