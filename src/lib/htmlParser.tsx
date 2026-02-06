import React, { createContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '@/components/CodeBlock';
import TableWithControls from '@/components/TableWithControls';
import Accordion from '@/components/Accordion';
import AlertButton from '@/components/AlertButton';
import NewUIComponentViewer from '@/uic-system/components/NewUIComponentViewer';

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

const processTextNode = (node: Node, key: string, elements: React.ReactNode[]) => {
  let text = node.textContent || '';
  
  const alertPatterns = [
    { regex: /\[✓\](.*?)(?=\[|$)/g, type: 'success' as const },
    { regex: /\[!\](.*?)(?=\[|$)/g, type: 'warning' as const },
    { regex: /\[✕\](.*?)(?=\[|$)/g, type: 'error' as const },
    { regex: /\[\?\](.*?)(?=\[|$)/g, type: 'info' as const },
  ];

  let hasAlerts = false;
  const alertElements: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const pattern of alertPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      hasAlerts = true;
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText.trim()) {
        alertElements.push(
          <span key={`text-before-${key}-${match.index}`}>{beforeText}</span>
        );
      }
      alertElements.push(
        <AlertButton key={`alert-${key}-${match.index}`} type={pattern.type}>
          {match[1].trim()}
        </AlertButton>
      );
      lastIndex = (match.index || 0) + match[0].length;
    }
  }

  if (hasAlerts) {
    const remainingText = text.substring(lastIndex);
    if (remainingText.trim()) {
      alertElements.push(
        <span key={`text-after-${key}`}>{remainingText}</span>
      );
    }
    elements.push(...alertElements);
  } else {
    text = text.trim();
    if (text) {
      elements.push(
        <span key={key} dangerouslySetInnerHTML={{ __html: text }} />
      );
    }
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

const processHeadingElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const HeadingTag = tagName as keyof JSX.IntrinsicElements;
  elements.push(
    <HeadingTag
      key={key}
      id={element.id}
      dangerouslySetInnerHTML={{ __html: element.innerHTML }}
    />
  );
};

const processParagraphElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const text = element.textContent || '';
  const uicPattern = /\[uic:([a-z-]+)\]/g;
  const match = uicPattern.exec(text);

  if (match) {
    const componentId = match[1];
    elements.push(
      <div key={key} className="my-6">
        <NewUIComponentViewer componentId={componentId} />
      </div>
    );
    return;
  }

  elements.push(
    <p key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
  );
};

const processListElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const ListTag = tagName as keyof JSX.IntrinsicElements;
  elements.push(
    <ListTag key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
  );
};

const processLinkElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    <a
      key={key}
      href={element.getAttribute('href') || '#'}
      target="_blank"
      rel="noopener noreferrer"
      dangerouslySetInnerHTML={{ __html: element.innerHTML }}
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
  const firstChild = element.firstChild;
  if (firstChild && firstChild.nodeName === 'P') {
    const pElement = firstChild as HTMLParagraphElement;
    const strongElement = pElement.querySelector('strong');
    
    if (strongElement && pElement.childNodes.length === 1) {
      const title = strongElement.textContent || '';
      const remainingContent = Array.from(element.childNodes)
        .slice(1)
        .map((node) => node.textContent)
        .join('\n');
      
      elements.push(
        <Accordion key={key} title={title}>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(remainingContent) }} />
        </Accordion>
      );
      return;
    }
  }
  
  elements.push(
    <blockquote key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
  );
};

const TableRenderer: React.FC<{ 
  tableHtml: string; 
  onTableClick?: (html: string) => void; 
  isDark: boolean;
}> = ({ tableHtml, onTableClick, isDark }) => (
  <TableWithControls
    tableHtml={tableHtml}
    isDark={isDark}
    onFullscreen={(html) => onTableClick?.(html)}
  />
);

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
  elements.push(
    <strong key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
  );
};

const processEmElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    <em key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
  );
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

      const handlers: Record<string, () => void> = {
        'pre': () => processPreElement(element, key, elements),
        'code': () => processCodeElement(element, key, elements),
        'p': () => processParagraphElement(element, key, elements),
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
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};
