import React, { createContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '@/components/CodeBlock';
import TableWithControls from '@/components/TableWithControls';
import Accordion from '@/components/Accordion';
import AlertButton from '@/components/AlertButton';
import UIComponentViewer from '@/uic-system/components/UIComponentViewer';
import BlurText from '@/uic-system/blur-text/BlurText';

// Реестр UI компонентов
const componentRegistry = {
  'blur-text': {
    componentId: 'blur-text',
    componentName: 'BlurText - Анимированный текст',
    Component: BlurText,
    files: {
      'BlurText.tsx': `import { motion, type Transition } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';
import type { BlurTextProps } from './types';

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);

  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])];
  });
  return keyframes;
};

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.35
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top' ? { filter: 'blur(10px)', opacity: 0, y: -50 } : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      {
        filter: 'blur(5px)',
        opacity: 0.5,
        y: direction === 'top' ? 5 : -5
      },
      { filter: 'blur(0px)', opacity: 1, y: 0 }
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));

  return (
    <p ref={ref} className={\`blur-text \${className} flex flex-wrap\`}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);

        const spanTransition: Transition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: easing as any
        };

        return (
          <motion.span
            key={index}
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
            style={{
              display: 'inline-block',
              willChange: 'transform, filter, opacity'
            }}
          >
            {segment === ' ' ? '\\u00A0' : segment}
            {animateBy === 'words' && index < elements.length - 1 && '\\u00A0'}
          </motion.span>
        );
      })}
    </p>
  );
};

export default BlurText;`,
      'types.ts': `import type { Easing } from 'framer-motion';

export type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, string | number>;
  animationTo?: Array<Record<string, string | number>>;
  easing?: Easing | Easing[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
};`
    },
    config: {
      files: [
        { name: 'BlurText.tsx', type: 'tsx' },
        { name: 'types.ts', type: 'ts' }
      ]
    },
    defaultProps: {
      text: 'Добро пожаловать в будущее веб-дизайна',
      className: 'text-4xl font-bold text-center'
    }
  }
};

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

// Вспомогательные функции для обработки разных типов элементов
const processTextNode = (node: Node, key: string, elements: React.ReactNode[]) => {
  let text = node.textContent || '';
  
  // Обработка alert buttons [✓], [!], [✕], [?]
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
    const component = componentRegistry[componentId as keyof typeof componentRegistry];

    if (component) {
      elements.push(
        <div key={key} className="my-6">
          <UIComponentViewer
            componentId={component.componentId}
            componentName={component.componentName}
            Component={component.Component}
            files={component.files}
            config={component.config}
            defaultProps={component.defaultProps}
          />
        </div>
      );
      return;
    }
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
  // Проверка на accordion синтаксис: > **Заголовок**
  const firstChild = element.firstChild;
  if (firstChild && firstChild.nodeName === 'P') {
    const pElement = firstChild as HTMLParagraphElement;
    const strongElement = pElement.querySelector('strong');
    
    if (strongElement && pElement.childNodes.length === 1) {
      // Это accordion
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
  
  // Обычный blockquote
  elements.push(
    <blockquote key={key} dangerouslySetInnerHTML={{ __html: element.innerHTML }} />
  );
};

// Компонент для рендеринга таблицы
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

      // Маппинг тегов на обработчики
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

      // Обработка заголовков
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        processHeadingElement(element, tagName, key, elements);
        return;
      }

      // Вызов соответствующего обработчика
      if (handlers[tagName]) {
        handlers[tagName]();
        return;
      }

      // Если нет специального обработчика, обрабатываем дочерние элементы
      if (element.childNodes.length > 0) {
        processNodes(element.childNodes, key);
      }
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};
