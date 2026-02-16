import React, { createContext, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '../components/CodeBlock';
import TableWithControls from '@/features/table/components/TableWithControls';
import ImageModal from '../components/ImageModal';
import MermaidDiagram from '../components/MermaidDiagram';
import Alert from '../components/Alert';
import MathFormula from '../components/MathFormula';
import NewUIComponentViewer from '@/features/ui-components/NewUIComponentViewer';

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

// Глобальный счётчик для генерации уникальных ключей
let globalKeyCounter = 0;

const generateUniqueKey = (prefix: string): string => {
  return `${prefix}-${globalKeyCounter++}`;
};

const processPreElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const codeElement = element.querySelector('code');
  if (codeElement) {
    const code = codeElement.textContent || '';
    const language =
      element.dataset.lang ||
      element.dataset.language ||
      codeElement.className.replace('language-', '') ||
      '';

    if (language === 'mermaid') {
      elements.push(
        <MermaidDiagram key={key} code={code.trim()} />
      );
    } else {
      elements.push(
        <CodeBlock
          key={key}
          code={code.trim()}
          language={language}
        />
      );
    }
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
      'data-language', 'data-lang', 'data-alert-type', 'data-math',
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

const ImageWithModal: React.FC<{ src: string; alt: string; title?: string }> = ({ src, alt, title }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {title ? (
        <figure className="my-6 w-full">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onClick={() => setIsOpen(true)}
            className="rounded-lg shadow-md max-w-full h-auto w-full cursor-pointer hover:opacity-90 transition-opacity"
          />
          <figcaption className="mt-2 text-center text-xs text-slate-400 italic font-medium">
            {title}
          </figcaption>
        </figure>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onClick={() => setIsOpen(true)}
          className="rounded-lg shadow-md max-w-full h-auto my-4 cursor-pointer hover:opacity-90 transition-opacity"
        />
      )}
      {isOpen && <ImageModal src={src} alt={alt} onClose={() => setIsOpen(false)} />}
    </>
  );
};

const processImageElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const src = element.getAttribute('src') || '';
  const alt = element.getAttribute('alt') || 'Image';
  const title = element.getAttribute('title') || '';

  elements.push(
    <ImageWithModal key={key} src={src} alt={alt} title={title || undefined} />
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

const processUnderlineElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    <u key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
};

const processDeleteElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    <del key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
};

const processSubElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    <sub key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
};

const processSupElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const sanitizedHTML = sanitizeInnerHTML(element.innerHTML);
  elements.push(
    <sup key={key} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
};

const processDetailsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const isOpen = element.hasAttribute('open');
  const summary = element.querySelector('summary');
  const summaryText = summary?.textContent || 'Подробности';
  
  // ИСПРАВЛЕНО: создаём копию HTML-содержимого, а не работаем с DOM напрямую
  const contentHTML: string[] = [];
  Array.from(element.children).forEach(child => {
    if (child.tagName.toLowerCase() !== 'summary') {
      contentHTML.push(child.outerHTML);
    }
  });

  // Объединяем весь контент в одну строку и санитизируем
  const fullContentHTML = sanitizeInnerHTML(contentHTML.join(''));

  elements.push(
    <details key={key} open={isOpen} className="my-4">
      <summary className="cursor-pointer font-semibold">{summaryText}</summary>
      <div 
        className="mt-2 pl-4"
        dangerouslySetInnerHTML={{ __html: fullContentHTML }}
      />
    </details>
  );
};

const processAlertElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const alertType = element.getAttribute('data-alert-type') as 'note' | 'tip' | 'important' | 'warning' | 'caution';
  const content = element.textContent || '';

  if (alertType) {
    elements.push(
      <Alert key={key} type={alertType}>
        {content}
      </Alert>
    );
  }
};

const processMathElement = (element: Element, key: string, elements: React.ReactNode[], isBlock: boolean) => {
  const formula = element.getAttribute('data-math') || '';

  if (formula) {
    elements.push(
      <MathFormula key={key} formula={formula} displayMode={isBlock} />
    );
  }
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
    'u': () => processUnderlineElement(element, key, elements),
    'del': () => processDeleteElement(element, key, elements),
    'sub': () => processSubElement(element, key, elements),
    'sup': () => processSupElement(element, key, elements),
    'details': () => processDetailsElement(element, key, elements),
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
      'data-language', 'data-lang', 'data-alert-type', 'data-math',
      'type', 'checked', 'disabled', 'open', 'style', 'align'
    ],
    ALLOW_DATA_ATTR: true,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'text/html');
  const elements: React.ReactNode[] = [];

  const processNodes = (nodes: NodeListOf<ChildNode>, parentKey = '') => {
    Array.from(nodes).forEach((node, index) => {
      // ИСПРАВЛЕНО: используем глобальный счётчик для гарантированно уникальных ключей
      const key = generateUniqueKey(`${parentKey}-node`);

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

      if (tagName === 'div' && element.classList.contains('github-alert')) {
        processAlertElement(element, key, elements);
        return;
      }

      if (tagName === 'span' && element.classList.contains('math-inline')) {
        processMathElement(element, key, elements, false);
        return;
      }

      if (tagName === 'div' && element.classList.contains('math-block')) {
        processMathElement(element, key, elements, true);
        return;
      }

      if (tagName === 'p') {
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