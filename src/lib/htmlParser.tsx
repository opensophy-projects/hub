import React from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';
import AdvancedTable from '../components/AdvancedTable';
import MermaidDiagram from '../components/MermaidDiagram';

interface ParsedNode {
  type: string;
  props: any;
  children?: React.ReactNode[];
}

interface HtmlParserProps {
  html: string;
  isDark: boolean;
  onFullscreenCode?: (code: string) => void;
  onFullscreenTable?: (html: string) => void;
}

const MathInline: React.FC<{ formula: string; isDark: boolean }> = ({ formula, isDark }) => {
  const [rendered, setRendered] = React.useState(false);

  React.useEffect(() => {
    const renderMath = async () => {
      try {
        const katex = (await import('katex')).default;
        setRendered(true);
      } catch (err) {
        console.error('KaTeX render error:', err);
      }
    };

    renderMath();
  }, [formula]);

  if (!rendered) {
    return <span className={`inline-code ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>${formula}$</span>;
  }

  return (
    <span 
      className="math-inline"
      dangerouslySetInnerHTML={{
        __html: require('katex').renderToString(formula, { throwOnError: false })
      }}
    />
  );
};

const parseHtmlToReact = (
  html: string,
  isDark: boolean,
  onFullscreenCode?: (code: string) => void,
  onFullscreenTable?: (html: string) => void
): React.ReactNode => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const parseNode = (node: Node, index: number): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        return <span key={index}>{text}</span>;
      }
      return null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    const key = `${tag}-${index}`;

    // Стили на основе темы
    const classPrefix = isDark ? 'dark' : 'light';

    switch (tag) {
      // Заголовки
      case 'h1':
        return (
          <motion.h1
            key={key}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`heading-1 text-4xl font-bold mt-8 mb-4 ${isDark ? 'text-white' : 'text-black'}`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.h1>
        );

      case 'h2':
        return (
          <motion.h2
            key={key}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`heading-2 text-3xl font-bold mt-7 mb-3 ${isDark ? 'text-white' : 'text-black'}`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.h2>
        );

      case 'h3':
        return (
          <motion.h3
            key={key}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`heading-3 text-2xl font-bold mt-6 mb-2 ${isDark ? 'text-white' : 'text-black'}`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.h3>
        );

      case 'h4':
        return (
          <motion.h4
            key={key}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`heading-4 text-xl font-bold mt-5 mb-2 ${isDark ? 'text-white' : 'text-black'}`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.h4>
        );

      case 'h5':
        return (
          <motion.h5
            key={key}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`heading-5 text-lg font-bold mt-4 mb-1 ${isDark ? 'text-white' : 'text-black'}`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.h5>
        );

      case 'h6':
        return (
          <motion.h6
            key={key}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`heading-6 text-base font-bold mt-3 mb-1 ${isDark ? 'text-white' : 'text-black'}`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.h6>
        );

      // Параграфы
      case 'p':
        return (
          <motion.p
            key={key}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className={`paragraph my-4 leading-7 ${isDark ? 'text-white/90' : 'text-black/90'}`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.p>
        );

      // Жирный текст
      case 'strong':
        return (
          <strong key={key} className="font-bold">
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </strong>
        );

      // Курсив
      case 'em':
        return (
          <em key={key} className="italic">
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </em>
        );

      // Зачёркнутый
      case 'del':
        return (
          <del key={key} className="line-through opacity-70">
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </del>
        );

      // Inline код
      case 'code':
        if (element.parentElement?.tagName !== 'PRE') {
          return (
            <code
              key={key}
              className={`inline-code px-2 py-1 rounded text-sm font-mono ${
                isDark ? 'bg-white/10 text-white/90' : 'bg-black/10 text-black/90'
              }`}
            >
              {element.textContent}
            </code>
          );
        }
        return null;

      // Блоки кода
      case 'code-block':
        const language = element.getAttribute('language') || 'plaintext';
        const code = element.textContent || '';
        return (
          <CodeBlock
            key={key}
            code={code}
            language={language}
            isDark={isDark}
            onFullscreen={onFullscreenCode}
          />
        );

      case 'code-section':
        const sectionCode = element.textContent || '';
        return (
          <CodeBlock
            key={key}
            code={sectionCode}
            language="plaintext"
            isDark={isDark}
            onFullscreen={onFullscreenCode}
          />
        );

      // Блок-цитаты
      case 'blockquote':
        return (
          <motion.blockquote
            key={key}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            className={`blockquote my-4 pl-4 border-l-4 ${
              isDark
                ? 'border-white/30 text-white/80'
                : 'border-black/30 text-black/80'
            }`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.blockquote>
        );

      // Списки
      case 'ul':
      case 'ol':
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className={tag === 'ol' ? 'list-decimal list-inside ml-4 my-4 space-y-2' : 'list-disc list-inside ml-4 my-4 space-y-2'}
          >
            {Array.from(element.children).map((child, idx) =>
              parseNode(child, idx)
            )}
          </motion.div>
        );

      case 'li':
        const hasCheckbox = element.classList.contains('list-item');
        const checkboxClass = element.className.match(/checkbox-\w+/)?.[0] || '';
        
        if (hasCheckbox && checkboxClass) {
          const checkboxStyles = {
            'checkbox-unchecked': '❌',
            'checkbox-checked': '✅',
            'checkbox-warning': '⚠️',
            'checkbox-info': 'ℹ️'
          };
          
          const icon = checkboxStyles[checkboxClass as keyof typeof checkboxStyles] || '☐';
          
          return (
            <li key={key} className={`flex items-start gap-3 ${isDark ? 'text-white/90' : 'text-black/90'}`}>
              <span className="inline-block w-5 text-center flex-shrink-0 mt-0.5">{icon}</span>
              <span>
                {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
              </span>
            </li>
          );
        }

        return (
          <li key={key} className={isDark ? 'text-white/90' : 'text-black/90'}>
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </li>
        );

      // Ссылки
      case 'a':
        const href = element.getAttribute('href') || '#';
        const isEmail = href.startsWith('mailto:');
        return (
          <a
            key={key}
            href={href}
            target={isEmail ? undefined : '_blank'}
            rel={isEmail ? undefined : 'noopener noreferrer'}
            className={`inline-link font-medium transition-colors ${
              isDark
                ? 'text-blue-400 hover:text-blue-300 underline'
                : 'text-blue-600 hover:text-blue-700 underline'
            }`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </a>
        );

      // Изображения
      case 'figure':
        return (
          <motion.figure
            key={key}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="my-6 flex flex-col items-center gap-2"
          >
            {Array.from(element.children).map((child, idx) =>
              parseNode(child, idx)
            )}
          </motion.figure>
        );

      case 'img':
        return (
          <motion.img
            key={key}
            src={element.getAttribute('src') || ''}
            alt={element.getAttribute('alt') || ''}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        );

      case 'figcaption':
        return (
          <motion.figcaption
            key={key}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className={`text-center text-sm italic ${isDark ? 'text-white/60' : 'text-black/60'}`}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </motion.figcaption>
        );

      // Горизонтальный разделитель
      case 'hr':
        return (
          <motion.hr
            key={key}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className={`my-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}
          />
        );

      // Таблицы
      case 'table':
        return (
          <AdvancedTable
            key={key}
            htmlContent={element.outerHTML}
            isDark={isDark}
            onFullscreen={onFullscreenTable || (() => {})}
          />
        );

      // Callout блоки
      case 'callout':
        const calloutType = element.getAttribute('type') as any || 'note';
        return (
          <Callout
            key={key}
            type={calloutType}
            isDark={isDark}
          >
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </Callout>
        );

      // Collapsed sections
      case 'collapsed-section':
        const title = element.getAttribute('title') || 'Details';
        return (
          <details
            key={key}
            className={`my-4 rounded-lg border cursor-pointer transition-colors ${
              isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
            }`}
          >
            <summary className={`p-4 font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              {title}
            </summary>
            <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/10 text-white/80' : 'border-black/10 text-black/80'}`}>
              {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
            </div>
          </details>
        );

      // Mermaid диаграммы
      case 'mermaid-diagram':
        const diagramCode = element.textContent || '';
        return (
          <MermaidDiagram
            key={key}
            code={diagramCode}
            isDark={isDark}
          />
        );

      // Inline математика
      case 'math-inline':
        const formula = element.textContent || '';
        return (
          <MathInline
            key={key}
            formula={formula}
            isDark={isDark}
          />
        );

      case 'span':
        if (element.classList.contains('math-inline')) {
          const mathFormula = decodeURIComponent(element.getAttribute('data-formula') || element.textContent || '');
          return (
            <MathInline
              key={key}
              formula={mathFormula}
              isDark={isDark}
            />
          );
        }
        return (
          <span key={key}>
            {parseChildren(element, isDark, onFullscreenCode, onFullscreenTable)}
          </span>
        );

      default:
        return (
          <div key={key}>
            {Array.from(element.childNodes).map((child, idx) =>
              parseNode(child, idx)
            )}
          </div>
        );
    }
  };

  const parseChildren = (
    element: Element,
    isDark: boolean,
    onFullscreenCode?: (code: string) => void,
    onFullscreenTable?: (html: string) => void
  ): React.ReactNode[] => {
    return Array.from(element.childNodes)
      .map((child, idx) => parseHtmlToReact(child.outerHTML || child.textContent || '', isDark, onFullscreenCode, onFullscreenTable))
      .filter(Boolean) as React.ReactNode[];
  };

  return (
    <div className="prose-container">
      {Array.from(doc.body.childNodes)
        .map((node, idx) => parseNode(node, idx))
        .filter(Boolean)}
    </div>
  );
};

const HtmlParser: React.FC<HtmlParserProps> = ({
  html,
  isDark,
  onFullscreenCode,
  onFullscreenTable
}) => {
  return (
    <div>
      {parseHtmlToReact(html, isDark, onFullscreenCode, onFullscreenTable)}
    </div>
  );
};

export default HtmlParser;
