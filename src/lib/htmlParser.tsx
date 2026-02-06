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

// Preprocessing для Alert кнопок и Accordion
const preprocessMarkdown = (html: string): string => {
  // Обработка Accordion
  html = html.replace(
    /:::accordion\s+(.+?)\n([\s\S]*?):::/gm,
    (_, title, content) => {
      const sanitizedTitle = DOMPurify.sanitize(title.trim());
      const sanitizedContent = DOMPurify.sanitize(content.trim());
      return `<div class="accordion-wrapper" data-title="${sanitizedTitle.replace(/"/g, '&quot;')}">${sanitizedContent}</div>`;
    }
  );

  // Обработка Alert кнопок
  const alertReplacements = [
    { pattern: /\[✓\]([^\[]+?)(?=\[|$)/g, type: 'success' },
    { pattern: /\[!\]([^\[]+?)(?=\[|$)/g, type: 'warning' },
    { pattern: /\[✕\]([^\[]+?)(?=\[|$)/g, type: 'error' },
    { pattern: /\[\?\]([^\[]+?)(?=\[|$)/g, type: 'info' },
  ];

  alertReplacements.forEach(({ pattern, type }) => {
    html = html.replace(pattern, (_, text) => {
      const cleanText = text.trim();
      return `<span class="alert-button" data-type="${type}">${cleanText}</span>`;
    });
  });

  return html;
};

const processTextNode = (node: Node, key: string, elements: React.ReactNode[]) => {
  const text = (node.textContent || '').trim();
  if (text) {
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
  const processBlockquoteContent = (el: Element): React.ReactNode[] => {
    const innerElements: React.ReactNode[] = [];
    const childNodes = Array.from(el.childNodes);
    
    childNodes.forEach((node, idx) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as Element;
        if (childElement.tagName.toLowerCase() === 'blockquote') {
          // Рекурсивно обрабатываем вложенные blockquote
          innerElements.push(
            <blockquote key={`nested-${idx}`} className="border-l-4 pl-4 my-2">
              {processBlockquoteContent(childElement)}
            </blockquote>
          );
        } else {
          innerElements.push(
            <div key={`child-${idx}`} dangerouslySetInnerHTML={{ __html: childElement.outerHTML }} />
          );
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          innerElements.push(<span key={`text-${idx}`}>{text}</span>);
        }
      }
    });
    
    return innerElements;
  };

  const content = processBlockquoteContent(element);
  
  elements.push(
    <blockquote key={key} className="border-l-4 pl-4 my-4">
      {content}
    </blockquote>
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
  // Обработка форматирования внутри ячеек таблицы
  const cells = element.querySelectorAll('td, th');
  cells.forEach(cell => {
    const innerHTML = cell.innerHTML;
    
    // Обработка жирного текста
    let processed = innerHTML.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Обработка курсива
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Обработка inline code
    processed = processed.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Обработка ссылок
    processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    cell.innerHTML = processed;
  });

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

const processAccordionWrapper = (element: Element, key: string, elements: React.ReactNode[]) => {
  const title = element.getAttribute('data-title') || '';
  const content = element.innerHTML;
  
  elements.push(
    <Accordion key={key} title={title}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Accordion>
  );
};

const processAlertButton = (element: Element, key: string, elements: React.ReactNode[]) => {
  const type = element.getAttribute('data-type') as 'success' | 'warning' | 'error' | 'info';
  const text = element.textContent || '';
  
  elements.push(
    <AlertButton key={key} type={type}>
      {text}
    </AlertButton>
  );
};

export const parseHtmlToReact = (html: string): React.ReactNode[] => {
  // Preprocessing для Alert и Accordion
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

      // Проверка на accordion wrapper
      if (tagName === 'div' && element.classList.contains('accordion-wrapper')) {
        processAccordionWrapper(element, key, elements);
        return;
      }

      // Проверка на alert button
      if (tagName === 'span' && element.classList.contains('alert-button')) {
        processAlertButton(element, key, elements);
        return;
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
        processNodes(element.childNodes, key);
      }
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};
