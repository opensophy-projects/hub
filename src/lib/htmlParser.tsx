import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '../components/CodeBlock';

export const parseHtmlContent = (html: string) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'a',
      'ul', 'ol', 'li', 'blockquote', 'code',
      'pre', 'img', 'table', 'tr', 'td', 'th',
      'thead', 'tbody', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'data-language'],
    ALLOW_DATA_ATTR: true,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'text/html');

  const elements: React.ReactNode[] = [];
  let preContent: string[] = [];
  let preLanguage = 'bash';

  const processNodes = (nodes: NodeListOf<ChildNode>) => {
    Array.from(nodes).forEach((node, index) => {
      if (node.nodeType === 3) {
        const text = (node.textContent || '').trim();
        if (text && !preContent.length) {
          elements.push(
            <p key={`text-${index}`} className="text-slate-300 mb-4 leading-relaxed">
              {text}
            </p>
          );
        }
      } else if (node.nodeType === 1) {
        const element = node as Element;

        if (element.tagName === 'PRE') {
          const codeElement = element.querySelector('code');
          if (codeElement) {
            const code = codeElement.textContent || '';
            const language = element.getAttribute('data-language') || 'bash';
            elements.push(
              <CodeBlock
                key={`code-${index}`}
                code={code.trim()}
                language={language}
              />
            );
          }
        } else if (element.tagName === 'H1') {
          elements.push(
            <h1 key={`h1-${index}`} className="text-3xl font-bold mb-4 mt-6 text-white">
              {element.textContent}
            </h1>
          );
        } else if (element.tagName === 'H2') {
          elements.push(
            <h2 key={`h2-${index}`} className="text-2xl font-bold mb-3 mt-5 text-white">
              {element.textContent}
            </h2>
          );
        } else if (element.tagName === 'H3') {
          elements.push(
            <h3 key={`h3-${index}`} className="text-xl font-bold mb-3 mt-4 text-white">
              {element.textContent}
            </h3>
          );
        } else if (element.tagName === 'P') {
          elements.push(
            <p key={`p-${index}`} className="text-slate-300 mb-4 leading-relaxed">
              {element.innerHTML.split('<br>').map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </p>
          );
        } else if (element.tagName === 'UL') {
          const items = Array.from(element.querySelectorAll('li')).map((li, i) => (
            <li key={i} className="text-slate-300 mb-2 ml-4">
              • {li.textContent}
            </li>
          ));
          elements.push(
            <ul key={`ul-${index}`} className="mb-4">
              {items}
            </ul>
          );
        } else if (element.tagName === 'OL') {
          const items = Array.from(element.querySelectorAll('li')).map((li, i) => (
            <li key={i} className="text-slate-300 mb-2 ml-4">
              {i + 1}. {li.textContent}
            </li>
          ));
          elements.push(
            <ol key={`ol-${index}`} className="mb-4">
              {items}
            </ol>
          );
        } else if (element.tagName === 'A') {
          elements.push(
            <a
              key={`a-${index}`}
              href={element.getAttribute('href') || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              {element.textContent}
            </a>
          );
        } else if (element.tagName === 'IMG') {
          elements.push(
            <img
              key={`img-${index}`}
              src={element.getAttribute('src') || ''}
              alt={element.getAttribute('alt') || 'Image'}
              className="max-w-full h-auto rounded-lg mb-4 my-4"
            />
          );
        } else if (element.tagName === 'BLOCKQUOTE') {
          elements.push(
            <blockquote
              key={`blockquote-${index}`}
              className="border-l-4 border-blue-500 pl-4 py-2 mb-4 text-slate-400 italic"
            >
              {element.textContent}
            </blockquote>
          );
        } else if (element.tagName === 'CODE' && !element.parentElement?.tagName?.includes('PRE')) {
          elements.push(
            <code
              key={`inline-code-${index}`}
              className="bg-slate-900 px-2 py-1 rounded text-slate-100 font-mono text-sm"
            >
              {element.textContent}
            </code>
          );
        } else {
          processNodes(element.childNodes);
        }
      }
    });
  };

  processNodes(doc.body.childNodes);

  return elements;
};
