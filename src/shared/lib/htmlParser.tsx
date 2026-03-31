import React, { createContext, lazy, Suspense } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '../components/CodeBlock';
import type { CodeTab } from '../components/CodeBlock';
import TableWithControls from '@/features/table/components/TableWithControls';
import Alert from '../components/Alert';
import NewUIComponentViewer from '@/features/ui-components/NewUIComponentViewer';
import ImageCard from '../components/ImageCard';
import { CardWithContext, CardGridWithContext } from '../components/Card';
import { ColumnsWithContext } from '../components/Columns';
import { StepperWithContext } from '../components/Stepper';
import type { StepData, StepStatus } from '../components/Stepper';
import type { ColumnsLayout } from '../components/Columns';

const LazyChartBlock = lazy(() => import('../components/ChartBlock'));

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

export const SANITIZE_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 'a',
  'ul', 'ol', 'li', 'blockquote', 'code',
  'pre', 'img', 'table', 'tr', 'td', 'th',
  'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption',
  'del', 'input', 'sub', 'sup', 'details', 'summary', 'mark',
  'math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'mtext', 'mspace',
  'mover', 'munder', 'munderover', 'msup', 'msub', 'msubsup', 'mfrac',
  'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mstyle', 'menclose',
  'annotation', 'svg', 'path', 'line', 'rect', 'circle', 'g', 'use',
  'defs', 'clippath',
];

export const SANITIZE_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'data-language', 'data-lang', 'data-alert-type',
  'data-cols', 'data-layout', 'data-status', 'data-title',
  'data-color', 'data-icon', 'data-image',
  'data-chart', 'data-colors', 'data-type',
  'data-tabs',
  'type', 'checked', 'disabled', 'open', 'style', 'align',
  'xmlns', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width',
  'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'cx', 'cy', 'r', 'transform', 'clip-path', 'clip-rule',
  'fill-rule', 'stroke-linecap', 'stroke-linejoin',
  'mathvariant', 'mathsize', 'stretchy', 'fence', 'separator',
  'lspace', 'rspace', 'minsize', 'maxsize', 'columnalign',
  'rowspacing', 'columnspacing', 'href', 'aria-hidden',
];

// Санитизация произвольной HTML-строки перед вставкой в DOM
const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: SANITIZE_TAGS,
    ALLOWED_ATTR: SANITIZE_ATTR,
    ALLOW_DATA_ATTR: true,
  });

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

const TAG_STYLES: Record<number, React.CSSProperties> = {
  1: { fontSize: 'clamp(1.4rem,3vw,2.25rem)',    fontWeight: 700, marginTop: '2rem',    marginBottom: '1rem',    lineHeight: 1.2,  scrollMarginTop: '5rem' },
  2: { fontSize: 'clamp(1.2rem,2.5vw,1.875rem)', fontWeight: 700, marginTop: '2rem',    marginBottom: '1rem',    lineHeight: 1.25, scrollMarginTop: '5rem' },
  3: { fontSize: 'clamp(1.05rem,2vw,1.5rem)',    fontWeight: 700, marginTop: '1.5rem',  marginBottom: '0.75rem', lineHeight: 1.3,  scrollMarginTop: '5rem' },
  4: { fontSize: 'clamp(1rem,1.8vw,1.25rem)',    fontWeight: 700, marginTop: '1.5rem',  marginBottom: '0.75rem',                   scrollMarginTop: '5rem' },
  5: { fontSize: '1rem',                          fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem',                    scrollMarginTop: '5rem' },
  6: { fontSize: '0.875rem',                      fontWeight: 700, marginTop: '1rem',    marginBottom: '0.5rem',  textTransform: 'uppercase', letterSpacing: '0.05em', scrollMarginTop: '5rem' },
};

const processPreElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const codeElement = element.querySelector('code');
  if (!codeElement) return;
  const code = codeElement.textContent || '';
  const language =
    element.dataset.lang ||
    element.dataset.language ||
    codeElement.className.replace('language-', '') ||
    '';
  elements.push(React.createElement(CodeBlock, { key, code: code.trim(), language }));
};

const processCodeElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  if (element.parentElement?.tagName.toLowerCase() === 'pre') return;
  elements.push(
    React.createElement(
      'code',
      { key, className: 'bg-slate-900 px-2 py-1 rounded text-slate-100 font-mono text-sm' },
      element.textContent,
    ),
  );
};

// Элементы приходят из уже санитизированного DOMPurify-документа — innerHTML безопасен
const processHeadingElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const text  = element.textContent || '';
  const id    = element.id || slugifyHeading(text);
  const level = Number.parseInt(tagName[1], 10);
  const Tag   = tagName as keyof JSX.IntrinsicElements;

  elements.push(
    React.createElement(Tag, {
      key,
      id,
      style: TAG_STYLES[level],
      dangerouslySetInnerHTML: { __html: sanitizeHtml(element.innerHTML) },
    }),
  );
};

const processListElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const hasTaskList = element.querySelector('input[type="checkbox"]');
  elements.push(
    React.createElement(tagName, {
      key,
      dangerouslySetInnerHTML: { __html: sanitizeHtml(element.innerHTML) },
      className: hasTaskList ? 'task-list' : undefined,
    }),
  );
};

const processLinkElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const children = Array.from(element.childNodes).filter(
    (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim()),
  );

  if (children.length === 1 && (children[0] as Element).tagName?.toLowerCase() === 'img') {
    const img = children[0] as Element;
    elements.push(
      React.createElement(ImageCard, {
        key,
        src:   img.getAttribute('src')   || '',
        alt:   img.getAttribute('alt')   || 'Image',
        title: img.getAttribute('title') || undefined,
      }),
    );
    return;
  }

  elements.push(
    React.createElement('a', {
      key,
      href:   element.getAttribute('href') || '#',
      target: '_blank',
      rel:    'noopener noreferrer',
      dangerouslySetInnerHTML: { __html: sanitizeHtml(element.innerHTML) },
    }),
  );
};

const processImageElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement(ImageCard, {
      key,
      src:   element.getAttribute('src')   || '',
      alt:   element.getAttribute('alt')   || 'Image',
      title: element.getAttribute('title') || undefined,
    }),
  );
};

const processBlockquoteElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('blockquote', {
      key,
      dangerouslySetInnerHTML: { __html: sanitizeHtml(element.innerHTML) },
    }),
  );
};

const processTableElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  // outerHTML дополнительно санитизируется перед передачей в компонент
  const tableHtml = sanitizeHtml(element.outerHTML);
  elements.push(
    React.createElement(
      TableContext.Consumer,
      { key },
      ({ onTableClick, isDark }: { onTableClick?: (html: string) => void; isDark: boolean }) =>
        React.createElement(TableWithControls, {
          tableHtml,
          isDark,
          onFullscreen: (html: string) => onTableClick?.(sanitizeHtml(html)),
        }),
    ),
  );
};

// Элемент приходит из уже санитизированного DOMPurify-документа — innerHTML безопасен
const processInlineElement = (tag: string, element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement(tag, {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    }),
  );
};

const processDetailsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const summary     = element.querySelector('summary');
  const summaryText = summary?.textContent || 'Подробности';
  const contentHTML = summary
    ? element.innerHTML.replace(summary.outerHTML, '')
    : element.innerHTML;
  const contentElements = parseHtmlToReact(contentHTML);

  elements.push(
    React.createElement(
      'details',
      { key, open: element.hasAttribute('open'), className: 'my-4' },
      React.createElement('summary', null, summaryText),
      React.createElement('div', { className: 'details-content pt-2 pb-3' }, ...contentElements),
    ),
  );
};

const processAlertElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const alertType = element.dataset.alertType as 'note' | 'tip' | 'important' | 'warning' | 'caution';
  if (!alertType) return;
  const contentElements = parseHtmlToReact(element.innerHTML);
  elements.push(React.createElement(Alert, { key, type: alertType }, ...contentElements));
};

const processCardElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const contentElements = parseHtmlToReact(element.innerHTML);
  elements.push(
    React.createElement(
      CardWithContext,
      {
        key,
        color: element.dataset.color || undefined,
        title: element.dataset.title || undefined,
        icon:  element.dataset.icon  || undefined,
        image: element.dataset.image || undefined,
      },
      ...contentElements,
    ),
  );
};

const processCardGridElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const cols        = Number.parseInt(element.dataset.cols || '2', 10);
  const cardElements: React.ReactNode[] = [];

  for (const [i, child] of Array.from(element.children).entries()) {
    if (child.classList.contains('custom-card')) {
      processCardElement(child, `${key}-card-${i}`, cardElements);
    }
  }

  elements.push(React.createElement(CardGridWithContext, { key, cols }, ...cardElements));
};

const processColumnsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const layout     = (element.dataset.layout || 'equal') as ColumnsLayout;
  const colElements: React.ReactNode[] = [];

  for (const [i, col] of Array.from(element.children).entries()) {
    if (col.classList.contains('custom-col')) {
      const colContent = parseHtmlToReact(col.innerHTML);
      colElements.push(React.createElement('div', { key: `${key}-col-${i}` }, ...colContent));
    }
  }

  elements.push(React.createElement(ColumnsWithContext, { key, layout }, ...colElements));
};

const processStepsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const steps: StepData[] = [];

  for (const stepEl of Array.from(element.children)) {
    if (stepEl.classList.contains('custom-step')) {
      const contentNodes = parseHtmlToReact(stepEl.innerHTML);
      steps.push({
        title:   stepEl.dataset.title || '',
        status:  (stepEl.dataset.status || 'default') as StepStatus,
        color:   stepEl.dataset.color || undefined,
        content: React.createElement(React.Fragment, null, ...contentNodes),
      });
    }
  }

  elements.push(React.createElement(StepperWithContext, { key, steps }));
};

const processChartElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const type   = (element.dataset.type   || 'bar') as import('../components/ChartBlock').ChartType;
  const title  =  element.dataset.title  || undefined;
  const colors =  element.dataset.colors || '';

  const palette = colors
    ? colors.split(',').map((c) => c.trim()).filter(Boolean)
    : undefined;

  let data: Record<string, unknown>[] = [];
  try {
    const parsed = JSON.parse(element.dataset.chart || '[]');
    if (Array.isArray(parsed)) data = parsed;
  } catch { /* невалидный JSON — пустой чарт */ }

  elements.push(
    React.createElement(
      Suspense,
      { key, fallback: React.createElement('div', { style: { height: 320 } }) },
      React.createElement(LazyChartBlock, { type, data, title, colors: palette }),
    ),
  );
};

const processTabsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  let tabs: CodeTab[] = [];
  try {
    const parsed = JSON.parse(element.dataset.tabs || '[]');
    if (Array.isArray(parsed)) tabs = parsed as CodeTab[];
  } catch { /* невалидный JSON */ }

  if (tabs.length === 0) return;

  elements.push(
    React.createElement(CodeBlock, {
      key,
      code:     tabs[0].code,
      language: tabs[0].language,
      tabs:     tabs.length > 1 ? tabs : undefined,
    }),
  );
};

const processUIComponent = (
  element: Element,
  key: string,
  textContent: string,
  elements: React.ReactNode[],
): boolean => {
  const match = /\[uic:([a-z-]+)\]/.exec(textContent);
  if (!match) return false;

  elements.push(
    React.createElement(
      'div',
      { key, className: 'my-6' },
      React.createElement(NewUIComponentViewer, { componentId: match[1] }),
    ),
  );
  return true;
};

const processTextNode = (node: ChildNode, key: string, elements: React.ReactNode[]) => {
  const text = node.textContent || '';
  if (text.trim()) elements.push(React.createElement('span', { key }, text));
};

const processFigureElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const img        = element.querySelector('img');
  const figcaption = element.querySelector('figcaption');

  if (img) {
    elements.push(
      React.createElement(ImageCard, {
        key,
        src:   img.getAttribute('src')  || '',
        alt:   img.getAttribute('alt')  || 'Image',
        title: figcaption?.textContent?.trim() || img.getAttribute('title') || undefined,
      }),
    );
    return;
  }

  const children = parseHtmlToReact(element.innerHTML);
  elements.push(React.createElement('figure', { key }, ...children));
};

// KaTeX-разметка формируется рендерером, не из пользовательского ввода напрямую.
// Содержимое проходит через DOMPurify выше по потоку перед попаданием сюда.
const processKatexBlock = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('div', {
      key,
      className: 'katex-block not-prose',
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    }),
  );
};

const processKatexInline = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('span', {
      key,
      className: 'katex-inline',
      dangerouslySetInnerHTML: { __html: sanitizeHtml(element.innerHTML) },
    }),
  );
};

const DIV_CLASS_HANDLERS: Array<[string, (el: Element, key: string, els: React.ReactNode[]) => void]> = [
  ['katex-block',     processKatexBlock],
  ['custom-alert',    processAlertElement],
  ['custom-chart',    processChartElement],
  ['custom-cardgrid', processCardGridElement],
  ['custom-card',     processCardElement],
  ['custom-columns',  processColumnsElement],
  ['custom-steps',    processStepsElement],
  ['custom-tabs',     processTabsElement],
];

const processDivElement = (
  element: Element,
  key: string,
  elements: React.ReactNode[],
  processNodes: (nodes: NodeListOf<ChildNode>, parentKey: string) => void,
): void => {
  for (const [cls, handler] of DIV_CLASS_HANDLERS) {
    if (element.classList.contains(cls)) {
      handler(element, key, elements);
      return;
    }
  }
  if (element.childNodes.length > 0) processNodes(element.childNodes, key);
};

function getImgFromLink(el: Element): Element | null {
  const nonEmpty = Array.from(el.childNodes).filter(
    (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim()),
  );
  if (nonEmpty.length === 1 && (nonEmpty[0] as Element).tagName?.toLowerCase() === 'img') {
    return nonEmpty[0] as Element;
  }
  return null;
}

function isBrOrEmpty(node: ChildNode): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return (node as Element).tagName.toLowerCase() === 'br';
  }
  if (node.nodeType === Node.TEXT_NODE) {
    return !node.textContent?.trim();
  }
  return false;
}

type ParagraphRun = { type: 'img'; el: Element } | { type: 'text'; html: string };

function splitParagraphIntoRuns(element: Element): ParagraphRun[] {
  const result: ParagraphRun[] = [];
  let textBuffer = '';

  const flushText = () => {
    if (!textBuffer.trim()) { textBuffer = ''; return; }

    // Временный узел используется только для очистки пустых br с краёв буфера,
    // не для рендеринга напрямую
    const tmp = document.createElement('div');
    tmp.innerHTML = sanitizeHtml(textBuffer.trim());
    while (tmp.firstChild && isBrOrEmpty(tmp.firstChild)) tmp.firstChild.remove();
    while (tmp.lastChild  && isBrOrEmpty(tmp.lastChild))  tmp.lastChild.remove();

    // HTML получен из уже санитизированного документа
    const cleaned = tmp.innerHTML.trim();
    if (cleaned) result.push({ type: 'text', html: cleaned });
    textBuffer = '';
  };

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el  = node as Element;
      const tag = el.tagName.toLowerCase();

      if (tag === 'img') { flushText(); result.push({ type: 'img', el }); continue; }

      if (tag === 'a') {
        const img = getImgFromLink(el);
        if (img) { flushText(); result.push({ type: 'img', el: img }); continue; }
      }

      textBuffer += el.outerHTML;
    } else if (node.nodeType === Node.TEXT_NODE) {
      textBuffer += node.textContent ?? '';
    }
  }

  flushText();
  return result;
}

const processParagraphElement = (
  element: Element,
  key: string,
  elements: React.ReactNode[],
  katexStore: Array<{ tag: 'div' | 'span'; cls: string; inner: string }>,
): void => {
  if (processUIComponent(element, key, element.textContent || '', elements)) return;

  const hasKatex = element.querySelector('[data-katex-idx]');
  const hasImg   = element.querySelector('img');

  // Элемент приходит из уже санитизированного DOMPurify-документа — innerHTML безопасен
  if (!hasKatex && !hasImg) {
    elements.push(
      React.createElement('p', {
        key,
        dangerouslySetInnerHTML: { __html: element.innerHTML },
      }),
    );
    return;
  }

  if (hasKatex && !hasImg) {
    const kids: React.ReactNode[] = [];

    Array.from(element.childNodes).forEach((child, ci) => {
      const ckey = `${key}-k${ci}`;

      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        if (text) kids.push(text);
        return;
      }

      if (child.nodeType === Node.ELEMENT_NODE) {
        const el  = child as Element;
        const idx = el.dataset.katexIdx;

        if (idx !== undefined) {
          const stored = katexStore[Number.parseInt(idx, 10)];
          if (stored) {
            // KaTeX-содержимое сохранено до санитизации и восстанавливается по индексу
            kids.push(
              React.createElement(stored.tag, {
                key:                     ckey,
                className:               stored.cls,
                dangerouslySetInnerHTML: { __html: stored.inner },
              }),
            );
            return;
          }
        }

        kids.push(
          React.createElement('span', {
            key:                     ckey,
            dangerouslySetInnerHTML: { __html: el.outerHTML },
          }),
        );
      }
    });

    elements.push(React.createElement('p', { key }, ...kids));
    return;
  }

  // Параграф содержит изображения — разбиваем на отдельные прогоны
  const runs = splitParagraphIntoRuns(element);
  runs.forEach((run, i) => {
    const runKey = `${key}-r${i}`;
    if (run.type === 'img') {
      elements.push(
        React.createElement(ImageCard, {
          key:   runKey,
          src:   run.el.getAttribute('src')   || '',
          alt:   run.el.getAttribute('alt')   || 'Image',
          title: run.el.getAttribute('title') || undefined,
        }),
      );
    } else {
      // run.html получен из уже санитизированного документа через splitParagraphIntoRuns
      elements.push(
        React.createElement('p', {
          key:                     runKey,
          dangerouslySetInnerHTML: { __html: run.html },
        }),
      );
    }
  });
};

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const INLINE_TAGS  = new Set(['strong', 'em', 'u', 'del', 'sub', 'sup']);

const processElement = (
  element: Element,
  tagName: string,
  key: string,
  elements: React.ReactNode[],
  processNodes: (nodes: NodeListOf<ChildNode>, parentKey: string) => void,
) => {
  if (HEADING_TAGS.has(tagName)) { processHeadingElement(element, tagName, key, elements); return; }
  if (INLINE_TAGS.has(tagName))  { processInlineElement(tagName, element, key, elements); return; }

  switch (tagName) {
    case 'pre':        return processPreElement(element, key, elements);
    case 'code':       return processCodeElement(element, key, elements);
    case 'ul':
    case 'ol':         return processListElement(element, tagName, key, elements);
    case 'a':          return processLinkElement(element, key, elements);
    case 'img':        return processImageElement(element, key, elements);
    case 'figure':     return processFigureElement(element, key, elements);
    case 'blockquote': return processBlockquoteElement(element, key, elements);
    case 'table':      return processTableElement(element, key, elements);
    case 'hr':         elements.push(React.createElement('hr', { key })); return;
    case 'details':    return processDetailsElement(element, key, elements);
    default:
      if (element.childNodes.length > 0) processNodes(element.childNodes, key);
  }
};

export const parseHtmlToReact = (html: string): React.ReactNode[] => {
  const rawDoc = new DOMParser().parseFromString(html, 'text/html');

  // KaTeX-элементы сохраняются до санитизации, т.к. DOMPurify может изменить их разметку.
  // После санитизации восстанавливаются по индексу через data-katex-idx.
  const katexStore: Array<{ tag: 'div' | 'span'; cls: string; inner: string }> = [];

  rawDoc.querySelectorAll('div.katex-block, span.katex-inline').forEach((el) => {
    const tag   = el.tagName.toLowerCase() as 'div' | 'span';
    const cls   = el.className;
    const inner = el.innerHTML;
    const idx   = katexStore.push({ tag, cls, inner }) - 1;
    const placeholder = rawDoc.createElement(tag);
    placeholder.dataset.katexIdx = String(idx);
    el.replaceWith(placeholder);
  });

  const sanitized = DOMPurify.sanitize(rawDoc.body.innerHTML, {
    ALLOWED_TAGS:    [...SANITIZE_TAGS],
    ALLOWED_ATTR:    [...SANITIZE_ATTR],
    ADD_ATTR:        ['data-katex-idx'],
    ALLOW_DATA_ATTR: true,
    FORCE_BODY:      false,
  });

  const doc      = new DOMParser().parseFromString(sanitized, 'text/html');
  const elements: React.ReactNode[] = [];

  const processNodes = (nodes: NodeListOf<ChildNode>, parentKey = '') => {
    Array.from(nodes).forEach((node, index) => {
      const key = `${parentKey}-${index}`;

      if (node.nodeType === Node.TEXT_NODE)    { processTextNode(node, key, elements); return; }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Восстановление KaTeX-элементов, замещённых плейсхолдерами до санитизации
      const katexIdx = element.dataset.katexIdx;
      if (katexIdx !== undefined) {
        const stored = katexStore[Number.parseInt(katexIdx, 10)];
        if (stored) {
          elements.push(
            React.createElement(stored.tag, {
              key,
              className:               stored.cls,
              dangerouslySetInnerHTML: { __html: stored.inner },
            }),
          );
          return;
        }
      }

      if (tagName === 'div') { processDivElement(element, key, elements, processNodes); return; }
      if (tagName === 'p')   { processParagraphElement(element, key, elements, katexStore); return; }

      processElement(element, tagName, key, elements, processNodes);
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};