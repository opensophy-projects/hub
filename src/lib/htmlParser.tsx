import React, { createContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '@/components/CodeBlock';
import TableWithControls from '@/components/TableWithControls';
import Accordion from '@/components/Accordion';
import NewUIComponentViewer from '@/uic-system/NewUIComponentViewer';

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

const processTextNode = (node: Node, key: string, elements: React.ReactNode[]) => {
  const text = node.textContent || '';
  
  // Удалена вся логика Alert кнопок
  
  const trimmedText = text.trim();
  if (trimmedText) {
    elements.push(
      <span key={key} dangerouslySetInnerHTML={{ __html: text }} />
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
  
  // Проверка на :::accordion синтаксис
  if (text.startsWith(':::accordion ')) {
    const titleMatch = text.match(/^:::accordion\s+(.+)/);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      elements.push(
        <p key={key} data-accordion-title={title} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
      );
      return;
    }
  }
  
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
  // Проверка на :::accordion внутри blockquote больше не нужна
  // Просто рендерим blockquote как есть с поддержкой вложенности
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
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'data-language', 'data-lang', 'data-accordion-title'],
    ALLOW_DATA_ATTR: true,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'text/html');
  const elements: React.ReactNode[] = [];

  const processNodes = (nodes: NodeListOf<ChildNode>, parentKey = '', accordionContext: { title: string; content: React.ReactNode[] } | null = null) => {
    Array.from(nodes).forEach((node, index) => {
      const key = `${parentKey}-${index}`;

      if (node.nodeType === Node.TEXT_NODE) {
        if (accordionContext) {
          const text = node.textContent || '';
          const trimmedText = text.trim();
          if (trimmedText) {
            accordionContext.content.push(
              <span key={key} dangerouslySetInnerHTML={{ __html: text }} />
            );
          }
        } else {
          processTextNode(node, key, elements);
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Проверка на accordion параграф
      if (tagName === 'p' && element.hasAttribute('data-accordion-title')) {
        const title = element.getAttribute('data-accordion-title') || '';
        const newAccordionContext = { title, content: [] };
        
        // Собираем следующие параграфы до следующего accordion или конца
        let nextSibling = element.nextSibling;
        const accordionContent: React.ReactNode[] = [];
        
        while (nextSibling) {
          if (nextSibling.nodeType === Node.ELEMENT_NODE) {
            const nextElement = nextSibling as Element;
            const nextTag = nextElement.tagName.toLowerCase();
            
            // Прекращаем, если встретили новый accordion
            if (nextTag === 'p' && nextElement.textContent?.startsWith(':::accordion ')) {
              break;
            }
            
            // Добавляем содержимое
            if (nextTag === 'p' && !nextElement.hasAttribute('data-accordion-title')) {
              accordionContent.push(
                <p key={`accordion-content-${index}`} dangerouslySetInnerHTML={{ __html: nextElement.innerHTML }} />
              );
            }
          }
          
          nextSibling = nextSibling.nextSibling;
        }
        
        elements.push(
          <Accordion key={key} title={title}>
            <div>{accordionContent}</div>
          </Accordion>
        );
        return;
      }

      if (accordionContext) {
        // Внутри accordion контекста
        if (tagName === 'p') {
          accordionContext.content.push(
            <p key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
          );
          return;
        }
      }

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
        processNodes(element.childNodes, key, accordionContext);
      }
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};
