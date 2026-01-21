import React, { createContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '@/components/CodeBlock';

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

export const parseHtmlToReact = (html: string): React.ReactNode[] => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'a',
      'ul', 'ol', 'li', 'blockquote', 'code',
      'pre', 'img', 'table', 'tr', 'td', 'th',
      'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'data-language', 'data-lang', 'style'],
    ALLOW_DATA_ATTR: true,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'text/html');
  const elements: React.ReactNode[] = [];

  const processNodes = (nodes: NodeListOf<ChildNode>, parentKey = '') => {
    Array.from(nodes).forEach((node, index) => {
      const key = `${parentKey}-${index}`;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || '').trim();
        if (text) {
          elements.push(
            <span key={key} dangerouslySetInnerHTML={{ __html: text }} />
          );
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        if (tagName === 'pre') {
          const codeElement = element.querySelector('code');
          if (codeElement) {
            const code = codeElement.textContent || '';
            const language = 
              element.getAttribute('data-lang') || 
              element.getAttribute('data-language') || 
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
          return;
        }

        if (tagName === 'code' && element.parentElement?.tagName.toLowerCase() !== 'pre') {
          elements.push(
            <code
              key={key}
              className="bg-slate-900 px-2 py-1 rounded text-slate-100 font-mono text-sm"
            >
              {element.textContent}
            </code>
          );
          return;
        }

        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          const HeadingTag = tagName as keyof JSX.IntrinsicElements;
          elements.push(
            <HeadingTag
              key={key}
              id={element.id}
              dangerouslySetInnerHTML={{ __html: element.innerHTML }}
            />
          );
          return;
        }

        if (tagName === 'p') {
          elements.push(
            <p key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
          );
          return;
        }

        if (tagName === 'ul' || tagName === 'ol') {
          const ListTag = tagName as keyof JSX.IntrinsicElements;
          elements.push(
            <ListTag key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
          );
          return;
        }

        if (tagName === 'a') {
          elements.push(
            
              key={key}
              href={element.getAttribute('href') || '#'}
              target="_blank"
              rel="noopener noreferrer"
              dangerouslySetInnerHTML={{ __html: element.innerHTML }}
            />
          );
          return;
        }

        if (tagName === 'img') {
          const src = element.getAttribute('src') || '';
          const alt = element.getAttribute('alt') || 'Image';
          const title = element.getAttribute('title') || '';
          const hasCaption = element.classList.contains('has-caption');

          // Если есть подпись (title или класс has-caption)
          if (title || hasCaption) {
            elements.push(
              <figure key={key} className="my-6 w-full">
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  className="rounded-lg shadow-md max-w-full h-auto w-full"
                />
                <figcaption className="mt-3 text-center text-sm text-slate-400 italic font-medium">
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
          return;
        }

        if (tagName === 'blockquote') {
          elements.push(
            <blockquote key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
          );
          return;
        }

        if (tagName === 'table') {
          const tableHtml = element.outerHTML;
          elements.push(
            <TableContext.Consumer key={key}>
              {({ onTableClick, isDark }) => (
                <div className="overflow-x-auto my-4">
                  <div className="inline-block min-w-full align-middle">
                    <button
                      onClick={() => onTableClick?.(tableHtml)}
                      className={`w-full text-left transition-all ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                      }`}
                      title="Нажмите для просмотра в полном размере"
                    >
                      <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
                    </button>
                  </div>
                </div>
              )}
            </TableContext.Consumer>
          );
          return;
        }

        if (tagName === 'hr') {
          elements.push(<hr key={key} />);
          return;
        }

        if (tagName === 'strong') {
          elements.push(
            <strong key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
          );
          return;
        }

        if (tagName === 'em') {
          elements.push(
            <em key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
          );
          return;
        }

        if (element.childNodes.length > 0) {
          processNodes(element.childNodes, key);
        }
      }
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};